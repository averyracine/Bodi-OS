"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="app-bg min-h-dvh grid place-items-center p-6">
      <div className="card p-8 max-w-md text-center" role="alert">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-muted mt-2">Your saved favorites and notes are safe in this browser.</p>
        <div className="flex gap-3 justify-center mt-6">
          <button className="btn btn-primary" onClick={reset}>Try again</button>
          <a className="btn" href="/app">Reload dashboard</a>
        </div>
      </div>
    </div>
  );
}
