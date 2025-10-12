import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTripDto } from './dto/create-trip.dto';
import { Trip, TripDocument } from './trip.schema';
import { ClassifierService } from '../classifier/classifier.service'; // ✅ import added

@Injectable()
export class TripsService {
  constructor(
    @InjectModel(Trip.name)
    private readonly tripModel: Model<TripDocument>,

    private readonly classifierService: ClassifierService, // ✅ inject here
  ) {}

  // 🟢 Create new trip
  async create(createTripDto: CreateTripDto): Promise<Trip> {
    // Count existing trips for this user
    const count = await this.tripModel.countDocuments({
      userId: createTripDto.userId,
    });
    const tripNumber = count + 1;

    const createdTrip = new this.tripModel({
      ...createTripDto,
      tripNumber, // assign sequential number
    });

    return createdTrip.save();
  }

  // 🟢 Get all trips (sorted by created date)
  async findAll(): Promise<Trip[]> {
    return this.tripModel.find().sort({ createdAt: -1 }).exec();
  }

  // 🟢 Get the latest trip by userId
  async findOne(userId: string): Promise<Trip> {
    const trip = await this.tripModel
      .findOne({ userId })
      .sort({ createdAt: -1 }) // 🔥 gets the latest trip
      .exec();

    if (!trip) {
      throw new NotFoundException(`No trips found for userId "${userId}"`);
    }

    return trip;
  }

  // 🟢 Delete trip by ID
  async remove(id: string) {
    const deleted = await this.tripModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Trip with ID "${id}" not found`);
    }
    return { deleted: true };
  }

  // 🟢 Combine latest trip + traveler profile
  async getCombinedInfo(userId: string) {
    // 1️⃣ Latest trip
    const trip = await this.findOne(userId);

    // 2️⃣ Traveler profile
    const traveler = await this.classifierService.findByUserId(userId);

    if (!traveler) {
      throw new NotFoundException(`Traveler profile not found for userId "${userId}"`);
    }

    // 3️⃣ Combine results
    return {
      userId,
      latestTrip: trip,
      travelerProfile: traveler,
    };
  }
}
