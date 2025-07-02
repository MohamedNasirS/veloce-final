import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBidDto } from './dto/create-bid.dto';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class BidsService {
  constructor(private prisma: PrismaService) {}

  async createBid(images: Express.Multer.File[], dto: CreateBidDto) {
    const bid = await this.prisma.bid.create({
      data: {
        ...dto,
        quantity: parseFloat(dto.quantity),
        basePrice: parseFloat(dto.basePrice),
        currentPrice: parseFloat(dto.basePrice),
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        creatorId: dto.creatorId,
        status: 'PENDING',
      },
    });

    await this.prisma.bidImage.createMany({
      data: images.map(file => ({
        bidId: bid.id,
        path: `/uploads/bids/${file.filename}`,
      })),
    });

    // Ensure the uploads/bids directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads', 'bids');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Create JSON file for bidding history
    const bidHistory = {
      bidId: bid.id,
      bids: [
        {
          userId: null,
          amount: parseFloat(dto.basePrice),
          timestamp: new Date().toISOString(),
        },
      ],
    };
    const historyFilePath = path.join(uploadsDir, `bid_history_${bid.id}.json`);
    console.log('Creating bid history file:', historyFilePath);
    try {
      await fs.writeFile(historyFilePath, JSON.stringify(bidHistory, null, 2));
      console.log('Bid history file created for bid:', bid.id);
    } catch (error) {
      console.error('Error creating bid history file:', error);
      throw new Error('Failed to create bid history file');
    }

    return { message: 'Bid created and pending admin approval', bid };
  }

  async approveBid(bidId: string) {
    const bid = await this.prisma.bid.findUnique({ where: { id: bidId } });
    if (!bid) throw new NotFoundException('Bid not found');

    await this.prisma.bid.update({
      where: { id: bidId },
      data: { status: 'APPROVED' },
    });

    return { message: 'Bid approved successfully' };
  }

  async cancelBid(bidId: string) {
    const bid = await this.prisma.bid.findUnique({ where: { id: bidId } });
    if (!bid) throw new NotFoundException('Bid not found');

    await this.prisma.bid.update({
      where: { id: bidId },
      data: { status: 'CANCELLED' },
    });

    return { message: 'Bid cancelled successfully' };
  }

  async placeBid(bidId: string, userId: string, amount: number) {
    console.log('Received bid attempt:', { bidId, userId, amount }); // Debug: Log incoming request
    const bid = await this.prisma.bid.findUnique({ where: { id: bidId } });
    if (!bid) throw new NotFoundException('Bid not found');

    if (bid.status !== 'LIVE') {
      throw new BadRequestException('This bid is not currently open for bidding.');
    }

    // Validate amount
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Bid amount must be a positive number.');
    }
    if (amount <= bid.currentPrice) {
      throw new BadRequestException(`Bid amount must be higher than the current price of ₹${bid.currentPrice}.`);
    }

    // Ensure the uploads/bids directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads', 'bids');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Update JSON file with new bid
    const historyFilePath = path.join(uploadsDir, `bid_history_${bidId}.json`);
    console.log('Placing bid for bid:', bidId, 'user:', userId, 'amount:', amount);

    const existing = await this.prisma.bidParticipant.findFirst({
      where: { bidId, userId },
    });

    try {
      let bidHistory;
      try {
        const fileContent = await fs.readFile(historyFilePath, 'utf-8');
        bidHistory = JSON.parse(fileContent);
      } catch (error) {
        // If file doesn't exist, create a new one
        bidHistory = {
          bidId,
          bids: [
            {
              userId: null,
              amount: bid.currentPrice,
              timestamp: new Date().toISOString(),
            },
          ],
        };
      }

      if (existing) {
        // Update existing bid in BidParticipant
        await this.prisma.bidParticipant.updateMany({
          where: { bidId, userId },
          data: { amount },
        });
        console.log('Updated existing bid for user:', userId, 'bid:', bidId);
      } else {
        // Create new BidParticipant entry
        await this.prisma.bidParticipant.create({
          data: { bidId, userId, amount },
        });
        console.log('Created new bid for user:', userId, 'bid:', bidId);
      }

      // Update JSON history with new bid
      bidHistory.bids.push({
        userId,
        amount,
        timestamp: new Date().toISOString(),
      });
      await fs.writeFile(his
System: It looks like the provided `bids.service.ts` file was cut off in the middle of the `placeBid` method. I'll complete the modification based on the context and the previous version of the file, ensuring the `placeBid` method validates the bid amount, updates the JSON file, and preserves all functionality. Additionally, I'll update `LiveBids.tsx` to add input validation, display error messages using a toast notification (consistent with `SelectWinner.tsx`), and preserve existing functionality.

### Error Analysis (Recap)
- **Error**: The `AxiosError: Request failed with status code 400` in `LiveBids.tsx` at line 45 (`handleBidSubmit`) indicates a `BadRequestException` from the `PATCH /bids/:id/bid` endpoint in `bids.service.ts`.
- **Likely Cause**: The `amount` sent in the request is invalid (e.g., `NaN`, empty, or not higher than `currentPrice`) or the backend is rejecting the request due to missing validation.
- **Frontend Issue**: `LiveBids.tsx` lacks input validation for `bidAmount` and does not display errors to the user, only logging them to the console.
- **Backend Issue**: The `placeBid` method needs to validate `amount` against `currentPrice` and handle invalid inputs robustly.
- **Requirements**:
  - Update `bids.service.ts` to complete the `placeBid` method with proper validation.
  - Update `LiveBids.tsx` to validate `bidAmount` and show error messages via toast.
  - Preserve all functionality in both files, including JSON file handling (`bid_history_<bidId>.json`), bidding history fetch, and winner selection.
  - No changes to `SelectWinner.tsx`, `WasteGeneratorDashboard.tsx`, or `App.tsx`.

### Modified Files

#### 1. bids.service.ts
Complete the `placeBid` method with validation for `amount` and ensure the JSON file and Prisma updates are consistent.

<xaiArtifact artifact_id="4b9b9126-e0e6-498c-899a-4aec1f325024" artifact_version_id="85dbbcea-ee55-4312-a691-9fe1827cdc00" title="bids.service.ts" contentType="text/typescript">
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBidDto } from './dto/create-bid.dto';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class BidsService {
  constructor(private prisma: PrismaService) {}

  async createBid(images: Express.Multer.File[], dto: CreateBidDto) {
    const bid = await this.prisma.bid.create({
      data: {
        ...dto,
        quantity: parseFloat(dto.quantity),
        basePrice: parseFloat(dto.basePrice),
        currentPrice: parseFloat(dto.basePrice),
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        creatorId: dto.creatorId,
        status: 'PENDING',
      },
    });

    await this.prisma.bidImage.createMany({
      data: images.map(file => ({
        bidId: bid.id,
        path: `/uploads/bids/${file.filename}`,
      })),
    });

    // Ensure the uploads/bids directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads', 'bids');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Create JSON file for bidding history
    const bidHistory = {
      bidId: bid.id,
      bids: [
        {
          userId: null,
          amount: parseFloat(dto.basePrice),
          timestamp: new Date().toISOString(),
        },
      ],
    };
    const historyFilePath = path.join(uploadsDir, `bid_history_${bid.id}.json`);
    console.log('Creating bid history file:', historyFilePath);
    try {
      await fs.writeFile(historyFilePath, JSON.stringify(bidHistory, null, 2));
      console.log('Bid history file created for bid:', bid.id);
    } catch (error) {
      console.error('Error creating bid history file:', error);
      throw new Error('Failed to create bid history file');
    }

    return { message: 'Bid created and pending admin approval', bid };
  }

  async approveBid(bidId: string) {
    const bid = await this.prisma.bid.findUnique({ where: { id: bidId } });
    if (!bid) throw new NotFoundException('Bid not found');

    await this.prisma.bid.update({
      where: { id: bidId },
      data: { status: 'APPROVED' },
    });

    return { message: 'Bid approved successfully' };
  }

  async cancelBid(bidId: string) {
    const bid = await this.prisma.bid.findUnique({ where: { id: bidId } });
    if (!bid) throw new NotFoundException('Bid not found');

    await this.prisma.bid.update({
      where: { id: bidId },
      data: { status: 'CANCELLED' },
    });

    return { message: 'Bid cancelled successfully' };
  }

  async placeBid(bidId: string, userId: string, amount: number) {
    console.log('Received bid attempt:', { bidId, userId, amount }); // Debug: Log incoming request
    const bid = await this.prisma.bid.findUnique({ where: { id: bidId } });
    if (!bid) throw new NotFoundException('Bid not found');

    if (bid.status !== 'LIVE') {
      throw new BadRequestException('This bid is not currently open for bidding.');
    }

    // Validate amount
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Bid amount must be a positive number.');
    }
    if (amount <= bid.currentPrice) {
      throw new BadRequestException(`Bid amount must be higher than the current price of ₹${bid.currentPrice}.`);
    }

    // Ensure the uploads/bids directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads', 'bids');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Update JSON file with new bid
    const historyFilePath = path.join(UploadsDir, `bid_history_${bidId}.json`);
    console.log('Placing bid for bid:', bidId, 'user:', userId, 'amount:', amount);

    const existing = await this.prisma.bidParticipant.findFirst({
      where: { bidId, userId },
    });

    try {
      let bidHistory;
      try {
        const fileContent = await fs.readFile(historyFilePath, 'utf-8');
        bidHistory = JSON.parse(fileContent);
      } catch (error) {
        // If file doesn't exist, create a new one
        bidHistory = {
          bidId,
          bids: [
            {
              userId: null,
              amount: bid.currentPrice,
              timestamp: new Date().toISOString(),
            },
          ],
        };
      }

      if (existing) {
        // Update existing bid in BidParticipant
        await this.prisma.bidParticipant.updateMany({
          where: { bidId, userId },
          data: { amount },
        });
        console.log('Updated existing bid for user:', userId, 'bid:', bidId);
      } else {
        // Create new BidParticipant entry
        await this.prisma.bidParticipant.create({
          data: { bidId, userId, amount },
        });
        console.log('Created new bid for user:', userId, 'bid:', bidId);
      }

      // Update JSON history with new bid
      bidHistory.bids.push({
        userId,
        amount,
        timestamp: new Date().toISOString(),
      });
      await fs.writeFile(historyFilePath, JSON.stringify(bidHistory, null, 2));
      console.log('Bid history updated for bid:', bidId);

      // Update bid's currentPrice if the new amount is higher
      if (amount > bid.currentPrice) {
        await this.prisma.bid.update({
          where: { id: bidId },
          data: { currentPrice: amount },
        });
        console.log('Updated currentPrice for bid:', bidId, 'to:', amount);
      }

      return { message: existing ? 'Bid updated successfully' : 'Bid placed successfully' };
    } catch (error) {
      console.error('Error placing/updating bid:', error);
      throw new Error('Failed to place or update bid');
    }
  }

  async getApprovedBids() {
    return this.prisma.bid.findMany({
      where: {
        status全都删掉 status: {
          in: ['APPROVED', 'LIVE'],
        },
      },
      include: {
        images: true,
        creator: true,
        participants: true,
      },
    });
  }

  async getPendingBids() {
    return this.prisma.bid.findMany({
      where: { status: 'PENDING' },
      include: { creator: true, images: true },
    });
  }

  async getBidsByCreator(userId: string) {
    return this.prisma.bid.findMany({
      where: { creatorId: userId },
      include: {
        images: true,
        participants: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBidById(bidId: string) {
    const bid = await this.prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        images: true,
        creator: true,
        participants: {
          include: { user: true },
          orderBy: { amount: 'desc' },
        },
      },
    });

    if (!bid) throw new NotFoundException('Bid not found');
    return bid;
  }

  async getAllBids() {
    return this.prisma.bid.findMany({
      include: {
        images: true,
        creator: true,
        participants: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBiddingHistory(bidId: string) {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'bids');
    const historyFilePath = path.join(uploadsDir, `bid_history_${bidId}.json`);
    console.log('Attempting to read bidding history file:', historyFilePath);
    try {
      await fs.access(historyFilePath);
      const fileContent = await fs.readFile(historyFilePath, 'utf-8');
      const historyData = JSON.parse(fileContent);
      console.log('Fetched bidding history from JSON:', historyData);
      return historyData;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.warn('Bidding history file not found for bid:', bidId);
        return { bidId, bids: [] };
      }
      console.error('Error reading bidding history:', error);
      throw new NotFoundException('Failed to fetch bidding history');
    }
  }

  async selectWinner(bidId: string, winnerId: string) {
    const bid = await this.prisma.bid.findUnique({ where: { id: bidId } });
    if (!bid) throw new NotFoundException('Bid not found');

    const uploadsDir = path.join(process.cwd(), 'uploads', 'bids');
    const historyFilePath = path.join(uploadsDir, `bid_history_${bidId}.json`);
    console.log('Selecting winner for bid:', bidId, 'winnerId:', winnerId);
    try {
      const fileContent = await fs.readFile(historyFilePath, 'utf-8');
      const historyData = JSON.parse(fileContent);
      historyData.winnerId = winnerId;
      await fs.writeFile(historyFilePath, JSON.stringify(historyData, null, 2));
      console.log('Winner updated in bid history for bid:', bidId);
    } catch (error) {
      console.error('Error updating winner in bid history:', error);
      throw new Error('Failed to update bid history with winner');
    }

    return this.prisma.bid.update({
      where: { id: bidId },
      data: { winnerId },
    });
  }

  async refreshBidStatuses() {
    const now = new Date();

    const toLive = await this.prisma.bid.updateMany({
      where: {
        status: 'APPROVED',
        startDate: { lte: now },
      },
      data: { status: 'LIVE' },
    });

    const toClosed = await this.prisma.bid.updateMany({
      where: {
        status: 'LIVE',
        endDate: { lte: now },
      },
      data: { status: 'CLOSED' },
    });

    return {
      message: 'Bid statuses refreshed',
      updatedToLive: toLive.count,
      updatedToClosed: toClosed.count,
    };
  }
}