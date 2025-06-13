import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../user/user.entity';
import { SignupDto, Role } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto) {
    const { name, email, password, role } = signupDto;

    // Check if user already exists
    const existingUser = await this.userRepo.findOne({ where: { email } });
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine initial status based on role
    let initialStatus = 'pending';
    if (role === Role.ADMIN) {
      // Admin accounts might need special approval or auto-approve
      initialStatus = 'pending'; // You can change this logic as needed
    }

    // Create user
    const user = this.userRepo.create({
      name,
      email,
      password: hashedPassword,
      role,
      status: initialStatus,
    });

    await this.userRepo.save(user);

    // Remove password from response
    const { password: _, ...result } = user;
    return {
      message: 'User registered successfully',
      user: result,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check account status (except for ADMIN who might have special privileges)
    if (user.role !== Role.ADMIN && user.status !== 'approved') {
      throw new UnauthorizedException('Account not approved yet');
    }

    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role,
      status: user.status 
    };
    const token = this.jwtService.sign(payload);

    // Remove password from response
    const { password: _, ...userResult } = user;

    return {
      access_token: token,
      user: userResult,
      message: `Welcome ${user.role.toLowerCase()}!`,
    };
  }

  // Method to get users by role (useful for admin operations)
  async getUsersByRole(role: Role) {
    return this.userRepo.find({ 
      where: { role },
      select: ['id', 'name', 'email', 'role', 'status', 'createdAt'] // Exclude password
    });
  }

  // Method to update user status (useful for admin approval)
  async updateUserStatus(userId: number, status: 'pending' | 'approved' | 'rejected') {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    user.status = status;
    await this.userRepo.save(user);

    const { password: _, ...result } = user;
    return result;
  }
}
