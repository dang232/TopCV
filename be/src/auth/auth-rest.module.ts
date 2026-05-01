import { Module } from '@nestjs/common';

import { AuthFacade } from './application/auth.facade';
import { AuthV1RestController } from './interface/auth-v1.rest.controller';
import { KeycloakAuthService } from './keycloak/keycloak-auth.service';

@Module({
  controllers: [AuthV1RestController],
  providers: [KeycloakAuthService, AuthFacade],
})
export class AuthRestModule {}

