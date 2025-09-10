import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Enable CORS for React frontend
  app.enableCors({
    origin: 'http://localhost:5173', // React dev server URL
    credentials: true,
  });

  // ✅ Global validation for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove extra fields
      forbidNonWhitelisted: true, // Throw error for extra fields
      transform: true, // Auto-transform payloads to DTO types
    }),
  );

  // ✅ Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Hackathon API')
    .setDescription('Live API Documentation for Judges & Team')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(3000);
}
bootstrap();
