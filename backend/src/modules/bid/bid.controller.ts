import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFiles,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { BidService } from './bid.service';

@Controller('api/bids')
export class BidController {
  constructor(private bidService: BidService) {}

  @Post('create')
  @UseInterceptors(FilesInterceptor('images', 10)) // Allow up to 10 images
  async createBid(
    @Body() bidData: any,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    try {
      // In a real app, you'd get the user ID from JWT token
      // For now, we'll pass it in the body
      const createdById = bidData.createdById;
      
      if (!createdById) {
        throw new Error('Creator ID is required');
      }

      return await this.bidService.createBid(bidData, images, createdById);
    } catch (error) {
      console.error('Error in createBid controller:', error);
      throw error;
    }
  }

  @Get()
  async getAllBids(
    @Query('status') status?: string,
    @Query('wasteType') wasteType?: string,
    @Query('createdById') createdById?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filters = {
      status,
      wasteType,
      createdById,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    };

    return this.bidService.getAllBids(filters);
  }

  @Get('user/:userId')
  async getUserBids(@Param('userId') userId: string) {
    return this.bidService.getUserBids(userId);
  }

  @Get(':bidId')
  async getBidById(@Param('bidId') bidId: string) {
    return this.bidService.getBidById(bidId);
  }

  @Post(':bidId/place-bid')
  async placeBid(
    @Param('bidId') bidId: string,
    @Body() bidData: { bidderId: string; amount: number; message?: string },
  ) {
    return this.bidService.placeBid(
      bidId,
      bidData.bidderId,
      bidData.amount,
      bidData.message,
    );
  }

  @Put(':bidId/close')
  async closeBid(
    @Param('bidId') bidId: string,
    @Body() userData: { userId: string },
  ) {
    return this.bidService.closeBid(bidId, userData.userId);
  }

  @Get('images/:imageId')
  async getBidImage(
    @Param('imageId') imageId: string,
    @Res() res: Response,
  ) {
    try {
      const image = await this.bidService.getBidImage(imageId);
      
      // Construct full file path
      const fullPath = path.resolve(image.relativePath);
      
      if (fs.existsSync(fullPath)) {
        res.setHeader('Content-Type', image.mimetype);
        res.setHeader('Content-Disposition', `inline; filename="${image.originalName}"`);
        
        const fileStream = fs.createReadStream(fullPath);
        fileStream.pipe(res);
      } else {
        res.status(404).json({ message: 'Image file not found on disk' });
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  @Get('images/download/:imageId')
  async downloadBidImage(
    @Param('imageId') imageId: string,
    @Res() res: Response,
  ) {
    try {
      const image = await this.bidService.getBidImage(imageId);
      
      // Construct full file path
      const fullPath = path.resolve(image.relativePath);
      
      if (fs.existsSync(fullPath)) {
        res.setHeader('Content-Type', image.mimetype);
        res.setHeader('Content-Disposition', `attachment; filename="${image.originalName}"`);
        
        const fileStream = fs.createReadStream(fullPath);
        fileStream.pipe(res);
      } else {
        res.status(404).json({ message: 'Image file not found on disk' });
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}
