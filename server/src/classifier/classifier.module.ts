import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClassifierController } from './classifier.controller';
import { ClassifierService } from './classifier.service';
import { UserProfile, UserProfileSchema } from './schemas/user-profile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserProfile.name, schema: UserProfileSchema },
    ]),
  ],
  controllers: [ClassifierController],
  providers: [ClassifierService],
  exports: [ClassifierService],
})
export class ClassifierModule {}
