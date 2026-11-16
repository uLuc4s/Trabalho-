// Os quatro modelos de negócio que o cliente escolhe no onboarding.
// Cada modelo tem um texto para o cliente escolher e uma lista de serviços de exemplo.
// Os exemplos são criados na conta nova quando a empresa ainda não tem serviços.

import type { BusinessModel } from "@/lib/company"; // os quatro identificadores aceitos pelo banco

// Formato de um serviço de exemplo, antes de ser gravado no banco.
export type ExampleService = {
  name: string; // nome do serviço
  category: string; // categoria para agrupar na página pública
  duration_minutes: number; // duração em minutos
  price: number | null; // preço em reais; null = sob consulta
};

// Lista dos modelos. A tela de onboarding percorre esta lista para montar os cartões.
export const BUSINESS_MODELS: {
  id: BusinessModel; // identificador gravado em companies.business_model
  title: string; // título do cartão
  text: string; // explicação curta do modelo
  examples: string; // exemplos de negócios que se encaixam
  services: ExampleService[]; // serviços de exemplo deste modelo
}[] = [
  {
    id: "balcao",
    title: "Atendo no meu espaço",
    text: "O cliente vem até você em um horário fixo, e o que mais importa é o retorno.",
    examples: "Barbearia, manicure, estética, pet shop",
    services: [
      { name: "Corte", category: "Cabelo", duration_minutes: 30, price: 45 }, // serviço rápido de horário fixo
      { name: "Barba", category: "Barba", duration_minutes: 20, price: 30 },
      { name: "Corte + barba", category: "Cabelo", duration_minutes: 45, price: 70 }, // combo com desconto implícito
    ],
  },
  {
    id: "campo",
    title: "Vou até o cliente",
    text: "Você atende na casa ou no local do cliente, em uma janela de horário combinada.",
    examples: "Instalador, eletricista, encanador, técnico",
    services: [
      { name: "Visita para diagnóstico", category: "Visita", duration_minutes: 60, price: 80 }, // ida ao local para avaliar
      { name: "Instalação", category: "Serviço", duration_minutes: 120, price: null }, // preço depende do caso, por isso sob consulta
    ],
  },
  {
    id: "orcamento",
    title: "Faço orçamento e projeto",
    text: "O cliente pede, você mede, orça e só depois executa. Tudo passa por aprovação.",
    examples: "Marceneiro sob medida, reforma, oficina, fotógrafo",
    services: [
      { name: "Orçamento e medição", category: "Orçamento", duration_minutes: 60, price: null }, // medição antes do preço
      { name: "Execução", category: "Serviço", duration_minutes: 180, price: null }, // só após aprovação do orçamento
    ],
  },
  {
    id: "recorrente",
    title: "Tenho clientes fixos",
    text: "Você atende as mesmas casas ou pessoas em ciclos, como semanal ou quinzenal.",
    examples: "Piscineiro, faxineira, personal, professora particular",
    services: [
      { name: "Visita semanal", category: "Rotina", duration_minutes: 60, price: 120 }, // ciclo de 7 dias
      { name: "Visita quinzenal", category: "Rotina", duration_minutes: 60, price: 180 }, // ciclo de 15 dias
    ],
  },
];
