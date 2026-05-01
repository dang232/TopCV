import * as React from 'react';
 
type ButtonVariant = 'primary' | 'outline' | 'ghost';
type ButtonSize = 'md' | 'sm' | 'xs';
 
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};
 
function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}
 
const base =
  'inline-flex w-full items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-700/30 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';
 
const variants: Record<ButtonVariant, string> = {
  primary: 'rounded-2xl bg-indigo-700 text-white hover:bg-indigo-800',
  outline: 'rounded-2xl border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50',
  ghost: 'rounded-2xl bg-transparent text-zinc-900 hover:bg-zinc-100',
};
 
const sizes: Record<ButtonSize, string> = {
  md: 'px-5 py-3 text-sm',
  sm: 'px-4 py-2 text-sm',
  xs: 'px-3 py-2 text-xs',
};
 
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', type = 'button', ...props },
  ref,
) {
  return <button ref={ref} type={type} className={cx(base, variants[variant], sizes[size], className)} {...props} />;
});

