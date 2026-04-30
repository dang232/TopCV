import { Module } from '@nestjs/common';
import type { Client as ElasticsearchClient } from '@elastic/elasticsearch';

import { ELASTICSEARCH_CLIENT } from '../../../infra/external-clients.module';
import { FORM_SEARCH_INDEX } from '../../application/ports/form.search-index';
import { ElasticFormSearchIndex } from './elastic-form-search-index';

@Module({
  providers: [
    {
      provide: FORM_SEARCH_INDEX,
      inject: [ELASTICSEARCH_CLIENT],
      useFactory: (client: ElasticsearchClient) => new ElasticFormSearchIndex(client),
    },
  ],
  exports: [FORM_SEARCH_INDEX],
})
export class FormsSearchModule {}
