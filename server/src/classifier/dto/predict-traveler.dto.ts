import { IsString, IsNotEmpty } from 'class-validator';

export class PredictTravelerDto {
  @IsString()
  @IsNotEmpty()
  q1_activity: string;

  @IsString()
  @IsNotEmpty()
  q2_destination: string;

  @IsString()
  @IsNotEmpty()
  q3_pace: string;

  @IsString()
  @IsNotEmpty()
  q4_accommodation: string;

  @IsString()
  @IsNotEmpty()
  q5_souvenir: string;

  @IsString()
  @IsNotEmpty()
  q6_evening: string;

  @IsString()
  @IsNotEmpty()
  q7_motivation: string;
}
