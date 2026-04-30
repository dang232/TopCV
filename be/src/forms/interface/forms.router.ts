import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CreateFormInputSchema,
  FormIdInputSchema,
  SearchFormsInputSchema,
  SubmitFormInputSchema,
  UpdateFormInputSchema,
  formsProcedureFormLookupErrors,
} from '@topcv/shared/forms';
import { os } from '@orpc/server';

import { CreateFormUseCase } from '../application/forms/create-form.use-case';
import { DeleteFormUseCase } from '../application/forms/delete-form.use-case';
import { GetActiveFormsUseCase } from '../application/forms/get-active-forms.use-case';
import { GetFormUseCase } from '../application/forms/get-form.use-case';
import { ListFormsUseCase } from '../application/forms/list-forms.use-case';
import { SearchFormsUseCase } from '../application/forms/search-forms.use-case';
import { UpdateFormUseCase } from '../application/forms/update-form.use-case';
import { ListSubmissionsUseCase } from '../application/submissions/list-submissions.use-case';
import { SubmitFormUseCase } from '../application/submissions/submit-form.use-case';
import { mapFormsFailureToOrpc, mapUnhandledFormsProcedureFailure } from './forms-orpc-error.mapper';

@Injectable()
export class FormsRouterFactory {
  private readonly logger = new Logger(FormsRouterFactory.name);

  constructor(
    @Inject(CreateFormUseCase) private readonly createForm: CreateFormUseCase,
    @Inject(ListFormsUseCase) private readonly listForms: ListFormsUseCase,
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
    return {
      forms: {
        create: os.input(CreateFormInputSchema).handler(({ input }) =>
          this.runProcedure('forms.create', () => this.createForm.execute(input)),
        ),
        list: os.handler(() => this.runProcedure('forms.list', () => this.listForms.execute())),
        get: os
          .input(FormIdInputSchema)
          .errors(formsProcedureFormLookupErrors)
          .handler(({ input }) => this.runProcedure('forms.get', () => this.getForm.execute(input))),
        update: os
          .input(UpdateFormInputSchema)
          .errors(formsProcedureFormLookupErrors)
          .handler(({ input }) => this.runProcedure('forms.update', () => this.updateForm.execute(input))),
        delete: os.input(FormIdInputSchema).handler(({ input }) =>
          this.runProcedure('forms.delete', () => this.deleteForm.execute(input)),
        ),
        search: os.input(SearchFormsInputSchema).handler(({ input }) =>
          this.runProcedure('forms.search', () => this.searchForms.execute(input)),
        ),
        active: os.handler(() => this.runProcedure('forms.active', () => this.getActiveForms.execute())),
        submit: os
          .input(SubmitFormInputSchema)
          .errors(formsProcedureFormLookupErrors)
          .handler(({ input }) => this.runProcedure('forms.submit', () => this.submitForm.execute(input))),
      },
      submissions: {
        list: os.handler(() => this.runProcedure('submissions.list', () => this.listSubmissions.execute())),
      },
    };
  }
}

export type AppRouter = ReturnType<FormsRouterFactory['create']>;
