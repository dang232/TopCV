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
    let mongoOk = false;
    try {
      const mongoCheck = await this.orm.checkConnection();
      mongoOk = mongoCheck.ok;
    } catch {
      mongoOk = false;
    }

    let redisOk = false;
    try {
      redisOk = (await this.redis.ping()) === 'PONG';
    } catch {
      redisOk = false;
    }

    let elasticsearchOk = false;
    try {
      const elasticsearch = await this.elasticsearch.info();
      elasticsearchOk = Boolean(elasticsearch);
    } catch {
      elasticsearchOk = false;
    }

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
