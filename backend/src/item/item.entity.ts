import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';

export enum ItemStatus {
  OPEN = 'open', // Actively accepting bids
  CLOSED = 'closed', // Bidding ended, no winner yet or not sold
  SOLD = 'sold', // Bidding ended, winner confirmed
  CANCELLED = 'cancelled', // Auction cancelled
  PENDING_APPROVAL = 'pending_approval',
  REJECTED = 'rejected',
}

@Entity('items') // Specify table name
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  startingPrice: number;

  @Column()
  endTime: Date;

  @ManyToOne(() => User, { eager: false }) // Define relationship, don't eager load by default
  @JoinColumn({ name: 'sellerId' }) // Specify the foreign key column name
  seller: User;

  @Column()
  sellerId: number; // Store the foreign key directly

  @Column({
    type: 'enum',
    enum: ItemStatus,
    default: ItemStatus.OPEN,
  })
  status: ItemStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
