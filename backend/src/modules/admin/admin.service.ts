// src/modules/admin/admin.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers() {
    return this.prisma.user.findMany({
      where: {
        role: { not: 'admin' }, // ✅ exclude admins
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateUserStatus(userId: string, status: 'approved' | 'rejected') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isApproved: status === 'approved',
      },
    });
  }
}
