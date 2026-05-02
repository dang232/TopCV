import { z } from 'zod';

const NodeEnvSchema = z.enum(['development', 'test', 'production']);

const CommaSeparatedOriginsSchema = z
  .string()
  .transform((raw) =>
    raw
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.string().min(1)).min(1));

export const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: NodeEnvSchema.default('development'),

  // CORS
  FRONTEND_ORIGIN: z
    .string()
    .optional()
    .transform((v) => v?.trim())
    .refine((v) => v === undefined || v.length > 0, 'FRONTEND_ORIGIN must not be empty')
    .default('http://localhost:3001,http://127.0.0.1:3001')
    .pipe(CommaSeparatedOriginsSchema.transform((list) => list.join(','))),

  // Dependencies
  MONGODB_URL: z.string().min(1),
  MONGODB_DB_NAME: z.string().min(1),
  REDIS_URL: z.string().min(1),
  ELASTICSEARCH_URL: z.string().url(),

  // Auth (Keycloak)
  KEYCLOAK_ISSUER: z.string().url(),
  KEYCLOAK_JWKS_URL: z.string().url().optional(),
  KEYCLOAK_AUDIENCE: z.string().min(1).optional(),
  KEYCLOAK_CLIENT_ID: z.string().min(1),
  KEYCLOAK_CLIENT_SECRET: z.string().min(1).optional(),

  KEYCLOAK_ADMIN_CLIENT_ID: z.string().min(1),
  KEYCLOAK_ADMIN_CLIENT_SECRET: z.string().min(1),

  // Rate limiting (Nest throttler; ttl in seconds)
  THROTTLE_ENABLED: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  THROTTLE_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(120),
});

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(config: Record<string, unknown>) {
  const parsed = EnvSchema.safeParse(config);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${message}`);
  }
  const env = { ...parsed.data };
  // Avoid throttling noise in test runs unless explicitly enabled.
  if (env.NODE_ENV === 'test' && env.THROTTLE_ENABLED === undefined) {
    env.THROTTLE_ENABLED = false;
  }
  if (env.THROTTLE_ENABLED === undefined) {
    env.THROTTLE_ENABLED = true;
  }
  return env;
}

