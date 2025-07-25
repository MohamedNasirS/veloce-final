import { 
  Controller, 
  Post, 
  Get,
  Param,
  Body, 
  HttpCode, 
  HttpStatus, 
  UseInterceptors, 
  UploadedFiles,
  Res,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('test')
  test() {
    return { message: 'Auth routes are working!' };
  }

  @Post('register')
  @UseInterceptors(FileFieldsInterceptor([
  { name: 'gstCertificate', maxCount: 1 },
  { name: 'panCard', maxCount: 1 },
  { name: 'bankDocument', maxCount: 1 },
  { name: 'authorizedSignatory', maxCount: 1 },
  { name: 'companyRegistration', maxCount: 1 },
]))
async register(
  @Body() registerDto: any,
  @UploadedFiles() files: {
    gstCertificate?: Express.Multer.File[],
    panCard?: Express.Multer.File[],
    bankDocument?: Express.Multer.File[],
    authorizedSignatory?: Express.Multer.File[],
    companyRegistration?: Express.Multer.File[],
  },
) {
  const cleanedFiles = {};
  for (const key in files) {
    if (files[key] && files[key].length > 0) {
      cleanedFiles[key] = files[key][0];
    }
  }
  return await this.authService.register(registerDto, cleanedFiles);
}


  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    try {
      return await this.authService.login(loginDto.email, loginDto.password);
    } catch (error) {
      console.error('Login controller error:', error);
      throw error;
    }
  }

  // Get user documents with folder info
  @Get('documents/:userId')
  async getUserDocuments(@Param('userId') userId: string) {
    return this.authService.getUserDocuments(userId);
  }

  // Get user's folder structure
  @Get('folder/:userId')
  async getUserFolder(@Param('userId') userId: string) {
    return this.authService.getUserFolderStructure(userId);
  }

  // Download document file
  @Get('documents/:userId/:documentId')
  async downloadDocument(
    @Param('userId') userId: string,
    @Param('documentId') documentId: string,
    @Res() res: Response,
  ) {
    try {
      const document = await this.authService.getDocumentFile(documentId, userId);
      
      if (fs.existsSync(document.filePath)) {
        res.setHeader('Content-Type', document.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
        
        const fileStream = fs.createReadStream(document.filePath);
        fileStream.pipe(res);
      } else {
        res.status(404).json({ message: 'File not found on disk' });
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}