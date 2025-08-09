import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGatePassController } from './admin-gate-pass.controller';
import { AdminGatePassService } from './admin-gate-pass.service';
import { AdminWinnerSelectionController } from './admin-winner-selection.controller';
import { AdminWinnerSelectionService } from './admin-winner-selection.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { BidsModule } from '../bids/bids.module';
import { BidGateway } from '../../gateways/bid.gateway';

@Module({
  imports: [PrismaModule, AuthModule, BidsModule],
  controllers: [AdminController, AdminGatePassController, AdminWinnerSelectionController],
  providers: [AdminService, AdminGatePassService, AdminWinnerSelectionService, BidGateway],
  exports: [AdminService, AdminGatePassService, AdminWinnerSelectionService],
})
export class AdminModule { }
