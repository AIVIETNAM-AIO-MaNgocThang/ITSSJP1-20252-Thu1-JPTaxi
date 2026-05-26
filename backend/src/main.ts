import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

function ensureUploadDirs() {
  const dirs = [
    'avatars',
    'drivers/portraits',
    'drivers/licenses',
    'drivers/vehicles',
  ];
  for (const sub of dirs) {
    const path = join(process.cwd(), 'uploads', sub);
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true });
    }
  }
}

async function bootstrap() {
  ensureUploadDirs();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableCors();
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

bootstrap();
