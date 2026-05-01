import { Controller, Get, Inject } from '@nestjs/common';
import type { MikroORM } from '@mikro-orm/mongodb';
import type { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import type { Redis } from 'ioredis';

import { MIKRO_ORM } from '../database/database.module';
import { ELASTICSEARCH_CLIENT, REDIS_CLIENT } from '../infra/external-clients.module';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(MIKRO_ORM) private readonly orm: MikroORM,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(ELASTICSEARCH_CLIENT) private readonly elasticsearch: ElasticsearchClient,
  ) {}

  @Get()
  async check() {
    const probe = async (fn: () => Promise<boolean>) => {
      try {
        return await fn();
      } catch {
        // Ignore health probe failure.
        return false;
      }
    };

    const mongoOk = await probe(async () => {
      const mongoCheck = await this.orm.checkConnection();
      return mongoCheck.ok;
    });

    const redisOk = await probe(async () => (await this.redis.ping()) === 'PONG');

    const elasticsearchOk = await probe(async () => {
      const elasticsearch = await this.elasticsearch.info();
      return Boolean(elasticsearch);
    });

    return {
      status: mongoOk && redisOk && elasticsearchOk ? 'ok' : 'degraded',
      services: {
        mongodb: mongoOk ? 'ok' : 'down',
        redis: redisOk ? 'ok' : 'down',
        elasticsearch: elasticsearchOk ? 'ok' : 'down',
      },
    };
  }
}
