import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as path from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  // ✅ Use Express version of Nest to allow static file serving
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ✅ Serve static assets from `uploads` folder at `/uploads` path
  app.useStaticAssets(path.resolve(__dirname, '..', 'uploads'), {
    prefix: '/uploads', // will map to http://0.0.0.0:3001/uploads
  });

  // ✅ Swagger Setup
  const config = new DocumentBuilder()
    .setTitle('Auction API')
    .setDescription('The Auction API documentation')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // ✅ Global prefix for all routes
  app.setGlobalPrefix('api');

  // ✅ Global validation pipes
  app.useGlobalPipes(new ValidationPipe());

  // ✅ Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // ✅ Start server
  await app.listen(3001);
  console.log(`✅ Server running at http://0.0.0.0:3001`);
  console.log(`🔗 Swagger: http://0.0.0.0:3001/api`);
  console.log(`📁 Static files served from http://0.0.0.0:3001/uploads/...`);
}

bootstrap();
