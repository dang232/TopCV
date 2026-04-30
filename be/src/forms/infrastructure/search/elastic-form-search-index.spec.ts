import { describe, expect, it } from 'vitest';

import { FieldType } from '../../domain/field-type';
import { DynamicForm } from '../../domain/form.aggregate';
import { FormStatus } from '../../domain/form-status';
import { ElasticFormSearchIndex, type ElasticFormClient, type ElasticIndexRequest } from './elastic-form-search-index';

describe('ElasticFormSearchIndex', () => {
  it('indexes a form document with searchable form and field text', async () => {
    const indexed: ElasticIndexRequest[] = [];
    const client: ElasticFormClient = {
      index: async (args) => {
        indexed.push(args);
        return {};
      },
      delete: async () => ({}),
      search: async () => ({ hits: { hits: [] } }),
    };
    const search = new ElasticFormSearchIndex(client);
    const form = DynamicForm.create('form-1', {
      title: 'Onboarding',
      description: 'Collect employee data',
      order: 1,
      status: FormStatus.Active,
      fields: [{ id: 'name', label: 'Employee name', type: FieldType.Text, order: 0, required: true }],
    });

    await search.index(form);

    expect(indexed).toEqual([
      {
        index: 'forms',
        id: 'form-1',
        document: {
          id: 'form-1',
          title: 'Onboarding',
          description: 'Collect employee data',
          status: 'active',
          order: 1,
          fieldLabels: ['Employee name'],
        },
      },
    ]);
  });

  it('returns ids from Elasticsearch hits in ranked order', async () => {
    const client: ElasticFormClient = {
      index: async () => ({}),
      delete: async () => ({}),
      search: async () => ({
        hits: {
          hits: [{ _id: 'form-1' }, { _id: 'form-2' }],
        },
      }),
    };
    const search = new ElasticFormSearchIndex(client);

    await expect(search.search('employee')).resolves.toEqual(['form-1', 'form-2']);
  });
});
