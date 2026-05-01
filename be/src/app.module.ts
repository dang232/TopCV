import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { FormsModule } from './forms/forms.module';
import { HealthModule } from './health/health.module';
import { ExternalClientsModule } from './infra/external-clients.module';
import { FormEntitySchema } from './forms/infrastructure/persistence/form.entity';
import { SubmissionEntitySchema } from './forms/infrastructure/persistence/submission.entity';

@Module({
  imports: [
    DatabaseModule.forRoot([FormEntitySchema, SubmissionEntitySchema]),
    ExternalClientsModule,
    FormsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
