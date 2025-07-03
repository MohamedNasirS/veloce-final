import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBidDto } from './dto/create-bid.dto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { BidHistory } from './types';

@Injectable()
export class BidsService {
  constructor(private prisma: PrismaService) {}

  async createBid(images: Express.Multer.File[], dto: CreateBidDto) {
    const bid = await this.prisma.bid.create({
      data: {
        ...dto,
        quantity: parseFloat(dto.quantity),
        basePrice: parseFloat(dto.basePrice),
        currentPrice: parseFloat(dto.basePrice),
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        creatorId: dto.creatorId,
        status: 'PENDING',
      },
    });

    await this.prisma.bidImage.createMany({
      data: images.map(file => ({
        bidId: bid.id,
        path: `/uploads/bids/${file.filename}`,
      })),
    });

    // Ensure the uploads/bids directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads', 'bids');
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      console.log('Uploads directory ensured:', uploadsDir);
    } catch (error) {
      console.error('Error creating uploads directory:', { error });
      throw new Error('Failed to create uploads directory');
    }

    // Create JSON file for bidding history
    const bidHistory: BidHistory = {
      bidId: bid.id,
      bids: [
        {
          userId: null,
          userName: null,
          amount: parseFloat(dto.basePrice),
          timestamp: new Date().toISOString(),
        },
      ],
    };
    const historyFilePath = path.join(uploadsDir, `bid_history_${bid.id}.json`);
    console.log('Creating bid history file:', historyFilePath);
    try {
      await fs.writeFile(historyFilePath, JSON.stringify(bidHistory, null, 2));
      console.log('Bid history file created successfully:', { bidId: bid.id });
      // Verify file creation
      await fs.access(historyFilePath);
      console.log('Verified bid history file exists:', historyFilePath);
    } catch (error) {
      console.error('Error creating/verifying bid history file:', { bidId: bid.id, path: historyFilePath, error });
      throw new Error(`Failed to create bid history file for bid ${bid.id}`);
    }

    return { message: 'Bid created and pending admin approval', bid };
  }

  async approveBid(bidId: string) {
    const bid = await this.prisma.bid.findUnique({ where: { id: bidId } });
    if (!bid) throw new NotFoundException('Bid not found');

    await this.prisma.bid.update({
      where: { id: bidId },
      data: { status: 'APPROVED' },
    });

    return { message: 'Bid approved successfully' };
  }

  async cancelBid(bidId: string) {
    const bid = await this.prisma.bid.findUnique({ where: { id: bidId } });
    if (!bid) throw new NotFoundException('Bid not found');

    await this.prisma.bid.update({
      where: { id: bidId },
      data: { status: 'CANCELLED' },
    });

    return { message: 'Bid cancelled successfully' };
  }

  async placeBid(bidId: string, userId: string, amount: number) {
    console.log('Received bid attempt:', { bidId, userId, amount });
    if (!userId) {
      console.error('Missing userId for bid attempt:', { bidId, amount });
      throw new BadRequestException('User ID is required.');
    }

    const bid = await this.prisma.bid.findUnique({ where: { id: bidId } });
    if (!bid) {
      console.error('Bid not found for bidId:', bidId);
      throw new NotFoundException('Bid not found');
    }

    if (bid.status !== 'LIVE') {
      console.error('Bid is not LIVE:', { bidId, status: bid.status });
      throw new BadRequestException('This bid is not currently open for bidding.');
    }

    // Validate amount is higher than the current highest bid
    if (!amount || isNaN(amount) || amount <= 0) {
      console.error('Invalid bid amount:', { bidId, userId, amount });
      throw new BadRequestException('Bid amount must be a positive number.');
    }
    if (amount <= bid.currentPrice) {
      console.error('Bid amount not higher than current highest bid:', {
        bidId,
        userId,
        amount,
        currentPrice: bid.currentPrice,
      });
      throw new BadRequestException(
        `Bid amount must be higher than the current highest bid of ₹${bid.currentPrice}.`,
      );
    }

    // Fetch user name
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.error('User not found for userId:', userId);
      throw new NotFoundException('User not found');
    }

    // Ensure the uploads/bids directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads', 'bids');
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      console.log('Uploads directory ensured:', uploadsDir);
    } catch (error) {
      console.error('Error creating uploads directory:', { error });
      throw new Error('Failed to create uploads directory');
    }

    // Update JSON file with new bid
    const historyFilePath = path.join(uploadsDir, `bid_history_${bidId}.json`);
    console.log('Placing bid:', { bidId, userId, userName: user.name, amount });

    const existing = await this.prisma.bidParticipant.findFirst({
      where: { bidId, userId },
    });

    try {
      let bidHistory: BidHistory;
      try {
        const fileContent = await fs.readFile(historyFilePath, 'utf-8');
        bidHistory = JSON.parse(fileContent);
        console.log('Read existing bid history:', { bidId, bidCount: bidHistory.bids.length });
      } catch (error) {
        // If file doesn't exist, create a new one
        bidHistory = {
          bidId,
          bids: [
            {
              userId: null,
              userName: null,
              amount: bid.currentPrice,
              timestamp: new Date().toISOString(),
            },
          ],
        };
        console.log('Created new bid history:', { bidId });
      }

      if (existing) {
        // Validate against existing bid
        if (amount <= existing.amount) {
          console.error('New bid amount not higher than user’s previous bid:', {
            bidId,
            userId,
            amount,
            previousAmount: existing.amount,
          });
          throw new BadRequestException(
            `New bid amount must be higher than your previous bid of ₹${existing.amount}.`,
          );
        }
        // Update existing bid in BidParticipant
        await this.prisma.bidParticipant.updateMany({
          where: { bidId, userId },
          data: { amount },
        });
        console.log('Updated existing bid:', { userId, userName: user.name, bidId, amount });
      } else {
        // Create new BidParticipant entry
        await this.prisma.bidParticipant.create({
          data: { bidId, userId, amount },
        });
        console.log('Created new bid:', { userId, userName: user.name, bidId, amount });
      }

      // Update JSON history with new bid
      bidHistory.bids.push({
        userId,
        userName: user.name || 'Unknown',
        amount,
        timestamp: new Date().toISOString(),
      });
      await fs.writeFile(historyFilePath, JSON.stringify(bidHistory, null, 2));
      console.log('Bid history updated successfully:', { bidId, bidCount: bidHistory.bids.length });

      // Update bid's currentPrice if the new amount is higher
      if (amount > bid.currentPrice) {
        await this.prisma.bid.update({
          where: { id: bidId },
          data: { currentPrice: amount },
        });
        console.log('Updated currentPrice:', { bidId, newPrice: amount });
      }

      return { message: existing ? 'Bid updated successfully' : 'Bid placed successfully' };
    } catch (error) {
      console.error('Error placing/updating bid:', { bidId, userId, path: historyFilePath, error });
      throw new Error(`Failed to place or update bid for bid ${bidId}`);
    }
  }

  async getApprovedBids() {
    return this.prisma.bid.findMany({
      where: {
        status: {
          in: ['APPROVED', 'LIVE'],
        },
      },
      include: {
        images: true,
        creator: true,
        participants: true,
      },
    });
  }

  async getPendingBids() {
    return this.prisma.bid.findMany({
      where: { status: 'PENDING' },
      include: { creator: true, images: true },
    });
  }

  async getBidsByCreator(userId: string) {
    return this.prisma.bid.findMany({
      where: { creatorId: userId },
      include: {
        images: true,
        participants: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBidById(bidId: string) {
    const bid = await this.prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        images: true,
        creator: true,
        participants: {
          include: { user: true },
          orderBy: { amount: 'desc' },
        },
      },
    });

    if (!bid) throw new NotFoundException('Bid not found');
    return bid;
  }

  async getAllBids() {
    return this.prisma.bid.findMany({
      include: {
        images: true,
        creator: true,
        participants: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBiddingHistory(bidId: string): Promise<BidHistory> {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'bids');
    const historyFilePath = path.join(uploadsDir, `bid_history_${bidId}.json`);
    console.log('Attempting to read bidding history file:', historyFilePath);

    // Log directory contents for debugging
    try {
      const files = await fs.readdir(uploadsDir);
      console.log('Directory contents:', { uploadsDir, files });
    } catch (error) {
      console.error('Error reading uploads directory:', { uploadsDir, error });
      return { bidId, bids: [] };
    }

    try {
      await fs.access(historyFilePath);
      const fileContent = await fs.readFile(historyFilePath, 'utf-8');
      let historyData: BidHistory;
      try {
        historyData = JSON.parse(fileContent);
        console.log('Successfully parsed bidding history:', { bidId, bidCount: historyData.bids.length });
      } catch (parseError) {
        console.error('Error parsing JSON file:', { bidId, path: historyFilePath, error: parseError });
        throw new BadRequestException(`Invalid bidding history file format for bid ${bidId}`);
      }
      if (!Array.isArray(historyData.bids)) {
        console.warn('Bidding history has no valid bids array:', { bidId, historyData });
        return { bidId, bids: [] };
      }
      return historyData;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.warn('Bidding history file not found:', { bidId, path: historyFilePath });
        return { bidId, bids: [] };
      }
      console.error('Error reading bidding history file:', { bidId, path: historyFilePath, error });
      throw new NotFoundException(`Failed to fetch bidding history for bid ${bidId}: ${error.message}`);
    }
  }

  async selectWinner(bidId: string, winnerId: string) {
    const bid = await this.prisma.bid.findUnique({ where: { id: bidId } });
    if (!bid) throw new NotFoundException('Bid not found');

    const uploadsDir = path.join(process.cwd(), 'uploads', 'bids');
    const historyFilePath = path.join(uploadsDir, `bid_history_${bidId}.json`);
    console.log('Selecting winner:', { bidId, winnerId });
    try {
      let historyData: BidHistory = { bidId, bids: [] };
      try {
        const fileContent = await fs.readFile(historyFilePath, 'utf-8');
        historyData = JSON.parse(fileContent);
      } catch (error) {
        console.warn('Bid history file not found during winner selection, creating new:', { bidId, path: historyFilePath });
      }
      historyData.winnerId = winnerId;
      await fs.writeFile(historyFilePath, JSON.stringify(historyData, null, 2));
      console.log('Winner updated in bid history:', { bidId, winnerId });
    } catch (error) {
      console.error('Error updating winner in bid history:', { bidId, path: historyFilePath, error });
      throw new Error(`Failed to update bid history with winner for bid ${bidId}`);
    }

    return this.prisma.bid.update({
      where: { id: bidId },
      data: { winnerId },
    });
  }

  async refreshBidStatuses() {
    const now = new Date();

    const toLive = await this.prisma.bid.updateMany({
      where: {
        status: 'APPROVED',
        startDate: { lte: now },
      },
      data: { status: 'LIVE' },
    });

    const toClosed = await this.prisma.bid.updateMany({
      where: {
        status: 'LIVE',
        endDate: { lte: now },
      },
      data: { status: 'CLOSED' },
    });

    return {
      message: 'Bid statuses refreshed',
      updatedToLive: toLive.count,
      updatedToClosed: toClosed.count,
    };
  }
}