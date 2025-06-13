import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';

export enum Role {
  CREATOR = 'CREATOR',
  BIDDER = 'BIDDER',
  AGGREGATOR = 'AGGREGATOR',
  ADMIN = 'ADMIN',
}

export class SignupDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(Role)
  role: Role;
}
