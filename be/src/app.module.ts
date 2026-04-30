import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { FormsModule } from './forms/forms.module';
import { HealthModule } from './health/health.module';
import { ExternalClientsModule } from './infra/external-clients.module';

@Module({
  imports: [DatabaseModule, ExternalClientsModule, FormsModule, HealthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
