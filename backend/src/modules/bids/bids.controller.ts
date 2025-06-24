import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFiles,
  Get,
  Patch,
  Param,
} from '@nestjs/common';
import { BidsService } from './bids.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Controller('bids')
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      storage: diskStorage({
        destination: './uploads/bids',
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname);
          cb(null, `${uuidv4()}${ext}`);
        },
      }),
    }),
  )
  createBid(
    @UploadedFiles() images: Express.Multer.File[],
    @Body() body: CreateBidDto,
  ) {
    return this.bidsService.createBid(images, body);
  }

  @Patch(':id/approve')
  approveBid(@Param('id') bidId: string) {
    return this.bidsService.approveBid(bidId);
  }

  @Patch(':id/cancel')
  cancelBid(@Param('id') bidId: string) {
    return this.bidsService.cancelBid(bidId);
  }

  @Patch(':id/bid')
  placeBid(
    @Param('id') bidId: string,
    @Body() body: { userId: string; amount: number },
  ) {
    return this.bidsService.placeBid(bidId, body.userId, body.amount);
  }

  @Get()
  getAllBids() {
    return this.bidsService.getAllBids();
  }

  @Get('approved')
  getApprovedBids() {
    return this.bidsService.getApprovedBids();
  }

  @Get('pending')
  getPendingBidsForAdmin() {
    return this.bidsService.getPendingBids();
  }

  @Get('creator/:userId')
  getBidsByCreator(@Param('userId') userId: string) {
    return this.bidsService.getBidsByCreator(userId);
  }

  @Get(':id')
  getBidById(@Param('id') bidId: string) {
    return this.bidsService.getBidById(bidId);
  }

  @Get('refresh-status')
  refreshStatuses() {
    return this.bidsService.refreshBidStatuses();
  }
}
