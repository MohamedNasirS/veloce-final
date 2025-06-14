import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ParseUUIDPipe } from '@nestjs/common';
import { ItemService } from './item.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from '../user/user.entity';
import { Role } from '../auth/dto/signup.dto'; // Assuming Role enum is here for ADMIN string

@Controller('items')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createItemDto: CreateItemDto, @Req() req) {
    // req.user is populated by JwtAuthGuard
    const user = req.user as User;
    return this.itemService.create(createItemDto, user);
  }

  @Get()
  findAll(@Req() req) { // Pass req to service to handle filtering by user role
    const user = req.user as User; // User might be undefined if route is public
    return this.itemService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.itemService.findOne(id);
  }

  @Get('seller/:sellerId')
  findBySeller(@Param('sellerId') sellerId: string) {
    // Convert sellerId to number if your User entity ID is number
    return this.itemService.findBySeller(parseInt(sellerId, 10));
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateItemDto: UpdateItemDto,
    @Req() req
  ) {
    const user = req.user as User;
    return this.itemService.update(id, updateItemDto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    const user = req.user as User;
    return this.itemService.removeItem(id, user);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  approveItem(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    const user = req.user as User; // User is guaranteed by JwtAuthGuard
    return this.itemService.approveItem(id, user);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  rejectItem(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    const user = req.user as User; // User is guaranteed by JwtAuthGuard
    return this.itemService.rejectItem(id, user);
  }
}
