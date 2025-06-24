// src/modules/admin/admin.controller.ts
import { Controller, Get, Patch, Param, Body, Res, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('admin') // used after globalPrefix 'api'
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Patch('users/:id/status')
  updateUserStatus(
    @Param('id') id: string,
    @Body() body: { status: 'approved' | 'rejected' }
  ) {
    return this.adminService.updateUserStatus(id, body.status);
  }

  @Get('users/:userId/documents')
  async getUserDocuments(@Param('userId') userId: string, @Res() res: Response) {
    const dir = path.join(process.cwd(), 'uploads', 'users', userId);
    try {
      if (!fs.existsSync(dir)) {
        throw new NotFoundException('Directory not found');
      }

      const files = fs.readdirSync(dir);
      const documents = files.map((filename) => ({
        name: filename,
        url: `http://localhost:3001/uploads/users/${userId}/${filename}`,
      }));

      return res.json({ documents });
    } catch (error) {
      return res.status(404).json({ message: 'No documents found for this user.' });
    }
  }
}
