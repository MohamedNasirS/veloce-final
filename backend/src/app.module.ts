import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { BidsModule } from './modules/bids/bids.module';
=======
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { BidModule } from './modules/bid/bid.module';
>>>>>>> 24844d5f1965f1d807783db52e2a984b0e8a3ebb

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads'), 
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
<<<<<<< HEAD
    AdminModule,
    BidsModule
=======
    BidModule,
>>>>>>> 24844d5f1965f1d807783db52e2a984b0e8a3ebb
  ],
})
export class AppModule {}
