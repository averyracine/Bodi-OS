"use client";
import Link from "next/link";
import { useEffect, useId, useMemo, useState, useTransition } from "react";
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, closestCorners,
  useDroppable, useSensor, useSensors, type DragEndEvent, type DragOverEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { moveProject } from "@/app/crm/actions";
import { formatMoney } from "@/lib/format";

export type Card = { id: string; title: string; customer: string; value: number | null; city: string | null; type: string | null; stageId: string };
export type Column = { id: string; name: string; kind: string };

export function PipelineBoard({ columns, cards: initial }: { columns: Column[]; cards: Card[] }) {
  const [cards, setCards] = useState(initial);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileStage, setMobileStage] = useState(columns[0]?.id);
  const [, start] = useTransition();
  const dndId = useId();
  useEffect(() => setCards(initial), [initial]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const byCol = useMemo(() => {
    const m = new Map<string, Card[]>(columns.map((c) => [c.id, []]));
    for (const c of cards) m.get(c.stageId)?.push(c);
    return m;
  }, [cards, columns]);

  const colOf = (id: string) => (columns.some((c) => c.id === id) ? id : cards.find((c) => c.id === id)?.stageId);

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }
  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const from = colOf(String(active.id));
    const to = colOf(String(over.id));
    if (!from || !to || from === to) return;
    setCards((prev) => prev.map((c) => (c.id === active.id ? { ...c, stageId: to } : c)));
  }
  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const to = colOf(String(over.id));
    if (!to) return;
    const col = cards.filter((c) => c.stageId === to);
    const oldIdx = col.findIndex((c) => c.id === active.id);
    const newIdx = col.findIndex((c) => c.id === over.id);
    const reordered = newIdx >= 0 && oldIdx >= 0 ? arrayMove(col, oldIdx, newIdx) : col;
    setCards([...cards.filter((c) => c.stageId !== to), ...reordered]);
    start(() => moveProject(String(active.id), to, reordered.map((c) => c.id)));
  }

  const active = cards.find((c) => c.id === activeId);

  return (
    <>
      {/* Phone: pick a stage, then move cards with a select (dragging across a tiny screen is painful) */}
      <div className="lg:hidden">
        <label htmlFor="stage-pick" className="sr-only">Stage</label>
        <select id="stage-pick" className="field mb-4" value={mobileStage} onChange={(e) => setMobileStage(e.target.value)}>
          {columns.map((c) => <option key={c.id} value={c.id}>{c.name} ({byCol.get(c.id)?.length ?? 0}) · {formatMoney(sum(byCol.get(c.id)))}</option>)}
        </select>
        <ul className="space-y-3">
          {(byCol.get(mobileStage!) ?? []).map((c) => (
            <li key={c.id} className="card p-4">
              <CardBody c={c} />
              <label className="mt-3 flex items-center gap-2 text-sm">
                <span className="text-muted">Move to</span>
                <select className="field min-h-10 flex-1 py-2 text-sm" value={c.stageId} onChange={(e) => {
                  const to = e.target.value;
                  setCards((prev) => prev.map((x) => (x.id === c.id ? { ...x, stageId: to } : x)));
                  start(() => moveProject(c.id, to, [c.id, ...(byCol.get(to) ?? []).map((x) => x.id)]));
                }}>
                  {columns.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
            </li>
          ))}
          {(byCol.get(mobileStage!) ?? []).length === 0 && <li className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">No projects in this stage.</li>}
        </ul>
      </div>

      {/* Desktop / tablet: drag-and-drop board */}
      <div className="hidden lg:block">
        <DndContext id={dndId} sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
          <div className="-mx-10 flex gap-4 overflow-x-auto px-10 pb-6">
            {columns.map((col) => (
              <BoardColumn key={col.id} col={col} cards={byCol.get(col.id) ?? []} />
            ))}
          </div>
          <DragOverlay>{active ? <div className="card w-72 rotate-1 p-4 shadow-xl"><CardBody c={active} /></div> : null}</DragOverlay>
        </DndContext>
        <p className="text-xs text-muted">Tip: drag cards between columns. With a keyboard, focus a card, press Space, use the arrow keys, then Space again.</p>
      </div>
    </>
  );
}

const sum = (list?: Card[]) => (list ?? []).reduce((n, c) => n + (c.value ?? 0), 0);

function BoardColumn({ col, cards }: { col: Column; cards: Card[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  return (
    <section aria-label={col.name} className={`flex w-72 shrink-0 flex-col rounded-2xl bg-sand-100/70 ${isOver ? "ring-2 ring-accent/40" : ""}`}>
      <header className="flex items-baseline justify-between px-4 pb-2 pt-4">
        <h2 className="text-sm font-medium">{col.name} <span className="text-muted">{cards.length}</span></h2>
        <span className="text-xs tabular-nums text-muted">{formatMoney(sum(cards))}</span>
      </header>
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="flex min-h-32 flex-1 flex-col gap-2 p-2">
          {cards.map((c) => <SortableCard key={c.id} c={c} />)}
        </ul>
      </SortableContext>
    </section>
  );
}

function SortableCard({ c }: { c: Card }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c.id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners}
      className={`card cursor-grab p-4 active:cursor-grabbing ${isDragging ? "opacity-40" : ""}`} aria-roledescription="Draggable project card">
      <CardBody c={c} />
    </li>
  );
}

function CardBody({ c }: { c: Card }) {
  return (
    <>
      <Link href={`/crm/projects/${c.id}`} className="block font-medium leading-snug hover:underline" onPointerDown={(e) => e.stopPropagation()}>{c.customer}</Link>
      <p className="mt-0.5 line-clamp-2 text-sm text-stone">{c.type ?? c.title}</p>
      <p className="mt-2 flex justify-between text-xs text-muted"><span>{c.city ?? ""}</span><span className="tabular-nums">{c.value ? formatMoney(c.value) : ""}</span></p>
    </>
  );
}
