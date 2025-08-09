import { Module } from '@nestjs/common';
import { BidsController } from './bids.controller';
import { BidsService } from './bids.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MulterModule } from '@nestjs/platform-express';
import { BidStatusScheduler } from './bid-status.scheduler';
import { BidGateway } from '../../gateways/bid.gateway';

@Module({
  imports: [PrismaModule, MulterModule.register({ dest: './uploads/bids' })],
  controllers: [BidsController],
  providers: [BidsService, BidStatusScheduler, BidGateway],
  exports: [BidsService],
})
export class BidsModule { }
