'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FieldType, FormStatus } from '@topcv/shared';

import { hasRole, RequireAuth, useAuth } from '@/src/shared/auth';
import { FormsListPanel } from '@/src/features/forms/ui/FormsListPanel';
import { useFormsController } from '@/src/features/forms/hooks/useFormsController';
import type { CreateFormDraft } from '@/src/features/forms/model/draftTypes';
import { WorkspaceShell } from '@/src/components/layout/WorkspaceShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { cn } from '@/src/lib/utils';

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

  const totalForms = controller.forms.length;
  const activeForms = controller.forms.filter((form) => form.status === FormStatus.Active).length;
  const draftForms = controller.forms.filter((form) => form.status === FormStatus.Draft).length;
  const totalSubmissions = controller.submissions.length;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Forms</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Form Management Portal</h1>
          <p className="mt-2 text-muted-foreground">Manage and organize your real data collection forms.</p>
        </div>
        <div className="flex gap-3">
          <Link
            className={cn(
              'inline-flex h-10 items-center justify-center rounded-lg border border-input bg-background px-4 text-sm font-medium transition-colors',
              'hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            )}
            href="/forms"
          >
            Open forms workspace
          </Link>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total forms</CardDescription>
            <CardTitle className="text-2xl">{totalForms}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Badge variant="secondary">All statuses</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-2xl">{activeForms}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Badge>Live</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Draft</CardDescription>
            <CardTitle className="text-2xl">{draftForms}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Badge variant="outline">Hidden from staff</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Submissions</CardDescription>
            <CardTitle className="text-2xl">{totalSubmissions}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Badge variant="secondary">Loaded in this session</Badge>
          </CardContent>
        </Card>
      </section>

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

  const availableForms = controller.forms.filter((form) => form.status === FormStatus.Active);
  const totalAvailable = availableForms.length;
  const mySubmissions = controller.submissions.length;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Employee Portal</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Available Forms</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Access and complete required documentation, requests, and submissions. Select a form below to begin a new entry.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active forms</CardDescription>
            <CardTitle className="text-2xl">{totalAvailable}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Badge>Ready</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>My submissions</CardDescription>
            <CardTitle className="text-2xl">{mySubmissions}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Badge variant="secondary">Loaded in this session</Badge>
          </CardContent>
        </Card>
      </section>

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
        <Link
          className={cn(
            'inline-flex h-10 items-center justify-center rounded-lg border border-input bg-background px-4 text-sm font-medium transition-colors',
            'hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          )}
          href="/forms"
        >
          Open forms page
        </Link>
      </div>
    </div>
  );
}

export function DashboardPageClient() {
  const { roles } = useAuth();

  const isAdmin = hasRole(roles, 'ADMIN');
  const isStaff = hasRole(roles, 'STAFF');

  return (
    <RequireAuth>
      <WorkspaceShell>
        <div className="mx-auto w-full max-w-6xl px-4 py-8 text-foreground sm:px-6 sm:py-10">
          {isAdmin ? <AdminDashboard /> : isStaff ? <StaffDashboard /> : <NoRole />}
        </div>
      </WorkspaceShell>
    </RequireAuth>
  );
}

function NoRole() {
  return (
    <section className="rounded-xl border border-border bg-card p-8 text-card-foreground shadow-sm">
      <h1 className="text-2xl font-semibold tracking-tight">403</h1>
      <p className="mt-2 text-muted-foreground">You’re signed in, but your account is missing the required role for this dashboard.</p>
      <Link
        className={cn(
          'mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors',
          'hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
        href="/403"
      >
        View details
      </Link>
    </section>
  );
}

