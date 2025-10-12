import { Injectable, HttpException, HttpStatus, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PredictTravelerDto } from './dto/predict-traveler.dto';
import { TravelerResponseDto } from './dto/traveler-response.dto';
import { SaveUserProfileDto } from './dto/save-profile.dto';
import {
  UserProfile as UserProfileInterface,
  SaveProfileResponse,
  DeleteProfileResponse,
} from './interfaces/user-profile.interface';
import { UserProfile } from './schemas/user-profile.schema';
import axios, { AxiosInstance, AxiosError } from 'axios';

@Injectable()
export class ClassifierService implements OnModuleInit {
  private readonly ML_SERVICE_URL = 'http://localhost:5000';
  private axiosInstance: AxiosInstance;

  constructor(
    @InjectModel(UserProfile.name)
    private userProfileModel: Model<UserProfile>,
  ) {
    this.axiosInstance = axios.create({
      baseURL: this.ML_SERVICE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async onModuleInit() {
    const isHealthy = await this.checkMLServiceHealth();
    if (isHealthy) {
      console.log('✅ ML Service is running and healthy');
    } else {
      console.warn('⚠️ ML Service is not available. Please start the Python service.');
    }

    // Check database connection
    try {
      const count = await this.userProfileModel.countDocuments();
      console.log(`✅ Database connected. ${count} user profiles found.`);
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
    }
  }

  async predictTravelerType(
    data: PredictTravelerDto,
  ): Promise<TravelerResponseDto> {
    try {
      const response = await this.axiosInstance.post('/predict', data);

      return {
        travelerType: response.data.travelerType,
        confidence: response.data.confidence,
        recommendations: response.data.recommendations,
        description: response.data.description,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error calling ML service:', axiosError.message);

      if (axiosError.response) {
        const errorData = axiosError.response.data as any;
        throw new HttpException(
          `ML Service Error: ${errorData?.error || 'Unknown error'}`,
          axiosError.response.status,
        );
      } else if (axiosError.request) {
        throw new HttpException(
          'ML Service is not available. Please ensure the Python service is running.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      } else {
        throw new HttpException(
          'Failed to predict traveler type',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async saveUserProfile(
    profileData: SaveUserProfileDto,
  ): Promise<SaveProfileResponse> {
    try {
      // Update if exists, create if not (upsert)
      const profile = await this.userProfileModel.findOneAndUpdate(
        { userId: profileData.userId },
        {
          travelerType: profileData.travelerType,
          confidence: profileData.confidence,
          description: profileData.description,
        },
        {
          upsert: true, // Create if doesn't exist
          new: true,    // Return updated document
          setDefaultsOnInsert: true,
        },
      );

      console.log(`✅ Saved traveler profile to DATABASE for user: ${profileData.userId}`);
      console.log(`   Type: ${profileData.travelerType} (${(profileData.confidence * 100).toFixed(0)}%)`);

      return {
        success: true,
        message: 'Traveler profile saved successfully to database',
        profile: {
          userId: profile.userId,
          travelerType: profile.travelerType,
          confidence: profile.confidence,
          description: profile.description,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
        },
      };
    } catch (error) {
      console.error('Error saving user profile to database:', error);
      throw new HttpException(
        'Failed to save traveler profile',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserProfile(userId: string): Promise<UserProfileInterface> {
    try {
      const profile = await this.userProfileModel.findOne({ userId }).exec();

      if (!profile) {
        throw new HttpException(
          'User profile not found. Please complete the travel quiz first.',
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        userId: profile.userId,
        travelerType: profile.travelerType,
        confidence: profile.confidence,
        description: profile.description,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error retrieving user profile:', error);
      throw new HttpException(
        'Failed to retrieve user profile',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAllProfiles(): Promise<UserProfileInterface[]> {
    try {
      const profiles = await this.userProfileModel.find().exec();
      return profiles.map((profile) => ({
        userId: profile.userId,
        travelerType: profile.travelerType,
        confidence: profile.confidence,
        description: profile.description,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      }));
    } catch (error) {
      console.error('Error retrieving all profiles:', error);
      throw new HttpException(
        'Failed to retrieve profiles',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteUserProfile(userId: string): Promise<DeleteProfileResponse> {
    try {
      const result = await this.userProfileModel.deleteOne({ userId }).exec();

      if (result.deletedCount === 0) {
        throw new HttpException(
          'User profile not found',
          HttpStatus.NOT_FOUND,
        );
      }

      console.log(`✅ Deleted profile for user: ${userId}`);

      return {
        success: true,
        message: 'User profile deleted successfully from database',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error deleting user profile:', error);
      throw new HttpException(
        'Failed to delete user profile',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async checkMLServiceHealth(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('/health', {
        timeout: 3000,
      });
      return response.data.status === 'healthy';
    } catch (error) {
      return false;
    }
  }

  async retrainModel(): Promise<{ message: string }> {
    try {
      const response = await this.axiosInstance.post('/retrain');
      return { message: response.data.message };
    } catch (error) {
      throw new HttpException(
        'Failed to retrain model',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async findByUserId(userId: string) {
  try {
    const profile = await this.userProfileModel
      .findOne({ userId })
      .sort({ updatedAt: -1 })
      .exec();

    if (!profile) {
      return null; // return null so TripsService can throw NotFoundException
    }

    return {
      userId: profile.userId,
      travelerType: profile.travelerType,
      confidence: profile.confidence,
      description: profile.description,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  } catch (error) {
    console.error('Error finding traveler profile by userId:', error);
    throw new HttpException(
      'Failed to fetch traveler profile',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

}
