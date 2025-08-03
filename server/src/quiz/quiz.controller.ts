// src/quiz/quiz.controller.ts
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz/create-quiz.dto';

@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post()
  create(@Body() createQuizDto: CreateQuizDto) {
    return this.quizService.create(createQuizDto);
  }

  @Get(':username')
  findOne(@Param('username') username: string) {
    return this.quizService.findByUsername(username);
  }

  @Get()
  findAll() {
    return this.quizService.findAll();
  }
}
