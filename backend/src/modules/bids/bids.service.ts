import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { BidHistory } from './types';
import { BidEventType } from '@prisma/client'; // ✅ Import the enum properly
import * as fs from 'fs';
import * as path from 'path';
import { BidGateway } from '../../gateways/bid.gateway'; 

@Injectable()
export class BidsService {
  constructor(
    private prisma: PrismaService,
    private bidGateway: BidGateway
  ) {}

  async createBid(images: Express.Multer.File[], dto: CreateBidDto) {
    const bid = await this.prisma.bid.create({
      data: {
        lotName: dto.lotName,
        description: dto.description,
        wasteType: dto.wasteType,
        quantity: parseFloat(dto.quantity),
        unit: dto.unit,
        location: dto.location,
        basePrice: parseFloat(dto.basePrice),
        minIncrementPercent: parseFloat(dto.minIncrementPercent),
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

    // Record initial base price event with correct enum usage
    await this.prisma.bidEvent.create({
      data: {
        bidId: bid.id,
        userId: null,
        amount: parseFloat(dto.basePrice),
        type: BidEventType.BASE_PRICE,
      },
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
  console.log('Received bid attempt:', { bidId, userId, amount });

  if (!userId) throw new BadRequestException('User ID is required.');

  const bid = await this.prisma.bid.findUnique({ where: { id: bidId } });
  if (!bid) throw new NotFoundException('Bid not found');

  if (bid.status !== 'LIVE') {
    throw new BadRequestException('This bid is not currently open for bidding.');
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    throw new BadRequestException('Bid amount must be a positive number.');
  }

  const minIncrement = bid.minIncrementPercent ?? 0;
  const requiredMinAmount = bid.currentPrice + bid.currentPrice * (minIncrement / 100);

  if (amount < requiredMinAmount) {
    throw new BadRequestException(
      `Your bid must be at least ₹${requiredMinAmount.toFixed(2)} (current price + ${minIncrement}% increment).`
    );
  }

  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundException('User not found');

  let existing = await this.prisma.bidParticipant.findFirst({ where: { bidId, userId } });

  if (existing) {
    if (amount <= existing.amount) {
      throw new BadRequestException(
        `New bid amount must be higher than your previous bid of ₹${existing.amount}.`
      );
    }

    await this.prisma.bidParticipant.updateMany({
      where: { bidId, userId },
      data: { amount },
    });
  } else {
    existing = await this.prisma.bidParticipant.create({
      data: { bidId, userId, amount },
    });
  }

  await this.prisma.bidEvent.create({
    data: {
      bidId,
      userId,
      amount,
      type: BidEventType.BID_PLACED,
    },
  });

  await this.prisma.bid.update({
    where: { id: bidId },
    data: { currentPrice: amount },
  });

  // ✅ Emit real-time update via WebSocket
  const updatedBid = await this.prisma.bid.findUnique({
    where: { id: bidId },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, company: true } },
        },
      },
      creator: { select: { id: true, name: true, company: true } },
    },
  });

  // Prevent silent failure
  try {
    this.bidGateway?.emitBidUpdate?.(updatedBid);
  } catch (error) {
    console.error('Failed to emit bid update via WebSocket:', error.message);
  }

  return {
    message: existing ? 'Bid updated successfully' : 'Bid placed successfully',
  };
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
        creator: { select: { id: true, name: true, company: true } },
        participants: { include: { user: { select: { id: true, name: true, company: true } } } },
        winner: { select: { id: true, name: true, email: true, company: true } },
      },
    });
  }

  async getPendingBids() {
    return this.prisma.bid.findMany({
      where: { status: 'PENDING' },
      include: {
        creator: { select: { id: true, name: true, company: true } },
        images: true,
        winner: { select: { id: true, name: true, email: true, company: true } },
      },
    });
  }

  async getBidsByCreator(userId: string) {
    return this.prisma.bid.findMany({
      where: { creatorId: userId },
      include: {
        images: true,
        creator: { select: { id: true, name: true, company: true } },
        participants: { include: { user: { select: { id: true, name: true, company: true } } } },
        winner: { select: { id: true, name: true, email: true, company: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBidById(bidId: string) {
  const bid = await this.prisma.bid.findUnique({
    where: { id: bidId },
    include: {
      images: true,
      creator: { select: { id: true, name: true, company: true } },
      participants: {
        include: {
          user: { select: { id: true, name: true, company: true } },
        },
        orderBy: { amount: 'desc' },
      },
      winner: {
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
        },
      },
    },
  });

  if (!bid) throw new NotFoundException('Bid not found');

  // ⬇️ Find the bid amount placed by the winner
  const winnerParticipant = bid.participants.find(
    (p) => p.userId === bid.winnerId
  );

  // ⬇️ Attach winnerAmount manually to result
  return {
    ...bid,
    winnerAmount: winnerParticipant?.amount ?? 0,
  };
}


  async getAllBids() {
    return this.prisma.bid.findMany({
      include: {
        images: true,
        creator: { select: { id: true, name: true, company: true } },
        participants: { include: { user: { select: { id: true, name: true, company: true } } } },
        winner: { select: { id: true, name: true, email: true, company: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBiddingHistory(bidId: string): Promise<BidHistory> {
    const events = await this.prisma.bidEvent.findMany({
      where: { bidId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    const bids = events
      .filter(event => event.type === BidEventType.BID_PLACED || event.type === BidEventType.BASE_PRICE)
      .map(event => ({
        userId: event.userId,
        userName: event.user?.name ?? (event.type === BidEventType.BASE_PRICE ? 'System' : null),
        amount: event.amount,
        timestamp: event.createdAt.toISOString(),
      }));

    const winnerEvent = events.find(event => event.type === BidEventType.WINNER_SELECTED);

    return {
      bidId,
      bids,
      winnerId: winnerEvent?.userId,
    };
  }

  async selectWinner(bidId: string, winnerId: string) {
    const bid = await this.prisma.bid.findUnique({ where: { id: bidId } });
    if (!bid) throw new NotFoundException('Bid not found');

    console.log('Selecting winner:', { bidId, winnerId });

    await this.prisma.bidEvent.create({
      data: {
        bidId,
        userId: winnerId,
        amount: 0,
        type: BidEventType.WINNER_SELECTED,
      },
    });

    return this.prisma.bid.update({
      where: { id: bidId },
      data: { winnerId },
    });
  }
async refreshBidStatuses() {
  const now = new Date();
  const goingLive = await this.prisma.bid.findMany({
    where: { status: 'APPROVED', startDate: { lte: now } },
  });

  await this.prisma.bid.updateMany({
    where: { id: { in: goingLive.map(b => b.id) } },
    data: { status: 'LIVE' },
  });

  for (const bid of goingLive) {
    const fullBid = await this.prisma.bid.findUnique({
      where: { id: bid.id },
      include: {
        participants: true,
        creator: { select: { id: true, name: true, company: true } },
      },
    });
    this.bidGateway.emitBidUpdate(fullBid);
  }

  const goingClosed = await this.prisma.bid.findMany({
    where: { status: 'LIVE', endDate: { lte: now } },
  });

  await this.prisma.bid.updateMany({
    where: { id: { in: goingClosed.map(b => b.id) } },
    data: { status: 'CLOSED' },
  });

  for (const bid of goingClosed) {
    const fullBid = await this.prisma.bid.findUnique({
      where: { id: bid.id },
      include: {
        participants: true,
        creator: { select: { id: true, name: true, company: true } },
      },
    });
    this.bidGateway.emitBidUpdate(fullBid);
  }

  return {
    updatedToLive: goingLive.length,
    updatedToClosed: goingClosed.length,
    message: 'Manual refresh completed',
  };
}

// ✅ Upload Gate Pass

async uploadGatePass(bidId: string, userId: string, filePath: string) {
  // Step 1: Get the bid
  const bid = await this.prisma.bid.findUnique({
    where: { id: bidId },
    select: {
      id: true,
      status: true,
      creatorId: true,
      winnerId: true,
      gatePassPath: true,
    },
  });

  // Step 2: Validation checks
  if (!bid) {
    throw new NotFoundException('Bid not found');
  }

  if (bid.creatorId !== userId) {
    throw new ForbiddenException('You are not the bid owner');
  }

  if (bid.status !== 'CLOSED') {
    throw new BadRequestException('Gate pass upload only allowed for closed bids');
  }

  if (!bid.winnerId) {
    throw new BadRequestException('No winner selected for this bid');
  }

  // Step 3: Delete the old gate pass file if it exists
  if (bid.gatePassPath) {
    const absoluteOldPath = path.join(process.cwd(), bid.gatePassPath);
    console.log('Deleting old gate pass:', absoluteOldPath);

    try {
      if (fs.existsSync(absoluteOldPath)) {
        fs.unlinkSync(absoluteOldPath);
        console.log('Old gate pass deleted successfully.');
      } else {
        console.warn('Old gate pass not found at:', absoluteOldPath);
      }
    } catch (error) {
      console.error('Error deleting old gate pass:', error.message);
      // You may optionally throw or log the error here depending on how critical deletion is
    }
  }

  // Step 4: Update the new gate pass path in DB
  const updated = await this.prisma.bid.update({
    where: { id: bidId },
    data: {
      gatePassPath: filePath, // must be relative like 'uploads/gatepass/file.pdf'
    },
  });

  // Step 5: Return success response
  return {
    message: 'Gate pass uploaded successfully',
    gatePassPath: updated.gatePassPath,
  };
}
  // ✅ Get Gate Pass (for winner or bid owner)
  async getGatePass(bidId: string, userId: string) {
    const bid = await this.prisma.bid.findUnique({
      where: { id: bidId },
      select: {
        gatePassPath: true,
        creatorId: true,
        winnerId: true,
      },
    });

    if (!bid) throw new NotFoundException('Bid not found');

    const isAuthorized = [bid.creatorId, bid.winnerId].includes(userId);
    if (!isAuthorized) {
      throw new ForbiddenException('You do not have permission to view this gate pass');
    }

    return { gatePassPath: bid.gatePassPath };
  }

  // ✅ Get Bids Participated by the User (with rank + winner check)
  async getParticipatedBids(userId: string) {
    const participations = await this.prisma.bidParticipant.findMany({
      where: { userId },
      include: {
        bid: {
          include: {
            winner: true,
          },
        },
      },
    });

    const result = [];

    for (const p of participations) {
      const allParticipants = await this.prisma.bidParticipant.findMany({
        where: { bidId: p.bidId },
        orderBy: { amount: 'desc' },
      });

      const rank = allParticipants.findIndex(part => part.userId === userId) + 1;

      result.push({
        id: p.bid.id,
        lotName: p.bid.lotName,
        wasteType: p.bid.wasteType,
        quantity: p.bid.quantity,
        unit: p.bid.unit,
        location: p.bid.location,
        currentPrice: p.bid.currentPrice,
        status: p.bid.status,
        myBidAmount: p.amount,
        myRank: rank,
        winnerId: p.bid.winnerId,
        isWinner: p.bid.winnerId === userId,  // ✅ Add this
      });

    }

    return result;
  }
}