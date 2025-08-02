import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  phoneNumber: string;

  @Prop()
  dateOfBirth: string;

  @Prop()
  address: string;

  @Prop()
  city: string;

  @Prop()
  zipCode: string;

  @Prop()
  adminCode: string;

  @Prop()
  department: string;

  @Prop()
  employeeId: string;

  @Prop()
  organizationName: string;

  @Prop()
  adminLevel: string;

  @Prop({ default: 'user' })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
