import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Item } from '../item/item.entity'; // Optional: if documents can be directly linked to items

@Entity('documents') // Specify table name
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column()
  mimetype: string;

  @Column()
  storagePath: string; // Path on the server or a URL if using cloud storage

  @Column('bigint') // Store file size in bytes
  fileSize: number;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'uploadedByUserId' })
  uploadedByUser: User;

  @Column()
  uploadedByUserId: number;

  // Optional: Link documents directly to an item (e.g., item images, specific documents for an item)
  @ManyToOne(() => Item, { nullable: true, eager: false, onDelete: 'SET NULL' }) // If item is deleted, set relatedItemId to null
  @JoinColumn({ name: 'relatedItemId' })
  relatedItem?: Item;

  @Column({ nullable: true })
  relatedItemId?: string; // Foreign key for Item

  @CreateDateColumn()
  uploadTimestamp: Date;

  @UpdateDateColumn()
  updatedAt: Date; // Keep track of metadata updates
}
