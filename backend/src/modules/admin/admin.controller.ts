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
  Logger,
  All,
  Post,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { Role } from '@prisma/client'; // Corrected import from UserRole to Role

// The controller is now correctly mapped to handle /api/admin routes
@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly adminService: AdminService,
    private readonly prisma: PrismaService,
  ) { }

  @Get('users')
  getAllUsers() {
    this.logger.log('GET /api/admin/users');
    return this.adminService.getAllUsers();
  }

  @Patch('users/:id/status')
  updateUserStatus(
    @Param('id') id: string,
    @Body() body: { status: 'approved' | 'rejected' | 'pending' }
  ) {
    this.logger.log(`PATCH /api/admin/users/${id}/status - ${body.status}`);
    return this.adminService.updateUserStatus(id, body.status);
  }

  @Patch('users/:id/role')
  updateUserRole(
    @Param('id') id: string,
    @Body() body: { role: Role } // Use the corrected Role type
  ) {
    this.logger.log(`PATCH /api/admin/users/${id}/role - ${body.role}`);
    return this.adminService.updateUserRole(id, body.role);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    this.logger.log(`DELETE /api/admin/users/${id}`);
    try {
      await this.adminService.deleteUser(id);
      this.logger.log(`User ${id} deleted successfully`);
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }

  // Fix the POST route for deleting users
  @Post('users/:id/delete')
  async deleteUserPost(@Param('id') id: string) {
    this.logger.log(`POST /api/admin/users/${id}/delete`);
    try {
      await this.adminService.deleteUser(id);
      this.logger.log(`User ${id} deleted successfully via POST`);
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting user ${id} via POST:`, error);
      throw error;
    }
  }

  // Add a simpler route for deleting users
  @Post('delete-user')
  async deleteUserSimple(@Body() body: { userId: string }) {
    const { userId } = body;
    this.logger.log(`POST /api/admin/delete-user with userId: ${userId}`);
    try {
      await this.adminService.deleteUser(userId);
      this.logger.log(`User ${userId} deleted successfully via simple POST`);
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting user ${userId} via simple POST:`, error);
      throw error;
    }
  }

  // Add a catch-all route for debugging
  @All('users/:id')
  async catchAll(@Param('id') id: string, @Res() res: Response) {
    this.logger.log(`Caught request for /api/admin/users/${id} with method ${res.req.method}`);
    if (res.req.method === 'DELETE') {
      try {
        await this.adminService.deleteUser(id);
        this.logger.log(`User ${id} deleted successfully via catch-all`);
        return res.json({ success: true, message: 'User deleted successfully' });
      } catch (error) {
        this.logger.error(`Error deleting user ${id} via catch-all:`, error);
        return res.status(500).json({ success: false, message: error.message });
      }
    }
    return res.status(404).json({ message: 'Route not found' });
  }

  @Get('users/:userId/documents')
  async getUserDocuments(
    @Param('userId') userId: string,
    @Res() res: Response
  ) {
    this.logger.log(`GET /api/admin/users/${userId}/documents`);

    try {
      // Get user document records from database
      const userDocument = await this.prisma.userDocument.findUnique({
        where: { userId },
      });

      if (!userDocument) {
        return res.status(404).json({ message: 'No documents found for this user.' });
      }

      const baseUrl = 'http://147.93.27.172:3001'; // Replace with your actual base URL from config
      const documents = [];

      // Document type mapping
      const documentTypes = {
        gstCertificatePath: { name: 'GST Certificate', type: 'gstCertificate' },
        panCardPath: { name: 'PAN Card', type: 'panCard' },
        bankDocumentPath: { name: 'Bank Document', type: 'bankDocument' },
        authorizedSignatoryPath: { name: 'Authorized Signatory', type: 'authorizedSignatory' },
        companyRegistrationPath: { name: 'Company Registration', type: 'companyRegistration' }
      };

      // Check each document type
      for (const [pathField, docInfo] of Object.entries(documentTypes)) {
        const filePath = userDocument[pathField];
        if (filePath) {
          const fullPath = path.join(process.cwd(), filePath);

          // Check if file exists on disk
          if (fs.existsSync(fullPath)) {
            const fileName = path.basename(filePath);
            documents.push({
              name: docInfo.name,
              type: docInfo.type,
              fileName: fileName,
              url: `${baseUrl}/${filePath.replace(/\\/g, '/')}`,
              uploadedAt: userDocument.uploadedAt,
              exists: true
            });
          } else {
            // File path exists in DB but file is missing on disk
            documents.push({
              name: docInfo.name,
              type: docInfo.type,
              fileName: 'File missing',
              url: null,
              uploadedAt: userDocument.uploadedAt,
              exists: false
            });
          }
        }
      }

      // If no documents found in database, try the old file system approach
      if (documents.length === 0) {
        const oldDir = path.join(process.cwd(), 'uploads', 'users', userId);
        if (fs.existsSync(oldDir)) {
          const files = fs.readdirSync(oldDir);
          files.forEach(filename => {
            documents.push({
              name: filename,
              type: 'unknown',
              fileName: filename,
              url: `${baseUrl}/uploads/users/${userId}/${filename}`,
              uploadedAt: null,
              exists: true,
              legacy: true
            });
          });
        }
      }

      return res.json({
        documents,
        totalDocuments: documents.filter(doc => doc.exists).length,
        userId
      });

    } catch (error) {
      this.logger.error(`Error fetching documents for user ${userId}:`, error);
      return res.status(500).json({ message: 'Error fetching user documents.' });
    }
  }
}