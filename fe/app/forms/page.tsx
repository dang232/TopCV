import { FormsPageClient } from '@/src/features/forms';
import { WorkspaceShell } from '@/src/components/layout/WorkspaceShell';
import { RequireAuth } from '@/src/shared/auth';

export default function FormsPage() {
  return (
    <RequireAuth>
      <WorkspaceShell>
        <FormsPageClient />
      </WorkspaceShell>
    </RequireAuth>
  );
}
