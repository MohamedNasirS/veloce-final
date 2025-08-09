import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface VendorSuccessRate {
    userId: string;
    userName: string;
    userEmail: string;
    company: string;
    totalWonBids: number;
    completedPickups: number;
    successRate: number;
    totalBidsCreated: number;
    activeBids: number;
    totalRevenue: number;
    averageBidValue: number;
    lastActivityDate: string | null;
    status: string;
    role: string;
}

@Injectable()
export class VendorMetricsService {
    constructor(private prisma: PrismaService) { }

    async calculateVendorSuccessRate(userId: string): Promise<VendorSuccessRate> {
        // Get user information
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                company: true,
                status: true,
                role: true,
                createdAt: true,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Get all bids created by this vendor
        const createdBids = await this.prisma.bid.findMany({
            where: { creatorId: userId },
            include: {
                winner: true,
            },
        });

        // Get bids won by this vendor (where they are the winner)
        const wonBids = await this.prisma.bid.findMany({
            where: { winnerId: userId },
            include: {
                creator: true,
            },
        });

        // Calculate metrics for bids created by vendor
        const totalBidsCreated = createdBids.length;
        const activeBids = createdBids.filter(bid =>
            bid.status === 'LIVE' || bid.status === 'APPROVED'
        ).length;

        // Calculate total revenue from created bids
        const totalRevenue = createdBids
            .filter(bid => bid.status === 'CLOSED' && bid.winnerId)
            .reduce((sum, bid) => sum + bid.currentPrice, 0);

        // Calculate average bid value
        const averageBidValue = totalBidsCreated > 0 ? totalRevenue / totalBidsCreated : 0;

        // For success rate calculation, we need to determine "completed pickups"
        // A completed pickup is when:
        // 1. The vendor won a bid (winnerId = userId)
        // 2. The bid is closed
        // 3. A gate pass has been uploaded (indicating pickup completion)

        const totalWonBids = wonBids.length;
        const completedPickups = wonBids.filter(bid =>
            bid.status === 'CLOSED' && bid.gatePassPath
        ).length;

        // Calculate success rate: (Completed Pickups / Won Bids) * 100
        const successRate = totalWonBids > 0 ? (completedPickups / totalWonBids) * 100 : 0;

        // Get last activity date
        const lastBid = createdBids.length > 0
            ? createdBids.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
            : null;

        return {
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            company: user.company,
            totalWonBids,
            completedPickups,
            successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
            totalBidsCreated,
            activeBids,
            totalRevenue,
            averageBidValue: Math.round(averageBidValue * 100) / 100,
            lastActivityDate: lastBid?.createdAt.toISOString() || null,
            status: user.status,
            role: user.role,
        };
    }

    async getAllVendorSuccessRates(): Promise<VendorSuccessRate[]> {
        // Get all users (vendors can be waste_generator, recycler, or aggregator)
        const users = await this.prisma.user.findMany({
            where: {
                role: {
                    in: ['waste_generator', 'recycler', 'aggregator'],
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                company: true,
                status: true,
                role: true,
            },
        });

        const successRates: VendorSuccessRate[] = [];

        for (const user of users) {
            try {
                const successRate = await this.calculateVendorSuccessRate(user.id);
                successRates.push(successRate);
            } catch (error) {
                console.error(`Error calculating success rate for user ${user.id}:`, error);
                // Add a default entry for users with errors
                successRates.push({
                    userId: user.id,
                    userName: user.name,
                    userEmail: user.email,
                    company: user.company,
                    totalWonBids: 0,
                    completedPickups: 0,
                    successRate: 0,
                    totalBidsCreated: 0,
                    activeBids: 0,
                    totalRevenue: 0,
                    averageBidValue: 0,
                    lastActivityDate: null,
                    status: user.status,
                    role: user.role,
                });
            }
        }

        // Sort by success rate descending
        return successRates.sort((a, b) => b.successRate - a.successRate);
    }

    async getTopPerformingVendors(limit: number = 10): Promise<VendorSuccessRate[]> {
        const allRates = await this.getAllVendorSuccessRates();
        return allRates
            .filter(vendor => vendor.totalWonBids > 0) // Only include vendors with at least one won bid
            .slice(0, limit);
    }

    async getVendorPerformanceStats() {
        const allRates = await this.getAllVendorSuccessRates();

        const activeVendors = allRates.filter(v => v.totalWonBids > 0);
        const totalVendors = allRates.length;
        const averageSuccessRate = activeVendors.length > 0
            ? activeVendors.reduce((sum, v) => sum + v.successRate, 0) / activeVendors.length
            : 0;

        const highPerformers = activeVendors.filter(v => v.successRate >= 80).length;
        const mediumPerformers = activeVendors.filter(v => v.successRate >= 50 && v.successRate < 80).length;
        const lowPerformers = activeVendors.filter(v => v.successRate < 50).length;

        return {
            totalVendors,
            activeVendors: activeVendors.length,
            averageSuccessRate: Math.round(averageSuccessRate * 100) / 100,
            performanceDistribution: {
                high: highPerformers, // >= 80%
                medium: mediumPerformers, // 50-79%
                low: lowPerformers, // < 50%
            },
            totalRevenue: activeVendors.reduce((sum, v) => sum + v.totalRevenue, 0),
            totalCompletedPickups: activeVendors.reduce((sum, v) => sum + v.completedPickups, 0),
        };
    }
}