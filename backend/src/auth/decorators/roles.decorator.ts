import { SetMetadata } from '@nestjs/common';
import { Role } from '../dto/signup.dto';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);