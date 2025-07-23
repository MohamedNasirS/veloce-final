import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as path from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(path.resolve(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Auction API')
    .setDescription('The Auction API documentation')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());

  // Correct CORS configuration specifying allowed origins to support credentials
  app.enableCors({
    origin: [
      'http://localhost:8080',  // your local frontend origin
      'http://147.93.27.172',   // your VPS frontend origin
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Enable the WebSocket adapter with IoAdapter
  app.useWebSocketAdapter(new IoAdapter(app));

  await app.listen(3001, '0.0.0.0');

  const baseUrl = 'http://localhost:3001';
  console.log(`✅ Server running at ${baseUrl}`);
  console.log(`🔗 Swagger: ${baseUrl}/api`);
  console.log(`📁 Static files served from ${baseUrl}/uploads/...`);
}

bootstrap();
