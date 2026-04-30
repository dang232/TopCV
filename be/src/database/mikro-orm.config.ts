import { defineConfig } from '@mikro-orm/mongodb';

import { FormEntitySchema } from '../forms/infrastructure/persistence/form.entity';
import { SubmissionEntitySchema } from '../forms/infrastructure/persistence/submission.entity';

export const mikroOrmConfig = defineConfig({
  clientUrl: process.env.MONGODB_URL ?? 'mongodb://localhost:27017',
  dbName: process.env.MONGODB_DB_NAME ?? 'topcv',
  entities: [FormEntitySchema, SubmissionEntitySchema],
});
