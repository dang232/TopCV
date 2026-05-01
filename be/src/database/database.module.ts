import { Global, Module } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/mongodb';
import type { Options } from '@mikro-orm/mongodb';

import { createMikroOrmConfig } from './mikro-orm.config';

export const MIKRO_ORM = Symbol('MIKRO_ORM');
export const ENTITY_MANAGER = Symbol('ENTITY_MANAGER');

@Global()
@Module({
  providers: [],
  exports: [MIKRO_ORM, ENTITY_MANAGER],
})
export class DatabaseModule {
  static forRoot(entities: NonNullable<Options['entities']>) {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: MIKRO_ORM,
          useFactory: async () => {
            const orm = await MikroORM.init(createMikroOrmConfig(entities));
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
    };
  }
}
