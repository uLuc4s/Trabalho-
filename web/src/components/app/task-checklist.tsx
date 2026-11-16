"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export type ChecklistItem = { id: string; title: string; done: boolean };

export function TaskChecklist({
  companyId,
  taskId,
  items,
}: {
  companyId: string;
  taskId: string;
  items: ChecklistItem[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const done = items.filter((i) => i.done).length;

  function toggle(item: ChecklistItem) {
    startTransition(async () => {
      await createClient().from("task_checklist_items").update({ done: !item.done }).eq("id", item.id);
      router.refresh();
    });
  }

  function add() {
    const title = draft.trim();
    if (title.length < 2) return;
    setDraft("");
    startTransition(async () => {
      await createClient().from("task_checklist_items").insert({
        company_id: companyId,
        task_id: taskId,
        title,
        position: items.length,
      });
      router.refresh();
    });
  }

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3" onPointerDown={(e) => e.stopPropagation()}>
      {items.length > 0 && (
        <p className="text-[11px] tabular-nums text-muted-foreground">
          {done} de {items.length} concluídos
        </p>
      )}
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => toggle(item)}
              disabled={pending}
              className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left text-xs transition-colors hover:bg-secondary/60 disabled:opacity-60"
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors duration-200",
                  item.done ? "border-accent bg-accent text-accent-foreground" : "border-border bg-background",
                )}
              >
                {item.done && <Check className="h-3 w-3" aria-hidden />}
              </span>
              <span className={cn("min-w-0 break-words", item.done && "text-muted-foreground line-through")}>{item.title}</span>
            </button>
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
        className="flex items-center gap-1.5"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Novo item"
          className="h-7 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Adicionar item"
          disabled={pending}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border transition-colors hover:bg-secondary"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
        </button>
      </form>
    </div>
  );
}
