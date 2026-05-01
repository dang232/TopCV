import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { FieldType, FormStatus, type SubmissionDto } from '@topcv/shared';

import type { FormsRepository } from './repository/formsRepository';
import { AuthProvider } from '@/src/shared/auth';
import { writeStoredSession } from '@/src/shared/auth/authStore';

let FormsPageClient: typeof import('./ui/FormsPageClient').FormsPageClient;

beforeAll(async () => {
  // Some modules (formsApi → api client) validate public env at import-time.
  // Ensure a sane test default so unrelated env-manipulating suites don't break this file.
  process.env.NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
  process.env.NEXT_PUBLIC_KEYCLOAK_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? 'http://localhost:8080';
  process.env.NEXT_PUBLIC_KEYCLOAK_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? 'topcv';
  process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? 'topcv-fe';

  ({ FormsPageClient } = await import('./ui/FormsPageClient'));
});

function makeApi(): FormsRepository {
  return {
    create: vi.fn(async (input) => ({
      id: 'form-1',
      ...input,
      fields: input.fields.map((field: (typeof input.fields)[number], index: number) => ({ ...field, id: `field-${index}` })),
      createdAt: '2099-01-01T00:00:00.000Z',
      updatedAt: '2099-01-01T00:00:00.000Z',
    })),
    list: vi.fn(async () => []),
    listPage: vi.fn(async () => ({ items: [], total: 0, page: 1, pageSize: 10 })),
    get: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    search: vi.fn(async () => []),
    active: vi.fn(async () => []),
    submit: vi.fn(),
    listSubmissions: vi.fn(async () => []),
  };
}

describe('FormsPageClient', () => {
  function renderWithRole(role: 'staff' | 'admin' | 'ADMIN' | 'STAFF', repo: FormsRepository) {
    writeStoredSession({ accessToken: 'token', roles: [role] });
    return render(
      <AuthProvider>
        <FormsPageClient repo={repo} />
      </AuthProvider>,
    );
  }

  it('debounces search input and refreshes when cleared', async () => {
    const api = makeApi();
    const user = userEvent.setup();

    renderWithRole('admin', api);

    await waitFor(() => expect(api.listSubmissions).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole('button', { name: /admin view/i }));
    await waitFor(() => expect(api.listPage).toHaveBeenCalled());

    // Pagination should be visible in admin mode when not searching.
    expect(screen.getByRole('button', { name: /^prev$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^next$/i })).toBeInTheDocument();

    const search = screen.getByLabelText(/search forms/i);
    await user.type(search, 'abc');

    expect(api.search).toHaveBeenCalledTimes(0);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 310));
    });
    await waitFor(() => expect(api.search).toHaveBeenCalledTimes(1));
    expect(api.search).toHaveBeenCalledWith({ query: 'abc' });

    // Search results are not paginated; pagination controls should be hidden.
    expect(screen.queryByRole('button', { name: /^prev$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^next$/i })).not.toBeInTheDocument();

    // Clear the input. Empty query should refresh admin list (listPage), not search.
    const listPageCallsBeforeClear = vi.mocked(api.listPage).mock.calls.length;
    await user.clear(search);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 310));
    });

    await waitFor(() => expect(vi.mocked(api.listPage).mock.calls.length).toBeGreaterThan(listPageCallsBeforeClear));
    expect(api.search).toHaveBeenCalledTimes(1);

    // Pagination should be restored after clearing search.
    expect(screen.getByRole('button', { name: /^prev$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^next$/i })).toBeInTheDocument();
  });

  it('creates a form through the API and refreshes the list', async () => {
    const api = makeApi();
    const user = userEvent.setup();

    renderWithRole('admin', api);

    await waitFor(() => expect(api.listSubmissions).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole('button', { name: /admin view/i }));
    await user.type(screen.getByLabelText(/title/i), 'Onboarding');
    await user.type(screen.getByLabelText(/field label/i), 'Name');
    await user.click(screen.getByRole('button', { name: /create form/i }));

    await waitFor(() => expect(api.create).toHaveBeenCalledOnce());
    expect(api.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Onboarding',
        fields: [expect.objectContaining({ label: 'Name', type: 'text' })],
      }),
    );
    await waitFor(() => expect(api.listPage).toHaveBeenCalled());
    expect(await screen.findByText(/form created/i)).toBeInTheDocument();
  });

  it('shows a validation message for a select field without options', async () => {
    const api = makeApi();
    const user = userEvent.setup();

    renderWithRole('admin', api);

    await waitFor(() => expect(api.listSubmissions).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole('button', { name: /admin view/i }));
    await user.type(screen.getByLabelText(/title/i), 'Invalid');
    await user.type(screen.getByLabelText(/field label/i), 'Department');
    await user.selectOptions(screen.getByLabelText(/field type/i), 'select');
    await user.click(screen.getByRole('button', { name: /create form/i }));

    expect(await screen.findByText(/option/i)).toBeInTheDocument();
    expect(api.create).not.toHaveBeenCalled();
  });

  it('submits an answer for a loaded active form', async () => {
    const api = makeApi();
    vi.mocked(api.active).mockResolvedValue([
      {
        id: 'form-1',
        title: 'Survey',
        description: '',
        order: 0,
        status: FormStatus.Active,
        fields: [{ id: 'name', label: 'Name', type: FieldType.Text, order: 0, required: true }],
        createdAt: '2099-01-01T00:00:00.000Z',
        updatedAt: '2099-01-01T00:00:00.000Z',
      },
    ]);
    vi.mocked(api.submit).mockResolvedValue({
      id: 'submission-1',
      formId: 'form-1',
      answers: { name: 'Jane' },
      submittedAt: '2099-01-01T00:00:00.000Z',
    });
    const user = userEvent.setup();

    renderWithRole('staff', api);

    await waitFor(() => expect(api.listSubmissions).toHaveBeenCalledTimes(1));

    await user.type(await screen.findByLabelText(/^name/i), 'Jane');
    await user.click(screen.getByRole('button', { name: /submit response/i }));

    await waitFor(() => expect(api.submit).toHaveBeenCalledWith({ formId: 'form-1', answers: { name: 'Jane' } }));
  });

  it('guards against double submit clicks', async () => {
    const api = makeApi();
    vi.mocked(api.active).mockResolvedValue([
      {
        id: 'form-1',
        title: 'Survey',
        description: '',
        order: 0,
        status: FormStatus.Active,
        fields: [{ id: 'name', label: 'Name', type: FieldType.Text, order: 0, required: true }],
        createdAt: '2099-01-01T00:00:00.000Z',
        updatedAt: '2099-01-01T00:00:00.000Z',
      },
    ]);
    let resolveSubmit: ((value: SubmissionDto | PromiseLike<SubmissionDto>) => void) | undefined;
    vi.mocked(api.submit).mockImplementation(
      async () =>
        new Promise<SubmissionDto>((resolve) => {
          resolveSubmit = resolve;
        }),
    );

    const user = userEvent.setup();
    renderWithRole('staff', api);

    await waitFor(() => expect(api.listSubmissions).toHaveBeenCalledTimes(1));

    await user.type(await screen.findByLabelText(/^name/i), 'Jane');
    const button = screen.getByRole('button', { name: /submit response/i });
    const click1 = user.click(button);
    const click2 = user.click(button);
    await Promise.all([click1, click2]);

    await waitFor(() => expect(api.submit).toHaveBeenCalledTimes(1));

    resolveSubmit?.({
      id: 'submission-1',
      formId: 'form-1',
      answers: { name: 'Jane' },
      submittedAt: '2099-01-01T00:00:00.000Z',
    });
  });

  it('renders Color fields as a color picker and submits a hex value', async () => {
    const api = makeApi();
    vi.mocked(api.active).mockResolvedValue([
      {
        id: 'form-1',
        title: 'Survey',
        description: '',
        order: 0,
        status: FormStatus.Active,
        fields: [{ id: 'color', label: 'Color', type: FieldType.Color, order: 0, required: true }],
        createdAt: '2099-01-01T00:00:00.000Z',
        updatedAt: '2099-01-01T00:00:00.000Z',
      },
    ]);
    vi.mocked(api.submit).mockResolvedValue({
      id: 'submission-1',
      formId: 'form-1',
      answers: { color: '#AABBCC' },
      submittedAt: '2099-01-01T00:00:00.000Z',
    });
    const user = userEvent.setup();

    renderWithRole('staff', api);

    await waitFor(() => expect(api.listSubmissions).toHaveBeenCalledTimes(1));

    const input = await screen.findByLabelText(/^color/i);
    expect(input).toHaveAttribute('type', 'color');
    await act(async () => {
      fireEvent.change(input, { target: { value: '#AABBCC' } });
    });

    await user.click(screen.getByRole('button', { name: /submit response/i }));
    await waitFor(() => expect(api.submit).toHaveBeenCalledWith({ formId: 'form-1', answers: { color: '#aabbcc' } }));
  });

  it('loads active forms by default and hides admin actions in staff view', async () => {
    const api = makeApi();
    vi.mocked(api.active).mockResolvedValue([
      {
        id: 'form-a',
        title: 'A',
        description: '',
        order: 0,
        status: FormStatus.Active,
        fields: [{ id: 'name', label: 'Name', type: FieldType.Text, order: 0, required: true }],
        createdAt: '2099-01-01T00:00:00.000Z',
        updatedAt: '2099-01-01T00:00:00.000Z',
      },
      {
        id: 'form-b',
        title: 'B',
        description: '',
        order: 2,
        status: FormStatus.Active,
        fields: [{ id: 'name', label: 'Name', type: FieldType.Text, order: 0, required: true }],
        createdAt: '2099-01-01T00:00:00.000Z',
        updatedAt: '2099-01-01T00:00:00.000Z',
      },
    ]);

    renderWithRole('STAFF', api);

    await waitFor(() => expect(api.listSubmissions).toHaveBeenCalledTimes(1));

    await waitFor(() => expect(api.active).toHaveBeenCalled());
    const headings = await screen.findAllByRole('heading', { level: 3 });
    expect(headings.map((h) => h.textContent)).toEqual(['A', 'B']);

    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /toggle status/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^edit$/i })).not.toBeInTheDocument();
  });

  it('keeps a form visible in Admin after toggling active -> draft, and hides it in Staff', async () => {
    const api = makeApi();

    const activeForm = {
      id: 'form-1',
      title: 'Survey',
      description: '',
      order: 0,
      status: FormStatus.Active,
      fields: [{ id: 'name', label: 'Name', type: FieldType.Text as const, order: 0, required: true }],
      createdAt: '2099-01-01T00:00:00.000Z',
      updatedAt: '2099-01-01T00:00:00.000Z',
    };

    vi.mocked(api.active).mockResolvedValue([activeForm]);
    vi.mocked(api.listPage).mockResolvedValue({ items: [activeForm], total: 1, page: 1, pageSize: 10 });
    vi.mocked(api.update).mockResolvedValue({ ...activeForm, status: FormStatus.Draft });

    const user = userEvent.setup();
    renderWithRole('ADMIN', api);

    await waitFor(() => expect(api.listSubmissions).toHaveBeenCalledTimes(1));

    // Staff initial load should fetch active forms at least once.
    await waitFor(() => expect(api.active).toHaveBeenCalled());
    const activeCallsBeforeAdmin = vi.mocked(api.active).mock.calls.length;

    // Switch to admin and ensure list is loaded once.
    await user.click(screen.getByRole('button', { name: /admin view/i }));
    await waitFor(() => expect(api.listPage).toHaveBeenCalled());
    const listPageCallsBeforeToggle = vi.mocked(api.listPage).mock.calls.length;

    // Toggle to draft in admin. Refresh should be list, not active.
    vi.mocked(api.listPage).mockResolvedValue({
      items: [{ ...activeForm, status: FormStatus.Draft }],
      total: 1,
      page: 1,
      pageSize: 10,
    });
    await user.click(await screen.findByRole('button', { name: /toggle status/i }));
    await waitFor(() => expect(api.update).toHaveBeenCalled());
    await waitFor(() => expect(vi.mocked(api.listPage).mock.calls.length).toBeGreaterThanOrEqual(listPageCallsBeforeToggle + 1));
    expect(vi.mocked(api.active).mock.calls.length).toBe(activeCallsBeforeAdmin);

    // Form should still be visible in admin even as draft.
    const surveyHeading = await screen.findByRole('heading', { level: 3, name: 'Survey' });
    const card = surveyHeading.closest('article');
    expect(card).not.toBeNull();
    expect(within(card as HTMLElement).getByText(FormStatus.Draft)).toBeInTheDocument();

    // Switch back to staff: active should load again (entering staff view) and form should disappear.
    vi.mocked(api.active).mockResolvedValue([]);
    await user.click(screen.getByRole('button', { name: /staff view/i }));
    await waitFor(() => expect(vi.mocked(api.active).mock.calls.length).toBe(activeCallsBeforeAdmin + 1));
    expect(screen.queryByRole('heading', { level: 3, name: 'Survey' })).not.toBeInTheDocument();
  });

  it('expands and collapses submission details in staff view', async () => {
    const api = makeApi();
    vi.mocked(api.listSubmissions).mockResolvedValue([
      {
        id: 'submission-1',
        formId: 'form-1',
        submittedAt: '2099-01-01T00:00:00.000Z',
        answers: { name: 'Jane', department: 'Engineering', color: '#AABBCC' },
      },
    ]);

    const user = userEvent.setup();
    renderWithRole('staff', api);

    await waitFor(() => expect(api.listSubmissions).toHaveBeenCalledTimes(1));

    const submissionButton = await screen.findByRole('button', { name: /toggle submission details/i });
    expect(screen.queryByText(/submission id/i)).not.toBeInTheDocument();

    await user.click(submissionButton);
    expect(await screen.findByText(/submission id/i)).toBeInTheDocument();
    expect(screen.getAllByText('submission-1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/answers/i)).toBeInTheDocument();
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByLabelText(/color swatch #aabbcc/i)).toBeInTheDocument();

    await user.click(submissionButton);
    await waitFor(() => expect(screen.queryByText(/submission id/i)).not.toBeInTheDocument());
  });

  it('hides Admin view toggle for staff users', async () => {
    const api = makeApi();
    renderWithRole('STAFF', api);

    await waitFor(() => expect(api.listSubmissions).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('button', { name: /admin view/i })).not.toBeInTheDocument();
  });
});
