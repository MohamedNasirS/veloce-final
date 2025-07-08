import { IsString, IsNotEmpty, IsNumberString, IsDateString } from 'class-validator';

export class CreateBidDto {
  @IsString() @IsNotEmpty() lotName: string;

  @IsString() @IsNotEmpty() description: string;

  @IsString() @IsNotEmpty() wasteType: string;

  @IsNumberString() quantity: string;          // ✅ Accept number in string form

  @IsString() @IsNotEmpty() unit: string;

  @IsString() @IsNotEmpty() location: string;

  @IsNumberString() basePrice: string;         // ✅ Accept number in string form

  @IsNumberString() minIncrementPercent: string; // ✅ Accept number in string form

  @IsDateString() startDate: string;

  @IsDateString() endDate: string;

  @IsString() @IsNotEmpty() creatorId: string;
}
