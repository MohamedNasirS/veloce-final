import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as path from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplication } from '@nestjs/common';

// ✅ Custom WebSocket CORS adapter
class CorsIoAdapter extends IoAdapter {
  constructor(private app: INestApplication) {
    super(app);
  }

  createIOServer(port: number, options?: any): any {
    const allowedOrigins = [
      'http://147.93.27.172/marketplace',
      'http://localhost:8080/marketplace',
    ];

    const corsOptions = {
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    };

    return super.createIOServer(port, {
      ...options,
      cors: corsOptions,
    });
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

  // ✅ Serve Swagger under /marketplace/api
  SwaggerModule.setup('marketplace/api', app, document);

  // ✅ Still use 'api' as global backend route prefix
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());

  const allowedOrigins = [
    'http://147.93.27.172/marketplace',
    'http://localhost:8080/marketplace',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.useWebSocketAdapter(new CorsIoAdapter(app));

  await app.listen(3001, '0.0.0.0');
  const baseUrl = 'http://147.93.27.172:3001';
  console.log(`✅ Server running at ${baseUrl}`);
  console.log(`🔗 Swagger: ${baseUrl}/marketplace/api`);
  console.log(`📁 Static files served from ${baseUrl}/uploads/...`);
}
bootstrap();
