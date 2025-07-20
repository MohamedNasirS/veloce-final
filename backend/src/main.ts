import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as path from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

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

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  await app.listen(3001, '0.0.0.0');

  const baseUrl = configService.get<string>('BASE_URL');

  if (!baseUrl) {
    console.warn('⚠️ BASE_URL not set. Defaulting to http://localhost:3001');
  }

  console.log(`✅ Server running at ${baseUrl || 'http://localhost:3001'}`);
  console.log(`🔗 Swagger: ${baseUrl || 'http://localhost:3001'}/api`);
  console.log(`📁 Static files served from ${baseUrl || 'http://localhost:3001'}/uploads/...`);

}
bootstrap();
