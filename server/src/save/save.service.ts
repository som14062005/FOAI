import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SavedTrip, SavedTripDocument } from './schemas/saved-trip.schema';
import { CreateSavedTripDto } from './dto/create-saved-trip.dto';
import { UpdateSavedTripDto } from './dto/update-saved-trip.dto';
import { QuerySavedTripDto } from './dto/query-saved-trip.dto';

@Injectable()
export class SavedTripsService {
  constructor(
    @InjectModel(SavedTrip.name)
    private savedTripModel: Model<SavedTripDocument>,
  ) {}

  // Create new saved trip
  async create(createDto: CreateSavedTripDto) {
    try {
      // Validate userId is a valid ObjectId
      if (!Types.ObjectId.isValid(createDto.userId)) {
        throw new BadRequestException('Invalid userId format');
      }

      const savedTrip = new this.savedTripModel({
        ...createDto,
        userId: new Types.ObjectId(createDto.userId),
        savedAt: new Date(),
      });

      const result = await savedTrip.save();

      return {
        success: true,
        message: 'Trip saved successfully',
        data: result,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to save trip: ${error.message}`,
      );
    }
  }

  // Get all trips by userId with pagination and filters
  async findByUserId(userId: string, queryDto: QuerySavedTripDto) {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid userId format');
      }

      // Set default values and ensure they're never undefined
      const page = queryDto.page ?? 1;
      const limit = queryDto.limit ?? 10;
      const sortBy = queryDto.sortBy ?? 'createdAt';
      const order = queryDto.order ?? 'desc';
      const district = queryDto.district;

      // Build filter query
      const filter: any = { userId: new Types.ObjectId(userId) };
      if (district) {
        filter['tripData.district'] = district;
      }

      // Calculate skip for pagination
      const skip = (page - 1) * limit;

      // Build sort object with proper typing
      const sort: Record<string, 1 | -1> = {
        [sortBy]: order === 'asc' ? 1 : -1,
      };

      // Execute query with pagination
      const [trips, total] = await Promise.all([
        this.savedTripModel
          .find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean<Array<SavedTripDocument & { createdAt: Date; updatedAt: Date }>>()
          .exec(),
        this.savedTripModel.countDocuments(filter),
      ]);

      // Transform trips for list view (lighter payload)
      const transformedTrips = trips.map((trip) => ({
        _id: trip._id,
        userId: trip.userId,
        tripData: {
          district: trip.tripData.district,
          days: trip.tripData.days,
          budget: trip.tripData.budget,
          travelWith: trip.tripData.travelWith,
          travelerType: trip.tripData.travelerType,
          stats: trip.tripData.stats,
        },
        savedAt: trip.savedAt,
        favorite: trip.favorite,
        tags: trip.tags,
        thumbnail: {
          firstPlace:
            Object.values(trip.tripData.itinerary)?.[0]?.[0]?.name || 'N/A',
          totalDays: trip.tripData.days,
          totalPlaces: trip.tripData.stats.totalPlaces,
        },
        createdAt: trip.createdAt,
        updatedAt: trip.updatedAt,
      }));

      return {
        success: true,
        data: {
          trips: transformedTrips,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to fetch trips: ${error.message}`,
      );
    }
  }

  // Get single trip by ID (full details)
  async findById(tripId: string) {
    try {
      if (!Types.ObjectId.isValid(tripId)) {
        throw new BadRequestException('Invalid tripId format');
      }

      const trip = await this.savedTripModel
        .findById(tripId)
        .lean<SavedTripDocument & { createdAt: Date; updatedAt: Date }>()
        .exec();

      if (!trip) {
        throw new NotFoundException(`Trip with ID ${tripId} not found`);
      }

      return {
        success: true,
        data: trip,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to fetch trip: ${error.message}`,
      );
    }
  }

  // Update trip metadata (notes, favorite, tags)
  async update(tripId: string, updateDto: UpdateSavedTripDto) {
    try {
      if (!Types.ObjectId.isValid(tripId)) {
        throw new BadRequestException('Invalid tripId format');
      }

      const updatedTrip = await this.savedTripModel
        .findByIdAndUpdate(tripId, updateDto, { new: true })
        .lean<SavedTripDocument & { createdAt: Date; updatedAt: Date }>()
        .exec();

      if (!updatedTrip) {
        throw new NotFoundException(`Trip with ID ${tripId} not found`);
      }

      return {
        success: true,
        message: 'Trip updated successfully',
        data: updatedTrip,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to update trip: ${error.message}`,
      );
    }
  }

  // Delete trip
  async delete(tripId: string) {
    try {
      if (!Types.ObjectId.isValid(tripId)) {
        throw new BadRequestException('Invalid tripId format');
      }

      const deletedTrip = await this.savedTripModel
        .findByIdAndDelete(tripId)
        .exec();

      if (!deletedTrip) {
        throw new NotFoundException(`Trip with ID ${tripId} not found`);
      }

      return {
        success: true,
        message: 'Trip deleted successfully',
        deletedId: tripId,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to delete trip: ${error.message}`,
      );
    }
  }

  // Get user statistics
  async getUserStats(userId: string) {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid userId format');
      }

      const stats = await this.savedTripModel.aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            totalTrips: { $sum: 1 },
            totalDays: { $sum: '$tripData.days' },
            totalPlaces: { $sum: '$tripData.stats.totalPlaces' },
            favoriteCount: {
              $sum: { $cond: ['$favorite', 1, 0] },
            },
          },
        },
      ]);

      return {
        success: true,
        data: stats[0] || {
          totalTrips: 0,
          totalDays: 0,
          totalPlaces: 0,
          favoriteCount: 0,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch user stats: ${error.message}`,
      );
    }
  }
}
