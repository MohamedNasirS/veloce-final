import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BidGateway } from '../../gateways/bid.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [UserController],
    providers: [UserService, BidGateway],
    exports: [UserService],
})
export class UserModule { }