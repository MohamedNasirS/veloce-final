import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    Query,
    UseGuards,
    Request,
    UseInterceptors,
    UploadedFile,
    HttpStatus,
    HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { AdminGatePassService } from './admin-gate-pass.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/gate-passes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminGatePassController {
    constructor(private adminGatePassService: AdminGatePassService) { }

    // Get all closed bids with winners for admin gate pass management
    @Get()
    async getAllClosedBidsWithWinners(@Query('page') page?: string, @Query('limit') limit?: string) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 50;
        return this.adminGatePassService.getAllClosedBidsWithWinners(pageNum, limitNum);
    }

    // Get gate pass for a specific bid (admin can view any gate pass)
    @Get(':bidId')
    async getGatePass(@Param('bidId') bidId: string) {
        return this.adminGatePassService.getGatePass(bidId);
    }

    // Upload gate pass for any bid (admin privilege)
    @Post(':bidId/upload')
    @UseInterceptors(
        FileInterceptor('gatePass', {
            storage: diskStorage({
                destination: './uploads/gatepasses',
                filename: (req, file, cb) => {
                    const ext = path.extname(file.originalname);
                    cb(null, `admin-${uuidv4()}${ext}`);
                },
            }),
            fileFilter: (req, file, cb) => {
                if (file.mimetype === 'application/pdf') {
                    cb(null, true);
                } else {
                    cb(new Error('Only PDF files are allowed'), false);
                }
            },
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB limit
            },
        }),
    )
    @HttpCode(HttpStatus.OK)
    async uploadGatePass(
        @Param('bidId') bidId: string,
        @UploadedFile() file: Express.Multer.File,
        @Request() req,
    ) {
        const adminId = req.user.sub;
        return this.adminGatePassService.uploadGatePass(
            bidId,
            adminId,
            `/uploads/gatepasses/${file.filename}`,
        );
    }

    // Get gate pass statistics for admin dashboard
    @Get('stats/overview')
    async getGatePassStats() {
        return this.adminGatePassService.getGatePassStats();
    }

    // Get gate passes by status (pending, completed)
    @Get('filter/:status')
    async getGatePassesByStatus(@Param('status') status: string) {
        return this.adminGatePassService.getGatePassesByStatus(status);
    }
}