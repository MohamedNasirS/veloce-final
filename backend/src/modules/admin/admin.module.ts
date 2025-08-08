import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module'; // Make sure this exists
import { BidGateway } from '../../gateways/bid.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [AdminService, BidGateway],
  exports: [AdminService], // Export the service in case it's needed elsewhere
})
export class AdminModule { }
