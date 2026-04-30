import { Global, Module } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/mongodb';

import { mikroOrmConfig } from './mikro-orm.config';

export const MIKRO_ORM = Symbol('MIKRO_ORM');
export const ENTITY_MANAGER = Symbol('ENTITY_MANAGER');

@Global()
@Module({
  providers: [
    {
      provide: MIKRO_ORM,
      useFactory: async () => {
        const orm = await MikroORM.init(mikroOrmConfig);
        await orm.connect();
        return orm;
      },
    },
    {
      provide: ENTITY_MANAGER,
      inject: [MIKRO_ORM],
      useFactory: (orm: MikroORM) => orm.em.fork(),
    },
  ],
  exports: [MIKRO_ORM, ENTITY_MANAGER],
})
export class DatabaseModule {}
