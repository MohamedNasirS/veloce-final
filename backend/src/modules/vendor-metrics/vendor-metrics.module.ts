import { Module } from '@nestjs/common';
import { VendorMetricsController } from './vendor-metrics.controller';
import { VendorMetricsService } from './vendor-metrics.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [VendorMetricsController],
    providers: [VendorMetricsService],
    exports: [VendorMetricsService],
})
export class VendorMetricsModule { }