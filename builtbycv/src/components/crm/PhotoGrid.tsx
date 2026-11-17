import type { Photo } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/dates";

export function PhotoGrid({ photos }: { photos: Photo[] }) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {photos.map((p) => (
        <li key={p.id}>
          <a href={p.url} target="_blank" rel="noopener" className="block overflow-hidden rounded-lg bg-sand-100">
            {/* eslint-disable-next-line @next/next/no-img-element -- user uploads from mixed storage; served as-is */}
            <img src={p.url} alt={p.caption ?? "Project photo"} loading="lazy" className="aspect-square w-full object-cover" />
          </a>
          <p className="mt-1 truncate text-[11px] text-muted">{p.caption ? `${p.caption} · ` : ""}{formatDateTime(p.createdAt)}</p>
        </li>
      ))}
    </ul>
  );
}
