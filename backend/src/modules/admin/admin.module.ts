import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGatePassController } from './admin-gate-pass.controller';
import { AdminGatePassService } from './admin-gate-pass.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { BidGateway } from '../../gateways/bid.gateway';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdminController, AdminGatePassController],
  providers: [AdminService, AdminGatePassService, BidGateway],
  exports: [AdminService, AdminGatePassService],
})
export class AdminModule { }
