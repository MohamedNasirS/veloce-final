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

      // Create user first to get the user ID
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
          status: 'approved',
        },
      });

      // Create user-specific folder structure
      const userFolderName = this.generateUserFolderName(user.id, user.email, user.company);
      const userDocumentsPath = path.join(process.cwd(), 'uploads', 'documents', userFolderName);
      
      // Create the user's document folder
      await fs.mkdir(userDocumentsPath, { recursive: true });

      // Handle file uploads if any files are provided
      if (files && Object.keys(files).length > 0) {
        const documentPromises = Object.entries(files).map(async ([type, file]: [string, any]) => {
          if (file) {
            // Create subfolder for document type (optional)
            const documentTypeFolder = path.join(userDocumentsPath, type);
            await fs.mkdir(documentTypeFolder, { recursive: true });

            // Generate unique filename
            const timestamp = Date.now();
            const fileExtension = path.extname(file.originalname);
            const fileName = `${type}_${timestamp}${fileExtension}`;
            const filePath = path.join(documentTypeFolder, fileName);
            
            // Save file to user's specific folder
            await fs.writeFile(filePath, file.buffer);

            // Save document record to database
            return this.prisma.document.create({
              data: {
                userId: user.id,
                type,
                originalName: file.originalname,
                fileName,
                filePath,
                relativePath: path.join('uploads', 'documents', userFolderName, type, fileName),
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
        userFolder: userFolderName,
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Generate a clean folder name for the user
  private generateUserFolderName(userId: string, email: string, company: string): string {
    // Clean the company name to be filesystem-safe
    const cleanCompany = company
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .toLowerCase();
    
    // Clean email (remove @ and . for folder name)
    const cleanEmail = email.replace(/[@.]/g, '_');
    
    // Create folder name: userId_companyName_email
    return `${userId}_${cleanCompany}_${cleanEmail}`;
  }

  async login(email: string, password: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

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

  // Method to get user documents with folder info
  async getUserDocuments(userId: string) {
    const documents = await this.prisma.document.findMany({
      where: { userId },
      select: {
        id: true,
        type: true,
        originalName: true,
        fileName: true,
        relativePath: true,
        fileSize: true,
        mimeType: true,
        uploadedAt: true,
      },
    });

    // Get user info for folder structure
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, company: true },
    });

    const userFolderName = user ? this.generateUserFolderName(userId, user.email, user.company) : userId;

    return {
      documents,
      userFolder: userFolderName,
      totalDocuments: documents.length,
    };
  }

  // Method to get document file with proper path resolution
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
      relativePath: document.relativePath,
      originalName: document.originalName,
      mimeType: document.mimeType,
    };
  }

  // Method to get user's folder structure
  async getUserFolderStructure(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, company: true, name: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const userFolderName = this.generateUserFolderName(userId, user.email, user.company);
    const userDocumentsPath = path.join(process.cwd(), 'uploads', 'documents', userFolderName);

    try {
      // Check if folder exists and get its contents
      const folderExists = await fs.access(userDocumentsPath).then(() => true).catch(() => false);
      
      if (folderExists) {
        const folderContents = await fs.readdir(userDocumentsPath, { withFileTypes: true });
        const subfolders = folderContents
          .filter(item => item.isDirectory())
          .map(item => item.name);

        return {
          userFolder: userFolderName,
          folderPath: userDocumentsPath,
          subfolders,
          folderExists: true,
        };
      }

      return {
        userFolder: userFolderName,
        folderPath: userDocumentsPath,
        subfolders: [],
        folderExists: false,
      };
    } catch (error) {
      console.error('Error reading user folder:', error);
      return {
        userFolder: userFolderName,
        folderPath: userDocumentsPath,
        subfolders: [],
        folderExists: false,
        error: error.message,
      };
    }
  }
}