// src/quiz/quiz.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateQuizDto } from './dto/create-quiz/create-quiz.dto';
import { Quiz, QuizDocument } from './entities/quiz_entity/quiz.entity';

@Injectable()
export class QuizService {
  constructor(@InjectModel(Quiz.name) private quizModel: Model<QuizDocument>) {}

  async create(createQuizDto: CreateQuizDto): Promise<Quiz> {
    const quiz = new this.quizModel(createQuizDto);
    return quiz.save();
  }

  async findByUsername(username: string): Promise<Quiz | null> {
    return this.quizModel.findOne({ username }).exec();
  }

  async findAll(): Promise<Quiz[]> {
    return this.quizModel.find().exec();
  }
}
