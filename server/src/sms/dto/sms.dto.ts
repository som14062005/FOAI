// src/sms/dto/sms.dto.ts
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class SendProximityAlertDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  placeName: string;

  @IsNumber()
  @IsNotEmpty()
  distance: number;

  @IsString()
  @IsOptional()
  timing?: string;

  @IsNumber()
  @IsOptional()
  rating?: number;
}
