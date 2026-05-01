import { FormsPageClient } from '@/src/features/forms';
import { RequireAuth } from '@/src/shared/auth';

export default function FormsPage() {
  return (
    <RequireAuth>
      <FormsPageClient />
    </RequireAuth>
  );
}
