// Gera CSV que o Excel abre com acentos corretos.
// Campos com vírgula, aspas ou quebra de linha são envolvidos em aspas, e aspas internas são duplicadas.

// Escapa um valor para uma célula de CSV.
function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// Monta o CSV completo. Usa ponto e vírgula, separador padrão do Excel em português.
// Entrada: cabeçalhos e linhas (cada linha é uma lista de valores na mesma ordem).
// Saída: texto CSV com BOM UTF-8 no início, para o Excel reconhecer os acentos.
export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(cell).join(";"));
  return "﻿" + lines.join("\r\n");
}
