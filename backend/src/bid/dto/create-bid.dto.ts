import { IsNotEmpty, IsNumber, Min, IsUUID } from 'class-validator';

export class CreateBidDto {
  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @IsNumber()
  @Min(0.01) // Assuming bids must be positive
  amount: number;
}
