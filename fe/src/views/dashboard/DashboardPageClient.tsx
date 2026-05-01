'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FieldType, FormStatus } from '@topcv/shared';

import { hasRole, RequireAuth, useAuth } from '@/src/shared/auth';
import { FormsListPanel } from '@/src/features/forms/ui/FormsListPanel';
import { useFormsController } from '@/src/features/forms/hooks/useFormsController';
import type { CreateFormDraft } from '@/src/features/forms/model/draftTypes';

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

function AdminDashboard() {
  const controller = useFormsController({ emptyDraft });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    void controller.setMode('admin');
    // Intentionally one-time mount load; avoid state-driven re-fetch loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Forms</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">Form Management Portal</h1>
          <p className="mt-2 text-zinc-600">Manage and organize your real data collection forms.</p>
        </div>
        <div className="flex gap-3">
          <Link
            className="inline-flex rounded-xl border border-zinc-200 bg-white px-4 py-2 font-medium text-zinc-900 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
            href="/forms"
          >
            Open forms workspace
          </Link>
        </div>
      </header>

      <FormsListPanel
        mode="admin"
        isAdminSearchMode={searchQuery.trim().length > 0}
        answers={controller.answers}
        forms={controller.forms}
        isSubmitting={controller.isSubmitting}
        page={controller.adminListPage}
        pageSize={controller.adminListPageSize}
        total={controller.adminListTotal}
        onPrevPage={() => void controller.adminPrevPage()}
        onNextPage={() => void controller.adminNextPage()}
        submissions={controller.submissions}
        onAnswerChange={controller.setAnswer}
        onDelete={(id) => void controller.deleteForm(id)}
        onLoadActive={() => void controller.loadActive()}
        onLoadSubmissions={() => void controller.loadSubmissions()}
        onRefresh={() => void controller.refreshForms()}
        onSearch={(query) => {
          setSearchQuery(query);
          void controller.search(query);
        }}
        onSubmit={(form) => void controller.submitResponse(form)}
        onToggleStatus={(form) => void controller.toggleStatus(form)}
        onUpdateForm={(input) => void controller.updateForm(input)}
      />
    </div>
  );
}

function StaffDashboard() {
  const controller = useFormsController({ emptyDraft });

  useEffect(() => {
    void controller.setMode('staff');
    // Intentionally one-time mount load; avoid state-driven re-fetch loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Employee Portal</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">Available Forms</h1>
        <p className="mt-2 max-w-3xl text-zinc-600">
          Access and complete required documentation, requests, and submissions. Select a form below to begin a new entry.
        </p>
      </header>

      <FormsListPanel
        mode="staff"
        answers={controller.answers}
        forms={controller.forms}
        isSubmitting={controller.isSubmitting}
        submissions={controller.submissions}
        onAnswerChange={controller.setAnswer}
        onDelete={() => {}}
        onLoadActive={() => void controller.loadActive()}
        onLoadSubmissions={() => void controller.loadSubmissions()}
        onRefresh={() => void controller.refreshForms()}
        onSearch={() => {}}
        onSubmit={(form) => void controller.submitResponse(form)}
        onToggleStatus={() => {}}
        onUpdateForm={() => {}}
      />

      <div className="flex justify-end">
        <Link className="inline-flex rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900" href="/forms">
          Open forms page
        </Link>
      </div>
    </div>
  );
}

export function DashboardPageClient() {
  const { roles, logout } = useAuth();

  const isAdmin = hasRole(roles, 'ADMIN');
  const isStaff = hasRole(roles, 'STAFF');

  return (
    <RequireAuth>
      <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-950">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-end">
          <button
            type="button"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
          >
            Logout
          </button>
        </div>

        <div className="mx-auto w-full max-w-6xl pt-6">
          {isAdmin ? <AdminDashboard /> : isStaff ? <StaffDashboard /> : <NoRole />}
        </div>
      </main>
    </RequireAuth>
  );
}

function NoRole() {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold tracking-tight">403</h1>
      <p className="mt-2 text-zinc-600">You’re signed in, but your account is missing the required role for this dashboard.</p>
      <Link className="mt-6 inline-flex rounded-xl bg-zinc-950 px-4 py-2 font-medium text-white" href="/403">
        View details
      </Link>
    </section>
  );
}

