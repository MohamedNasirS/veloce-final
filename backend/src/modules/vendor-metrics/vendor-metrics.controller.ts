import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { VendorMetricsService } from './vendor-metrics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('vendor-metrics')
@UseGuards(JwtAuthGuard)
export class VendorMetricsController {
    constructor(private vendorMetricsService: VendorMetricsService) { }

    @Get('success-rate/:userId')
    async getVendorSuccessRate(@Param('userId') userId: string) {
        return this.vendorMetricsService.calculateVendorSuccessRate(userId);
    }

    @Get('success-rates/all')
    async getAllVendorSuccessRates() {
        return this.vendorMetricsService.getAllVendorSuccessRates();
    }

    @Get('top-performers')
    async getTopPerformingVendors(@Query('limit') limit?: string) {
        const limitNum = limit ? parseInt(limit, 10) : 10;
        return this.vendorMetricsService.getTopPerformingVendors(limitNum);
    }

    @Get('performance-stats')
    async getVendorPerformanceStats() {
        return this.vendorMetricsService.getVendorPerformanceStats();
    }
}