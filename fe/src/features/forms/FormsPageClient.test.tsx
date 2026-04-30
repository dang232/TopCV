import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FieldType, FormStatus } from '@topcv/shared';

import { FormsPageClient, type FormsApi } from './FormsPageClient';

function makeApi(): FormsApi {
  return {
    create: vi.fn(async (input) => ({
      id: 'form-1',
      ...input,
      fields: input.fields.map((field: (typeof input.fields)[number], index: number) => ({ ...field, id: `field-${index}` })),
      createdAt: '2099-01-01T00:00:00.000Z',
      updatedAt: '2099-01-01T00:00:00.000Z',
    })),
    list: vi.fn(async () => []),
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
  it('creates a form through the API and refreshes the list', async () => {
    const api = makeApi();
    const user = userEvent.setup();

    render(<FormsPageClient api={api} />);

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
    expect(await screen.findByText(/form created/i)).toBeInTheDocument();
  });

  it('shows a validation message for a select field without options', async () => {
    const api = makeApi();
    const user = userEvent.setup();

    render(<FormsPageClient api={api} />);

    await user.type(screen.getByLabelText(/title/i), 'Invalid');
    await user.type(screen.getByLabelText(/field label/i), 'Department');
    await user.selectOptions(screen.getByLabelText(/field type/i), 'select');
    await user.click(screen.getByRole('button', { name: /create form/i }));

    expect(await screen.findByText(/option/i)).toBeInTheDocument();
    expect(api.create).not.toHaveBeenCalled();
  });

  it('submits an answer for a loaded active form', async () => {
    const api = makeApi();
    vi.mocked(api.list).mockResolvedValue([
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

    render(<FormsPageClient api={api} />);

    await user.click(screen.getByRole('button', { name: /refresh/i }));
    await user.type(await screen.findByLabelText(/answer for name/i), 'Jane');
    await user.click(screen.getByRole('button', { name: /submit response/i }));

    await waitFor(() => expect(api.submit).toHaveBeenCalledWith({ formId: 'form-1', answers: { name: 'Jane' } }));
  });
});
