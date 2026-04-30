import { CreateFormInputSchema } from '@topcv/shared';
import { expect, test } from 'vitest';

test('form creation payload matches the shared backend contract', () => {
  const payload = CreateFormInputSchema.parse({
    title: 'Onboarding',
    description: 'Collect details',
    order: 0,
    status: 'draft',
    fields: [{ label: 'Name', type: 'text', order: 0, required: true }],
  });

  expect(payload.title).toBe('Onboarding');
  expect(payload.fields[0]?.type).toBe('text');
});