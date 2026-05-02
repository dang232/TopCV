import 'dotenv/config';
import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import helmet from 'helmet';

import { AppModule } from './app.module';

/** CSR calls API from a different origin (:3001 → :3000); browsers require Access-Control-Allow-Origin from this server. */
function corsOptions(): CorsOptions {
  const raw = process.env.FRONTEND_ORIGIN?.trim();
  const origins = raw
    ? raw
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
    : ['http://localhost:3001', 'http://127.0.0.1:3001'];

  return {
    origin: origins.length <= 1 ? origins[0] : origins,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  app.enableCors(corsOptions());
  app.use(helmet());
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
