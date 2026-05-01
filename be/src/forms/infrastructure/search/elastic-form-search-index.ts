import { Injectable } from '@nestjs/common';
import type { FormSearchIndex } from '../../application/ports/form.search-index';
import type { FormSnapshot } from '../../domain/form-snapshot';

export type ElasticFormClient = {
  index(args: ElasticIndexRequest): Promise<ElasticWriteResult>;
  delete(args: ElasticDeleteRequest): Promise<ElasticWriteResult>;
  search<T>(args: ElasticSearchRequest): Promise<ElasticSearchResponse<T>>;
};

interface FormSearchDocument {
  id: string;
  title: string;
  description: string;
  status: string;
  order: number;
  fieldLabels: string[];
}

export interface ElasticIndexRequest {
  index: string;
  id: string;
  document: FormSearchDocument;
}

export interface ElasticDeleteRequest {
  index: string;
  id: string;
}

export interface ElasticSearchRequest {
  index: string;
  query: {
    multi_match: {
      query: string;
      fields: string[];
    };
  };
}

export interface ElasticWriteResult {
  result?: string;
}

export interface ElasticSearchResponse<T> {
  hits: {
    hits: Array<{
      _id?: string;
      _source?: T;
    }>;
  };
}

@Injectable()
export class ElasticFormSearchIndex implements FormSearchIndex {
  private readonly indexName = 'forms';

  constructor(private readonly client: ElasticFormClient) {}

  async index(snapshot: FormSnapshot): Promise<void> {
    const document: FormSearchDocument = {
      id: snapshot.id,
      title: snapshot.title,
      description: snapshot.description,
      status: snapshot.status,
      order: snapshot.order,
      fieldLabels: snapshot.fields.map((field) => field.label),
    };

    await this.client.index({
      index: this.indexName,
      id: snapshot.id,
      document,
    });
  }

  async remove(id: string): Promise<void> {
    try {
      await this.client.delete({
        index: this.indexName,
        id,
      });
    } catch (error) {
      const statusCode = (error as { meta?: { statusCode?: number }; statusCode?: number } | null | undefined)?.meta
        ?.statusCode ?? (error as { statusCode?: number } | null | undefined)?.statusCode;

      // Elasticsearch returns 404 when the document doesn't exist. Deleting a form should be idempotent.
      if (statusCode === 404) {
        return;
      }

      throw error;
    }
  }

  async search(query: string): Promise<string[]> {
    const response = await this.client.search<FormSearchDocument>({
      index: this.indexName,
      query: {
        multi_match: {
          query,
          fields: ['title^2', 'description', 'fieldLabels'],
        },
      },
    });

    return response.hits.hits.map((hit) => hit._id).filter((id): id is string => Boolean(id));
  }
}
