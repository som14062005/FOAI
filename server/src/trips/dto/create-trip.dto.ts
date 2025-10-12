import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateTripDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  district: string;

  @IsNumber()
  @IsNotEmpty()
  days: number;

  @IsString()
  @IsNotEmpty()
  budget: string;

  @IsString()
  @IsNotEmpty()
  travelWith: string;
}
