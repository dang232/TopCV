export const formsButtonBase =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border text-sm font-medium transition-colors ' +
  'cursor-pointer ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white ' +
  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50';

export const formsButtonOutline =
  `${formsButtonBase} border-zinc-300 bg-white text-zinc-950 hover:bg-zinc-50 active:bg-zinc-100`;

export const formsButtonPrimary =
  `${formsButtonBase} border-zinc-950 bg-zinc-950 text-white hover:bg-zinc-900 active:bg-zinc-800`;

export const formsButtonGhost =
  `inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-950 transition-colors cursor-pointer ` +
  'hover:bg-zinc-100 active:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white ' +
  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50';

export const formsButtonSm = 'px-3 py-2';
export const formsButtonXs = 'px-2 py-1 text-xs rounded-md';

export const formsDragHandle =
  `${formsButtonOutline} ${formsButtonXs} cursor-grab active:cursor-grabbing`;
