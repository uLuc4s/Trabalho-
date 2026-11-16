"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NEXT: Record<string, { status: string; label: string }[]> = {
  open: [
    { status: "scheduled", label: "Programar" },
    { status: "cancelled", label: "Cancelar" },
  ],
  scheduled: [
    { status: "in_progress", label: "Iniciar" },
    { status: "cancelled", label: "Cancelar" },
  ],
  in_progress: [
    { status: "completed", label: "Concluir" },
    { status: "cancelled", label: "Cancelar" },
  ],
};

export function WorkOrderActions({ workOrderId, status }: { workOrderId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const actions = NEXT[status] ?? [];

  function move(next: string) {
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("app_set_work_order_status", {
        p_work_order_id: workOrderId,
        p_status: next,
      });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      router.refresh();
    });
  }

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((action) => (
          <button
            key={action.status}
            type="button"
            onClick={() => move(action.status)}
            disabled={pending}
            className="flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-xs transition-colors hover:bg-secondary disabled:opacity-50"
          >
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
            {action.label}
          </button>
        ))}
      </div>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
