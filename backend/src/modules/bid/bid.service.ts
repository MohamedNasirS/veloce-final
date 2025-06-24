import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class BidService {
  constructor(private prisma: PrismaService) {}

  async createBid(bidData: any, images: Express.Multer.File[], createdById: string) {
    try {
      const {
        lotName,
        description,
        wasteType,
        quantity,
        unit,
        location,
        address,
        basePrice,
        startDate,
        endDate,
      } = bidData;

      // Create the bid first
      const bid = await this.prisma.wasteBid.create({
        data: {
          lotName,
          description,
          wasteType,
          quantity: parseFloat(quantity),
          unit,
          location,
          address,
          basePrice: parseFloat(basePrice),
          currentPrice: parseFloat(basePrice),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          createdById,
          status: 'published',
        },
      });

      // Create bid-specific folder for images
      const bidFolderName = `bid_${bid.id}_${Date.now()}`;
      const bidImagesPath = path.join(process.cwd(), 'uploads', 'bid-images', bidFolderName);
      await fs.mkdir(bidImagesPath, { recursive: true });

      // Handle image uploads
      if (images && images.length > 0) {
        const imagePromises = images.map(async (image, index) => {
          const timestamp = Date.now();
          const fileExtension = path.extname(image.originalname);
          const fileName = `image_${index + 1}_${timestamp}${fileExtension}`;
          const filePath = path.join(bidImagesPath, fileName);
          const relativePath = path.join('uploads', 'bid-images', bidFolderName, fileName);

          // Save file to disk
          await fs.writeFile(filePath, image.buffer);

          // Save image record to database
          return this.prisma.bidImage.create({
            data: {
              wasteBidId: bid.id,
              originalName: image.originalname,
              filename: fileName,
              relativePath,
              size: image.size,
              mimetype: image.mimetype,
            },
          });
        });

        await Promise.all(imagePromises);
      }

      // Return bid with images
      return this.getBidById(bid.id);
    } catch (error) {
      console.error('Error creating bid:', error);
      throw error;
    }
  }

  async getBidById(bidId: string) {
    const bid = await this.prisma.wasteBid.findUnique({
      where: { id: bidId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
          },
        },
        images: true,
        bidEntries: {
          include: {
            bidder: {
              select: {
                id: true,
                name: true,
                company: true,
              },
            },
          },
          orderBy: {
            amount: 'desc',
          },
        },
      },
    });

    if (!bid) {
      throw new NotFoundException('Bid not found');
    }

    return bid;
  }

  async getAllBids(filters?: {
    status?: string;
    wasteType?: string;
    createdById?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.wasteType) {
      where.wasteType = filters.wasteType;
    }
    if (filters?.createdById) {
      where.createdById = filters.createdById;
    }

    const bids = await this.prisma.wasteBid.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
        images: {
          take: 1, // Just get the first image for listing
        },
        bidEntries: {
          select: {
            amount: true,
            bidder: {
              select: {
                name: true,
                company: true,
              },
            },
          },
          orderBy: {
            amount: 'desc',
          },
          take: 1, // Just get the highest bid
        },
        _count: {
          select: {
            bidEntries: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    });

    return bids;
  }

  async getUserBids(userId: string) {
    const bids = await this.prisma.wasteBid.findMany({
      where: { createdById: userId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
          },
        },
        images: {
          select: {
            id: true,
            originalName: true,
            relativePath: true,
          },
        },
        bidEntries: {
          include: {
            bidder: {
              select: {
                id: true,
                name: true,
                company: true,
              },
            },
          },
          orderBy: {
            amount: 'desc',
          },
        },
        _count: {
          select: {
            bidEntries: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to match frontend expectations
    return bids.map(bid => ({
      id: bid.id,
      lotName: bid.lotName,
      description: bid.description,
      wasteType: bid.wasteType,
      quantity: Number(bid.quantity),
      unit: bid.unit,
      location: bid.location,
      basePrice: Number(bid.basePrice),
      currentPrice: Number(bid.currentPrice),
      status: bid.status,
      startDate: bid.startDate.toISOString(),
      endDate: bid.endDate.toISOString(),
      createdAt: bid.createdAt.toISOString(),
      images: bid.images,
      bidEntries: bid.bidEntries.map(entry => ({
        id: entry.id,
        amount: Number(entry.amount),
        bidder: entry.bidder,
      })),
      _count: bid._count,
    }));
  }

  async placeBid(bidId: string, bidderId: string, amount: number, message?: string) {
    // Check if bid exists and is active
    const bid = await this.prisma.wasteBid.findUnique({
      where: { id: bidId },
    });

    if (!bid) {
      throw new NotFoundException('Bid not found');
    }

    if (bid.status !== 'in-progress' && bid.status !== 'published') {
      throw new BadRequestException('Bid is not accepting new bids');
    }

    if (new Date() > bid.endDate) {
      throw new BadRequestException('Bid has expired');
    }

    if (amount <= Number(bid.currentPrice)) {
      throw new BadRequestException('Bid amount must be higher than current price');
    }

    // Create bid entry (remove upsert since we don't have compound unique constraint)
    const bidEntry = await this.prisma.bidEntry.create({
      data: {
        wasteBidId: bidId,
        bidderId,
        amount,
        message,
      },
    });

    // Update current price and status
    await this.prisma.wasteBid.update({
      where: { id: bidId },
      data: {
        currentPrice: amount,
        status: 'in-progress',
      },
    });

    return bidEntry;
  }

  async getBidImage(imageId: string) {
    const image = await this.prisma.bidImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    return image;
  }

  async closeBid(bidId: string, userId: string) {
    const bid = await this.prisma.wasteBid.findUnique({
      where: { id: bidId },
    });

    if (!bid) {
      throw new NotFoundException('Bid not found');
    }

    if (bid.createdById !== userId) {
      throw new BadRequestException('Only the bid creator can close the bid');
    }

    return this.prisma.wasteBid.update({
      where: { id: bidId },
      data: { status: 'closed' },
    });
  }
}
