import { defineConfig, type Options } from '@mikro-orm/mongodb';

export function createMikroOrmConfig(entities: NonNullable<Options['entities']>) {
  return defineConfig({
    clientUrl: process.env.MONGODB_URL ?? 'mongodb://localhost:27017',
    dbName: process.env.MONGODB_DB_NAME ?? 'topcv',
    entities,
  });
}
