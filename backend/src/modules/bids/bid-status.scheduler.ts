import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BidStatusScheduler {
  private readonly logger = new Logger(BidStatusScheduler.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async updateBidStatuses() {
    const now = new Date();

    const liveResult = await this.prisma.bid.updateMany({
      where: {
        status: 'APPROVED',
        startDate: { lte: now },
      },
      data: { status: 'LIVE' },
    });

    const closedResult = await this.prisma.bid.updateMany({
      where: {
        status: 'LIVE',
        endDate: { lte: now },
      },
      data: { status: 'CLOSED' },
    });

    if (liveResult.count || closedResult.count) {
      this.logger.log(`Updated Bids ➜ LIVE: ${liveResult.count}, ➜ CLOSED: ${closedResult.count}`);
    }
  }
}
