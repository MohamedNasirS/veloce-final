import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    Query,
    UseGuards,
    Request,
    HttpStatus,
    HttpCode,
} from '@nestjs/common';
import { AdminWinnerSelectionService } from './admin-winner-selection.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/winner-selection')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminWinnerSelectionController {
    constructor(private adminWinnerSelectionService: AdminWinnerSelectionService) { }

    // Get all closed bids that need winner selection
    @Get('pending')
    async getPendingWinnerSelection(@Query('page') page?: string, @Query('limit') limit?: string) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 50;
        return this.adminWinnerSelectionService.getPendingWinnerSelection(pageNum, limitNum);
    }

    // Get all closed bids with winners (completed winner selections)
    @Get('completed')
    async getCompletedWinnerSelections(@Query('page') page?: string, @Query('limit') limit?: string) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 50;
        return this.adminWinnerSelectionService.getCompletedWinnerSelections(pageNum, limitNum);
    }

    // Get all bids requiring winner selection (both pending and completed)
    @Get()
    async getAllWinnerSelectionBids(@Query('page') page?: string, @Query('limit') limit?: string) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 50;
        return this.adminWinnerSelectionService.getAllWinnerSelectionBids(pageNum, limitNum);
    }

    // Get specific bid details for winner selection
    @Get('bid/:bidId')
    async getBidForWinnerSelection(@Param('bidId') bidId: string) {
        return this.adminWinnerSelectionService.getBidForWinnerSelection(bidId);
    }

    // Get bidding history for a specific bid
    @Get('bid/:bidId/history')
    async getBiddingHistoryForAdmin(@Param('bidId') bidId: string) {
        return this.adminWinnerSelectionService.getBiddingHistoryForAdmin(bidId);
    }

    // Admin select winner for any bid
    @Post('bid/:bidId/select-winner')
    @HttpCode(HttpStatus.OK)
    async selectWinnerAsAdmin(
        @Param('bidId') bidId: string,
        @Body() body: { winnerId: string },
        @Request() req,
    ) {
        const adminId = req.user.sub;
        return this.adminWinnerSelectionService.selectWinnerAsAdmin(bidId, body.winnerId, adminId);
    }

    // Get winner selection statistics for admin dashboard
    @Get('stats/overview')
    async getWinnerSelectionStats() {
        return this.adminWinnerSelectionService.getWinnerSelectionStats();
    }

    // Override winner selection (change existing winner)
    @Patch('bid/:bidId/change-winner')
    @HttpCode(HttpStatus.OK)
    async changeWinner(
        @Param('bidId') bidId: string,
        @Body() body: { winnerId: string; reason?: string },
        @Request() req,
    ) {
        const adminId = req.user.sub;
        return this.adminWinnerSelectionService.changeWinner(bidId, body.winnerId, adminId, body.reason);
    }
}