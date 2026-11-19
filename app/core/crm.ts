export type CrmClient = {
  id: string
  name: string
  company: string
  email: string
  city: string
  status: 'active' | 'prospect' | 'inactive'
  createdAt: string
}

export type OpportunityStage = 'qualification' | 'proposal' | 'negotiation' | 'won'

export type CrmOpportunity = {
  id: string
  title: string
  clientId: string
  value: number
  stage: OpportunityStage
  expectedAt: string
  owner: string
}

export const clientStatus: Record<
  CrmClient['status'],
  { label: string; tone: 'success' | 'primary' | 'default' }
> = {
  active: { label: 'Ativo', tone: 'success' },
  prospect: { label: 'Prospect', tone: 'primary' },
  inactive: { label: 'Inativo', tone: 'default' },
}

export const opportunityStages = [
  { id: 'qualification', label: 'Qualificação', tone: 'info' },
  { id: 'proposal', label: 'Proposta', tone: 'primary' },
  { id: 'negotiation', label: 'Negociação', tone: 'warning' },
  { id: 'won', label: 'Fechada', tone: 'success' },
] as const satisfies ReadonlyArray<{ id: OpportunityStage; label: string; tone: string }>

export const initialClients: CrmClient[] = [
  {
    id: 'serra',
    name: 'Isabela Duarte',
    company: 'Serra Café',
    email: 'isabela@example.com',
    city: 'Florianópolis, SC',
    status: 'active',
    createdAt: '2026-06-22',
  },
  {
    id: 'atelie',
    name: 'Rafael Pereira',
    company: 'Ateliê Nove',
    email: 'rafael@example.com',
    city: 'São Paulo, SP',
    status: 'active',
    createdAt: '2026-06-20',
  },
  {
    id: 'brisa',
    name: 'Lívia Moraes',
    company: 'Brisa Arquitetura',
    email: 'livia@example.com',
    city: 'Curitiba, PR',
    status: 'prospect',
    createdAt: '2026-06-15',
  },
  {
    id: 'mar',
    name: 'André Santos',
    company: 'Mar Aberto',
    email: 'andre@example.com',
    city: 'Recife, PE',
    status: 'active',
    createdAt: '2026-06-12',
  },
  {
    id: 'norte',
    name: 'Beatriz Alves',
    company: 'Norte Criativo',
    email: 'beatriz@example.com',
    city: 'Belo Horizonte, MG',
    status: 'prospect',
    createdAt: '2026-06-10',
  },
  {
    id: 'campo',
    name: 'Lucas Ferreira',
    company: 'Campo & Casa',
    email: 'lucas@example.com',
    city: 'Campinas, SP',
    status: 'inactive',
    createdAt: '2026-06-04',
  },
]

export const initialOpportunities: CrmOpportunity[] = [
  {
    id: 'opp-01',
    title: 'Operação multicanal',
    clientId: 'serra',
    value: 32800,
    stage: 'negotiation',
    expectedAt: '2026-07-06',
    owner: 'Marina Costa',
  },
  {
    id: 'opp-02',
    title: 'Projeto de implantação',
    clientId: 'brisa',
    value: 18600,
    stage: 'proposal',
    expectedAt: '2026-07-12',
    owner: 'Daniel Souza',
  },
  {
    id: 'opp-03',
    title: 'Pacote de indicadores',
    clientId: 'norte',
    value: 9800,
    stage: 'qualification',
    expectedAt: '2026-07-18',
    owner: 'Marina Costa',
  },
  {
    id: 'opp-04',
    title: 'Portal de atendimento',
    clientId: 'mar',
    value: 24700,
    stage: 'proposal',
    expectedAt: '2026-07-14',
    owner: 'Renata Lima',
  },
  {
    id: 'opp-05',
    title: 'Renovação anual',
    clientId: 'atelie',
    value: 15200,
    stage: 'won',
    expectedAt: '2026-06-24',
    owner: 'Daniel Souza',
  },
  {
    id: 'opp-06',
    title: 'Acompanhamento de estoque',
    clientId: 'campo',
    value: 8400,
    stage: 'qualification',
    expectedAt: '2026-07-22',
    owner: 'Renata Lima',
  },
  {
    id: 'opp-07',
    title: 'Integração de vendas',
    clientId: 'atelie',
    value: 21400,
    stage: 'negotiation',
    expectedAt: '2026-07-08',
    owner: 'Daniel Souza',
  },
  {
    id: 'opp-08',
    title: 'Expansão de licenças',
    clientId: 'mar',
    value: 10400,
    stage: 'won',
    expectedAt: '2026-06-26',
    owner: 'Renata Lima',
  },
]

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})
const shortDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' })

export function getInitials(name: string) {
  const [first = '', ...rest] = name.trim().split(/\s+/)
  return `${first[0] ?? ''}${rest.at(-1)?.[0] ?? ''}`.toUpperCase()
}


export function newCrmId() {
  return crypto.randomUUID?.() ?? Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-')
}

export function formatCrmCurrency(value: number) {
  return currency.format(value)
}

export function formatCrmShortDate(date: string) {
  return shortDate.format(new Date(`${date}T00:00:00Z`))
}

export const storageKeys = {
  crmClients: 'aurora-crm-clientes',
  crmOpportunities: 'aurora-crm-oportunidades',
} as const
