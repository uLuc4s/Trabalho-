// Separa as solicitações entre as que aguardam decisão e as já decididas.
// Função pura, sem acesso a banco.

import type { ServiceRequestRowDTO } from "@/services/solicitacoes.service";

// Entrada: todas as solicitações.
// Saída: duas listas. "open" aguarda decisão (new ou under_review). "decided" já foi aprovada ou recusada.
export function splitRequests(rows: ServiceRequestRowDTO[]) {
  const open = rows.filter((r) => r.status === "new" || r.status === "under_review");
  const decided = rows.filter((r) => r.status !== "new" && r.status !== "under_review");
  return { open, decided };
}
