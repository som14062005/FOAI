import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS so React frontend can access it
  app.enableCors({
    origin: 'http://localhost:5173', // React dev server
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();
