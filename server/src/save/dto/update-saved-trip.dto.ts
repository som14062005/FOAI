import { IsBoolean, IsString, IsArray, IsOptional } from 'class-validator';

export class UpdateSavedTripDto {
  @IsOptional()
  @IsBoolean()
  favorite?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}
