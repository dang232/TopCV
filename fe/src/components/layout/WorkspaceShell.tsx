'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { hasRole, useAuth } from '@/src/shared/auth';
import { parseJwt } from '@/src/shared/auth/jwt';
import { cn } from '@/src/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/forms', label: 'Forms workspace' },
] as const;

function labelFromAccessToken(accessToken: string | undefined): string {
  if (!accessToken) return 'Signed in';
  const payload = parseJwt<Record<string, unknown>>(accessToken);
  if (!payload) return 'Signed in';
  const preferred = payload['preferred_username'];
  const email = payload['email'];
  if (typeof preferred === 'string' && preferred.length > 0) return preferred;
  if (typeof email === 'string' && email.length > 0) return email;
  return 'Signed in';
}

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session, roles, logout } = useAuth();
  const userLabel = labelFromAccessToken(session?.accessToken);
  const isAdmin = hasRole(roles, 'ADMIN');
  const roleLabel = isAdmin ? 'Admin' : hasRole(roles, 'STAFF') ? 'Staff' : 'User';

  function handleLogout() {
    logout();
    window.location.href = '/login';
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground focus:outline-none"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-14 items-center justify-between gap-3 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <Link
              href="/dashboard"
              className="truncate text-sm font-semibold tracking-tight text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
            >
              FormFlow
            </Link>
            <span className="hidden text-muted-foreground sm:inline" aria-hidden>
              |
            </span>
            <span className="hidden truncate text-xs text-muted-foreground sm:inline md:text-sm">Workspace</span>
          </div>
          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            <div className="hidden max-w-[200px] flex-col items-end text-right sm:flex">
              <span className="truncate text-sm font-medium">{userLabel}</span>
              <Badge variant="secondary" className="mt-0.5 text-[10px] font-normal uppercase tracking-wide">
                {roleLabel}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} type="button">
              Log out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside
          className="border-b border-border bg-muted/30 md:w-56 md:shrink-0 md:border-b-0 md:border-r md:border-border"
          aria-label="Workspace navigation"
        >
          <nav className="flex gap-1 overflow-x-auto p-2 md:flex-col md:gap-0.5 md:p-3">
            {NAV.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main id="main-content" className="min-h-0 flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
