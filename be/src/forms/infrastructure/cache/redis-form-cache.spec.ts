import { describe, expect, it } from 'vitest';

import { RedisFormCache, type RedisCacheClient } from './redis-form-cache';

type RedisSetCall = [key: string, value: string, mode: 'EX', ttlSeconds: number];

describe('RedisFormCache', () => {
  it('stores and retrieves JSON values with explicit TTLs', async () => {
    const calls: RedisSetCall[] = [];
    const values = new Map<string, string>();
    const redis: RedisCacheClient = {
      get: async (key: string) => values.get(key) ?? null,
      set: async (key, value, mode, ttlSeconds) => {
        calls.push([key, value, mode, ttlSeconds]);
        values.set(key, value);
        return 'OK';
      },
      del: async (...keys: string[]) => {
        keys.forEach((key) => values.delete(key));
        return keys.length;
      },
    };

    const cache = new RedisFormCache(redis);
    await cache.set('forms:list', [{ id: 'form-1' }], 60);

    await expect(cache.get('forms:list')).resolves.toEqual([{ id: 'form-1' }]);
    expect(calls).toEqual([['forms:list', JSON.stringify([{ id: 'form-1' }]), 'EX', 60]]);
  });

  it('builds stable cache keys', () => {
    expect(RedisFormCache.keys.list()).toBe('forms:list');
    expect(RedisFormCache.keys.active()).toBe('forms:active');
    expect(RedisFormCache.keys.byId('form-1')).toBe('forms:by-id:form-1');
  });
});
