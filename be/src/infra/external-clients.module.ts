import { Global, Module } from '@nestjs/common';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { Redis } from 'ioredis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');
export const ELASTICSEARCH_CLIENT = Symbol('ELASTICSEARCH_CLIENT');

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () =>
        new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
        }),
    },
    {
      provide: ELASTICSEARCH_CLIENT,
      useFactory: () =>
        new ElasticsearchClient({
          node: process.env.ELASTICSEARCH_URL ?? 'http://localhost:9200',
        }),
    },
  ],
  exports: [REDIS_CLIENT, ELASTICSEARCH_CLIENT],
})
export class ExternalClientsModule {}
