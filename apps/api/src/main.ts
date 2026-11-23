import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  const config = new DocumentBuilder()
    .setTitle('BrightPath Support API')
    .setVersion('1')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('/docs', app, SwaggerModule.createDocument(app, config));

  const port = process.env.API_PORT || 3001;
  await app.listen(port);
}

bootstrap();