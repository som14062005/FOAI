// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ClassifierModule } from './classifier/classifier.module';
import { TripsModule } from './trips/trips.module';
import { SavedTripsModule } from './save/save.module';
import { SmsModule } from './sms/sms.module';

@Module({
  imports: [
    // ✅ IMPORTANT: ConfigModule MUST be FIRST
    ConfigModule.forRoot({
      isGlobal: true,        // Makes config available globally
      envFilePath: '.env',   // Path to .env file
      cache: true,           // Cache environment variables
    }),
    
    // MongoDB Connection
    MongooseModule.forRoot('mongodb://localhost:27017/FOAI'),
    
    // All other modules
    AuthModule,
    ClassifierModule,
    TripsModule,
    SavedTripsModule,
    SmsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
