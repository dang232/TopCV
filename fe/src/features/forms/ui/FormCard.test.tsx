import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FieldType, FormStatus, submissionAnswerKey, type FormDto } from '@topcv/shared';

import { FormCard } from './FormCard';

function todayIsoDate(): string {
  const date = new Date();
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

function makeForm(status: FormDto['status']): FormDto {
  return {
    id: 'form-1',
    title: 'Survey',
    description: '',
    order: 0,
    status,
    fields: [{ id: 'name', label: 'Name', type: FieldType.Text, order: 0, required: true }],
    createdAt: '2099-01-01T00:00:00.000Z',
    updatedAt: '2099-01-01T00:00:00.000Z',
  };
}

describe('FormCard', () => {
  it('calls onToggleStatus when clicking Toggle status', async () => {
    const user = userEvent.setup();
    const form = makeForm(FormStatus.Active);
    const onToggleStatus = vi.fn();

    render(
      <FormCard
        form={form}
        mode="admin"
        answers={{}}
        onAnswerChange={() => {}}
        onDelete={() => {}}
        onSubmit={() => {}}
        onToggleStatus={onToggleStatus}
        onUpdateForm={() => {}}
      />,
    );

    await user.click(screen.getByRole('button', { name: /toggle status/i }));
    expect(onToggleStatus).toHaveBeenCalledWith(form);
  });

  it('renders placeholders for answer inputs (text/number/date/select)', () => {
    const form: FormDto = {
      ...makeForm(FormStatus.Active),
      fields: [
        { id: 'f-text', label: 'Full name', type: FieldType.Text, order: 0, required: true },
        { id: 'f-number', label: 'Age', type: FieldType.Number, order: 1, required: true },
        { id: 'f-date', label: 'Start date', type: FieldType.Date, order: 2, required: false },
        { id: 'f-select', label: 'Department', type: FieldType.Select, order: 3, required: true, options: ['Engineering'] },
      ],
    };

    render(
      <FormCard
        form={form}
        mode="staff"
        answers={{}}
        onAnswerChange={() => {}}
        onDelete={() => {}}
        onSubmit={() => {}}
        onToggleStatus={() => {}}
        onUpdateForm={() => {}}
      />,
    );

    expect(screen.getByLabelText(/full name/i)).toHaveAttribute('placeholder');
    expect(screen.getByLabelText(/age/i)).toHaveAttribute('placeholder');

    const date = screen.getByLabelText(/start date/i);
    expect(date).toHaveAttribute('placeholder');
    expect(date).toHaveAttribute('min', todayIsoDate());

    const select = screen.getByLabelText(/department/i);
    expect(select).toHaveDisplayValue('Select…');
    expect(screen.getByRole('option', { name: 'Select…' })).toHaveValue('');
  });

  it('defaults required date answer to today and enforces min=today', () => {
    const form: FormDto = {
      ...makeForm(FormStatus.Active),
      fields: [{ id: 'f-date', label: 'Start date', type: FieldType.Date, order: 0, required: true }],
    };

    const onAnswerChange = vi.fn();
    render(
      <FormCard
        form={form}
        mode="staff"
        answers={{}}
        onAnswerChange={onAnswerChange}
        onDelete={() => {}}
        onSubmit={() => {}}
        onToggleStatus={() => {}}
        onUpdateForm={() => {}}
      />,
    );

    const date = screen.getByLabelText(/start date/i);
    expect(date).toHaveAttribute('min', todayIsoDate());
    expect(onAnswerChange).toHaveBeenCalledWith(submissionAnswerKey(form.fields[0]!), todayIsoDate());
  });

  it('defaults required color answer once', () => {
    const form: FormDto = {
      ...makeForm(FormStatus.Active),
      fields: [{ id: 'f-color', label: 'Favorite color', type: FieldType.Color, order: 0, required: true }],
    };

    const onAnswerChange = vi.fn();
    render(
      <FormCard
        form={form}
        mode="staff"
        answers={{}}
        onAnswerChange={onAnswerChange}
        onDelete={() => {}}
        onSubmit={() => {}}
        onToggleStatus={() => {}}
        onUpdateForm={() => {}}
      />,
    );

    expect(onAnswerChange).toHaveBeenCalledWith(submissionAnswerKey(form.fields[0]!), '#000000');
    expect(onAnswerChange).toHaveBeenCalledTimes(1);
  });

  it('does not re-default required color on click', async () => {
    const user = userEvent.setup();
    const form: FormDto = {
      ...makeForm(FormStatus.Active),
      fields: [{ id: 'f-color', label: 'Favorite color', type: FieldType.Color, order: 0, required: true }],
    };

    const onAnswerChange = vi.fn();
    render(
      <FormCard
        form={form}
        mode="staff"
        answers={{}}
        onAnswerChange={onAnswerChange}
        onDelete={() => {}}
        onSubmit={() => {}}
        onToggleStatus={() => {}}
        onUpdateForm={() => {}}
      />,
    );

    // First render should initialize the answer.
    expect(onAnswerChange).toHaveBeenCalledWith(submissionAnswerKey(form.fields[0]!), '#000000');
    expect(onAnswerChange).toHaveBeenCalledTimes(1);

    // Clicking the color input should not trigger another defaulting update.
    await user.click(screen.getByLabelText(/pick a color/i));
    expect(onAnswerChange).toHaveBeenCalledTimes(1);
  });

  it('shows a friendly error and disables submit for number answers > 100', () => {
    const form: FormDto = {
      ...makeForm(FormStatus.Active),
      fields: [{ id: 'f-number', label: 'Score', type: FieldType.Number, order: 0, required: true }],
    };

    render(
      <FormCard
        form={form}
        mode="staff"
        answers={{ [submissionAnswerKey(form.fields[0]!)]: '101' }}
        onAnswerChange={() => {}}
        onDelete={() => {}}
        onSubmit={() => {}}
        onToggleStatus={() => {}}
        onUpdateForm={() => {}}
      />,
    );

    expect(screen.getByText(/value must be between 0 and 100/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit response/i })).toBeDisabled();
  });
});

