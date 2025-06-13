import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum Role {
  CREATOR = 'CREATOR',
  BIDDER = 'BIDDER',
  AGGREGATOR = 'AGGREGATOR',
  ADMIN = 'ADMIN',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.BIDDER })
  role: Role;

  @CreateDateColumn()
  createdAt: Date;
}
