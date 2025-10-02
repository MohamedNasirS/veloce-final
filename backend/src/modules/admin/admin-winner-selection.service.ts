import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BidsService } from '../bids/bids.service';
import { BidGateway } from '../../gateways/bid.gateway';
import { BidEventType } from '@prisma/client';

@Injectable()
export class AdminWinnerSelectionService {
    constructor(
        private prisma: PrismaService,
        private bidsService: BidsService,
        private bidGateway: BidGateway,
    ) { }

    // Get all closed bids that need winner selection (no winner selected yet)
    async getPendingWinnerSelection(page: number = 1, limit: number = 50) {
        const skip = (page - 1) * limit;

        const [bids, totalCount] = await Promise.all([
            this.prisma.bid.findMany({
                where: {
                    status: 'CLOSED',
                    winnerId: null, // No winner selected yet
                },
                include: {
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            company: true,
                        },
                    },
                    participants: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    company: true,
                                },
                            },
                        },
                        orderBy: { amount: 'desc' },
                    },
                    _count: {
                        select: {
                            participants: true,
                        },
                    },
                },
                orderBy: { endDate: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.bid.count({
                where: {
                    status: 'CLOSED',
                    winnerId: null,
                },
            }),
        ]);

        return {
            bids,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
                hasNext: page * limit < totalCount,
                hasPrev: page > 1,
            },
        };
    }

    // Get all closed bids with winners (completed winner selections)
    async getCompletedWinnerSelections(page: number = 1, limit: number = 50) {
        const skip = (page - 1) * limit;

        const [bids, totalCount] = await Promise.all([
            this.prisma.bid.findMany({
                where: {
                    status: 'CLOSED',
                    winnerId: { not: null }, // Winner already selected
                },
                include: {
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            company: true,
                        },
                    },
                    winner: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            company: true,
                        },
                    },
                    participants: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    company: true,
                                },
                            },
                        },
                        orderBy: { amount: 'desc' },
                    },
                    _count: {
                        select: {
                            participants: true,
                        },
                    },
                },
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.bid.count({
                where: {
                    status: 'CLOSED',
                    winnerId: { not: null },
                },
            }),
        ]);

        return {
            bids,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
                hasNext: page * limit < totalCount,
                hasPrev: page > 1,
            },
        };
    }

    // Get all bids requiring winner selection (both pending and completed)
    async getAllWinnerSelectionBids(page: number = 1, limit: number = 50) {
        const skip = (page - 1) * limit;

        const [bids, totalCount] = await Promise.all([
            this.prisma.bid.findMany({
                where: {
                    status: 'CLOSED',
                },
                include: {
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            company: true,
                        },
                    },
                    winner: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            company: true,
                        },
                    },
                    participants: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    company: true,
                                },
                            },
                        },
                        orderBy: { amount: 'desc' },
                    },
                    _count: {
                        select: {
                            participants: true,
                        },
                    },
                },
                orderBy: { endDate: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.bid.count({
                where: {
                    status: 'CLOSED',
                },
            }),
        ]);

        return {
            bids,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
                hasNext: page * limit < totalCount,
                hasPrev: page > 1,
            },
        };
    }

    // Get specific bid details for winner selection
    async getBidForWinnerSelection(bidId: string) {
        const bid = await this.prisma.bid.findUnique({
            where: { id: bidId },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        company: true,
                    },
                },
                winner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        company: true,
                    },
                },
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                company: true,
                            },
                        },
                    },
                    orderBy: { amount: 'desc' },
                },
                images: true,
                _count: {
                    select: {
                        participants: true,
                    },
                },
            },
        });

        if (!bid) {
            throw new NotFoundException('Bid not found');
        }

        if (bid.status !== 'CLOSED') {
            throw new BadRequestException('Winner selection only available for closed bids');
        }

        return {
            bid,
            hasWinner: !!bid.winnerId,
            participantCount: bid._count.participants,
        };
    }

    // Get bidding history for admin winner selection
    async getBiddingHistoryForAdmin(bidId: string) {
        return this.bidsService.getBiddingHistory(bidId);
    }

    // Admin select winner for any bid
    async selectWinnerAsAdmin(bidId: string, winnerId: string, adminId: string) {
        // Verify the bid exists and is closed
        const bid = await this.prisma.bid.findUnique({
            where: { id: bidId },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        company: true,
                    },
                },
            },
        });

        if (!bid) {
            throw new NotFoundException('Bid not found');
        }

        if (bid.status !== 'CLOSED') {
            throw new BadRequestException('Winner can only be selected for closed bids');
        }

        if (bid.winnerId) {
            throw new BadRequestException('Winner already selected for this bid. Use change-winner endpoint to modify.');
        }

        // Verify the winner participated in the bid
        const participation = await this.prisma.bidParticipant.findFirst({
            where: {
                bidId,
                userId: winnerId,
            },
        });

        if (!participation) {
            throw new BadRequestException('Selected user did not participate in this bid');
        }

        // Use the existing selectWinner method with admin tracking
        const result = await this.bidsService.selectWinner(bidId, winnerId, adminId);

        console.log(`Admin ${adminId} selected winner ${winnerId} for bid ${bidId}`);

        return {
            success: true,
            message: 'Winner selected successfully by admin',
            bid: result,
            selectedBy: 'admin',
            adminId,
        };
    }

    // Get winner selection statistics
    async getWinnerSelectionStats() {
        const [totalClosedBids, pendingWinnerSelection, completedWinnerSelection, adminSelected, wasteGeneratorSelected] = await Promise.all([
            // Total closed bids
            this.prisma.bid.count({
                where: { status: 'CLOSED' },
            }),
            // Pending winner selection
            this.prisma.bid.count({
                where: {
                    status: 'CLOSED',
                    winnerId: null,
                },
            }),
            // Completed winner selection
            this.prisma.bid.count({
                where: {
                    status: 'CLOSED',
                    winnerId: { not: null },
                },
            }),
            // Count of winners selected by admin (from bid events)
            this.prisma.bidEvent.count({
                where: {
                    type: BidEventType.WINNER_SELECTED,
                    user: {
                        role: 'admin',
                    },
                },
            }),
            // Count of winners selected by waste generators
            this.prisma.bidEvent.count({
                where: {
                    type: BidEventType.WINNER_SELECTED,
                    user: {
                        role: 'waste_generator',
                    },
                },
            }),
        ]);

        return {
            totalClosedBids,
            pendingWinnerSelection,
            completedWinnerSelection,
            adminSelected,
            wasteGeneratorSelected,
            completionRate: totalClosedBids > 0 ? Math.round((completedWinnerSelection / totalClosedBids) * 100) : 0,
        };
    }

    // Change existing winner (admin override)
    async changeWinner(bidId: string, newWinnerId: string, adminId: string, reason?: string) {
        const bid = await this.prisma.bid.findUnique({
            where: { id: bidId },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        company: true,
                    },
                },
                winner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        company: true,
                    },
                },
            },
        });

        if (!bid) {
            throw new NotFoundException('Bid not found');
        }

        if (bid.status !== 'CLOSED') {
            throw new BadRequestException('Winner can only be changed for closed bids');
        }

        if (!bid.winnerId) {
            throw new BadRequestException('No winner selected yet. Use select-winner endpoint instead.');
        }

        // Verify the new winner participated in the bid
        const participation = await this.prisma.bidParticipant.findFirst({
            where: {
                bidId,
                userId: newWinnerId,
            },
        });

        if (!participation) {
            throw new BadRequestException('New winner did not participate in this bid');
        }

        // Get new winner details
        const newWinner = await this.prisma.user.findUnique({
            where: { id: newWinnerId },
            select: {
                id: true,
                name: true,
                email: true,
                company: true,
            },
        });

        // Create bid event for winner change
        await this.prisma.bidEvent.create({
            data: {
                bidId,
                userId: newWinnerId,
                amount: 0,
                type: BidEventType.WINNER_SELECTED,
            },
        });

        // Update the bid with new winner
        const updatedBid = await this.prisma.bid.update({
            where: { id: bidId },
            data: { winnerId: newWinnerId },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        company: true,
                    },
                },
                winner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        company: true,
                    },
                },
            },
        });

        // Get admin details
        const admin = await this.prisma.user.findUnique({
            where: { id: adminId },
            select: {
                id: true,
                name: true,
                role: true,
            },
        });

        // Emit WebSocket event for winner change
        this.bidGateway.emitWinnerSelected(updatedBid, newWinner, admin);

        console.log(`Admin ${adminId} changed winner for bid ${bidId} from ${bid.winner?.name} to ${newWinner?.name}. Reason: ${reason || 'No reason provided'}`);

        return {
            success: true,
            message: 'Winner changed successfully by admin',
            bid: updatedBid,
            previousWinner: bid.winner,
            newWinner: newWinner,
            reason: reason || 'No reason provided',
            changedBy: 'admin',
            adminId,
        };
    }
}