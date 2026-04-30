import { Module } from '@nestjs/common';
import type { Redis } from 'ioredis';

import { REDIS_CLIENT } from '../../../infra/external-clients.module';
import { FORM_CACHE } from '../../application/ports/form.cache';
import { RedisFormCache } from './redis-form-cache';

@Module({
  providers: [
    {
      provide: FORM_CACHE,
      inject: [REDIS_CLIENT],
      useFactory: (redis: Redis) => new RedisFormCache(redis),
    },
  ],
  exports: [FORM_CACHE],
})
export class FormsCacheModule {}
