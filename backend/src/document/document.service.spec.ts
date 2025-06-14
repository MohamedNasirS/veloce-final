// backend/src/document/document.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentService } from './document.service';
import { Document } from './document.entity';
import { Item } from '../item/item.entity';
import { User } from '../user/user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockUser = { id: 1, email: 'uploader@example.com' } as User;
const mockItem = { id: 'item-uuid', name: 'Related Item' } as Item;

const mockDocumentRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
};
const mockItemRepository = {
  findOne: jest.fn(),
};

describe('DocumentService', () => {
  let service: DocumentService;
  let docRepository: Repository<Document>;
  let itemRepository: Repository<Item>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentService,
        { provide: getRepositoryToken(Document), useValue: mockDocumentRepository },
        { provide: getRepositoryToken(Item), useValue: mockItemRepository },
      ],
    }).compile();

    service = module.get<DocumentService>(DocumentService);
    docRepository = module.get<Repository<Document>>(getRepositoryToken(Document));
    itemRepository = module.get<Repository<Item>>(getRepositoryToken(Item));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    const mockFile = {
      originalname: 'test.jpg',
      mimetype: 'image/jpeg',
      path: 'uploads/test.jpg',
      size: 1024,
    } as Express.Multer.File;

    it('should upload a file and save document metadata', async () => {
      const expectedDoc = { id: 'doc-uuid', ...mockFile } as any;
      mockDocumentRepository.create.mockReturnValue(expectedDoc);
      mockDocumentRepository.save.mockResolvedValue(expectedDoc);

      // mapDocumentToResponseDto is private, so we test its effect
      const result = await service.uploadFile(mockFile, mockUser);
      expect(docRepository.create).toHaveBeenCalledWith(expect.objectContaining({ filename: mockFile.originalname }));
      expect(docRepository.save).toHaveBeenCalledWith(expectedDoc);
      expect(result.filename).toEqual(mockFile.originalname);
    });

    it('should throw BadRequestException if no file is uploaded', async () => {
      await expect(service.uploadFile(null, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should link to an item if relatedItemId is provided and item exists', async () => {
        mockItemRepository.findOne.mockResolvedValue(mockItem); // Item exists
        const expectedDoc = { id: 'doc-uuid', relatedItemId: mockItem.id } as any;
        mockDocumentRepository.create.mockReturnValue(expectedDoc);
        mockDocumentRepository.save.mockResolvedValue(expectedDoc);

        const result = await service.uploadFile(mockFile, mockUser, mockItem.id);
        expect(itemRepository.findOne).toHaveBeenCalledWith({ where: { id: mockItem.id } });
        expect(docRepository.create).toHaveBeenCalledWith(expect.objectContaining({ relatedItemId: mockItem.id }));
        expect(result.relatedItemId).toEqual(mockItem.id);
    });

    it('should throw NotFoundException if relatedItemId is provided but item does not exist', async () => {
        mockItemRepository.findOne.mockResolvedValue(null); // Item does not exist
        await expect(service.uploadFile(mockFile, mockUser, 'non-existent-item-id')).rejects.toThrow(NotFoundException);
    });
  });
});
