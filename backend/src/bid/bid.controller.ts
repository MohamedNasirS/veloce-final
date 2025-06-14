import { Controller, Get, Post, Body, Param, UseGuards, Req, ParseUUIDPipe } from '@nestjs/common';
import { BidService } from './bid.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../user/user.entity';

@Controller('bids')
export class BidController {
  constructor(private readonly bidService: BidService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createBidDto: CreateBidDto, @Req() req) {
    const user = req.user as User;
    return this.bidService.create(createBidDto, user);
  }

  @Get('item/:itemId')
  findByItem(@Param('itemId', ParseUUIDPipe) itemId: string) {
    return this.bidService.findByItem(itemId);
  }

  // Get bids for the currently authenticated user
  @UseGuards(JwtAuthGuard)
  @Get('my-bids')
  findMyBids(@Req() req) {
    const user = req.user as User;
    return this.bidService.findByUser(user.id);
  }

  // Or, if you need to get bids by any user ID (e.g., for admin)
  // Ensure proper authorization for this if it's sensitive
  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    // Add role checks if necessary
    return this.bidService.findByUser(parseInt(userId, 10));
  }

  @Get('winning/:itemId')
  getWinningBid(@Param('itemId', ParseUUIDPipe) itemId: string) {
    return this.bidService.getWinningBid(itemId);
  }
}
