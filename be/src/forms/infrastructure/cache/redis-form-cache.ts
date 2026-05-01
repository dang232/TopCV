import { Injectable } from '@nestjs/common';
import type { FormCache } from '../../application/ports/form.cache';

export type RedisCacheClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: 'EX', ttlSeconds: number): Promise<string | null>;
  del(...keys: string[]): Promise<number>;
};

@Injectable()
export class RedisFormCache implements FormCache {
  constructor(private readonly redis: RedisCacheClient) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);

    return value ? (JSON.parse(value) as T) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async delete(...keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    await this.redis.del(...keys);
  }
}
