import { z } from 'zod';

import { restHttpException } from './rest-error';

export function parseZodBody<T>(schema: z.ZodType<T>, body: unknown): T {
  try {
    return schema.parse(body);
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw restHttpException(400, 'VALIDATION', 'Invalid request', err.flatten());
    }
    throw err;
  }
}

