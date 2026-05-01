import { useId, useState } from 'react';

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  error?: string | null;
  helpText?: string;
};

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
      <path
        d="M2.5 12s3.5-7.5 9.5-7.5S21.5 12 21.5 12s-3.5 7.5-9.5 7.5S2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
      <path
        d="M4 4l16 16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M2.5 12s3.5-7.5 9.5-7.5c2.16 0 4.04.75 5.6 1.83M21.5 12s-3.5 7.5-9.5 7.5c-2.16 0-4.04-.75-5.6-1.83"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M10.2 10.2A3.25 3.25 0 0 0 13.8 13.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  disabled,
  required,
  autoComplete,
  error,
  helpText,
}: PasswordFieldProps) {
  const reactId = useId();
  const errorId = `${id}-${reactId}-error`;
  const helpId = `${id}-${reactId}-help`;
  const describedBy = [error ? errorId : null, helpText ? helpId : null].filter(Boolean).join(' ') || undefined;
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 pr-12 text-sm outline-none ring-indigo-700/30 focus:ring-4"
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-xl p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          <EyeIcon visible={visible} />
        </button>
      </div>
      {helpText ? (
        <p id={helpId} className="text-xs text-zinc-500">
          {helpText}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

