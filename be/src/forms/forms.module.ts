import { Module } from '@nestjs/common';

import { CreateFormUseCase } from './application/forms/create-form.use-case';
import { DeleteFormUseCase } from './application/forms/delete-form.use-case';
import { GetActiveFormsUseCase } from './application/forms/get-active-forms.use-case';
import { GetFormUseCase } from './application/forms/get-form.use-case';
import { ListFormsUseCase } from './application/forms/list-forms.use-case';
import { SearchFormsUseCase } from './application/forms/search-forms.use-case';
import { UpdateFormUseCase } from './application/forms/update-form.use-case';
import { ListSubmissionsUseCase } from './application/submissions/list-submissions.use-case';
import { SubmitFormUseCase } from './application/submissions/submit-form.use-case';
import { FormsCacheModule } from './infrastructure/cache/forms-cache.module';
import { FormsPersistenceModule } from './infrastructure/persistence/forms-persistence.module';
import { FormsSearchModule } from './infrastructure/search/forms-search.module';
import { FormsRouterFactory } from './interface/forms.router';
import { OrpcController } from './interface/orpc.controller';

@Module({
  imports: [FormsPersistenceModule, FormsCacheModule, FormsSearchModule],
  controllers: [OrpcController],
  providers: [
    CreateFormUseCase,
    ListFormsUseCase,
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
