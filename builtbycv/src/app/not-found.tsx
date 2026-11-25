import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center bg-paper">
      <div className="container-x py-24">
        <p className="eyebrow">404</p>
        <h1 className="h2 mt-4">This page isn&apos;t here.</h1>
        <p className="lede mt-4">It may have moved. Try the home page or our projects.</p>
        <div className="mt-8 flex gap-3">
          <Link href="/" className="btn-primary">Home</Link>
          <Link href="/projects" className="btn-ghost">Projects</Link>
        </div>
      </div>
    </main>
  );
}
