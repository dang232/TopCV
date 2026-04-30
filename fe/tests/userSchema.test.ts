import { UserSchema } from '@topcv/shared';
import { expect, test } from 'vitest';

test('valid user schema', () => {
  expect(UserSchema.parse({ id: '1', name: 'John', email: 'john@example.com' })).toEqual({
    id: '1',
    name: 'John',
    email: 'john@example.com',
  });
});