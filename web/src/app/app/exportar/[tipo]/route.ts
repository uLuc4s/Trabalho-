// Exporta dados do painel em CSV: clientes ou atendimentos do mês atual.
// Só membros da empresa chegam aqui (a proxy protege /app). A RLS do banco filtra os dados.

import { NextResponse } from "next/server"; // resposta HTTP
import { getCurrentCompany, todayInSaoPaulo } from "@/lib/company"; // empresa do usuário logado
import { toCsv } from "@/lib/csv"; // gerador de CSV
import { getCustomers } from "@/services/clientes.service"; // consulta de clientes
import { getMonthAppointments } from "@/services/relatorios.service"; // atendimentos do mês
import { formatMoney } from "@/mappers/agenda.mapper"; // formatação de valor

// Entrada: tipo na URL (clientes ou atendimentos).
// Saída: arquivo CSV para baixar. Tipo desconhecido devolve 404.
export async function GET(_request: Request, { params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;
  const { supabase } = await getCurrentCompany();
  const hoje = todayInSaoPaulo();

  if (tipo === "clientes") {
    const { data, error } = await getCustomers(supabase);
    if (error) return NextResponse.json({ erro: "Não foi possível exportar." }, { status: 500 });
    const csv = toCsv(
      ["Nome", "Telefone", "E-mail"],
      (data ?? []).map((c) => [c.name, c.phone, c.email ?? ""]),
    );
    return file(csv, `clientes-${hoje}.csv`);
  }

  if (tipo === "atendimentos") {
    const monthStart = `${hoje.slice(0, 8)}01T00:00:00-03:00`;
    const { data, error } = await getMonthAppointments(supabase, monthStart);
    if (error) return NextResponse.json({ erro: "Não foi possível exportar." }, { status: 500 });
    const csv = toCsv(
      ["Data", "Serviço", "Situação", "Forma de pagamento", "Valor recebido"],
      (data ?? []).map((a) => {
        const service = Array.isArray(a.services) ? a.services[0] : a.services;
        return [
          new Date(a.starts_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
          service?.name ?? "",
          a.status,
          a.payment_method ?? "",
          a.amount_paid !== null ? formatMoney(Number(a.amount_paid)) : "",
        ];
      }),
    );
    return file(csv, `atendimentos-${hoje.slice(0, 7)}.csv`);
  }

  return NextResponse.json({ erro: "Tipo não encontrado." }, { status: 404 });
}

// Devolve o texto como arquivo para download.
function file(content: string, name: string) {
  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
    },
  });
}
