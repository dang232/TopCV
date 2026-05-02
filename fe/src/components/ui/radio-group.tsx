import * as React from "react";

import { cn } from "@/src/lib/utils";

export type RadioGroupProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
};

export function RadioGroup({ className, value, onValueChange, disabled, ...props }: RadioGroupProps) {
  return (
    <div
      role="radiogroup"
      aria-disabled={disabled ? true : undefined}
      data-value={value}
      className={cn("grid gap-2", className)}
      {...props}
      onChange={(e) => {
        if (disabled) return;
        const target = e.target as HTMLInputElement | null;
        const next = target?.value;
        if (typeof next === "string") onValueChange?.(next);
      }}
    />
  );
}

export type RadioGroupItemProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: React.ReactNode;
};

export function RadioGroupItem({ className, id, label, disabled, ...props }: RadioGroupItemProps) {
  const fallbackId = React.useId();
  const inputId = id ?? fallbackId;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm " +
          "outline-none ring-indigo-700/30 focus-within:ring-4",
        disabled ? "cursor-not-allowed opacity-60" : "hover:bg-zinc-50",
        className,
      )}
    >
      <span className="font-medium text-zinc-900">{label}</span>
      <input
        id={inputId}
        type="radio"
        disabled={disabled}
        className="size-4 accent-indigo-700"
        {...props}
      />
    </label>
  );
}

