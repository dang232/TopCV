'use client';

import { FormEvent, useState } from 'react';
import {
  CreateFormInputSchema,
  FieldType,
  FormStatus,
  submissionAnswerKey,
  type FormDto,
  type SubmissionDto,
} from '@topcv/shared';

import { ApiRpcFailure } from '@/src/lib/rpcError';
import { CreateFormPanel } from './CreateFormPanel';
import { FormsListPanel } from './FormsListPanel';
import { formsApi, type FormsApi } from './formsApi';
import { buildDraftFieldFromDraft, parseSelectOptions, type CreateFormDraft } from './formTypes';

interface FormsPageClientProps {
  api?: FormsApi;
}

const emptyDraft: CreateFormDraft = {
  title: '',
  description: '',
  status: FormStatus.Draft,
  fieldLabel: '',
  fieldType: FieldType.Text,
  selectOptions: '',
  required: true,
  fields: [],
};

export function FormsPageClient({ api = formsApi }: FormsPageClientProps) {
  const [forms, setForms] = useState<FormDto[]>([]);
  const [draft, setDraft] = useState<CreateFormDraft>(emptyDraft);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);

  const infraHint =
    'Check Docker (`pnpm services:up`), `NEXT_PUBLIC_ORPC_URL`, CORS `FRONTEND_ORIGIN`, and Nest logs.';

  function showFailure(cause: unknown) {
    const failure = ApiRpcFailure.parse(cause);
    setError(`${failure.message}${failure.suggestsInfrastructureHint() ? `. ${infraHint}` : ''}`);
  }

  async function refreshForms() {
    setForms(await api.list());
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');

    const draftFields = draft.fields.length > 0 ? draft.fields : [buildDraftFieldFromDraft(draft)];

    const input = {
      title: draft.title,
      description: draft.description,
      order: forms.length,
      status: draft.status,
      fields: draftFields.map((field, index) => ({
        label: field.label,
        type: field.type,
        order: index,
        required: field.required,
        ...(field.type === FieldType.Select ? { options: field.options ?? parseSelectOptions(draft.selectOptions) } : {}),
      })),
    };
    const parsed = CreateFormInputSchema.safeParse(input);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid form input');
      return;
    }

    try {
      await api.create(parsed.data);
    } catch (cause: unknown) {
      showFailure(cause);
      return;
    }

    await refreshForms();
    setDraft(emptyDraft);
    setMessage('Form created');
  }

  async function handleDelete(id: string) {
    await api.delete({ id });
    await refreshForms();
  }

  async function handleToggleStatus(form: FormDto) {
    await api.update({
      id: form.id,
      status: form.status === FormStatus.Active ? FormStatus.Draft : FormStatus.Active,
    });
    await refreshForms();
  }

  async function handleSearch(query: string) {
    if (!query.trim()) {
      await refreshForms();
      return;
    }

    setForms(await api.search({ query }));
  }

  async function handleLoadActive() {
    setForms(await api.active());
  }

  async function handleLoadSubmissions() {
    setSubmissions(await api.listSubmissions());
  }

  async function handleSubmit(form: FormDto) {
    setMessage('');
    setError('');

    const formAnswers = Object.fromEntries(
      form.fields.map((field) => {
        const key = submissionAnswerKey(field);
        const raw = answers[key] ?? '';
        const value = field.type === 'number' ? Number(raw) : raw;

        return [key, value];
      }),
    );

    try {
      await api.submit({ formId: form.id, answers: formAnswers });
    } catch (cause: unknown) {
      showFailure(cause);
      return;
    }

    setMessage('Response submitted');
    await handleLoadSubmissions();
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-950">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[420px_1fr]">
        <CreateFormPanel draft={draft} error={error} message={message} onDraftChange={setDraft} onSubmit={handleCreate} />
        <FormsListPanel
          answers={answers}
          forms={forms}
          submissions={submissions}
          onAnswerChange={(key, value) => setAnswers((current) => ({ ...current, [key]: value }))}
          onDelete={(id) => void handleDelete(id)}
          onLoadActive={() => void handleLoadActive()}
          onLoadSubmissions={() => void handleLoadSubmissions()}
          onRefresh={() => void refreshForms()}
          onSearch={(query) => void handleSearch(query)}
          onSubmit={(form) => void handleSubmit(form)}
          onToggleStatus={(form) => void handleToggleStatus(form)}
        />
      </div>
    </main>
  );
}

export type { FormsApi };
