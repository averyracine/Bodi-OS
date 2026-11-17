"use client";
import { useRef, useState, useTransition } from "react";
import { uploadPhotos } from "@/app/crm/actions";
import { compressImage } from "@/components/site/image-compress";
import { primaryBtn } from "./ui";

/** Phone-friendly uploader: opens the camera or library, shrinks photos, uploads in small batches. */
export function PhotoUploader({ projectId }: { projectId: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function onPick(list: FileList | null) {
    if (!list?.length) return;
    const files = Array.from(list).slice(0, 20);
    setMsg(`Preparing ${files.length} photo${files.length > 1 ? "s" : ""}…`);
    const small = await Promise.all(files.map((f) => compressImage(f)));
    start(async () => {
      let done = 0;
      for (let i = 0; i < small.length; i += 4) {
        const fd = new FormData();
        fd.set("projectId", projectId);
        small.slice(i, i + 4).forEach((f) => fd.append("photos", f));
        const r = await uploadPhotos(fd);
        if (r.error) { setMsg(r.error); return; }
        done += r.count ?? 0;
        setMsg(`Uploaded ${done} of ${small.length}…`);
      }
      setMsg(`Uploaded ${done} photo${done > 1 ? "s" : ""}.`);
      if (input.current) input.current.value = "";
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className={`${primaryBtn} cursor-pointer`}>
        <input ref={input} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => onPick(e.target.files)} disabled={pending} />
        {pending ? "Uploading…" : "Add photos"}
      </label>
      {msg && <p className="text-sm text-muted" aria-live="polite">{msg}</p>}
    </div>
  );
}
