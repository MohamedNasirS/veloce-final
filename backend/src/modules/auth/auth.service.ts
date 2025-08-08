import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import * as fs from 'fs/promises';
import { Role, UserStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

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

      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        throw new BadRequestException('User with this email already exists');
      }

      const normalizedRole = this.normalizeRole(role);

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          company,
          role: normalizedRole,
          phone,
          address,
          registrationNumber,
          taxId,
          description,
          status: UserStatus.PENDING,
        },
      });

      const userFolderPath = path.join(process.cwd(), 'uploads', 'users', user.id);
      await fs.mkdir(userFolderPath, { recursive: true });

      const saveFile = async (key: string, file): Promise<string | null> => {
        if (!file) return null;
        const ext = path.extname(file.originalname);
        const filename = `${key}${ext}`;
        const filePath = path.join(userFolderPath, filename);
        await fs.writeFile(filePath, file.buffer);
        return path.relative(process.cwd(), filePath);
      };

      const gstPath = await saveFile('gst', files.gstCertificate);
      const panPath = await saveFile('pan', files.panCard);
      const bankPath = await saveFile('bank', files.bankDocument);
      const signatoryPath = await saveFile('signatory', files.authorizedSignatory);
      const regPath = await saveFile('registration', files.companyRegistration);

      await this.prisma.userDocument.create({
        data: {
          userId: user.id,
          gstCertificatePath: gstPath,
          panCardPath: panPath,
          bankDocumentPath: bankPath,
          authorizedSignatoryPath: signatoryPath ?? undefined,
          companyRegistrationPath: regPath,
        },
      });

      return {
        success: true,
        message: 'Registration successful. Awaiting admin approval.',
        userId: user.id,
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  private normalizeRole(input: string): Role {
    switch (input?.toLowerCase()) {
      case 'waste_generator':
        return 'waste_generator';
      case 'recycler':
        return 'recycler';
      case 'aggregator':
        return 'aggregator';
      case 'admin':
        return 'admin';
      default:
        throw new BadRequestException(`Invalid role: ${input}`);
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

      if (user.status !== UserStatus.APPROVED) {
        throw new UnauthorizedException('Your account is not approved yet. Please wait for admin approval.');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
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


  async getUserDocuments(userId: string) {
    const doc = await this.prisma.userDocument.findUnique({
      where: { userId },
    });

    if (!doc) {
      throw new BadRequestException('No documents found for user');
    }

    return {
      documents: doc,
      totalDocuments: Object.entries(doc).filter(([k, v]) =>
        k.endsWith('Path') && v
      ).length,
    };
  }

  async getDocumentFile(documentType: string, userId: string) {
    const doc = await this.prisma.userDocument.findUnique({
      where: { userId },
    });

    if (!doc) {
      throw new BadRequestException('User document not found');
    }

    const key = `${documentType}Path`;
    const relativePath = doc[key];

    if (!relativePath) {
      throw new BadRequestException(`Document type ${documentType} not found`);
    }

    const filePath = path.join(process.cwd(), relativePath);
    const mimeType = this.getMimeTypeFromExtension(filePath);

    return {
      filePath,
      relativePath,
      originalName: path.basename(filePath),
      mimeType,
    };
  }

  private getMimeTypeFromExtension(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.pdf':
        return 'application/pdf';
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      default:
        return 'application/octet-stream';
    }
  }

  async getUserFolderStructure(userId: string) {
    const userFolderPath = path.join(process.cwd(), 'uploads', 'users', userId);

    try {
      const folderExists = await fs
        .access(userFolderPath)
        .then(() => true)
        .catch(() => false);

      if (!folderExists) {
        return {
          folderExists: false,
          folderPath: userFolderPath,
          subfiles: [],
        };
      }

      const contents = await fs.readdir(userFolderPath);
      return {
        folderExists: true,
        folderPath: userFolderPath,
        subfiles: contents,
      };
    } catch (error) {
      console.error('Error reading folder:', error);
      return {
        folderExists: false,
        folderPath: userFolderPath,
        subfiles: [],
        error: error.message,
      };
    }
  }
}