import { Controller, Post, Body, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto, Role } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Admin only endpoints
  @Get('users/:role')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  async getUsersByRole(@Param('role') role: Role) {
    return this.authService.getUsersByRole(role);
  }

  @Patch('users/:id/status')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  async updateUserStatus(
    @Param('id') id: number,
    @Body('status') status: 'pending' | 'approved' | 'rejected'
  ) {
    return this.authService.updateUserStatus(id, status);
  }
}
