import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Res,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { Role } from '@prisma/client'; // Corrected import from UserRole to Role

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
  ) {}

  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Patch('users/:id/status')
  updateUserStatus(
    @Param('id') id: string,
    @Body() body: { status: 'approved' | 'rejected' | 'pending' }
  ) {
    return this.adminService.updateUserStatus(id, body.status);
  }

  @Patch('users/:id/role')
  updateUserRole(
    @Param('id') id: string,
    @Body() body: { role: Role } // Use the corrected Role type
  ) {
    return this.adminService.updateUserRole(id, body.role);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Get('users/:userId/documents')
  async getUserDocuments(
    @Param('userId') userId: string,
    @Res() res: Response
  ) {
    const dir = path.join(process.cwd(), 'uploads', 'users', userId);
    try {
      if (!fs.existsSync(dir)) {
        throw new NotFoundException('Directory not found');
      }

      const baseUrl = 'http://147.93.27.172:3001'; // Replace with your actual base URL from config

      const files = fs.readdirSync(dir);
      const documents = files.map((filename) => ({
        name: filename,
        url: `${baseUrl}/uploads/users/${userId}/${filename}`,
      }));

      return res.json({ documents });
    } catch (error) {
      return res.status(404).json({ message: 'No documents found for this user.' });
    }
  }
}