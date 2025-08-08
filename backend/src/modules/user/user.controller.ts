import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    UseGuards,
    Request,
    HttpStatus,
    HttpCode,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
    constructor(private userService: UserService) { }

    @Get('pending')
    @UseGuards(RolesGuard)
    @Roles('admin')
    async getPendingUsers() {
        return this.userService.getPendingUsers();
    }

    @Get('all')
    @UseGuards(RolesGuard)
    @Roles('admin')
    async getAllUsers() {
        return this.userService.getAllUsers();
    }

    @Post(':id/approve')
    @UseGuards(RolesGuard)
    @Roles('admin')
    @HttpCode(HttpStatus.OK)
    async approveUser(@Param('id') userId: string, @Request() req) {
        const adminId = req.user.sub;
        return this.userService.approveUser(userId, adminId);
    }

    @Post(':id/reject')
    @UseGuards(RolesGuard)
    @Roles('admin')
    @HttpCode(HttpStatus.OK)
    async rejectUser(
        @Param('id') userId: string,
        @Body() body: { reason?: string },
        @Request() req
    ) {
        const adminId = req.user.sub;
        return this.userService.rejectUser(userId, adminId, body.reason);
    }
}