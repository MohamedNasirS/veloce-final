import { IsString, IsOptional, IsNumber, Min, IsDateString, IsEnum } from 'class-validator';
import { ItemStatus } from '../item.entity';

export class UpdateItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  startingPrice?: number;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsEnum(ItemStatus)
  status?: ItemStatus;
}
