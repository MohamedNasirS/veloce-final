// ✅ 1. bid-status.scheduler.ts — Cron Job for Status Updates

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

    const liveBids = await this.prisma.bid.findMany({
      where: {
        status: 'APPROVED',
        startDate: { lte: now },
      },
    });

    for (const bid of liveBids) {
      await this.prisma.bid.update({ where: { id: bid.id }, data: { status: 'LIVE' } });
      const updated = await this.prisma.bid.findUnique({
        where: { id: bid.id },
        include: {
          participants: true,
          creator: { select: { id: true, name: true, company: true } },
        },
      });
      this.bidGateway.emitBidUpdate(updated);
    }

    const closedBids = await this.prisma.bid.findMany({
      where: {
        status: 'LIVE',
        endDate: { lte: now },
      },
    });

    for (const bid of closedBids) {
      await this.prisma.bid.update({ where: { id: bid.id }, data: { status: 'CLOSED' } });
      const updated = await this.prisma.bid.findUnique({
        where: { id: bid.id },
        include: {
          participants: true,
          creator: { select: { id: true, name: true, company: true } },
        },
      });
      this.bidGateway.emitBidUpdate(updated);
    }

    if (liveBids.length || closedBids.length) {
      this.logger.log(`Status updated — LIVE: ${liveBids.length}, CLOSED: ${closedBids.length}`);
    }
  }
}