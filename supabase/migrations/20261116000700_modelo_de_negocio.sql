-- MODELO DE NEGÓCIO DA EMPRESA
-- Objetivo: guardar como a empresa atende (balcão, campo, orçamento ou recorrente).
-- O modelo define quais telas e indicadores o painel mostra.
-- Resultado esperado: coluna business_model aceita só os quatro valores; empresas antigas ficam nulas até escolherem.

-- Adiciona a coluna de modelo na tabela de empresas.
alter table public.companies
  add column business_model text
    -- Restrição: só os quatro modelos previstos. Qualquer outro valor é recusado pelo banco.
    check (business_model in ('balcao', 'campo', 'orcamento', 'recorrente'));
