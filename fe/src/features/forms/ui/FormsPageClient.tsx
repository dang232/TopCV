'use client';

import { useEffect, useState } from 'react';
import type React from 'react';
import { FieldType, FormStatus } from '@topcv/shared';

import { CreateFormPanel } from './CreateFormPanel';
import { FormsListPanel } from './FormsListPanel';
import { useFormsController } from '../hooks/useFormsController';
import type { CreateFormDraft } from '../model/draftTypes';
import { formsApi } from '../api/formsApi';
import type { FormsRepository } from '../repository/formsRepository';
import { hasRole, useAuth } from '@/src/shared/auth';
import { Button } from '@/src/components/ui/button';

interface FormsPageClientProps {
  repo?: FormsRepository;
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

export function FormsPageClient({ repo = formsApi }: FormsPageClientProps) {
  const { roles } = useAuth();
  const isAdmin = hasRole(roles, 'ADMIN');
  const [mode, setMode] = useState<'staff' | 'admin'>('staff');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const controller = useFormsController({ repo, emptyDraft });
  const effectiveMode: 'staff' | 'admin' = isAdmin ? mode : 'staff';

  useEffect(() => {
    void controller.setMode('staff');
    // Intentionally one-time mount load; avoid state-driven re-fetch loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCreate(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    void controller.createForm();
  }

  return (
    <div className="bg-background px-4 py-8 text-foreground sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Dynamic Forms</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Staff fills active forms in order. Admin manages forms and fields.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={effectiveMode === 'staff' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setMode('staff');
                void controller.setMode('staff');
              }}
            >
              Staff view
            </Button>
            {isAdmin ? (
              <Button
                variant={effectiveMode === 'admin' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setMode('admin');
                  void controller.setMode('admin');
                }}
              >
                Admin view
              </Button>
            ) : null}
          </div>
        </header>

        <div className={`mt-8 grid gap-8 ${effectiveMode === 'admin' ? 'lg:grid-cols-[420px_1fr]' : ''}`}>
          {effectiveMode === 'admin' ? (
            <CreateFormPanel
              draft={controller.draft}
              error={controller.error}
              message={controller.message}
              onDraftChange={controller.setDraft}
              onSubmit={handleCreate}
            />
          ) : null}

          <FormsListPanel
            mode={effectiveMode}
            isAdminSearchMode={effectiveMode === 'admin' && adminSearchQuery.trim().length > 0}
            answers={controller.answers}
            forms={controller.forms}
            isSubmitting={controller.isSubmitting}
            page={effectiveMode === 'admin' ? controller.adminListPage : undefined}
            pageSize={effectiveMode === 'admin' ? controller.adminListPageSize : undefined}
            total={effectiveMode === 'admin' ? controller.adminListTotal : undefined}
            onPrevPage={() => void controller.adminPrevPage()}
            onNextPage={() => void controller.adminNextPage()}
            submissions={controller.submissions}
            onAnswerChange={controller.setAnswer}
            onDelete={(id) => void controller.deleteForm(id)}
            onLoadActive={() => void controller.loadActive()}
            onLoadSubmissions={() => void controller.loadSubmissions()}
            onRefresh={() => void controller.refreshForms()}
            onSearch={(query) => {
              setAdminSearchQuery(query);
              void controller.search(query);
            }}
            onSubmit={(form) => void controller.submitResponse(form)}
            onToggleStatus={(form) => void controller.toggleStatus(form)}
            onUpdateForm={(input) => void controller.updateForm(input)}
          />
        </div>
      </div>
    </div>
  );
}

export type { FormsRepository };

