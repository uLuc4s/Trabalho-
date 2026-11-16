-- SEGMENTO DA EMPRESA
-- Objetivo: guardar o ramo do negócio (barbearia, oficina, advocacia...).
-- O segmento muda os campos do agendamento e o sigilo da agenda (advocacia e clínica).
-- Resultado esperado: coluna segment aceita só os valores listados; o restante fica nulo.

-- Adiciona a coluna de segmento na tabela de empresas.
alter table public.companies
  add column segment text
    -- Restrição: só os segmentos previstos. Qualquer outro valor é recusado pelo banco.
    check (segment in ('barbearia', 'oficina', 'advocacia', 'clinica', 'pet', 'lava_jato', 'outro'));
