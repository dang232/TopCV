import { Module } from '@nestjs/common';

import { CreateFormUseCase } from './application/forms/create-form.use-case';
import { DeleteFormUseCase } from './application/forms/delete-form.use-case';
import { GetActiveFormsUseCase } from './application/forms/get-active-forms.use-case';
import { GetFormUseCase } from './application/forms/get-form.use-case';
import { ListFormsUseCase } from './application/forms/list-forms.use-case';
import { ListFormsPageUseCase } from './application/forms/list-forms-page.use-case';
import { SearchFormsUseCase } from './application/forms/search-forms.use-case';
import { UpdateFormUseCase } from './application/forms/update-form.use-case';
import { ListSubmissionsUseCase } from './application/submissions/list-submissions.use-case';
import { SubmitFormUseCase } from './application/submissions/submit-form.use-case';
import { FormsCacheModule } from './infrastructure/cache/forms-cache.module';
import { FormsPersistenceModule } from './infrastructure/persistence/forms-persistence.module';
import { FormsSearchModule } from './infrastructure/search/forms-search.module';
import { FormsRouterFactory } from './interface/forms.router';
import { FormsV1RestController } from './interface/forms-v1.rest.controller';
import { OrpcController } from './interface/orpc.controller';
import { SubmissionsV1RestController } from './interface/submissions-v1.rest.controller';
import { AuthModule } from '../auth/auth.module';

const orpcPublicControllers = (process.env.ORPC_PUBLIC_ENABLED ?? '').toLowerCase() === 'true' ? [OrpcController] : [];

@Module({
  imports: [FormsPersistenceModule, FormsCacheModule, FormsSearchModule, AuthModule],
  controllers: [FormsV1RestController, SubmissionsV1RestController, ...orpcPublicControllers],
  providers: [
    CreateFormUseCase,
    ListFormsUseCase,
    ListFormsPageUseCase,
    GetFormUseCase,
    UpdateFormUseCase,
    DeleteFormUseCase,
    SearchFormsUseCase,
    GetActiveFormsUseCase,
    SubmitFormUseCase,
    ListSubmissionsUseCase,
    FormsRouterFactory,
  ],
})
export class FormsModule {}
