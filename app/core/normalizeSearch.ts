// Assim, "sao" também encontra "São Paulo".
export function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{Diacritic}/gu, '')
}
