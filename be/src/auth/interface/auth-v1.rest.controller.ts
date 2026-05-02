import { Body, Controller, Inject, Post } from '@nestjs/common';
import { LoginInputSchema, LogoutInputSchema, RefreshInputSchema, RegisterInputSchema } from '@topcv/shared/auth';

import { HTTP_API_V1_AUTH_PATH } from '../../http/api-path.constants';
import { parseZodBody } from '../../shared/http/zod-parse';
import { AuthFacade } from '../application/auth.facade';

@Controller(HTTP_API_V1_AUTH_PATH)
export class AuthV1RestController {
  constructor(@Inject(AuthFacade) private readonly auth: AuthFacade) {}

  @Post('register')
  async register(@Body() body: unknown): Promise<{ created: true; userId?: string }> {
    const parsed = parseZodBody(RegisterInputSchema, body);
    return await this.auth.register(parsed);
  }

  @Post('login')
  async login(@Body() body: unknown): Promise<{
    accessToken: string;
    refreshToken?: string;
    idToken?: string;
    expiresIn?: number;
    refreshExpiresIn?: number;
    tokenType?: string;
    scope?: string;
  }> {
    const parsed = parseZodBody(LoginInputSchema, body);
    return await this.auth.login(parsed);
  }

  @Post('refresh')
  async refresh(@Body() body: unknown): Promise<{
    accessToken: string;
    refreshToken?: string;
    idToken?: string;
    expiresIn?: number;
    refreshExpiresIn?: number;
    tokenType?: string;
    scope?: string;
  }> {
    const parsed = parseZodBody(RefreshInputSchema, body);
    return await this.auth.refresh(parsed);
  }

  @Post('logout')
  async logout(@Body() body: unknown): Promise<{ loggedOut: true }> {
    const parsed = parseZodBody(LogoutInputSchema, body);
    return await this.auth.logout(parsed);
  }
}

