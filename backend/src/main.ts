// main.ts - MODIFIED SLIGHTLY FOR CLARITY AND EXPLICITNESS

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as path from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';

class CorsIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: any) {
    const corsOptions = {
      // Explicitly list all allowed origins for Socket.IO
      origin: [ 'http://localhost:8080', 'http://147.93.27.172' ],
      credentials: true, // Crucial: Allows cookies/auth headers with cross-origin requests
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Standard methods
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'], // Standard headers
    };
    options = {
      ...options,
      cors: corsOptions,
    };
    return super.createIOServer(port, options);
  }
}

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

  // CORS for HTTP endpoints
  app.enableCors({
    // Explicitly list all allowed origins for HTTP API requests
    origin: [ 'http://localhost:8080', 'http://147.93.27.172' ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Use the custom IoAdapter with explicit CORS config for WebSockets
  app.useWebSocketAdapter(new CorsIoAdapter(app));

  await app.listen(3001, '0.0.0.0'); // Listen on all available network interfaces

  // Corrected base URL for console log to reflect VPS access
  const baseUrl = 'http://147.93.27.172:3001';
  console.log(`✅ Server running at ${baseUrl}`);
  console.log(`🔗 Swagger: ${baseUrl}/api`);
  console.log(`📁 Static files served from ${baseUrl}/uploads/...`);
}

bootstrap();