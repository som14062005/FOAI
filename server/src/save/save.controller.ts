import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { SavedTripsService } from './save.service';
import { CreateSavedTripDto } from './dto/create-saved-trip.dto';
import { UpdateSavedTripDto } from './dto/update-saved-trip.dto';
import { QuerySavedTripDto } from './dto/query-saved-trip.dto';

@Controller('api/saved-trips')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class SavedTripsController {
  constructor(private readonly savedTripsService: SavedTripsService) {}

  // Save new trip
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async saveTrip(@Body() createDto: CreateSavedTripDto) {
    return this.savedTripsService.create(createDto);
  }

  // Get all user trips with pagination and filters
  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  async getUserTrips(
    @Param('userId') userId: string,
    @Query() queryDto: QuerySavedTripDto,
  ) {
    return this.savedTripsService.findByUserId(userId, queryDto);
  }

  // Get user statistics
  @Get('user/:userId/stats')
  @HttpCode(HttpStatus.OK)
  async getUserStats(@Param('userId') userId: string) {
    return this.savedTripsService.getUserStats(userId);
  }

  // Get single trip by ID
  @Get(':tripId')
  @HttpCode(HttpStatus.OK)
  async getTripById(@Param('tripId') tripId: string) {
    return this.savedTripsService.findById(tripId);
  }

  // Update trip metadata
  @Patch(':tripId')
  @HttpCode(HttpStatus.OK)
  async updateTrip(
    @Param('tripId') tripId: string,
    @Body() updateDto: UpdateSavedTripDto,
  ) {
    return this.savedTripsService.update(tripId, updateDto);
  }

  // Delete saved trip
  @Delete(':tripId')
  @HttpCode(HttpStatus.OK)
  async deleteTrip(@Param('tripId') tripId: string) {
    return this.savedTripsService.delete(tripId);
  }
}
