import { defineEntity, p } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import type { FormDto } from '@topcv/shared/forms';

export const FormEntitySchema = defineEntity({
  name: 'FormEntity',
  collection: 'forms',
  properties: {
    _id: p.type(ObjectId).primary(),
    id: p.string().serializedPrimaryKey(),
    publicId: p.string().unique(),
    title: p.string(),
    description: p.string(),
    order: p.integer(),
    status: p.string().$type<FormDto['status']>(),
    fields: p.json().$type<FormDto['fields']>(),
    createdAt: p.datetime(),
    updatedAt: p.datetime().onUpdate(() => new Date()),
  },
});

export class FormEntity extends FormEntitySchema.class {
  constructor() {
    super();
    this._id = new ObjectId();
  }
}

FormEntitySchema.setClass(FormEntity);
