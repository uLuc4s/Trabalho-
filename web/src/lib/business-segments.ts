// Os ramos de negócio (segmentos) que o cliente escolhe no onboarding.
// Cada segmento traz serviços de exemplo. Os marcados como sensitive escondem serviço e telefone na agenda.

import type { ExampleService } from "@/lib/business-models"; // mesmo formato de serviço de exemplo

// Identificadores aceitos pelo banco em companies.segment.
export type Segment = "barbearia" | "oficina" | "advocacia" | "clinica" | "pet" | "lava_jato" | "outro";

// Lista dos segmentos. A tela de onboarding percorre esta lista para montar os botões.
export const SEGMENTS: { id: Segment; label: string; services: ExampleService[]; sensitive?: boolean }[] = [
  {
    id: "barbearia",
    label: "Barbearia",
    services: [
      { name: "Corte", category: "Cabelo", duration_minutes: 30, price: 45 },
      { name: "Barba", category: "Barba", duration_minutes: 20, price: 30 },
    ],
  },
  {
    id: "oficina",
    label: "Oficina mecânica",
    services: [
      { name: "Diagnóstico", category: "Mecânica", duration_minutes: 60, price: 120 },
      { name: "Troca de óleo", category: "Revisão", duration_minutes: 45, price: 180 },
      { name: "Revisão completa", category: "Revisão", duration_minutes: 180, price: null }, // preço varia por veículo
    ],
  },
  {
    id: "advocacia",
    label: "Advocacia",
    sensitive: true, // a agenda esconde o serviço e o telefone (sigilo profissional)
    services: [
      { name: "Consulta inicial", category: "Atendimento", duration_minutes: 60, price: 300 },
      { name: "Consulta de retorno", category: "Atendimento", duration_minutes: 30, price: 150 },
    ],
  },
  {
    id: "clinica",
    label: "Clínica ou consultório",
    sensitive: true, // a agenda esconde o serviço e o telefone (sigilo de saúde)
    services: [
      { name: "Consulta", category: "Atendimento", duration_minutes: 45, price: 200 },
      { name: "Retorno", category: "Atendimento", duration_minutes: 30, price: 120 },
    ],
  },
  {
    id: "pet",
    label: "Pet shop",
    services: [
      { name: "Banho", category: "Banho e tosa", duration_minutes: 60, price: 80 },
      { name: "Tosa", category: "Banho e tosa", duration_minutes: 60, price: 90 },
    ],
  },
  {
    id: "lava_jato",
    label: "Lava-jato",
    services: [
      { name: "Lavagem completa", category: "Lavagem", duration_minutes: 60, price: 60 },
      { name: "Polimento", category: "Estética", duration_minutes: 180, price: null }, // preço depende do veículo
    ],
  },
  {
    id: "outro",
    label: "Outro",
    services: [], // sem exemplos: a empresa cadastra os próprios serviços
  },
];
