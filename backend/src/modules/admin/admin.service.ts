// src/modules/admin/admin.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client'; // Corrected import from UserRole to Role

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers() {
    return this.prisma.user.findMany({
      where: {
        role: { not: 'admin' },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateUserStatus(userId: string, status: 'approved' | 'rejected' | 'pending') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let isApproved = user.isApproved;
    if (status === 'approved') isApproved = true;
    if (status === 'rejected' || status === 'pending') isApproved = false;

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isApproved: isApproved,
      },
    });
  }

  async updateUserRole(userId: string, role: Role) { // Use the corrected Role type
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (role === 'admin') {
        throw new Error("Cannot assign admin role.");
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        role: role,
      },
    });
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Before deleting the user, we need to handle related records
    // to avoid foreign key constraint errors.

    // Delete related UserDocument first
    await this.prisma.userDocument.deleteMany({
      where: { userId: userId },
    });

    // Disassociate from bids they won
    await this.prisma.bid.updateMany({
        where: { winnerId: userId },
        data: { winnerId: null },
    });
    
    // Delete their participation records
    await this.prisma.bidParticipant.deleteMany({
        where: { userId: userId },
    });

    // Delete events they triggered
     await this.prisma.bidEvent.deleteMany({
        where: { userId: userId },
    });
    
    // Handle bids they created (e.g., delete them or reassign)
    // For now, let's delete them. Be careful with this in production.
    const createdBids = await this.prisma.bid.findMany({
        where: { creatorId: userId },
        include: { images: true, participants: true, events: true },
    });

    for (const bid of createdBids) {
        await this.prisma.bidImage.deleteMany({ where: { bidId: bid.id }});
        await this.prisma.bidParticipant.deleteMany({ where: { bidId: bid.id }});
        await this.prisma.bidEvent.deleteMany({ where: { bidId: bid.id }});
        await this.prisma.bid.delete({ where: { id: bid.id }});
    }

    // Finally, delete the user
    return this.prisma.user.delete({
      where: { id: userId },
    });
  }
}