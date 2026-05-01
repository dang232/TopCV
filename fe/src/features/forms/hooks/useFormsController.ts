'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  CreateFormInputSchema,
  FieldType,
  FormStatus,
  submissionAnswerKey,
  type FormDto,
  type PaginatedFormList,
  type UpdateFormInput,
  type SubmissionDto,
} from '@topcv/shared';

import { formsApi } from '../api/formsApi';
import type { FormsRepository } from '../repository/formsRepository';
import { buildDraftFieldFromDraft, parseSelectOptions } from '../model/draftField';
import type { CreateFormDraft } from '../model/draftTypes';
import { useFormsControllerInternals } from './useFormsController.internals';

export type FormsControllerState = {
  forms: FormDto[];
  adminListPage: number;
  adminListPageSize: number;
  adminListTotal: number;
  draft: CreateFormDraft;
  answers: Record<string, string>;
  submissions: SubmissionDto[];
  isSubmitting: boolean;
  message: string;
  error: string;
};

export type FormsControllerActions = {
  setDraft(draft: CreateFormDraft): void;
  setAnswer(key: string, value: string): void;
  refreshForms(): Promise<void>;
  setMode(mode: 'admin' | 'staff'): Promise<void>;
  adminNextPage(): Promise<void>;
  adminPrevPage(): Promise<void>;
  createForm(): Promise<void>;
  deleteForm(id: string): Promise<void>;
  updateForm(input: UpdateFormInput): Promise<void>;
  toggleStatus(form: FormDto): Promise<void>;
  search(query: string): Promise<void>;
  loadActive(): Promise<void>;
  loadSubmissions(): Promise<void>;
  submitResponse(form: FormDto): Promise<void>;
};

export type UseFormsControllerResult = FormsControllerState & FormsControllerActions;

export function useFormsController(init: {
  repo?: FormsRepository;
  emptyDraft: CreateFormDraft;
}): UseFormsControllerResult {
  const api = init.repo ?? formsApi;

  const [forms, setForms] = useState<FormDto[]>([]);
  const [adminListPage, setAdminListPage] = useState(1);
  const [adminListPageSize] = useState(10);
  const [adminListTotal, setAdminListTotal] = useState(0);
  const [draft, setDraft] = useState<CreateFormDraft>(init.emptyDraft);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const infraHint = useMemo(
    () =>
      'Check Docker (`pnpm services:up`), `NEXT_PUBLIC_API_BASE_URL` (REST `/api/v1`), CORS `FRONTEND_ORIGIN`, and Nest logs.',
    [],
  );

  const { clearNotices, runApi, runApiResult } = useFormsControllerInternals({
    setMessage,
    setError,
    infraHint,
  });

  const formsRequestId = useRef(0);
  const currentModeRef = useRef<'admin' | 'staff'>('staff');
  const lastLoadedModeRef = useRef<'admin' | 'staff' | null>(null);
  const lastAdminListPageRef = useRef(1);
  const submitInFlightRef = useRef(false);

  const setFormsFrom = useCallback(
    async (getter: () => Promise<FormDto[]>) => {
      const requestId = (formsRequestId.current += 1);
      const nextForms = await getter();
      if (formsRequestId.current === requestId) {
        setForms(nextForms);
      }
      return nextForms;
    },
    [setForms],
  );

  const setFormsFromPage = useCallback(
    async (getter: () => Promise<PaginatedFormList>) => {
      const requestId = (formsRequestId.current += 1);
      const pageResult = await getter();
      if (formsRequestId.current === requestId) {
        setAdminListTotal(pageResult.total);
        setAdminListPage(pageResult.page);
        lastAdminListPageRef.current = pageResult.page;
        setForms(pageResult.items);
      }
      return pageResult;
    },
    [setForms],
  );

  const loadAdminPage = useCallback(
    async (page: number) => {
      await runApi(() => setFormsFromPage(() => api.listPage({ page, pageSize: adminListPageSize })));
    },
    [adminListPageSize, api, runApi, setFormsFromPage],
  );

  const loadActive = useCallback(async () => {
    await runApi(() => setFormsFrom(() => api.active()));
  }, [api, runApi, setFormsFrom]);

  const loadSubmissions = useCallback(async () => {
    const next = await runApiResult(() => api.listSubmissions());
    if (!next) return;
    setSubmissions(next);
  }, [api, runApiResult]);

  const refreshForms = useCallback(async () => {
    if (currentModeRef.current === 'admin') {
      await loadAdminPage(lastAdminListPageRef.current);
      return;
    }
    await loadActive();
  }, [loadActive, loadAdminPage]);

  const setMode = useCallback(
    async (mode: 'admin' | 'staff') => {
      currentModeRef.current = mode;
      if (lastLoadedModeRef.current === mode) return;
      lastLoadedModeRef.current = mode;
      if (mode === 'admin') {
        lastAdminListPageRef.current = 1;
        await loadAdminPage(1);
        return;
      }
      // Staff view is centered around filling forms and validating submissions persisted across refreshes.
      await Promise.all([refreshForms(), loadSubmissions()]);
    },
    [loadAdminPage, loadSubmissions, refreshForms],
  );

  const adminNextPage = useCallback(async () => {
    if (currentModeRef.current !== 'admin') return;
    const totalPages = Math.max(1, Math.ceil(adminListTotal / adminListPageSize));
    const next = Math.min(lastAdminListPageRef.current + 1, totalPages);
    if (next === lastAdminListPageRef.current) return;
    await loadAdminPage(next);
  }, [adminListPageSize, adminListTotal, loadAdminPage]);

  const adminPrevPage = useCallback(async () => {
    if (currentModeRef.current !== 'admin') return;
    const next = Math.max(1, lastAdminListPageRef.current - 1);
    if (next === lastAdminListPageRef.current) return;
    await loadAdminPage(next);
  }, [loadAdminPage]);

  const createForm = useCallback(async () => {
    clearNotices();

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

    const createdOk = await runApi(() => api.create(parsed.data));
    if (!createdOk) {
      return;
    }

    if (currentModeRef.current === 'admin') {
      lastAdminListPageRef.current = 1;
    }
    await refreshForms();
    setDraft(init.emptyDraft);
    setMessage('Form created');
  }, [api, clearNotices, draft, forms.length, init.emptyDraft, refreshForms, runApi]);

  const deleteForm = useCallback(
    async (id: string) => {
      const deletedOk = await runApi(() => api.delete({ id }));
      if (deletedOk) {
        await refreshForms();
      }
    },
    [api, refreshForms, runApi],
  );

  const updateForm = useCallback(
    async (input: UpdateFormInput) => {
      clearNotices();
      const updatedOk = await runApi(() => api.update(input));
      if (updatedOk) {
        await refreshForms();
        setMessage('Form updated');
      }
    },
    [api, clearNotices, refreshForms, runApi],
  );

  const toggleStatus = useCallback(
    async (form: FormDto) => {
      clearNotices();
      const updatedOk = await runApi(() =>
        api.update({
          id: form.id,
          status: form.status === FormStatus.Active ? FormStatus.Draft : FormStatus.Active,
        }),
      );
      if (updatedOk) {
        await refreshForms();
        setMessage('Form status updated');
      }
    },
    [api, clearNotices, refreshForms, runApi],
  );

  const search = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        await refreshForms();
        return;
      }
      await runApi(() => setFormsFrom(() => api.search({ query })));
    },
    [api, refreshForms, runApi, setFormsFrom],
  );

  const submitResponse = useCallback(
    async (form: FormDto) => {
      if (submitInFlightRef.current) return;
      clearNotices();
      submitInFlightRef.current = true;
      setIsSubmitting(true);

      const formAnswers = Object.fromEntries(
        form.fields.map((field) => {
          const key = submissionAnswerKey(field);
          const raw = answers[key] ?? '';
          return [key, raw] as const;
        }),
      );

      try {
        const submitted = await runApiResult(() => api.submit({ formId: form.id, answers: formAnswers }));
        if (!submitted) {
          return;
        }
        setMessage('Response submitted');

        // Keep the UI consistent immediately after submit; persistence is verified on next reload via listSubmissions().
        setSubmissions((current) => [submitted, ...current]);
      } finally {
        submitInFlightRef.current = false;
        setIsSubmitting(false);
      }
    },
    [api, answers, clearNotices, runApiResult],
  );

  return {
    forms,
    adminListPage,
    adminListPageSize,
    adminListTotal,
    draft,
    answers,
    submissions,
    isSubmitting,
    message,
    error,
    setDraft,
    setAnswer: (key, value) =>
      setAnswers((current) => {
        if (current[key] === value) return current;
        return { ...current, [key]: value };
      }),
    refreshForms,
    setMode,
    adminNextPage,
    adminPrevPage,
    createForm,
    deleteForm,
    updateForm,
    toggleStatus,
    search,
    loadActive,
    loadSubmissions,
    submitResponse,
  };
}

