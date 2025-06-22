import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  console.log('Starting NestJS application...');
  
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Auction API')
    .setDescription('The Auction API blockchain integrated documentation')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.useGlobalPipes(new ValidationPipe());
  
  // Enable CORS with proper configuration
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  // Add global prefix
  app.setGlobalPrefix('api');

  await app.listen(3001);
  console.log('✅ Backend is running on http://localhost:3001');
  console.log('✅ API endpoints available at http://localhost:3001/api');
  console.log('✅ Test endpoint: http://localhost:3001/api/auth/test');
}
bootstrap().catch(error => {
  console.error('❌ Failed to start application:', error);
});
