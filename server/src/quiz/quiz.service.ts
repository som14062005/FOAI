// src/quiz/quiz.service.ts
import { Injectable } from '@nestjs/common';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

@Injectable()
export class QuizService {
  private quizAnswers: SubmitQuizDto[] = []; // 🔹 Temporary storage

  async saveQuiz(submitQuizDto: SubmitQuizDto) {
    this.quizAnswers.push(submitQuizDto);
    return {
      message: 'Quiz answers saved successfully!',
      data: submitQuizDto,
    };
  }

  async getAllQuizzes() {
    return this.quizAnswers; // return all stored answers
  }

  async getQuizByUserId(userId: string) {
    return this.quizAnswers.find((quiz) => quiz.userId === userId);
  }
}
