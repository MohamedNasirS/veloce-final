import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from './user/user.entity';
import { Item } from '../item/item.entity';
import { Bid } from '../bid/bid.entity';
import { Document } from '../document/document.entity';
import { AuthModule } from './auth/auth.module';
import { ItemModule } from '../item/item.module';
import { BidModule } from '../bid/bid.module';
import { DocumentModule } from '../document/document.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
      username: process.env.POSTGRES_USER || 'your_pg_username',
      password: process.env.POSTGRES_PASSWORD || 'your_pg_password',
      database: process.env.POSTGRES_DB || 'your_database_name',
      entities: [User, Item, Bid, Document],
      synchronize: true, // use only in dev
    }),
    TypeOrmModule.forFeature([User, Item, Bid]), // Document is now in DocumentModule
    AuthModule,
    ItemModule,
    BidModule,
    DocumentModule,
  ],
})
export class AppModule {}
