import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SavedTripDocument = SavedTrip & Document;

// Nested Schemas
@Schema({ _id: false })
export class Weather {
  @Prop({ required: true })
  temp: number;

  @Prop({ required: true })
  condition: string;

  @Prop()
  description: string;

  @Prop()
  humidity: number;
}

@Schema({ _id: false })
export class Explanation {
  @Prop({ type: [String] })
  reasons: string[];
}

@Schema({ _id: false })
export class Place {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  duration: number;

  @Prop({ required: true })
  rating: number;

  @Prop({ required: true })
  timing: string;

  @Prop({ required: true })
  latitude: string;

  @Prop({ required: true })
  longitude: string;

  @Prop({ type: Weather })
  weather?: Weather;

  @Prop({ type: Explanation })
  explanation?: Explanation;
}

@Schema({ _id: false })
export class WeatherForecast {
  @Prop({ required: true })
  day: number;

  @Prop({ required: true })
  temp: number;

  @Prop({ required: true })
  condition: string;

  @Prop()
  description: string;

  @Prop()
  humidity: number;
}

@Schema({ _id: false })
export class Stats {
  @Prop({ required: true })
  totalPlaces: number;

  @Prop({ required: true })
  totalDuration: number;
}

@Schema({ _id: false })
export class AIFeatures {
  @Prop()
  ml_model: string;

  @Prop()
  route_optimization: string;

  @Prop()
  weather_integration: string;

  @Prop()
  personalization: string;

  @Prop()
  clustering: string;
}

@Schema({ _id: false })
export class TripData {
  @Prop({ required: true })
  district: string;

  @Prop({ required: true })
  days: number;

  @Prop({ required: true })
  budget: string;

  @Prop({ required: true })
  travelWith: string;

  @Prop({ required: true })
  travelerType: string;

  @Prop()
  algorithm: string;

  @Prop({ type: Stats, required: true })
  stats: Stats;

  @Prop({ type: Object, required: true })
  itinerary: Record<string, Place[]>;

  @Prop({ type: [WeatherForecast] })
  weatherForecast: WeatherForecast[];

  @Prop({ type: AIFeatures })
  aiFeatures: AIFeatures;
}

@Schema({ timestamps: true })
export class SavedTrip {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({ type: TripData, required: true })
  tripData: TripData;

  @Prop({ default: Date.now })
  savedAt: Date;

  @Prop({ default: false })
  favorite: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop()
  notes: string;
}

export const SavedTripSchema = SchemaFactory.createForClass(SavedTrip);

// Indexes for better query performance
SavedTripSchema.index({ userId: 1, createdAt: -1 });
SavedTripSchema.index({ 'tripData.district': 1 });
SavedTripSchema.index({ favorite: 1 });
SavedTripSchema.index({ savedAt: -1 });
