export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 text-zinc-950">
      <section className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">403</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Access denied</h1>
        <p className="mt-3 text-zinc-600">
          Your account doesn’t have permission to view this page. If you think this is a mistake, contact an admin.
        </p>
      </section>
    </main>
  );
}

