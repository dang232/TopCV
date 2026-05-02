import * as React from "react";

import { cn } from "@/src/lib/utils";

type AlertVariant = "default" | "destructive";

export type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
};

const variantStyles: Record<AlertVariant, string> = {
  default: "border-border bg-muted/50 text-foreground",
  destructive: "border-destructive/50 bg-destructive/5 text-destructive dark:border-destructive/40 dark:bg-destructive/10",
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { className, variant = "default", role = "alert", ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      role={role}
      className={cn(
        "relative w-full rounded-xl border px-4 py-3 text-sm shadow-sm [&_svg]:size-4 [&_svg]:shrink-0",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
});

export const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  function AlertTitle({ className, ...props }, ref) {
    return <h5 ref={ref} className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />;
  },
);

export const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  function AlertDescription({ className, ...props }, ref) {
    return <p ref={ref} className={cn("text-sm leading-relaxed", className)} {...props} />;
  },
);

export function AlertCircleIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      focusable="false"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}
