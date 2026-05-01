import { Controller, Get, Inject, Logger, UseGuards } from '@nestjs/common';

import { AuthenticatedGuard } from '../../auth/authenticated.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { Role } from '../../auth/roles';
import { KeycloakJwtAuthGuard } from '../../auth/keycloak/keycloak-jwt.guard';
import { HTTP_API_V1_SUBMISSIONS_PATH } from '../../http/api-path.constants';
import { ListSubmissionsUseCase } from '../application/submissions/list-submissions.use-case';
import { rethrowFormsRest } from './forms-rest-error.handler';

@Controller(HTTP_API_V1_SUBMISSIONS_PATH)
@UseGuards(KeycloakJwtAuthGuard, AuthenticatedGuard, RolesGuard)
export class SubmissionsV1RestController {
  private readonly logger = new Logger(SubmissionsV1RestController.name);

  constructor(@Inject(ListSubmissionsUseCase) private readonly listSubmissions: ListSubmissionsUseCase) {}

  private async run<T>(procedure: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error: unknown) {
      rethrowFormsRest(error, procedure, this.logger);
    }
  }

  @Get()
  @Roles(Role.STAFF, Role.ADMIN)
  list(): Promise<unknown> {
    return this.run('submissions.rest.list', () => this.listSubmissions.execute());
  }
}
