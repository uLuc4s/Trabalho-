import type { BusinessModel } from "@/lib/company";

export type ExampleService = { name: string; category: string; duration_minutes: number; price: number | null };

export const BUSINESS_MODELS: {
  id: BusinessModel;
  title: string;
  text: string;
  examples: string;
  services: ExampleService[];
}[] = [
  {
    id: "balcao",
    title: "Atendo no meu espaço",
    text: "O cliente vem até você em um horário fixo, e o que mais importa é o retorno.",
    examples: "Barbearia, manicure, estética, pet shop",
    services: [
      { name: "Corte", category: "Cabelo", duration_minutes: 30, price: 45 },
      { name: "Barba", category: "Barba", duration_minutes: 20, price: 30 },
      { name: "Corte + barba", category: "Cabelo", duration_minutes: 45, price: 70 },
    ],
  },
  {
    id: "campo",
    title: "Vou até o cliente",
    text: "Você atende na casa ou no local do cliente, em uma janela de horário combinada.",
    examples: "Instalador, eletricista, encanador, técnico",
    services: [
      { name: "Visita para diagnóstico", category: "Visita", duration_minutes: 60, price: 80 },
      { name: "Instalação", category: "Serviço", duration_minutes: 120, price: null },
    ],
  },
  {
    id: "orcamento",
    title: "Faço orçamento e projeto",
    text: "O cliente pede, você mede, orça e só depois executa. Tudo passa por aprovação.",
    examples: "Marceneiro sob medida, reforma, oficina, fotógrafo",
    services: [
      { name: "Orçamento e medição", category: "Orçamento", duration_minutes: 60, price: null },
      { name: "Execução", category: "Serviço", duration_minutes: 180, price: null },
    ],
  },
  {
    id: "recorrente",
    title: "Tenho clientes fixos",
    text: "Você atende as mesmas casas ou pessoas em ciclos, como semanal ou quinzenal.",
    examples: "Piscineiro, faxineira, personal, professora particular",
    services: [
      { name: "Visita semanal", category: "Rotina", duration_minutes: 60, price: 120 },
      { name: "Visita quinzenal", category: "Rotina", duration_minutes: 60, price: 180 },
    ],
  },
];
