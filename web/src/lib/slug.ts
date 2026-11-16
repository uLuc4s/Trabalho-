// Transforma um nome em slug, a parte do link público da empresa. Ex.: "Oficina Norte" vira "oficina-norte".

// Converte um texto para slug.
// Entrada: texto livre, ex.: "Auto Peças São José".
// Saída: texto só com letras minúsculas, números e hífens, ex.: "auto-pecas-sao-jose".
export function toSlug(value: string) {
  return value
    .normalize("NFD") // separa as letras dos acentos (ex.: "ç" vira "c" + cedilha)
    .replace(/[̀-ͯ]/g, "") // apaga os acentos separados no passo anterior
    .toLowerCase() // tudo minúsculo
    .replace(/[^a-z0-9]+/g, "-") // troca qualquer sequência de caracteres que não sejam letra ou número por um hífen
    .replace(/^-+|-+$/g, ""); // tira hífens do começo e do fim
}
