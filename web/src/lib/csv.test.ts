// Testes do gerador de CSV. Rodam com: npm test (no diretório web).

import { test } from "node:test";
import assert from "node:assert/strict";
import { toCsv } from "./csv.ts";

test("toCsv começa com BOM para o Excel reconhecer acentos", () => {
  assert.equal(toCsv(["Nome"], []).charCodeAt(0), 0xfeff);
});

test("toCsv separa colunas com ponto e vírgula e linhas com CRLF", () => {
  const csv = toCsv(["Nome", "Telefone"], [["Ana", "11999"], ["Bruno", "11888"]]);
  assert.equal(csv, "﻿Nome;Telefone\r\nAna;11999\r\nBruno;11888");
});

test("toCsv envolve em aspas valores com ponto e vírgula, aspas ou quebra de linha", () => {
  const csv = toCsv(["Obs"], [['diz "oi"; tchau'], ["linha1\nlinha2"]]);
  assert.equal(csv, '﻿Obs\r\n"diz ""oi""; tchau"\r\n"linha1\nlinha2"');
});

test("toCsv deixa vazio null e undefined", () => {
  assert.equal(toCsv(["A", "B"], [[null, undefined]]), "﻿A;B\r\n;");
});
