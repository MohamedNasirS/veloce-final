// backend/src/document/document.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './document.entity';
import { User } from '../user/user.entity';
import { Item } from '../item/item.entity'; // To validate relatedItemId
import { FileResponseDto } from './dto/file-response.dto';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(Item) // For validating relatedItemId
    private itemRepository: Repository<Item>,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    user: User,
    relatedItemId?: string,
  ): Promise<FileResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    let itemExists: Item | null = null;
    if (relatedItemId) {
      itemExists = await this.itemRepository.findOne({ where: { id: relatedItemId } });
      if (!itemExists) {
        throw new NotFoundException(`Item with ID "${relatedItemId}" not found.`);
      }
    }

    const document = this.documentRepository.create({
      filename: file.originalname,
      mimetype: file.mimetype,
      storagePath: file.path, // Path where multer saved the file
      fileSize: file.size,
      uploadedByUserId: user.id,
      relatedItemId: relatedItemId || null,
    });

    const savedDocument = await this.documentRepository.save(document);
    return this.mapDocumentToResponseDto(savedDocument);
  }

  async getDocumentInfo(id: string): Promise<FileResponseDto | null> {
    const document = await this.documentRepository.findOne({ where: { id } });
    if (!document) {
      throw new NotFoundException(`Document with ID "${id}" not found.`);
    }
    return this.mapDocumentToResponseDto(document);
  }

  async getDocumentsByItem(itemId: string): Promise<FileResponseDto[]> {
    const documents = await this.documentRepository.find({ where: { relatedItemId: itemId } });
    return documents.map(this.mapDocumentToResponseDto);
  }

  async getDocumentsByUser(userId: number): Promise<FileResponseDto[]> {
    const documents = await this.documentRepository.find({ where: { uploadedByUserId: userId } });
    return documents.map(this.mapDocumentToResponseDto);
  }

  async deleteDocument(id: string, userId: number): Promise<void> {
    const document = await this.documentRepository.findOne({ where: { id } });
    if (!document) {
        throw new NotFoundException(`Document with ID "${id}" not found.`);
    }
    // Optional: Check if the user is authorized to delete (e.g., uploader or admin)
    if (document.uploadedByUserId !== userId) {
        // Add admin role check here if admins should be able to delete any doc
        // For now, only uploader can delete
        // throw new UnauthorizedException('You are not authorized to delete this document.');
    }

    // TODO: Actually delete the file from disk: fs.unlinkSync(document.storagePath);
    // This requires 'fs' module and careful error handling. Deferring for now.

    await this.documentRepository.remove(document);
  }

  private mapDocumentToResponseDto(document: Document): FileResponseDto {
    return {
      id: document.id,
      filename: document.filename,
      mimetype: document.mimetype,
      fileSize: document.fileSize,
      storagePath: document.storagePath, // Consider if this should be transformed to a URL
      uploadTimestamp: document.uploadTimestamp,
      relatedItemId: document.relatedItemId,
      uploadedByUserId: document.uploadedByUserId,
    };
  }
}
