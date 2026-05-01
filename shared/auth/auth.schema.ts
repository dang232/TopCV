import { z } from 'zod';

import { TOPCV_REALM_ROLES } from './roles';

export const RegisterInputSchema = z.object({
  username: z.string().trim().min(3).max(64),
  email: z.string().trim().email(),
  password: z.string().min(8).max(256),
  role: z.enum(TOPCV_REALM_ROLES),
});

export const LoginInputSchema = z.object({
  usernameOrEmail: z.string().trim().min(1).max(256),
  password: z.string().min(1).max(256),
});

export const LogoutInputSchema = z.object({
  refreshToken: z.string().trim().min(1),
});

export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type LogoutInput = z.infer<typeof LogoutInputSchema>;

