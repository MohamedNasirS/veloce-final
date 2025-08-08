import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus } from '@prisma/client';
import { BidGateway } from '../../gateways/bid.gateway';

@Injectable()
export class UserService {
    constructor(
        private prisma: PrismaService,
        private bidGateway: BidGateway,
    ) { }

    async approveUser(userId: string, adminId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.status !== UserStatus.PENDING) {
            throw new BadRequestException('User is not in pending status');
        }

        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                status: UserStatus.APPROVED,
                updatedAt: new Date(),
            },
        });

        // Emit user approval event via WebSocket
        this.bidGateway.emitUserApproved({
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            company: updatedUser.company,
            role: updatedUser.role,
            status: updatedUser.status,
            approvedBy: adminId,
            approvedAt: updatedUser.updatedAt,
        });

        return {
            success: true,
            message: 'User approved successfully',
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                status: updatedUser.status,
            },
        };
    }

    async rejectUser(userId: string, adminId: string, reason?: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.status !== UserStatus.PENDING) {
            throw new BadRequestException('User is not in pending status');
        }

        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                status: UserStatus.REJECTED,
                updatedAt: new Date(),
            },
        });

        // Emit user rejection event via WebSocket
        this.bidGateway.emitUserRejected({
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            company: updatedUser.company,
            role: updatedUser.role,
            status: updatedUser.status,
            rejectedBy: adminId,
            rejectedAt: updatedUser.updatedAt,
            reason: reason || 'No reason provided',
        });

        return {
            success: true,
            message: 'User rejected successfully',
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                status: updatedUser.status,
            },
        };
    }

    async getPendingUsers() {
        const users = await this.prisma.user.findMany({
            where: { status: UserStatus.PENDING },
            select: {
                id: true,
                name: true,
                email: true,
                company: true,
                role: true,
                phone: true,
                address: true,
                registrationNumber: true,
                taxId: true,
                description: true,
                status: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return {
            success: true,
            users,
            count: users.length,
        };
    }

    async getAllUsers() {
        const users = await this.prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                company: true,
                role: true,
                phone: true,
                address: true,
                registrationNumber: true,
                taxId: true,
                description: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return {
            success: true,
            users,
            count: users.length,
        };
    }
}