import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item, ItemStatus } from './item.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { User } from '../user/user.entity';

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(Item)
    private itemRepository: Repository<Item>,
  ) {}

  async create(createItemDto: CreateItemDto, seller: User): Promise<Item> {
    let status = createItemDto.status || ItemStatus.OPEN; // Default for ADMIN or if status is passed

    if (seller.role === 'CREATOR') {
      status = ItemStatus.PENDING_APPROVAL;
    } else if (seller.role === 'ADMIN' && createItemDto.status) {
      // Admin can set status directly, ensure it's a valid one if necessary
      status = createItemDto.status;
    } else if (seller.role === 'ADMIN') {
      // Default for admin if no status is provided in DTO
      status = ItemStatus.OPEN;
    }
    // Other roles default to PENDING_APPROVAL or throw error if not allowed to create

    const item = this.itemRepository.create({
      ...createItemDto,
      sellerId: seller.id,
      seller: seller,
      status: status,
    });
    return this.itemRepository.save(item);
  }

  async findAll(user?: User): Promise<Item[]> {
    let whereConditions: any = { status: ItemStatus.OPEN }; // Default for public/BIDDER/AGGREGATOR

    if (user) {
      if (user.role === 'ADMIN') {
        whereConditions = [
          { status: ItemStatus.OPEN },
          { status: ItemStatus.PENDING_APPROVAL },
          { status: ItemStatus.REJECTED }, // Admins might want to see rejected items too
          { status: ItemStatus.CLOSED },
          { status: ItemStatus.SOLD },
        ];
      } else if (user.role === 'CREATOR') {
        whereConditions = { sellerId: user.id };
        // Optionally, filter by specific statuses for creators:
        // whereConditions = { sellerId: user.id, status: In([ItemStatus.OPEN, ItemStatus.PENDING_APPROVAL, ItemStatus.CLOSED, ItemStatus.SOLD, ItemStatus.REJECTED]) };
      }
      // BIDDER/AGGREGATOR roles fall through to the default of only OPEN items.
    }
    return this.itemRepository.find({ where: whereConditions, relations: ['seller'] });
  }

  async findOne(id: string): Promise<Item> {
    const item = await this.itemRepository.findOne({ where: { id }, relations: ['seller'] });
    if (!item) {
      throw new NotFoundException(`Item with ID "${id}" not found`);
    }
    return item;
  }

  async findBySeller(sellerId: number): Promise<Item[]> {
    return this.itemRepository.find({ where: { sellerId }, relations: ['seller'] });
  }

  async approveItem(id: string, approvingUser: User): Promise<Item> {
    if (approvingUser.role !== 'ADMIN') {
      throw new UnauthorizedException('Only ADMINs can approve items.');
    }
    const item = await this.findOne(id);
    if (item.status !== ItemStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Item is not pending approval. Current status: ${item.status}`);
    }
    item.status = ItemStatus.OPEN;
    return this.itemRepository.save(item);
  }

  async rejectItem(id: string, rejectingUser: User): Promise<Item> {
    if (rejectingUser.role !== 'ADMIN') {
      throw new UnauthorizedException('Only ADMINs can reject items.');
    }
    const item = await this.findOne(id);
    if (item.status !== ItemStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Item is not pending approval. Current status: ${item.status}`);
    }
    item.status = ItemStatus.REJECTED;
    return this.itemRepository.save(item);
  }

  async update(id: string, updateItemDto: UpdateItemDto, user: User): Promise<Item> {
    const item = await this.findOne(id);

    if (user.role !== 'ADMIN' && item.sellerId !== user.id) {
        throw new UnauthorizedException('You are not authorized to update this item.');
    }

    // Creators can only update their items if they are PENDING_APPROVAL or if admin allows updates on OPEN items by creator
    if (user.role === 'CREATOR' && item.sellerId === user.id && ![ItemStatus.PENDING_APPROVAL, ItemStatus.OPEN].includes(item.status) ) {
      // Allowing OPEN for now, but could be more restrictive
       throw new UnauthorizedException(`Item in status ${item.status} cannot be updated by creator.`);
    }

    // Prevent updating certain fields after bidding has started or item is closed, if necessary
    // This logic can be expanded (e.g. admin override)

    Object.assign(item, updateItemDto);
    return this.itemRepository.save(item);
  }

  async removeItem(id: string, user: User): Promise<void> {
    const item = await this.findOne(id);
    if (user.role !== 'ADMIN' && item.sellerId !== user.id) {
        throw new UnauthorizedException('You are not authorized to delete this item.');
    }

    // Add logic here: e.g., only allow deletion if no bids are placed or if item is in 'cancelled' state.
    // For ADMINs, they might be able to delete PENDING_APPROVAL, REJECTED, or even OPEN items if no bids.
    // For CREATORs, only PENDING_APPROVAL or REJECTED items.
    if (user.role === 'CREATOR' && ![ItemStatus.PENDING_APPROVAL, ItemStatus.REJECTED].includes(item.status)) {
        throw new UnauthorizedException(`Creators can only delete items that are pending approval or rejected. Current status: ${item.status}`);
    }

    const result = await this.itemRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Item with ID "${id}" not found`);
    }
  }
}
