import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemService } from './item.service';
import { ItemController } from './item.controller.ts';
import { Item } from './item.entity';
import { AuthModule } from '../auth/auth.module'; // For JwtAuthGuard if not global

@Module({
  imports: [TypeOrmModule.forFeature([Item]), AuthModule], // Import AuthModule if JwtAuthGuard is exported from there and not global
  controllers: [ItemController],
  providers: [ItemService],
  exports: [ItemService],
})
export class ItemModule {}
