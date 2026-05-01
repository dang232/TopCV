import { Module } from '@nestjs/common';

import { AuthenticatedGuard } from './authenticated.guard';
import { KeycloakJwtAuthGuard } from './keycloak/keycloak-jwt.guard';
import { KeycloakJwtVerifier } from './keycloak/keycloak-jwt.verifier';
import { RolesGuard } from './roles.guard';

@Module({
  providers: [KeycloakJwtVerifier, KeycloakJwtAuthGuard, AuthenticatedGuard, RolesGuard],
  exports: [KeycloakJwtVerifier, KeycloakJwtAuthGuard, AuthenticatedGuard, RolesGuard],
})
export class AuthModule {}

