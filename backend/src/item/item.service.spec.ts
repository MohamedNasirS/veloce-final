// backend/src/item/item.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm'; // Import In for multi-status checks
import { ItemService } from './item.service';
import { Item, ItemStatus } from './item.entity';
import { User } from '../user/user.entity'; // Assuming User entity has 'role'
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';

// Mock Users with different roles
const mockCreatorUser = { id: 1, email: 'creator@example.com', role: 'CREATOR' } as User;
const mockAdminUser = { id: 2, email: 'admin@example.com', role: 'ADMIN' } as User;
const mockBidderUser = { id: 3, email: 'bidder@example.com', role: 'BIDDER' } as User;

// Mock Item Repository
const mockItemRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
};

describe('ItemService', () => {
  let service: ItemService;
  let repository: Repository<Item>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemService,
        {
          provide: getRepositoryToken(Item),
          useValue: mockItemRepository,
        },
      ],
    }).compile();

    service = module.get<ItemService>(ItemService);
    repository = module.get<Repository<Item>>(getRepositoryToken(Item));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createItemDto: CreateItemDto = { name: 'Test Item', description: 'Test Desc', startingPrice: 100, endTime: new Date().toISOString() };

    it('should set status to PENDING_APPROVAL for CREATOR role', async () => {
      const expectedItem = { ...createItemDto, sellerId: mockCreatorUser.id, status: ItemStatus.PENDING_APPROVAL } as any;
      mockItemRepository.create.mockReturnValue(expectedItem);
      mockItemRepository.save.mockResolvedValue(expectedItem);

      await service.create(createItemDto, mockCreatorUser);
      expect(mockItemRepository.create).toHaveBeenCalledWith(expect.objectContaining({ status: ItemStatus.PENDING_APPROVAL, sellerId: mockCreatorUser.id }));
      expect(mockItemRepository.save).toHaveBeenCalledWith(expectedItem);
    });

    it('should set status to OPEN for ADMIN role if not specified in DTO', async () => {
      const expectedItem = { ...createItemDto, sellerId: mockAdminUser.id, status: ItemStatus.OPEN } as any;
      mockItemRepository.create.mockReturnValue(expectedItem);
      mockItemRepository.save.mockResolvedValue(expectedItem);

      await service.create(createItemDto, mockAdminUser);
      expect(mockItemRepository.create).toHaveBeenCalledWith(expect.objectContaining({ status: ItemStatus.OPEN, sellerId: mockAdminUser.id }));
    });

    it('should use status from DTO if provided by ADMIN', async () => {
      const adminCreateDto: CreateItemDto = { ...createItemDto, status: ItemStatus.CLOSED };
      const expectedItem = { ...adminCreateDto, sellerId: mockAdminUser.id } as any;
      mockItemRepository.create.mockReturnValue(expectedItem);
      mockItemRepository.save.mockResolvedValue(expectedItem);

      await service.create(adminCreateDto, mockAdminUser);
      expect(mockItemRepository.create).toHaveBeenCalledWith(expect.objectContaining({ status: ItemStatus.CLOSED, sellerId: mockAdminUser.id }));
    });
  });

  describe('findAll', () => {
    it('should return only OPEN items for public (no user)', async () => {
      await service.findAll();
      expect(mockItemRepository.find).toHaveBeenCalledWith({ where: { status: ItemStatus.OPEN }, relations: ['seller'] });
    });

    it('should return only OPEN items for BIDDER role', async () => {
      await service.findAll(mockBidderUser);
      expect(mockItemRepository.find).toHaveBeenCalledWith({ where: { status: ItemStatus.OPEN }, relations: ['seller'] });
    });

    it('should return items with various statuses for ADMIN role', async () => {
      await service.findAll(mockAdminUser);
      // As per service logic: whereConditions will be an array of objects
      const calledWith = mockItemRepository.find.mock.calls[0][0];
      expect(calledWith.where).toBeInstanceOf(Array);
    });

    it('should return own items for CREATOR role', async () => {
      await service.findAll(mockCreatorUser);
      expect(mockItemRepository.find).toHaveBeenCalledWith({ where: { sellerId: mockCreatorUser.id }, relations: ['seller'] });
    });
  });

  describe('approveItem', () => {
    const itemId = 'item-id-approve';
    const pendingItem = { id: itemId, status: ItemStatus.PENDING_APPROVAL, save: jest.fn().mockResolvedValue(this) } as any;

    it('should allow ADMIN to approve a PENDING_APPROVAL item', async () => {
      mockItemRepository.findOne.mockResolvedValue(pendingItem);
      // Mock the save method directly on the object instance for this test
      const saveSpy = jest.spyOn(pendingItem, 'save');

      const result = await service.approveItem(itemId, mockAdminUser);

      expect(mockItemRepository.findOne).toHaveBeenCalledWith({ where: { id: itemId }, relations: ['seller'] }); // findOne is called by approveItem
      expect(pendingItem.status).toBe(ItemStatus.OPEN);
      expect(saveSpy).toHaveBeenCalled(); // Check that item.save() was called
      expect(result.status).toBe(ItemStatus.OPEN);
    });

    it('should throw UnauthorizedException if non-ADMIN tries to approve', async () => {
      await expect(service.approveItem(itemId, mockCreatorUser)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if item is not PENDING_APPROVAL', async () => {
      const openItem = { id: itemId, status: ItemStatus.OPEN } as Item;
      mockItemRepository.findOne.mockResolvedValue(openItem);
      await expect(service.approveItem(itemId, mockAdminUser)).rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectItem', () => {
    const itemId = 'item-id-reject';
    const pendingItem = { id: itemId, status: ItemStatus.PENDING_APPROVAL, save: jest.fn().mockResolvedValue(this) } as any;

    it('should allow ADMIN to reject a PENDING_APPROVAL item', async () => {
      mockItemRepository.findOne.mockResolvedValue(pendingItem);
      const saveSpy = jest.spyOn(pendingItem, 'save');

      const result = await service.rejectItem(itemId, mockAdminUser);

      expect(mockItemRepository.findOne).toHaveBeenCalledWith({ where: { id: itemId }, relations: ['seller'] });
      expect(pendingItem.status).toBe(ItemStatus.REJECTED);
      expect(saveSpy).toHaveBeenCalled();
      expect(result.status).toBe(ItemStatus.REJECTED);
    });

    it('should throw UnauthorizedException if non-ADMIN tries to reject', async () => {
      await expect(service.rejectItem(itemId, mockCreatorUser)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('update', () => {
    const itemId = 'item-id-update';
    const updateDto: UpdateItemDto = { name: 'Updated Name' };
    // For these tests, the actual save is on the repository, not the item instance itself.
    // The item instance is modified and then passed to repository.save().
    const creatorItemPending = { id: itemId, sellerId: mockCreatorUser.id, status: ItemStatus.PENDING_APPROVAL, name: 'Old Name' } as Item;
    const adminItemOpen = { id: 'admin-item', sellerId: mockCreatorUser.id, status: ItemStatus.OPEN, name: 'Admin Old Name' } as Item;

    beforeEach(() => {
        // Reset save mock for each test in this describe block if needed
        mockItemRepository.save.mockClear();
    });

    it('should allow ADMIN to update any item', async () => {
        mockItemRepository.findOne.mockResolvedValue(adminItemOpen);
        mockItemRepository.save.mockImplementation(item => Promise.resolve(item)); // mock save to return the item passed to it

        const result = await service.update(adminItemOpen.id, updateDto, mockAdminUser);
        expect(mockItemRepository.findOne).toHaveBeenCalledWith({ where: { id: adminItemOpen.id }, relations: ['seller'] });
        expect(mockItemRepository.save).toHaveBeenCalledWith(expect.objectContaining({ id: adminItemOpen.id, name: updateDto.name }));
        expect(result.name).toBe(updateDto.name);
    });

    it('should allow CREATOR to update their PENDING_APPROVAL item', async () => {
        mockItemRepository.findOne.mockResolvedValue(creatorItemPending);
        mockItemRepository.save.mockImplementation(item => Promise.resolve(item));

        const result = await service.update(itemId, updateDto, mockCreatorUser);
        expect(mockItemRepository.findOne).toHaveBeenCalledWith({ where: { id: itemId }, relations: ['seller'] });
        expect(mockItemRepository.save).toHaveBeenCalledWith(expect.objectContaining({ id: itemId, name: updateDto.name }));
        expect(result.name).toBe(updateDto.name);
    });

    it('should deny CREATOR to update item in wrong status (e.g. CLOSED)', async () => {
        const closedItem = { ...creatorItemPending, status: ItemStatus.CLOSED };
        mockItemRepository.findOne.mockResolvedValue(closedItem);
        await expect(service.update(itemId, updateDto, mockCreatorUser)).rejects.toThrow(UnauthorizedException);
    });

    it('should deny CREATOR to update another user item', async () => {
        const anotherUserItem = { ...creatorItemPending, sellerId: 999 }; // Different sellerId
        mockItemRepository.findOne.mockResolvedValue(anotherUserItem);
        await expect(service.update(itemId, updateDto, mockCreatorUser)).rejects.toThrow(UnauthorizedException);
    });
  });

   describe('removeItem', () => {
    const itemId = 'test-item-id';
    const creatorItemPending = { id: itemId, sellerId: mockCreatorUser.id, status: ItemStatus.PENDING_APPROVAL } as Item;

    it('should allow ADMIN to delete any item', async () => {
        mockItemRepository.findOne.mockResolvedValue(creatorItemPending);
        mockItemRepository.delete.mockResolvedValue({ affected: 1 });
        await service.removeItem(itemId, mockAdminUser);
        expect(mockItemRepository.findOne).toHaveBeenCalledWith({ where: { id: itemId }, relations: ['seller'] });
        expect(mockItemRepository.delete).toHaveBeenCalledWith(itemId);
    });

    it('should allow CREATOR to delete their PENDING_APPROVAL item', async () => {
        mockItemRepository.findOne.mockResolvedValue(creatorItemPending);
        mockItemRepository.delete.mockResolvedValue({ affected: 1 });
        await service.removeItem(itemId, mockCreatorUser);
        expect(mockItemRepository.findOne).toHaveBeenCalledWith({ where: { id: itemId }, relations: ['seller'] });
        expect(mockItemRepository.delete).toHaveBeenCalledWith(itemId);
    });

    it('should throw UnauthorizedException if CREATOR tries to delete item not in deletable status (e.g. OPEN)', async () => {
        const openItem = { ...creatorItemPending, status: ItemStatus.OPEN };
        mockItemRepository.findOne.mockResolvedValue(openItem);
        await expect(service.removeItem(itemId, mockCreatorUser)).rejects.toThrow(UnauthorizedException);
    });
  });

});
