import {
  IsString,
  IsNumber,
  IsObject,
  IsArray,
  IsOptional,
  ValidateNested,
  IsNotEmpty,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WeatherDto {
  @IsNumber()
  temp: number;

  @IsString()
  condition: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  humidity?: number;
}

export class ExplanationDto {
  @IsArray()
  @IsString({ each: true })
  reasons: string[];

  // NEW: Optional fields from AI
  @IsOptional()
  @IsString()
  algorithm?: string;

  @IsOptional()
  @IsNumber()
  confidence?: number;
}

export class PlaceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsNumber()
  @Min(0)
  duration: number;

  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number;

  @IsString()
  timing: string;

  @IsString()
  latitude: string;

  @IsString()
  longitude: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => WeatherDto)
  weather?: WeatherDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ExplanationDto)
  explanation?: ExplanationDto;
}

export class WeatherForecastDto {
  @IsNumber()
  day: number;

  @IsNumber()
  temp: number;

  @IsString()
  condition: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  humidity?: number;
}

export class StatsDto {
  @IsNumber()
  @Min(0)
  totalPlaces: number;

  @IsNumber()
  @Min(0)
  totalDuration: number;
}

export class AIFeaturesDto {
  @IsOptional()
  @IsString()
  ml_model?: string;

  @IsOptional()
  @IsString()
  route_optimization?: string;

  @IsOptional()
  @IsString()
  weather_integration?: string;

  @IsOptional()
  @IsString()
  personalization?: string;

  @IsOptional()
  @IsString()
  clustering?: string;

  // NEW: Additional AI fields
  @IsOptional()
  @IsString()
  csp?: string;

  @IsOptional()
  @IsString()
  a_star?: string;

  @IsOptional()
  @IsString()
  explainable_ai?: string;

  @IsOptional()
  @IsString()
  naive_bayes?: string;

  @IsOptional()
  @IsString()
  weather_aware?: string;
}

export class TripDataDto {
  @IsString()
  @IsNotEmpty()
  district: string;

  @IsNumber()
  @Min(1)
  @Max(30)
  days: number;

  @IsString()
  @IsNotEmpty()
  budget: string;

  @IsString()
  @IsNotEmpty()
  travelWith: string;

  @IsString()
  @IsNotEmpty()
  travelerType: string;

  @IsOptional()
  @IsString()
  algorithm?: string;

  @ValidateNested()
  @Type(() => StatsDto)
  stats: StatsDto;

  @IsObject()
  itinerary: Record<string, any[]>; // More flexible - accepts any place structure

  @IsOptional()
  @IsArray()
  weatherForecast?: WeatherForecastDto[];

  @IsOptional()
  aiFeatures?: AIFeaturesDto;
}

export class CreateSavedTripDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ValidateNested()
  @Type(() => TripDataDto)
  tripData: TripDataDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  favorite?: boolean;
}
