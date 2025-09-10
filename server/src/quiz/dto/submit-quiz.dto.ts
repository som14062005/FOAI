// src/quiz/dto/submit-quiz.dto.ts
import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitQuizDto {
  @ApiProperty({
    example: 'user123',
    description: 'The unique ID of the user submitting the quiz',
  })
  @IsString()
  userId: string; // Comes from frontend (or JWT later)

  @ApiProperty({
    example: ['A', 'C', 'B'],
    description: 'Array of selected answers in order',
    type: [String],
  })
  @IsArray()
  answers: string[]; // Just array of selected answers
}
