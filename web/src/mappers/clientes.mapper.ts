// Regras da tela de clientes: histórico, filtro e contagem de clientes sem retorno.
// Funções puras. A data limite chega por parâmetro, então os testes não dependem do relógio.

import type { CustomerAppointmentRowDTO, CustomerRowDTO, CustomerStatsDTO } from "@/dto/clientes.dto";

// Calcula, para cada cliente, quantos atendimentos teve e quando foi o último.
// Entrada: todos os atendimentos da empresa.
// Saída: mapa de cliente para histórico. Cancelados são ignorados.
export function buildCustomerStats(rows: CustomerAppointmentRowDTO[]): Map<string, CustomerStatsDTO> {
  const stats = new Map<string, CustomerStatsDTO>();
  for (const a of rows) {
    if (a.status === "cancelled") continue; // cancelado não conta no histórico
    const s = stats.get(a.customer_id) ?? { total: 0, last: null }; // histórico atual ou zerado
    s.total += 1;
    // Guarda a data mais recente. Comparação de texto ISO funciona na ordem cronológica.
    if (!s.last || a.starts_at > s.last) s.last = a.starts_at;
    stats.set(a.customer_id, s);
  }
  return stats;
}

// Diz se um cliente está sem retorno: nunca foi atendido, ou o último atendimento é anterior à data limite.
// Entrada: histórico do cliente (ou undefined) e o instante limite em milissegundos.
// Saída: true ou false.
export function isInactive(stats: CustomerStatsDTO | undefined, cutoffMs: number): boolean {
  const last = stats?.last;
  return !last || new Date(last).getTime() < cutoffMs;
}

// Aplica a busca por nome ou telefone e o filtro de sem retorno.
// Entrada: clientes, históricos, termo digitado, se o filtro está ligado e o instante limite.
// Saída: lista filtrada, na mesma ordem.
export function filterCustomers(
  customers: CustomerRowDTO[],
  stats: Map<string, CustomerStatsDTO>,
  options: { term: string; onlyInactive: boolean; cutoffMs: number },
): CustomerRowDTO[] {
  const term = options.term.trim().toLowerCase(); // busca sem diferença de maiúsculas
  const digits = term.replace(/\D/g, ""); // só os números do termo, para buscar por telefone
  return customers.filter((c) => {
    // Se há termo, o nome OU o telefone precisa bater.
    if (term && !c.name.toLowerCase().includes(term) && !(digits && c.phone.includes(digits))) return false;
    // Com o filtro ligado, mostra só quem está sem retorno.
    if (options.onlyInactive && !isInactive(stats.get(c.id), options.cutoffMs)) return false;
    return true;
  });
}
