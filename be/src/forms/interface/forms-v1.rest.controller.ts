import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  CreateFormInputSchema,
  FormFieldSchema,
  FormIdInputSchema,
  PaginationInputSchema,
  SearchFormsInputSchema,
  SubmitFormInputSchema,
  UpdateFormInputSchema,
} from '@topcv/shared/forms';

import { AuthenticatedGuard } from '../../auth/authenticated.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { Role } from '../../auth/roles';
import { KeycloakJwtAuthGuard } from '../../auth/keycloak/keycloak-jwt.guard';
import { HTTP_API_V1_FORMS_PATH } from '../../http/api-path.constants';
import { CreateFormUseCase } from '../application/forms/create-form.use-case';
import { DeleteFormUseCase } from '../application/forms/delete-form.use-case';
import { GetActiveFormsUseCase } from '../application/forms/get-active-forms.use-case';
import { GetFormUseCase } from '../application/forms/get-form.use-case';
import { ListFormsUseCase } from '../application/forms/list-forms.use-case';
import { ListFormsPageUseCase } from '../application/forms/list-forms-page.use-case';
import { SearchFormsUseCase } from '../application/forms/search-forms.use-case';
import { UpdateFormUseCase } from '../application/forms/update-form.use-case';
import { SubmitFormUseCase } from '../application/submissions/submit-form.use-case';
import { rethrowFormsRest } from './forms-rest-error.handler';

@Controller(HTTP_API_V1_FORMS_PATH)
@UseGuards(KeycloakJwtAuthGuard, AuthenticatedGuard, RolesGuard)
export class FormsV1RestController {
  private readonly logger = new Logger(FormsV1RestController.name);

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
  ) {}

  private async run<T>(procedure: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error: unknown) {
      rethrowFormsRest(error, procedure, this.logger);
    }
  }

  @Get()
  @Roles(Role.ADMIN)
  list(): Promise<unknown> {
    return this.run('forms.rest.list', () => this.listForms.execute());
  }

  @Get('page')
  @Roles(Role.ADMIN)
  listPage(@Query('page') page: string, @Query('pageSize') pageSize: string): Promise<unknown> {
    return this.run('forms.rest.listPage', () =>
      this.listFormsPage.execute(PaginationInputSchema.parse({ page: Number(page), pageSize: Number(pageSize) })),
    );
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() body: unknown): Promise<unknown> {
    return this.run('forms.rest.create', () => this.createForm.execute(CreateFormInputSchema.parse(body)));
  }

  @Get('search')
  @Roles(Role.ADMIN)
  search(@Query('query') query: string): Promise<unknown> {
    return this.run('forms.rest.search', () => this.searchForms.execute(SearchFormsInputSchema.parse({ query })));
  }

  @Get('active')
  @Roles(Role.STAFF, Role.ADMIN)
  active(): Promise<unknown> {
    return this.run('forms.rest.active', () => this.getActiveForms.execute());
  }

  @Get(':id')
  @Roles(Role.STAFF, Role.ADMIN)
  getOne(@Param('id') id: string): Promise<unknown> {
    return this.run('forms.rest.get', () => this.getForm.execute(FormIdInputSchema.parse({ id })));
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() body: unknown): Promise<unknown> {
    return this.run('forms.rest.update', () =>
      this.updateForm.execute(UpdateFormInputSchema.parse({ ...(body as object), id })),
    );
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string): Promise<unknown> {
    return this.run('forms.rest.delete', () => this.deleteForm.execute(FormIdInputSchema.parse({ id })));
  }

  @Post(':id/fields')
  @Roles(Role.ADMIN)
  addField(@Param('id') id: string, @Body() body: unknown): Promise<unknown> {
    return this.run('forms.rest.addField', async () => {
      const parsedId = FormIdInputSchema.parse({ id });
      const field = FormFieldSchema.parse(body);
      const form = await this.getForm.execute(parsedId);
      const newId = field.id ?? randomUUID();
      const nextFields = [...form.fields, { ...field, id: newId }];
      return this.updateForm.execute({ id: parsedId.id, fields: nextFields });
    });
  }

  @Put(':id/fields/:fieldId')
  @Roles(Role.ADMIN)
  updateField(@Param('id') id: string, @Param('fieldId') fieldId: string, @Body() body: unknown): Promise<unknown> {
    return this.run('forms.rest.updateField', async () => {
      const parsedId = FormIdInputSchema.parse({ id });
      const form = await this.getForm.execute(parsedId);
      const idx = form.fields.findIndex((f) => f.id === fieldId);
      if (idx === -1) {
        throw new NotFoundException({ message: 'Field not found', code: 'FIELD_NOT_FOUND' });
      }
      const field = FormFieldSchema.parse(body);
      const merged = { ...field, id: fieldId };
      const nextFields = form.fields.map((f) => (f.id === fieldId ? merged : f));
      return this.updateForm.execute({ id: parsedId.id, fields: nextFields });
    });
  }

  @Delete(':id/fields/:fieldId')
  @Roles(Role.ADMIN)
  removeField(@Param('id') id: string, @Param('fieldId') fieldId: string): Promise<unknown> {
    return this.run('forms.rest.removeField', async () => {
      const parsedId = FormIdInputSchema.parse({ id });
      const form = await this.getForm.execute(parsedId);
      const nextFields = form.fields.filter((f) => f.id !== fieldId);
      if (nextFields.length === form.fields.length) {
        throw new NotFoundException({ message: 'Field not found', code: 'FIELD_NOT_FOUND' });
      }
      if (nextFields.length < 1) {
        throw new BadRequestException({ message: 'Form must keep at least one field', code: 'INVALID_FIELD_SET' });
      }
      return this.updateForm.execute({ id: parsedId.id, fields: nextFields });
    });
  }

  @Post(':id/submit')
  @Roles(Role.STAFF, Role.ADMIN)
  submit(@Param('id') id: string, @Body() body: unknown): Promise<unknown> {
    return this.run('forms.rest.submit', () => {
      const payload =
        typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
      return this.submitForm.execute(SubmitFormInputSchema.parse({ ...payload, formId: id }));
    });
  }
}
