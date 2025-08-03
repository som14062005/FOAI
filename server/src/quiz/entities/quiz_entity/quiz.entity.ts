export class QuizEntity {}
// src/quiz/entities/quiz.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type QuizDocument = Quiz & Document;

@Schema()
export class Quiz {
  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  foodPreference: string;

  @Prop({ required: true })
  preferredActivity: string;

  @Prop({ required: true })
  accommodationType: string;

  @Prop({ required: true })
  travelPace: string;

  @Prop({ required: true })
  travelCompanion: string;

  @Prop({ type: [String], required: true })
  travelInterests: string[];

  @Prop()
  preferredDestination?: string;

  @Prop()
  budget?: string;

  @Prop()
  tripDuration?: string;

  @Prop()
  transportPreference?: string;

  @Prop()
  season?: string;
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);
