-- ÍNDICES DAS CONSULTAS MAIS USADAS
-- Objetivo: deixar rápidas as consultas do painel e do agendamento público à medida que a base cresce.
-- Resultado esperado: buscas por cliente, por profissional e por status deixam de varrer a tabela inteira.
-- Nenhum dado muda; só acelera a leitura.

-- Histórico de atendimentos por cliente (tela de clientes e cálculo de "sem retorno").
create index if not exists appointments_customer_idx on public.appointments (customer_id, starts_at);

-- Agenda de um profissional em um dia (checagem de horário livre).
create index if not exists appointments_employee_starts_idx on public.appointments (employee_id, starts_at);

-- Pedidos de orçamento por cliente (limite de tentativas por telefone).
create index if not exists service_requests_customer_idx on public.service_requests (customer_id, created_at);

-- Ordens por cliente (tela de ordens).
create index if not exists work_orders_customer_idx on public.work_orders (customer_id);
