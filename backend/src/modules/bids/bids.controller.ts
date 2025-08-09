import {
  Controller, Post, Body, UseInterceptors, UploadedFiles, UploadedFile,
  Get, Patch, Param, Query, BadRequestException, Res, Req, ForbiddenException, NotFoundException
} from '@nestjs/common';
import { Response, Request } from 'express';
import { BidsService } from './bids.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { BidHistory } from './types';

@Controller('bids')
export class BidsController {
  constructor(private readonly bidsService: BidsService) { }

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

  @Get(':id/history')
  getBiddingHistory(@Param('id') bidId: string): Promise<BidHistory> {
    return this.bidsService.getBiddingHistory(bidId);
  }

  @Patch(':id/select-winner')
  selectWinner(@Param('id') bidId: string, @Body() body: { winnerId: string; selectedById?: string }) {
    return this.bidsService.selectWinner(bidId, body.winnerId, body.selectedById);
  }

  @Get('refresh-status')
  refreshStatuses() {
    return this.bidsService.refreshBidStatuses();
  }

  // ✅ New Gate Pass Endpoints

  @Get(':id/gate-pass')
  async getGatePass(
    @Param('id') bidId: string,
    @Query('userId') userId: string,
  ) {
    return this.bidsService.getGatePass(bidId, userId);
  }
  @Post(':id/gate-pass')
  @UseInterceptors(
    FileInterceptor('gatePass', {
      storage: diskStorage({
        destination: './uploads/gatepasses',
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname);
          cb(null, `${uuidv4()}${ext}`);
        },
      }),
    }),
  )
  uploadGatePass(
    @Param('id') bidId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId: string,
  ) {
    return this.bidsService.uploadGatePass(bidId, userId, `/uploads/gatepasses/${file.filename}`);
  }

  @Get('participated/:userId')
  async getParticipatedBids(@Param('userId') userId: string) {
    return this.bidsService.getParticipatedBids(userId);
  }

}
