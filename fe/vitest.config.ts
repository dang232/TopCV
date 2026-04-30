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
    alias: {
      '@': fromRoot('.'),
      '@topcv/shared': fromRoot('../shared/index.ts'),
      '@topcv/shared/forms': fromRoot('../shared/forms/index.ts'),
      '@topcv/shared/user': fromRoot('../shared/user.schema.ts'),
    },
  },
});
