import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Res,
  Req,
  NotFoundException
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Response, Request } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly configService: ConfigService
  ) {}

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
  async getUserDocuments(
    @Param('userId') userId: string,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const dir = path.join(process.cwd(), 'uploads', 'users', userId);
    try {
      if (!fs.existsSync(dir)) {
        throw new NotFoundException('Directory not found');
      }

      // Prefer dynamic host, fallback to env BASE_URL
      const host = req.get('host');
      const protocol = req.protocol;
      const envBase = this.configService.get<string>('BASE_URL') || 'http://localhost:3001';
      const baseUrl = host ? `${protocol}://${host}` : envBase;

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
