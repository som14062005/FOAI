import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Delete,
} from '@nestjs/common';
import { ClassifierService } from './classifier.service';
import { PredictTravelerDto } from './dto/predict-traveler.dto';
import { TravelerResponseDto } from './dto/traveler-response.dto';
import { SaveUserProfileDto } from './dto/save-profile.dto';
import {
  UserProfile,
  SaveProfileResponse,
  DeleteProfileResponse,
  GetAllProfilesResponse,
} from './interfaces/user-profile.interface';

@Controller('classifier')
export class ClassifierController {
  constructor(private readonly classifierService: ClassifierService) {}

  /**
   * Predict traveler type based on questionnaire answers
   * POST /classifier/predict
   */
  @Post('predict')
  @HttpCode(HttpStatus.OK)
  async predictTravelerType(
    @Body() predictDto: PredictTravelerDto,
  ): Promise<TravelerResponseDto> {
    return this.classifierService.predictTravelerType(predictDto);
  }

  /**
   * Save user's traveler profile
   * POST /classifier/save-profile
   */
  @Post('save-profile')
  @HttpCode(HttpStatus.OK)
  async saveUserProfile(
    @Body() profileDto: SaveUserProfileDto,
  ): Promise<SaveProfileResponse> {
    return this.classifierService.saveUserProfile(profileDto);
  }

  /**
   * Get user's traveler profile by userId
   * GET /classifier/profile/:userId
   */
  @Get('profile/:userId')
  @HttpCode(HttpStatus.OK)
  async getUserProfile(@Param('userId') userId: string): Promise<UserProfile> {
    return this.classifierService.getUserProfile(userId);
  }

  /**
   * Delete user's traveler profile
   * DELETE /classifier/profile/:userId
   */
  @Delete('profile/:userId')
  @HttpCode(HttpStatus.OK)
  async deleteUserProfile(
    @Param('userId') userId: string,
  ): Promise<DeleteProfileResponse> {
    return this.classifierService.deleteUserProfile(userId);
  }

  /**
   * Get all user profiles (for admin/debugging)
   * GET /classifier/profiles
   */
  @Get('profiles')
  @HttpCode(HttpStatus.OK)
  async getAllProfiles(): Promise<GetAllProfilesResponse> {
    const profiles = await this.classifierService.getAllProfiles(); // ← Added await here!
    return {
      success: true,
      count: profiles.length,
      profiles: profiles,
    };
  }

  /**
   * Check health of classifier service and ML service
   * GET /classifier/health
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  async checkHealth(): Promise<{
    status: string;
    mlServiceAvailable: boolean;
    timestamp: string;
  }> {
    const isHealthy = await this.classifierService.checkMLServiceHealth();
    return {
      status: 'ok',
      mlServiceAvailable: isHealthy,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Retrain the ML model with latest data
   * POST /classifier/retrain
   */
  @Post('retrain')
  @HttpCode(HttpStatus.OK)
  async retrainModel(): Promise<{ message: string }> {
    return this.classifierService.retrainModel();
  }
}
