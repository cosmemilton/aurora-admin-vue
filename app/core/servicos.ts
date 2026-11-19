export const statuses = ['Aberta', 'Agendada', 'Em atendimento', 'Concluída'] as const
export type OrderStatus = (typeof statuses)[number]
export type ServiceOrder = {
  id: number
  service: string
  client: string
  technician: string
  date: string
  time: string
  status: OrderStatus
}

export const statusTones = {
  Aberta: 'warning',
  Agendada: 'info',
  'Em atendimento': 'primary',
  Concluída: 'success',
} as const
export const technicians = ['Ana Castro', 'Bruno Reis', 'Lívia Santos', 'Rafael Alves']
export const statusOptions = statuses.map((status) => ({
  value: status,
  label: status,
}))

export function localDate(offset = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

export function displayDate(value: string) {
  if (!value) return 'Sem data'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

export function orderCode(id: number) {
  return `OS-${id}`
}

export const initialOrders: ServiceOrder[] = [
  {
    id: 1032,
    service: 'Reparo do quadro elétrico',
    client: 'Mercado Boa Praça',
    technician: '',
    date: '',
    time: '',
    status: 'Aberta',
  },
  {
    id: 1031,
    service: 'Revisão do sistema de climatização',
    client: 'Clínica Aurora',
    technician: 'Ana Castro',
    date: localDate(),
    time: '08:30',
    status: 'Em atendimento',
  },
  {
    id: 1030,
    service: 'Instalação de novos pontos de rede',
    client: 'Estúdio Lume',
    technician: 'Bruno Reis',
    date: localDate(),
    time: '10:00',
    status: 'Agendada',
  },
  {
    id: 1029,
    service: 'Inspeção das câmeras de segurança',
    client: 'Edifício Porto Sul',
    technician: 'Lívia Santos',
    date: localDate(),
    time: '14:30',
    status: 'Agendada',
  },
  {
    id: 1028,
    service: 'Troca de sensor de pressão',
    client: 'Oficina São Lucas',
    technician: '',
    date: '',
    time: '',
    status: 'Aberta',
  },
  {
    id: 1027,
    service: 'Manutenção preventiva de bombas',
    client: 'Condomínio Jardim',
    technician: 'Rafael Alves',
    date: localDate(1),
    time: '09:00',
    status: 'Agendada',
  },
  {
    id: 1026,
    service: 'Calibração da balança industrial',
    client: 'Mercado Boa Praça',
    technician: 'Ana Castro',
    date: localDate(2),
    time: '11:00',
    status: 'Agendada',
  },
  {
    id: 1025,
    service: 'Substituição de roteador',
    client: 'Estúdio Lume',
    technician: 'Bruno Reis',
    date: localDate(-1),
    time: '15:00',
    status: 'Concluída',
  },
  {
    id: 1024,
    service: 'Vistoria dos extintores',
    client: 'Escola Ipê',
    technician: 'Lívia Santos',
    date: localDate(-2),
    time: '13:30',
    status: 'Concluída',
  },
]

export function emptyOrder(): ServiceOrder {
  return {
    id: 0,
    service: '',
    client: '',
    technician: '',
    date: '',
    time: '',
    status: 'Aberta',
  }
}

export function compareAppointments(a: ServiceOrder, b: ServiceOrder) {
  return a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.id - b.id
}

export const storageKeys = {
  serviceOrders: 'aurora.servicos.ordens.v1',
} as const
