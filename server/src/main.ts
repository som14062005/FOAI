// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Enable CORS for network access
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://192.168.1.35:5173', // ✅ Your network IP
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT || 3000;
  
  // ✅ Listen on all network interfaces
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Backend running on:`);
  console.log(`   Local:   http://localhost:${port}`);
  console.log(`   Network: http://10.252.100.1:${port}`);
}
bootstrap();
