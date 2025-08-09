import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AdminGatePassService {
    constructor(private prisma: PrismaService) { }

    // Get all closed bids with winners for admin management
    async getAllClosedBidsWithWinners(page: number = 1, limit: number = 50) {
        const skip = (page - 1) * limit;

        const [bids, totalCount] = await Promise.all([
            this.prisma.bid.findMany({
                where: {
                    status: 'CLOSED',
                    winnerId: { not: null },
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
                    gatePassUploader: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
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

    // Get gate pass for a specific bid (admin can view any)
    async getGatePass(bidId: string) {
        const bid = await this.prisma.bid.findUnique({
            where: { id: bidId },
            select: {
                id: true,
                lotName: true,
                status: true,
                gatePassPath: true,
                gatePassUploadedBy: true,
                gatePassUploadedAt: true,
                winnerId: true,
                creatorId: true,
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
                gatePassUploader: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        if (!bid) {
            throw new NotFoundException('Bid not found');
        }

        if (bid.status !== 'CLOSED') {
            throw new BadRequestException('Gate pass only available for closed bids');
        }

        if (!bid.winnerId) {
            throw new BadRequestException('No winner selected for this bid');
        }

        return {
            bid,
            gatePassPath: bid.gatePassPath,
            uploadedBy: bid.gatePassUploader,
            uploadedAt: bid.gatePassUploadedAt,
        };
    }

    // Upload gate pass for any bid (admin privilege)
    async uploadGatePass(bidId: string, adminId: string, filePath: string) {
        // Get the bid
        const bid = await this.prisma.bid.findUnique({
            where: { id: bidId },
            select: {
                id: true,
                status: true,
                winnerId: true,
                gatePassPath: true,
                lotName: true,
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                winner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        // Validation checks
        if (!bid) {
            throw new NotFoundException('Bid not found');
        }

        if (bid.status !== 'CLOSED') {
            throw new BadRequestException('Gate pass upload only allowed for closed bids');
        }

        if (!bid.winnerId) {
            throw new BadRequestException('No winner selected for this bid');
        }

        // Delete the old gate pass file if it exists
        if (bid.gatePassPath) {
            const absoluteOldPath = path.join(process.cwd(), bid.gatePassPath);
            console.log('Admin deleting old gate pass:', absoluteOldPath);

            try {
                if (fs.existsSync(absoluteOldPath)) {
                    fs.unlinkSync(absoluteOldPath);
                    console.log('Old gate pass deleted successfully by admin.');
                }
            } catch (error) {
                console.error('Error deleting old gate pass:', error.message);
            }
        }

        // Update the gate pass in database
        const updatedBid = await this.prisma.bid.update({
            where: { id: bidId },
            data: {
                gatePassPath: filePath,
                gatePassUploadedBy: adminId,
                gatePassUploadedAt: new Date(),
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                winner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                gatePassUploader: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
            },
        });

        console.log(`Admin ${adminId} uploaded gate pass for bid ${bidId} (${bid.lotName})`);

        return {
            success: true,
            message: 'Gate pass uploaded successfully by admin',
            gatePassPath: updatedBid.gatePassPath,
            uploadedBy: updatedBid.gatePassUploader,
            uploadedAt: updatedBid.gatePassUploadedAt,
            bid: {
                id: updatedBid.id,
                lotName: bid.lotName,
                creator: bid.creator,
                winner: bid.winner,
            },
        };
    }

    // Get gate pass statistics for admin dashboard
    async getGatePassStats() {
        const [totalClosedBids, pendingGatePasses, completedGatePasses, adminUploaded, wasteGeneratorUploaded] = await Promise.all([
            // Total closed bids with winners
            this.prisma.bid.count({
                where: {
                    status: 'CLOSED',
                    winnerId: { not: null },
                },
            }),
            // Pending gate passes
            this.prisma.bid.count({
                where: {
                    status: 'CLOSED',
                    winnerId: { not: null },
                    gatePassPath: null,
                },
            }),
            // Completed gate passes
            this.prisma.bid.count({
                where: {
                    status: 'CLOSED',
                    winnerId: { not: null },
                    gatePassPath: { not: null },
                },
            }),
            // Gate passes uploaded by admin
            this.prisma.bid.count({
                where: {
                    status: 'CLOSED',
                    winnerId: { not: null },
                    gatePassPath: { not: null },
                    gatePassUploader: {
                        role: 'admin',
                    },
                },
            }),
            // Gate passes uploaded by waste generators
            this.prisma.bid.count({
                where: {
                    status: 'CLOSED',
                    winnerId: { not: null },
                    gatePassPath: { not: null },
                    gatePassUploader: {
                        role: 'waste_generator',
                    },
                },
            }),
        ]);

        return {
            totalClosedBids,
            pendingGatePasses,
            completedGatePasses,
            adminUploaded,
            wasteGeneratorUploaded,
            completionRate: totalClosedBids > 0 ? Math.round((completedGatePasses / totalClosedBids) * 100) : 0,
        };
    }

    // Get gate passes by status
    async getGatePassesByStatus(status: string) {
        let whereCondition: any = {
            status: 'CLOSED',
            winnerId: { not: null },
        };

        if (status === 'pending') {
            whereCondition.gatePassPath = null;
        } else if (status === 'completed') {
            whereCondition.gatePassPath = { not: null };
        }

        const bids = await this.prisma.bid.findMany({
            where: whereCondition,
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
                gatePassUploader: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        return {
            status,
            count: bids.length,
            bids,
        };
    }
}