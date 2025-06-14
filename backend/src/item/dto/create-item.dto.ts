import { IsString, IsNotEmpty, IsNumber, Min, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { ItemStatus } from '../item.entity';

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  startingPrice: number;

  @IsDateString()
  endTime: string; // ISO date string

  @IsOptional()
  @IsEnum(ItemStatus)
  status?: ItemStatus;
}
