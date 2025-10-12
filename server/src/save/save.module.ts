import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SavedTripsController } from './save.controller';
import { SavedTripsService } from './save.service';
import { SavedTrip, SavedTripSchema } from './schemas/saved-trip.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SavedTrip.name, schema: SavedTripSchema },
    ]),
  ],
  controllers: [SavedTripsController],
  providers: [SavedTripsService],
  exports: [SavedTripsService], // Export if needed in other modules
})
export class SavedTripsModule {}
