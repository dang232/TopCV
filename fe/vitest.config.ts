import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
  resolve: {
    // Use an ordered alias array so subpath matches win over the base package alias.
    alias: [
      { find: '@', replacement: fromRoot('.') },
      { find: '@topcv/shared/auth', replacement: fromRoot('../shared/auth/index.ts') },
      { find: '@topcv/shared/forms', replacement: fromRoot('../shared/forms/index.ts') },
      { find: '@topcv/shared/transport', replacement: fromRoot('../shared/transport/index.ts') },
      { find: '@topcv/shared/user', replacement: fromRoot('../shared/user.schema.ts') },
      { find: '@topcv/shared', replacement: fromRoot('../shared/index.ts') },
    ],
  },
});
