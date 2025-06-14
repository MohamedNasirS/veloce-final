import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BidService } from './bid.service';
import { BidController } from './bid.controller';
import { Bid } from './bid.entity';
import { Item } from '../item/item.entity'; // Import Item for ItemRepository injection in BidService
import { AuthModule } from '../auth/auth.module'; // For JwtAuthGuard

@Module({
  imports: [TypeOrmModule.forFeature([Bid, Item]), AuthModule], // Include Item repository access
  controllers: [BidController],
  providers: [BidService],
  exports: [BidService],
})
export class BidModule {}
