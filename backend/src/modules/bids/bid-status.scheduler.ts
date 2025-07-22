import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { BidGateway } from '../../gateways/bid.gateway';

@Injectable()
export class BidStatusScheduler {
  private readonly logger = new Logger(BidStatusScheduler.name);

  constructor(
    private prisma: PrismaService,
    private bidGateway: BidGateway
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async updateBidStatuses() {
    const now = new Date();

    // --- Bids going LIVE ---
    const liveBids = await this.prisma.bid.findMany({
      where: {
        status: 'APPROVED',
        startDate: { lte: now },
      },
    });

    for (const bid of liveBids) {
      const updatedBid = await this.prisma.bid.update({
        where: { id: bid.id },
        data: { status: 'LIVE' },
        include: {
          participants: true,
          creator: { select: { id: true, name: true, company: true } },
        },
      });
      // Send the general update for the live bids page
      this.bidGateway.emitBidUpdate(updatedBid);
      // --- Send the specific notification for the sidebar ---
      this.bidGateway.emitNewBidLive(updatedBid);
    }

    // --- Bids getting CLOSED ---
    const closedBids = await this.prisma.bid.findMany({
      where: {
        status: 'LIVE',
        endDate: { lte: now },
      },
    });

    for (const bid of closedBids) {
      const updatedBid = await this.prisma.bid.update({
        where: { id: bid.id },
        data: { status: 'CLOSED' },
        include: {
          participants: true,
          creator: { select: { id: true, name: true, company: true } },
        },
      });
      // Send the general update to remove it from the live bids page
      this.bidGateway.emitBidUpdate(updatedBid);
      // --- Send the specific notification for the sidebar ---
      this.bidGateway.emitBidClosed(updatedBid);
    }

    if (liveBids.length || closedBids.length) {
      this.logger.log(`Status updated — LIVE: ${liveBids.length}, CLOSED: ${closedBids.length}`);
    }
  }
}
