import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 text-zinc-950">
      <section className="max-w-2xl rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">TopCV Dynamic Form Builder</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Next.js CSR frontend for the Nest oRPC forms API.</h1>
        <p className="mt-4 text-lg leading-8 text-zinc-600">
          Create and manage dynamic forms with shared Zod contracts, then test the full flow against the backend.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="inline-flex rounded-xl bg-zinc-950 px-5 py-3 font-medium text-white" href="/dashboard">
            Open dashboard
          </Link>
          <Link className="inline-flex rounded-xl border border-zinc-200 bg-white px-5 py-3 font-medium text-zinc-900" href="/login">
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
