import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { ApiTags, ApiResponse } from '@nestjs/swagger';

@ApiTags('Quiz') // Groups all quiz endpoints in Swagger
@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post('submit')
  @ApiResponse({
    status: 201,
    description: 'Quiz submission successful',
    schema: {
      example: {
        message: 'Quiz submitted successfully',
        score: 8,
        totalQuestions: 10,
      },
    },
  })
  async submitQuiz(@Body() submitQuizDto: SubmitQuizDto) {
    return this.quizService.saveQuiz(submitQuizDto);
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'List of all quizzes',
    schema: {
      example: [
        {
          quizId: 'quiz123',
          title: 'JavaScript Basics',
          totalQuestions: 10,
        },
      ],
    },
  })
  async getAllQuizzes() {
    return this.quizService.getAllQuizzes();
  }

  @Get(':userId')
  @ApiResponse({
    status: 200,
    description: 'Quiz results for a specific user',
    schema: {
      example: {
        userId: 'user123',
        score: 8,
        totalQuestions: 10,
        passed: true,
      },
    },
  })
  async getQuizByUser(@Param('userId') userId: string) {
    return this.quizService.getQuizByUserId(userId);
  }
}
