import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(userData: any, files: any) {
    try {
      const {
        name,
        email,
        password,
        company,
        role,
        phone,
        address,
        registrationNumber,
        taxId,
        description,
      } = userData;

      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new BadRequestException('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          company,
          role,
          phone,
          address,
          registrationNumber,
          taxId,
          description,
          status: 'approved', // Set to approved for testing, change to 'pending' for production
        },
      });

      // Handle file uploads
      if (files && Object.keys(files).length > 0) {
        const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
        await fs.mkdir(uploadDir, { recursive: true });

        const documentPromises = Object.entries(files).map(async ([type, file]: [string, any]) => {
          if (file) {
            const fileName = `${user.id}_${type}_${Date.now()}_${file.originalname}`;
            const filePath = path.join(uploadDir, fileName);
            
            // Save file to disk
            await fs.writeFile(filePath, file.buffer);

            // Save document record to database
            return this.prisma.document.create({
              data: {
                userId: user.id,
                type,
                originalName: file.originalname,
                fileName,
                filePath,
                fileSize: file.size,
                mimeType: file.mimetype,
              },
            });
          }
        });

        await Promise.all(documentPromises.filter(Boolean));
      }

      return {
        success: true,
        message: 'Registration submitted successfully!',
        userId: user.id,
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async login(email: string, password: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // For testing, allow any status. In production, uncomment the line below:
      // if (user.status !== 'approved') {
      //   throw new UnauthorizedException('Account is pending approval or has been rejected');
      // }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = { 
        sub: user.id, 
        email: user.email, 
        role: user.role 
      };

      return {
        success: true,
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
        },
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Method to get user documents
  async getUserDocuments(userId: string) {
    return this.prisma.document.findMany({
      where: { userId },
      select: {
        id: true,
        type: true,
        originalName: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        uploadedAt: true,
      },
    });
  }

  // Method to get document file
  async getDocumentFile(documentId: string, userId: string) {
    const document = await this.prisma.document.findFirst({
      where: { 
        id: documentId,
        userId: userId 
      },
    });

    if (!document) {
      throw new BadRequestException('Document not found');
    }

    return {
      filePath: document.filePath,
      originalName: document.originalName,
      mimeType: document.mimeType,
    };
  }
}