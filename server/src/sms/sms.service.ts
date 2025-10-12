// src/sms/sms.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';
import { SendProximityAlertDto } from './dto/sms.dto';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: twilio.Twilio | null = null;
  private twilioPhoneNumber: string | null = null;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.twilioPhoneNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER') || null;

    if (accountSid && authToken && this.twilioPhoneNumber) {
      this.twilioClient = twilio(accountSid, authToken);
      this.logger.log('✅ Twilio client initialized successfully');
      this.logger.log(`📱 Using Twilio number: ${this.twilioPhoneNumber}`);
    } else {
      this.logger.warn('⚠️ Twilio credentials not found. SMS service disabled.');
      this.logger.warn('⚠️ Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in your .env file');
    }
  }

  async sendProximityAlert(dto: SendProximityAlertDto): Promise<{ success: boolean; messageSid?: string; error?: string }> {
    if (!this.twilioClient || !this.twilioPhoneNumber) {
      return {
        success: false,
        error: 'Twilio service not configured. Please check environment variables.'
      };
    }

    try {
      // Format the message
      const message = `🗺️ TRIP ALERT!\n\nYou're ${dto.distance}m away from:\n📍 ${dto.placeName}\n${dto.rating ? `⭐ Rating: ${dto.rating}/5\n` : ''}${dto.timing ? `⏰ Best time: ${dto.timing}\n` : ''}\nEnjoy your visit!`;

      // Send SMS via Twilio
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.twilioPhoneNumber,
        to: dto.phoneNumber
      });

      this.logger.log(`✅ SMS sent successfully to ${dto.phoneNumber} for ${dto.placeName} (SID: ${result.sid})`);

      return {
        success: true,
        messageSid: result.sid
      };
    } catch (error: any) {
      this.logger.error(`❌ Failed to send SMS: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  async sendCustomSMS(phoneNumber: string, message: string): Promise<{ success: boolean; messageSid?: string; error?: string }> {
    if (!this.twilioClient || !this.twilioPhoneNumber) {
      return {
        success: false,
        error: 'Twilio service not configured. Please check environment variables.'
      };
    }

    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.twilioPhoneNumber,
        to: phoneNumber
      });

      this.logger.log(`✅ Custom SMS sent successfully to ${phoneNumber} (SID: ${result.sid})`);

      return {
        success: true,
        messageSid: result.sid
      };
    } catch (error: any) {
      this.logger.error(`❌ Failed to send custom SMS: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  // Test method to verify Twilio connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.twilioClient) {
      return {
        success: false,
        message: 'Twilio service not configured. Check your environment variables (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER).'
      };
    }

    try {
      const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
      
      if (!accountSid) {
        return {
          success: false,
          message: 'TWILIO_ACCOUNT_SID not found in environment variables'
        };
      }

      // Verify account details
      const account = await this.twilioClient.api.accounts(accountSid).fetch();

      return {
        success: true,
        message: `Twilio connected successfully! Account: ${account.friendlyName}, Status: ${account.status}`
      };
    } catch (error: any) {
      this.logger.error(`❌ Twilio connection test failed: ${error.message}`);
      return {
        success: false,
        message: `Failed to connect to Twilio: ${error.message}`
      };
    }
  }

  // Check if SMS service is available
  isConfigured(): boolean {
    return this.twilioClient !== null && this.twilioPhoneNumber !== null;
  }

  // Get service status
  getStatus(): { configured: boolean; phoneNumber: string | null } {
    return {
      configured: this.isConfigured(),
      phoneNumber: this.twilioPhoneNumber ? this.maskPhoneNumber(this.twilioPhoneNumber) : null
    };
  }

  // Helper to mask phone number for security
  private maskPhoneNumber(phone: string): string {
    if (phone.length < 4) return phone;
    return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4);
  }
}
