import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { Redis } from 'ioredis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');
export const ELASTICSEARCH_CLIENT = Symbol('ELASTICSEARCH_CLIENT');

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Redis(config.getOrThrow<string>('REDIS_URL'), {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
        }),
    },
    {
      provide: ELASTICSEARCH_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new ElasticsearchClient({
          node: config.getOrThrow<string>('ELASTICSEARCH_URL'),
        }),
    },
  ],
  exports: [REDIS_CLIENT, ELASTICSEARCH_CLIENT],
})
export class ExternalClientsModule {}
