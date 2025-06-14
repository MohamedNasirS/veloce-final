// backend/src/document/document.controller.ts
import {
  Controller, Get, Post, Param, UseGuards, Req, UploadedFile, UseInterceptors, ParseUUIDPipe, Delete, Query, Optional, Body
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { DocumentService } from './document.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../user/user.entity';
import { FileResponseDto } from './dto/file-response.dto';

// Multer options
export const multerOptions = {
  limits: {
    fileSize: 1024 * 1024 * 20, // 20MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common document types
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx)$/)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type ${extname(file.originalname)}`), false);
    }
  },
  storage: diskStorage({
    destination: './uploads', // Ensure this directory exists
    filename: (req, file, cb) => {
      const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
      cb(null, `${randomName}${extname(file.originalname)}`);
    },
  }),
};

@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
    @Body('relatedItemId') @Optional() relatedItemId?: string, // Get relatedItemId from form-data
  ): Promise<FileResponseDto> {
    const user = req.user as User;
    // If relatedItemId is passed in query for some reason, prioritize body.
    // relatedItemId = relatedItemId || (req.query.relatedItemId as string);
    return this.documentService.uploadFile(file, user, relatedItemId);
  }

  @Get(':id')
  async getDocumentInfo(@Param('id', ParseUUIDPipe) id: string): Promise<FileResponseDto> {
    return this.documentService.getDocumentInfo(id);
  }

  @Get('item/:itemId')
  async getDocumentsByItem(@Param('itemId', ParseUUIDPipe) itemId: string): Promise<FileResponseDto[]> {
    return this.documentService.getDocumentsByItem(itemId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/my-documents')
  async getMyDocuments(@Req() req): Promise<FileResponseDto[]> {
    const user = req.user as User;
    return this.documentService.getDocumentsByUser(user.id);
  }

  @UseGuards(JwtAuthGuard) // Protect deletion
  @Delete(':id')
  async deleteDocument(@Param('id', ParseUUIDPipe) id: string, @Req() req): Promise<void> {
      const user = req.user as User;
      return this.documentService.deleteDocument(id, user.id);
  }
}
