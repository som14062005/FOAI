import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TripDocument = Trip & Document;

@Schema({ timestamps: true })
export class Trip {
  @Prop({ required: true })
  userId: string; // user reference

  @Prop({ required: true })
  tripNumber: number; // sequential number

  @Prop({ required: true })
  district: string;

  @Prop({ required: true })
  days: number;

  @Prop({ required: true })
  budget: string;

  @Prop({ required: true })
  travelWith: string;

  // ✅ NEW FIELD - User Type
  @Prop()
  travelerType: string; // e.g., "Foodie", "Adventure", "Nature Lover", etc.
}

export const TripSchema = SchemaFactory.createForClass(Trip);
