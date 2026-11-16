-- FECHA ESCRITA DIRETA EM TABELAS CONTROLADAS POR FUNÇÕES
-- Problema: as políticas de escrita deixavam membros alterarem status, valores e histórico direto pela API,
-- contornando as funções que garantem as regras (máquina de estados, fechamento, aprovação e histórico).
-- Correção: remove a permissão de UPDATE nessas tabelas e de INSERT no histórico. Nenhuma tela grava direto
-- nelas: todas passam pelas funções (que rodam com security definer e não dependem dessa permissão).
-- Resultado esperado: PATCH direto em status, valor pago ou histórico é recusado pelo banco.

-- Atendimento: alterações só pelas funções de fechamento, cancelamento e remarcação.
revoke update on public.appointments from authenticated;

-- Solicitação: aprovação e vínculo com ordem só pela função de decisão.
revoke update on public.service_requests from authenticated;

-- Ordem: status só pela máquina de estados.
revoke update on public.work_orders from authenticated;

-- Histórico: inserção só pela função que muda o status.
revoke insert on public.work_order_events from authenticated;
