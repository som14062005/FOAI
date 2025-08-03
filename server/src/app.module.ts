import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { QuizModule } from './quiz/quiz.module';


@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/FOAI'),
    MongooseModule.forRoot('mongodb://localhost:27017/travelDB'),
    AuthModule,
    QuizModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
