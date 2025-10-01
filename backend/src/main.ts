import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as path from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplication } from '@nestjs/common';
import * as bodyParser from 'body-parser';

class CorsIoAdapter extends IoAdapter {
  constructor(private app: INestApplication) {
    super(app);
  }

  createIOServer(port: number, options?: any): any {
    const corsOptions = {
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow all 147.93.27.172 origins (any port)
        if (!origin || origin.startsWith('http://147.93.27.172')) {
          callback(null, true);
        } else {
          console.log(`Origin ${origin} not allowed by CORS`);
          callback(null, true); // Allow all origins for development
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    };

    return super.createIOServer(port, {
      ...options,
      cors: corsOptions,
    });
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configure body parser to handle large requests
  app.use(bodyParser.json({ limit: '20mb' }));
  app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));

  // Static uploads under /uploads
  app.useStaticAssets(path.resolve(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Auction API')
    .setDescription('The Auction API documentation')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Swagger accessible under /marketplace/api via Nginx rewrite
  SwaggerModule.setup('api', app, document);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());

  // Enable CORS - Allow all 147.93.27.172 origins (any port) for development
  app.enableCors({
    origin: (origin, callback) => {
      // Allow all 147.93.27.172 origins (any port)
      if (!origin || (origin && origin.startsWith('http://147.93.27.172'))) {
        callback(null, true);
      } else {
        console.log(`Origin ${origin} not allowed by CORS`);
        callback(null, true); // Allow all origins for development
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useWebSocketAdapter(new CorsIoAdapter(app));

  await app.listen(3001, '0.0.0.0');
  const baseUrl = 'http://147.93.27.172:3001';
  console.log(`✅ Server running at ${baseUrl}`);
  console.log(`🔗 Swagger: ${baseUrl}/api`);
  console.log(`📁 Static files served from ${baseUrl}/uploads/...`);
}
bootstrap();
