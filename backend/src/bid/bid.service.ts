import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common'; // Add Logger
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bid, BidStatus } from './bid.entity';
import { CreateBidDto } from './dto/create-bid.dto';
import { User } from '../user/user.entity';
import { Item, ItemStatus } from '../item/item.entity';

@Injectable()
export class BidService {
  private readonly logger = new Logger(BidService.name); // Instantiate Logger

  constructor(
    @InjectRepository(Bid)
    private bidRepository: Repository<Bid>,
    @InjectRepository(Item)
    private itemRepository: Repository<Item>,
  ) {}

  async create(createBidDto: CreateBidDto, user: User): Promise<Bid> {
    this.logger.log(`Attempting to create bid with DTO: ${JSON.stringify(createBidDto)} by user: ${user.email} (ID: ${user.id})`);

    const { itemId, amount } = createBidDto;

    const item = await this.itemRepository.findOne({ where: { id: itemId } });
    if (!item) {
      this.logger.warn(`Item with ID "${itemId}" not found.`);
      throw new NotFoundException(`Item with ID "${itemId}" not found.`);
    }
    this.logger.log(`Found item: ${JSON.stringify(item)}`);

    if (item.status !== ItemStatus.OPEN) {
      this.logger.warn(`Item "${item.name}" is not open. Status: ${item.status}`);
      throw new BadRequestException(`Item "${item.name}" is not open for bidding. Current status: ${item.status}`);
    }

    if (new Date() >= new Date(item.endTime)) {
      this.logger.warn(`Bidding for item "${item.name}" has ended. End time: ${item.endTime}`);
      throw new BadRequestException(`Bidding for item "${item.name}" has ended.`);
    }

    if (item.sellerId === user.id) {
      this.logger.warn(`User ${user.email} (seller) cannot bid on their own item ${item.name}.`);
      throw new BadRequestException('Sellers cannot bid on their own items.');
    }

    if (amount < item.startingPrice) {
        this.logger.warn(`Bid amount $${amount} for item ${item.name} is less than starting price $${item.startingPrice}.`);
        throw new BadRequestException(`Bid amount $${amount} is less than starting price $${item.startingPrice}.`);
    }

    this.logger.log(`Fetching highest bid for item ID "${itemId}"...`);
    const highestBid = await this.bidRepository.findOne({
      where: { itemId: itemId },
      order: { amount: 'DESC' },
    });

    if (highestBid) {
      this.logger.log(`Current highest bid is: ${JSON.stringify(highestBid)}`);
      if (amount <= highestBid.amount) {
        this.logger.warn(`Bid amount $${amount} is not higher than current highest bid $${highestBid.amount}.`);
        throw new BadRequestException(
          `Your bid of $${amount} must be higher than the current highest bid of $${highestBid.amount}.`,
        );
      }

      if (highestBid.userId !== user.id) {
        this.logger.log(`Updating previous highest bid ${highestBid.id} status to OUTBID.`);
        highestBid.status = BidStatus.OUTBID;
        try {
          await this.bidRepository.save(highestBid); // Save the change to the outbid bid
          this.logger.log(`Successfully updated status of previous highest bid ${highestBid.id} to OUTBID.`);
        } catch (error) {
          this.logger.error(`Failed to update status of previous highest bid ${highestBid.id}: ${error.message}`, error.stack);
          // Decide if this error should prevent the new bid; likely not, but log it.
        }
      }
    } else {
      this.logger.log('No existing bids found for this item.');
    }

    const bidEntityData = {
      itemId,
      userId: user.id,
      // user: user, // Not needed if only storing userId, TypeORM handles relation via FK
      amount,
      // item: item, // Not needed if only storing itemId
      status: BidStatus.ACTIVE,
      timestamp: new Date(), // timestamp is CreateDateColumn, TypeORM handles it. Explicitly setting might be okay.
    };
    this.logger.log(`Data for new bid entity: ${JSON.stringify(bidEntityData)}`);

    const newBid = this.bidRepository.create(bidEntityData);
    this.logger.log(`Bid entity created by TypeORM: ${JSON.stringify(newBid)}`);

    try {
      this.logger.log('Attempting to save the new bid...');
      const savedBid = await this.bidRepository.save(newBid);
      this.logger.log(`Bid saved successfully: ${JSON.stringify(savedBid)}`);
      return savedBid;
    } catch (error) {
      this.logger.error(`Failed to save bid: ${error.message}`, error.stack);
      throw error; // Re-throw the error to ensure it's handled by NestJS
    }
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
