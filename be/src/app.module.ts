import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { FormsModule } from './forms/forms.module';
import { HealthModule } from './health/health.module';
import { ExternalClientsModule } from './infra/external-clients.module';
import { FormEntitySchema } from './forms/infrastructure/persistence/form.entity';
import { SubmissionEntitySchema } from './forms/infrastructure/persistence/submission.entity';
import { AuthRestModule } from './auth/auth-rest.module';
import { validateEnv } from './config/env';
import { ApiExceptionFilter } from './shared/http/api-exception.filter';
import { ApiResponseInterceptor } from './shared/http/api-response.interceptor';
import { RequestLoggingInterceptor } from './shared/http/request-logging.interceptor';

const throttlingEnabled = process.env.NODE_ENV !== 'test' && process.env.THROTTLE_ENABLED !== 'false';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL_SECONDS', 60),
            limit: config.get<number>('THROTTLE_LIMIT', 120),
          },
        ],
      }),
    }),
    DatabaseModule.forRoot([FormEntitySchema, SubmissionEntitySchema]),
    ExternalClientsModule,
    AuthRestModule,
    FormsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },
    ...(throttlingEnabled
      ? [
          {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
          },
        ]
      : []),
  ],
})
export class AppModule {}
