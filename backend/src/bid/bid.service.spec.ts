// backend/src/bid/bid.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BidService } from './bid.service';
import { Bid, BidStatus } from './bid.entity';
import { Item, ItemStatus } from '../item/item.entity';
import { User } from '../user/user.entity';
import { CreateBidDto } from './dto/create-bid.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const mockUser = { id: 1, email: 'bidder@example.com' } as User;
const mockSeller = { id: 2, email: 'seller@example.com' } as User;

const mockItemRepository = {
  findOne: jest.fn(),
  // save: jest.fn(), // if item status is updated
};
const mockBidRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
};

describe('BidService', () => {
  let service: BidService;
  let itemRepository: Repository<Item>;
  let bidRepository: Repository<Bid>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BidService,
        { provide: getRepositoryToken(Item), useValue: mockItemRepository },
        { provide: getRepositoryToken(Bid), useValue: mockBidRepository },
      ],
    }).compile();

    service = module.get<BidService>(BidService);
    itemRepository = module.get<Repository<Item>>(getRepositoryToken(Item));
    bidRepository = module.get<Repository<Bid>>(getRepositoryToken(Bid));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createBidDto: CreateBidDto = { itemId: 'item-uuid', amount: 150 };
    const openItem: Item = {
        id: 'item-uuid', name: 'Test Item', status: ItemStatus.OPEN,
        endTime: new Date(Date.now() + 3600000), // Ends in 1 hour
        startingPrice: 100, sellerId: mockSeller.id
    } as Item;

    it('should create a bid successfully', async () => {
      mockItemRepository.findOne.mockResolvedValue(openItem);
      mockBidRepository.findOne.mockResolvedValue(null); // No existing highest bid
      const expectedBid = { ...createBidDto, userId: mockUser.id, status: BidStatus.ACTIVE } as any; // Simplified
      mockBidRepository.create.mockReturnValue(expectedBid);
      mockBidRepository.save.mockResolvedValue(expectedBid);

      const result = await service.create(createBidDto, mockUser);
      expect(itemRepository.findOne).toHaveBeenCalledWith({ where: { id: createBidDto.itemId } });
      expect(bidRepository.create).toHaveBeenCalledWith(expect.objectContaining({ amount: createBidDto.amount }));
      expect(bidRepository.save).toHaveBeenCalledWith(expectedBid);
      expect(result).toEqual(expectedBid);
    });

    it('should throw NotFoundException if item not found', async () => {
      mockItemRepository.findOne.mockResolvedValue(null);
      await expect(service.create(createBidDto, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if item is not open', async () => {
      const closedItem = { ...openItem, status: ItemStatus.CLOSED };
      mockItemRepository.findOne.mockResolvedValue(closedItem);
      await expect(service.create(createBidDto, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if bid amount is lower than starting price', async () => {
      const lowBidDto: CreateBidDto = { itemId: 'item-uuid', amount: 50 };
      mockItemRepository.findOne.mockResolvedValue(openItem); // startingPrice is 100
      await expect(service.create(lowBidDto, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if bid amount is not higher than current highest bid', async () => {
      const highestBid = { amount: 150 } as Bid;
      mockItemRepository.findOne.mockResolvedValue(openItem);
      mockBidRepository.findOne.mockResolvedValue(highestBid); // Existing highest bid is 150
      await expect(service.create(createBidDto, mockUser)).rejects.toThrow(BadRequestException); // DTO amount is 150
    });
  });
});
