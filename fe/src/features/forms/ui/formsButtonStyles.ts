export const formsButtonBase =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border text-sm font-medium transition-colors ' +
  'cursor-pointer ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50';

export const formsButtonOutline =
  `${formsButtonBase} border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground`;

export const formsButtonPrimary =
  `${formsButtonBase} border-primary bg-primary text-primary-foreground hover:bg-primary/90`;

export const formsButtonGhost =
  `inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors cursor-pointer ` +
  'hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50';

export const formsButtonSm = 'px-3 py-2';
export const formsButtonXs = 'px-2 py-1 text-xs rounded-md';

export const formsDragHandle =
  `${formsButtonOutline} ${formsButtonXs} cursor-grab active:cursor-grabbing`;
