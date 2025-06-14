import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Item } from '../item/item.entity';

export enum BidStatus {
  ACTIVE = 'active', // A current, potentially winning bid
  OUTBID = 'outbid', // Has been surpassed by another bid
  WINNING = 'winning', // The current highest bid when auction closes
  CANCELLED = 'cancelled', // Bid was cancelled (if allowed)
}

@Entity('bids') // Specify table name
export class Bid {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Item, { eager: false })
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @Column()
  itemId: string; // Store the foreign key directly

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number; // Store the foreign key directly

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: BidStatus,
    default: BidStatus.ACTIVE,
  })
  status: BidStatus;

  @CreateDateColumn()
  timestamp: Date; // TypeORM will set this on creation

  @UpdateDateColumn()
  updatedAt: Date;
}
