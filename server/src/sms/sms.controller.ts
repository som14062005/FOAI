// src/sms/sms.controller.ts
import { Controller, Post, Body, Get, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SendProximityAlertDto } from './dto/sms.dto';

@Controller('api/sms')
export class SmsController {
  private readonly logger = new Logger(SmsController.name);

  constructor(private readonly smsService: SmsService) {}

  @Get('health')
  healthCheck() {
    this.logger.log('Health check called');
    return {
      status: 'OK',
      service: 'SMS Service',
      timestamp: new Date().toISOString()
    };
  }

  @Post('send-proximity-alert')
  async sendProximityAlert(@Body() dto: SendProximityAlertDto) {
    this.logger.log(`📨 Proximity alert request for ${dto.placeName}`);

    try {
      const result = await this.smsService.sendProximityAlert(dto);

      if (result.success) {
        return {
          success: true,
          message: 'SMS sent successfully',
          messageSid: result.messageSid,
          data: {
            phoneNumber: dto.phoneNumber,
            placeName: dto.placeName,
            distance: dto.distance
          }
        };
      } else {
        throw new HttpException(
          {
            success: false,
            message: 'Failed to send SMS',
            error: result.error
          },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    } catch (error: any) {
      this.logger.error(`❌ Error: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to send proximity alert',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('send-custom')
  async sendCustomSMS(@Body() body: { phoneNumber: string; message: string }) {
    this.logger.log(`📨 Custom SMS request to ${body.phoneNumber}`);

    try {
      const result = await this.smsService.sendCustomSMS(body.phoneNumber, body.message);

      if (result.success) {
        return {
          success: true,
          message: 'Custom SMS sent successfully',
          messageSid: result.messageSid
        };
      } else {
        throw new HttpException(
          {
            success: false,
            message: 'Failed to send custom SMS',
            error: result.error
          },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    } catch (error: any) {
      this.logger.error(`❌ Error: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to send custom SMS',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
