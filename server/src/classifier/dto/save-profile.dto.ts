import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class SaveUserProfileDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  travelerType: string;

  @IsNumber()
  confidence: number;

  @IsString()
  description: string;
}
