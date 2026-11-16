# Agendfix

Agendfix é um sistema de agendamento online e gestão operacional para pequenos negócios brasileiros que atendem com hora marcada: barbearias, clínicas, oficinas, lava-jatos, instaladores, assistências técnicas e prestadores de serviço em campo.

O cliente final agenda pelo link da empresa, sem criar conta. A equipe gerencia agenda, profissionais, solicitações de orçamento, ordens de serviço, tarefas e relatórios em um painel só.

## Sumário

- [Ideia do produto](#ideia-do-produto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Como rodar](#como-rodar)
- [Testes](#testes)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Regras de negócio e segurança](#regras-de-negócio-e-segurança)
- [Limitações conhecidas](#limitações-conhecidas)
- [Equipe](#equipe)

## Ideia do produto

Pequenos negócios perdem tempo com mensagens do tipo "tem horário amanhã?" e erram agenda quando dois clientes pedem o mesmo horário. O Agendfix resolve isso com três ideias:

1. **O cliente agenda sozinho.** A empresa tem um link público (`/e/nome-da-empresa`) com serviços, profissionais e horários livres. O cliente escolhe e confirma sem login.
2. **O banco garante a regra.** Conflito de horário, limite de tentativas, permissões por papel e isolamento entre empresas são impostos pelo PostgreSQL (RLS, restrições e funções), e não só pela tela.
3. **O modelo se adapta ao negócio.** No onboarding, a empresa escolhe como atende (no espaço, no local do cliente, por orçamento ou com clientes fixos) e o ramo. O painel mostra só o que faz sentido para ela. Advocacia e clínica, por exemplo, não exibem serviço nem telefone na agenda, por sigilo.

## Funcionalidades

**Para o cliente (sem login)**
- Escolha de serviço, profissional, dia e horário, com a regra de antecedência mínima.
- Pedido de orçamento ou visita para serviços que não estão na lista.
- Consulta, remarcação e cancelamento pelo link recebido na confirmação.
- Acompanhamento do pedido de orçamento pelo link.

**Para a empresa (painel)**
- Visão geral com indicadores e gráficos que mudam conforme o modelo de negócio.
- Agenda diária e mensal, com fechamento do atendimento (pagamento ou falta) e cancelamento.
- Solicitações: aprovar ou recusar com confirmação. Aprovar abre uma ordem de serviço.
- Ordens de serviço com status, histórico de mudanças e veículo, quando houver.
- Clientes, com busca, filtro de clientes sem retorno há 30 dias e exclusão de dados (LGPD).
- Serviços, profissionais, serviços por profissional e horários de trabalho.
- Convite de equipe com papéis: dono, administrador, equipe e somente leitura.
- Quadro Kanban de tarefas com checklist.
- Relatórios mensais: receita, formas de pagamento e serviços mais feitos.
- Configurações da empresa: contato, descrição, formas de pagamento e prazo de cancelamento.

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Interface | Next.js 16 (App Router), React 19, TypeScript |
| Estilo | Tailwind CSS 4, componentes no estilo shadcn/ui |
| Animações | Framer Motion |
| Banco, autenticação e API | Supabase (PostgreSQL, Auth, RLS, funções RPC) |
| Testes do banco | PGlite (PostgreSQL em memória) |
| Testes do web | `node --test` com TypeScript nativo do Node |

## Como rodar

### Pré-requisitos

- Node.js 20 ou superior (testado com 24)
- Uma conta no [Supabase](https://supabase.com) com um projeto criado

### 1. Clonar e instalar

```bash
git clone https://github.com/uLuc4s/Trabalho-.git
cd Trabalho-
npm install            # dependências dos testes do banco
cd web
npm install            # dependências do site
```

### 2. Configurar o ambiente

Crie o arquivo `web/.env.local` com os dados do seu projeto Supabase (em *Project Settings > API*):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-publishable
```

A chave publicável não é segredo, mas o arquivo `.env.local` está no `.gitignore` e não deve ser versionado. Nunca use a chave `service_role` no front-end.

### 3. Criar o banco

As migrations ficam em `supabase/migrations/` e precisam ser aplicadas **na ordem do nome do arquivo**. Pelo painel do Supabase, em *SQL Editor*, rode cada arquivo nessa ordem. Não renomeie nem reordene os arquivos: o nome define a sequência.

Ordem:

1. `20261116000000_fundacao.sql`: tabelas, RLS e funções de empresa e convite
2. `20261116000100_revoga_anon.sql`: remove acesso anônimo direto às tabelas
3. `20261116000200_operacoes.sql`: ordens, solicitações, Kanban, notificações e auditoria
4. `20261116000300_agendamento_publico.sql`: agendamento público sem login
5. `20261116000400_membro_ve_propria_linha.sql`: membro lê o próprio vínculo
6. `20261116000500_funcoes_internas.sql`: pedidos, remarcação, status de ordem e cancelamento
7. `20261116000600_perfil_empresa.sql`: perfil público da empresa
8. `20261116000700_modelo_de_negocio.sql`: modelo de negócio
9. `20261116000800_consulta_remarcacao.sql`: dados para remarcar pela consulta
10. `20261116000900_fechamento_e_protecao.sql`: fechamento, anonimização e limite de tentativas
11. `20261116001000_segmento.sql`: segmento do negócio
12. `20261116001100_detalhes_do_segmento.sql`: detalhes do segmento no agendamento
13. `20261116001200_vincula_atendimento_na_ordem.sql`: atendimento ligado à ordem
14. `20261116001300_convite_nao_rebaixa.sql`: convite aceito não rebaixa membro existente
15. `20261116001400_remarcacao_sem_conflito_consigo.sql`: remarcação não conflita consigo mesma
16. `20261116001500_nomes_da_equipe.sql`: nomes dos membros da equipe

Em *Authentication > Providers*, mantenha o login por e-mail e senha habilitado. Para testes locais, desative a confirmação obrigatória de e-mail se quiser entrar logo após o cadastro.

### 4. Rodar o site

```bash
cd web
npm run dev
```

Abra `http://localhost:3000`. Cadastre uma conta, crie a empresa, escolha o modelo e o ramo. O link público fica em `http://localhost:3000/e/seu-endereco`.

## Testes

**Banco de dados** (na raiz do projeto). Sobe um PostgreSQL em memória, aplica as migrations e checa permissões, isolamento entre empresas, conflitos de horário e as funções públicas:

```bash
npm run test:db
```

Resultado esperado: as quatro suítes com todas as verificações em `PASS` (24, 15, 14 e 20 verificações).

**Web** (dentro de `web/`). Testes unitários das funções puras de mapeamento:

```bash
cd web
npm test
```

**Qualidade do código** (dentro de `web/`):

```bash
npm run lint
npx tsc --noEmit
```

## Estrutura do projeto

```
Trabalho-/
├── README.md
├── package.json                  # script de testes do banco
├── supabase/
│   ├── migrations/               # schema, RLS e funções, aplicados em ordem
│   └── tests/                    # testes de permissões e regras do banco
└── web/
    ├── src/
    │   ├── app/                  # rotas (App Router)
    │   │   ├── app/              # painel protegido (agenda, clientes, ordens...)
    │   │   ├── e/[slug]/         # página pública de agendamento
    │   │   ├── consulta/         # cliente consulta, remarca ou cancela
    │   │   ├── solicitacao/      # cliente acompanha um pedido de orçamento
    │   │   ├── convite/          # aceite de convite de equipe
    │   │   └── login, cadastro, onboarding/
    │   ├── components/           # interface por área (app, booking, landing, motion, ui)
    │   ├── dto/                  # tipos dos dados que entram e saem do banco
    │   ├── services/             # consultas ao Supabase, uma por área
    │   ├── mappers/              # regras puras (contas, filtros, formatação) e seus testes
    │   ├── lib/                  # clientes do Supabase, datas, modelos e segmentos
    │   └── proxy.ts              # protege /app e /onboarding (exige login)
    └── public/brand/             # logo
```

O fluxo de dados segue sempre a mesma ordem: a página chama um **service**, que consulta o Supabase e devolve os dados no formato de um **dto**; um **mapper** transforma esses dados em números e textos prontos para a tela.

## Regras de negócio e segurança

- **Isolamento entre empresas**: todas as tabelas têm RLS. Um usuário só enxerga e altera dados das empresas em que tem vínculo ativo.
- **Papéis**: dono e administrador gerenciam a empresa e a equipe; membro opera a agenda e as ordens; visualizador só lê.
- **Visitante sem login**: só acessa funções `public_*` específicas. Nenhuma tabela é aberta para ele.
- **Tokens de consulta**: o link de agendamento e de pedido carrega um token aleatório de 64 caracteres. O banco guarda apenas o hash SHA-256.
- **Horário sem conflito**: uma restrição de intervalo no PostgreSQL impede dois agendamentos sobrepostos para o mesmo profissional. Cancelados não contam.
- **Limites de tentativas**: 3 agendamentos por telefone por dia e 60 por empresa por hora.
- **Histórico imutável**: eventos de ordem e registros de auditoria não podem ser alterados nem apagados pelo usuário.
- **LGPD**: o dono ou administrador pode apagar os dados de um cliente. Os horários futuros são cancelados e o registro fica anonimizado.

## Limitações conhecidas

- **Notificações por e-mail e integração com Google Agenda ainda não estão implementadas.** A confirmação é registrada na fila, mas o envio depende de um provedor ainda não contratado.
- **Proteção contra robôs (CAPTCHA) ainda não está ligada** nos formulários públicos.
- O token de consulta aparece na URL. Ele pode ficar no histórico do navegador e em logs de acesso.
- O painel ainda não passou por uma rodada completa de testes manuais no navegador depois da separação em camadas (services, mappers e dto).
- Hospedagem para uso comercial ainda não definida.

## Equipe

Projeto desenvolvido por:

- Lucas Soares Fonseca
- João Gabriel Martins Flausino
- João Henrique Nonato Moura Gomes
- João Victor de Morais Dutra
