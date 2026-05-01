import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CreateFormInputSchema,
  FormIdInputSchema,
  PaginationInputSchema,
  PaginatedFormListSchema,
  SearchFormsInputSchema,
  SubmitFormInputSchema,
  UpdateFormInputSchema,
  formsProcedureFormLookupErrors,
} from '@topcv/shared/forms';
import { ORPCError, os } from '@orpc/server';

import { CreateFormUseCase } from '../application/forms/create-form.use-case';
import { DeleteFormUseCase } from '../application/forms/delete-form.use-case';
import { GetActiveFormsUseCase } from '../application/forms/get-active-forms.use-case';
import { GetFormUseCase } from '../application/forms/get-form.use-case';
import { ListFormsUseCase } from '../application/forms/list-forms.use-case';
import { ListFormsPageUseCase } from '../application/forms/list-forms-page.use-case';
import { SearchFormsUseCase } from '../application/forms/search-forms.use-case';
import { UpdateFormUseCase } from '../application/forms/update-form.use-case';
import { ListSubmissionsUseCase } from '../application/submissions/list-submissions.use-case';
import { SubmitFormUseCase } from '../application/submissions/submit-form.use-case';
import { mapFormsFailureToOrpc, mapUnhandledFormsProcedureFailure } from './forms-orpc-error.mapper';
import type { OrpcContext } from '../../auth/auth.types';
import { Role } from '../../auth/roles';

@Injectable()
export class FormsRouterFactory {
  private readonly logger = new Logger(FormsRouterFactory.name);

  constructor(
    @Inject(CreateFormUseCase) private readonly createForm: CreateFormUseCase,
    @Inject(ListFormsUseCase) private readonly listForms: ListFormsUseCase,
    @Inject(ListFormsPageUseCase) private readonly listFormsPage: ListFormsPageUseCase,
    @Inject(GetFormUseCase) private readonly getForm: GetFormUseCase,
    @Inject(UpdateFormUseCase) private readonly updateForm: UpdateFormUseCase,
    @Inject(DeleteFormUseCase) private readonly deleteForm: DeleteFormUseCase,
    @Inject(SearchFormsUseCase) private readonly searchForms: SearchFormsUseCase,
    @Inject(GetActiveFormsUseCase) private readonly getActiveForms: GetActiveFormsUseCase,
    @Inject(SubmitFormUseCase) private readonly submitForm: SubmitFormUseCase,
    @Inject(ListSubmissionsUseCase) private readonly listSubmissions: ListSubmissionsUseCase,
  ) {}

  private async runProcedure<T>(procedure: string, execute: () => Promise<T>): Promise<T> {
    try {
      return await execute();
    } catch (error) {
      const mapped = mapFormsFailureToOrpc(error);
      if (mapped) {
        throw mapped;
      }

      throw mapUnhandledFormsProcedureFailure(procedure, error, this.logger);
    }
  }

  create() {
    const base = os.$context<OrpcContext>();

    const requireAuth = base.use(({ context, next }) => {
      if (context.user) {
        return next();
      }

      throw new ORPCError('UNAUTHORIZED', { status: 401, message: 'Unauthorized', defined: true });
    });

    const requireAnyRole = (...roles: Role[]) =>
      requireAuth.use(({ context, next }) => {
        const userRoles = new Set(context.user?.roles ?? []);
        const allowed = roles.some((role) => userRoles.has(role));
        if (allowed) {
          return next();
        }
        throw new ORPCError('FORBIDDEN', { status: 403, message: 'Forbidden', defined: true });
      });

    const adminOnly = requireAnyRole(Role.ADMIN);
    const staffOrAdmin = requireAnyRole(Role.STAFF, Role.ADMIN);

    return {
      forms: {
        create: adminOnly.input(CreateFormInputSchema).handler(({ input }) =>
          this.runProcedure('forms.create', () => this.createForm.execute(input)),
        ),
        list: adminOnly.handler(() => this.runProcedure('forms.list', () => this.listForms.execute())),
        listPage: adminOnly
          .input(PaginationInputSchema)
          .output(PaginatedFormListSchema)
          .handler(({ input }) => this.runProcedure('forms.listPage', () => this.listFormsPage.execute(input))),
        get: staffOrAdmin
          .input(FormIdInputSchema)
          .errors(formsProcedureFormLookupErrors)
          .handler(({ input }) => this.runProcedure('forms.get', () => this.getForm.execute(input))),
        update: adminOnly
          .input(UpdateFormInputSchema)
          .errors(formsProcedureFormLookupErrors)
          .handler(({ input }) => this.runProcedure('forms.update', () => this.updateForm.execute(input))),
        delete: adminOnly.input(FormIdInputSchema).handler(({ input }) =>
          this.runProcedure('forms.delete', () => this.deleteForm.execute(input)),
        ),
        search: adminOnly.input(SearchFormsInputSchema).handler(({ input }) =>
          this.runProcedure('forms.search', () => this.searchForms.execute(input)),
        ),
        active: staffOrAdmin.handler(() => this.runProcedure('forms.active', () => this.getActiveForms.execute())),
        submit: staffOrAdmin
          .input(SubmitFormInputSchema)
          .errors(formsProcedureFormLookupErrors)
          .handler(({ input }) => this.runProcedure('forms.submit', () => this.submitForm.execute(input))),
      },
      submissions: {
        list: staffOrAdmin.handler(() => this.runProcedure('submissions.list', () => this.listSubmissions.execute())),
      },
    };
  }
}

export type AppRouter = ReturnType<FormsRouterFactory['create']>;
