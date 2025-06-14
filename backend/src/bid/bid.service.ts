import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bid, BidStatus } from './bid.entity';
import { CreateBidDto } from './dto/create-bid.dto';
import { User } from '../user/user.entity';
import { Item, ItemStatus } from '../item/item.entity'; // Import Item and ItemStatus

@Injectable()
export class BidService {
  constructor(
    @InjectRepository(Bid)
    private bidRepository: Repository<Bid>,
    @InjectRepository(Item) // Inject ItemRepository for item validation
    private itemRepository: Repository<Item>,
  ) {}

  async create(createBidDto: CreateBidDto, user: User): Promise<Bid> {
    const { itemId, amount } = createBidDto;

    const item = await this.itemRepository.findOne({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException(`Item with ID "${itemId}" not found.`);
    }

    if (item.status !== ItemStatus.OPEN) {
      throw new BadRequestException(`Item "${item.name}" is not open for bidding. Current status: ${item.status}`);
    }

    if (new Date() >= new Date(item.endTime)) {
      throw new BadRequestException(`Bidding for item "${item.name}" has ended.`);
    }

    if (item.sellerId === user.id) {
      throw new BadRequestException('Sellers cannot bid on their own items.');
    }

    if (amount < item.startingPrice) {
        throw new BadRequestException(`Bid amount $${amount} is less than starting price $${item.startingPrice}.`);
    }

    // Check against current highest bid for this item
    const highestBid = await this.bidRepository.findOne({
      where: { itemId: itemId },
      order: { amount: 'DESC' },
    });

    if (highestBid && amount <= highestBid.amount) {
      throw new BadRequestException(
        `Your bid of $${amount} must be higher than the current highest bid of $${highestBid.amount}.`,
      );
    }

    // Optional: Update status of previous highest bid for this item to OUTBID
    if (highestBid && highestBid.userId !== user.id) { // ensure it's not the same user outbidding themselves
        highestBid.status = BidStatus.OUTBID;
        await this.bidRepository.save(highestBid);
    }


    const bid = this.bidRepository.create({
      itemId,
      userId: user.id,
      user: user, // For relation if needed by TypeORM, userId is sufficient for FK
      amount,
      item: item, // For relation
      status: BidStatus.ACTIVE, // New bids are active
      timestamp: new Date(),
    });

    return this.bidRepository.save(bid);
  }

  async findByItem(itemId: string): Promise<Bid[]> {
    const item = await this.itemRepository.findOne({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException(`Item with ID "${itemId}" not found.`);
    }
    return this.bidRepository.find({
      where: { itemId },
      relations: ['user'], // Show user info, exclude password in User entity if not already done
      order: { amount: 'DESC' },
    });
  }

  async findByUser(userId: number): Promise<Bid[]> {
    return this.bidRepository.find({
      where: { userId },
      relations: ['item'], // Show item info
      order: { timestamp: 'DESC' },
    });
  }

  // Method to get the winning bid for an item (could be part of ItemService too)
  async getWinningBid(itemId: string): Promise<Bid | null> {
    const item = await this.itemRepository.findOne({ where: { id: itemId }});
    if (!item) {
        throw new NotFoundException(`Item with ID "${itemId}" not found.`);
    }

    // Only determine winner if item is closed and bidding time has passed
    if (item.status === ItemStatus.OPEN && new Date() < new Date(item.endTime)) {
        throw new BadRequestException(`Bidding for item "${item.name}" has not ended yet.`);
    }

    return this.bidRepository.findOne({
        where: { itemId: itemId, status: BidStatus.ACTIVE }, // Or a new status like 'AWAITING_CONFIRMATION'
        order: { amount: 'DESC' },
        relations: ['user']
    });
  }
}
