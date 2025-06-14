// backend/src/document/document.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { Document } from './document.entity';
import { Item } from '../item/item.entity'; // For ItemRepository in DocumentService
import { AuthModule } from '../auth/auth.module'; // For JwtAuthGuard

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, Item]), // Provide Document and Item repositories
    MulterModule.register({
      dest: './uploads', // Default destination if not overridden in controller
    }),
    AuthModule,
  ],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}
