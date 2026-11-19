export type EntryKind = 'entrada' | 'saida'
export const entryKindLabels: Record<EntryKind, string> = { entrada: 'A receber', saida: 'A pagar' }

export type FinanceEntry = {
  id: string
  description: string
  contact: string
  category: string
  kind: EntryKind
  cents: number
  dueDate: string
  settledDate?: string
}

export function financeDate(offset = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const compactMoney = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 0,
})
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })
const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })

export const financeMoney = (cents: number) => money.format(cents / 100)
export const financeCompactMoney = (cents: number) => compactMoney.format(cents / 100)
export const financeDateLabel = (date: string) => dateFormatter.format(new Date(`${date}T12:00:00`))
export const financeShortDate = (date: string) => shortDateFormatter.format(new Date(`${date}T12:00:00`))

export const seedEntries: FinanceEntry[] = [
  { id: 'f01', description: 'Implantação de plataforma', contact: 'Aquarela Studio', category: 'Implantação', kind: 'entrada', cents: 2_470_000, dueDate: financeDate(-20), settledDate: financeDate(-20) },
  { id: 'f02', description: 'Mensalidade de operação', contact: 'Clínica Horizonte', category: 'Assinaturas', kind: 'entrada', cents: 865_000, dueDate: financeDate(-14), settledDate: financeDate(-14) },
  { id: 'f03', description: 'Licenças do time de produto', contact: 'Nuvem Stack', category: 'Tecnologia', kind: 'saida', cents: 383_400, dueDate: financeDate(-13), settledDate: financeDate(-13) },
  { id: 'f04', description: 'Folha administrativa', contact: 'Equipe Aurora', category: 'Pessoal', kind: 'saida', cents: 1_450_000, dueDate: financeDate(-9), settledDate: financeDate(-9) },
  { id: 'f05', description: 'Consultoria de dados', contact: 'Vereda Digital', category: 'Serviços', kind: 'entrada', cents: 1_260_000, dueDate: financeDate(-6), settledDate: financeDate(-6) },
  { id: 'f06', description: 'Serviços de infraestrutura', contact: 'Base Norte', category: 'Tecnologia', kind: 'saida', cents: 218_000, dueDate: financeDate(-4), settledDate: financeDate(-4) },
  { id: 'f07', description: 'Renovação anual', contact: 'Nexo Comércio', category: 'Assinaturas', kind: 'entrada', cents: 780_000, dueDate: financeDate(-3) },
  { id: 'f08', description: 'Integração de pagamentos', contact: 'Ponte Sistemas', category: 'Fornecedores', kind: 'saida', cents: 248_000, dueDate: financeDate(-2) },
  { id: 'f09', description: 'Mensalidade de operação', contact: 'Mercado Vila', category: 'Assinaturas', kind: 'entrada', cents: 635_000, dueDate: financeDate(2) },
  { id: 'f10', description: 'Campanha de aquisição', contact: 'Ateliê Mídia', category: 'Marketing', kind: 'saida', cents: 391_500, dueDate: financeDate(4) },
  { id: 'f11', description: 'Análise de indicadores', contact: 'Rota Serviços', category: 'Serviços', kind: 'entrada', cents: 945_000, dueDate: financeDate(9) },
  { id: 'f12', description: 'Contabilidade mensal', contact: 'Mosaico Contábil', category: 'Administrativo', kind: 'saida', cents: 177_500, dueDate: financeDate(11) },
  { id: 'f13', description: 'Contrato de atendimento', contact: 'Vereda Digital', category: 'Assinaturas', kind: 'entrada', cents: 1_030_000, dueDate: financeDate(19) },
  { id: 'f14', description: 'Folha administrativa', contact: 'Equipe Aurora', category: 'Pessoal', kind: 'saida', cents: 1_450_000, dueDate: financeDate(23) },
  { id: 'f15', description: 'Implantação comercial', contact: 'Aquarela Studio', category: 'Implantação', kind: 'entrada', cents: 2_150_000, dueDate: financeDate(39) },
  { id: 'f16', description: 'Renovação de serviços em nuvem', contact: 'Base Norte', category: 'Tecnologia', kind: 'saida', cents: 1_840_000, dueDate: financeDate(73) },
]

export function financeStatus(entry: FinanceEntry, today = financeDate()) {
  if (entry.settledDate) return 'liquidado'
  return entry.dueDate < today ? 'vencido' : 'pendente'
}

export function sumFinance(entries: FinanceEntry[], kind: EntryKind) {
  return entries.filter((entry) => entry.kind === kind).reduce((total, entry) => total + entry.cents, 0)
}

export function financeBalance(entries: FinanceEntry[]) {
  const settled = entries.filter((entry) => entry.settledDate)
  return sumFinance(settled, 'entrada') - sumFinance(settled, 'saida')
}

export const storageKeys = {
  financeEntries: 'aurora-ops.financeiro.lancamentos',
} as const
