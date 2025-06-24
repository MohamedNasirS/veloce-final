import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBidDto } from './dto/create-bid.dto';

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
    const bid = await this.prisma.bid.findUnique({ where: { id: bidId } });
    if (!bid) throw new NotFoundException('Bid not found');

    if (bid.status !== 'LIVE') {
      throw new BadRequestException('This bid is not currently open for bidding.');
    }

    const existing = await this.prisma.bidParticipant.findFirst({
      where: { bidId, userId },
    });

    if (existing) {
      throw new BadRequestException('You have already placed a bid.');
    }

    await this.prisma.bidParticipant.create({
      data: { bidId, userId, amount },
    });

    await this.prisma.bid.update({
      where: { id: bidId },
      data: { currentPrice: amount },
    });

    return { message: 'Bid placed successfully' };
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
