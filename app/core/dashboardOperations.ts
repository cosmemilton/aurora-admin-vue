export const pipeline = [
  { label: 'Novos leads', value: 126, tone: 'info' },
  { label: 'Qualificação', value: 84, tone: 'primary' },
  { label: 'Proposta', value: 56, tone: 'accent' },
  { label: 'Negociação', value: 31, tone: 'warning' },
  { label: 'Fechados', value: 22, tone: 'success' },
] as const

export const ticketStates = [
  { label: 'Abertos', value: 18, tone: 'warning' },
  { label: 'Em andamento', value: 24, tone: 'primary' },
  { label: 'Resolvidos', value: 86, tone: 'success' },
] as const

export const supportResponseTime = '1h 24min'

export const progressPanels = [
  {
    id: 'cursos', title: 'Desempenho dos cursos', description: 'Matrículas e taxa de conclusão', icon: 'graduation-cap',
    items: [
      { title: 'Fundamentos de produto', detail: '342 alunos', progress: 78, icon: 'layers-3' },
      { title: 'Análise de dados para negócios', detail: '286 alunos', progress: 64, icon: 'book-open' },
      { title: 'Comunicação com clientes', detail: '198 alunos', progress: 91, icon: 'graduation-cap' },
    ],
  },
  {
    id: 'projetos', title: 'Progresso dos projetos', description: 'Entregas previstas e execução', icon: 'folder-kanban',
    items: [
      { title: 'Portal de parceiros', detail: 'Produto · 28 jun', progress: 82, initials: 'PP' },
      { title: 'Migração de pagamentos', detail: 'Engenharia · 02 jul', progress: 61, initials: 'MP' },
      { title: 'Campanha de inverno', detail: 'Marketing · 08 jul', progress: 37, initials: 'CI' },
    ],
  },
] as const

export const recentOrders = [
  { id: '8421', customer: 'Helena Costa', initials: 'HC', date: '2026-06-25', total: 1284, status: 'Pago', tone: 'success' },
  { id: '8420', customer: 'Lucas Mendes', initials: 'LM', date: '2026-06-24', total: 398, status: 'Em análise', tone: 'warning' },
  { id: '8419', customer: 'Ana Ribeiro', initials: 'AR', date: '2026-06-23', total: 759, status: 'Pago', tone: 'success' },
  { id: '8418', customer: 'Gabriel Lima', initials: 'GL', date: '2026-06-23', total: 249, status: 'Cancelado', tone: 'danger' },
  { id: '8417', customer: 'Marina Rocha', initials: 'MR', date: '2026-06-22', total: 546, status: 'Enviado', tone: 'info' },
] as const

export const recentOrderDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', timeZone: 'UTC' })

export const activityDate = '25 de junho de 2026'

export const activity = [
  { id: 'purchase', label: '10:42', title: 'Novo pedido recebido', description: 'Helena Costa · #8421', tone: 'success', icon: 'shopping-bag' },
  { id: 'case', label: '10:18', title: 'Chamado resolvido', description: 'Equipe de suporte · #1568', tone: 'info', icon: 'headphones' },
  { id: 'project', label: '09:54', title: 'Etapa do projeto concluída', description: 'Portal de parceiros', tone: 'primary', icon: 'check' },
  { id: 'course', label: '09:31', title: 'Nova matrícula', description: 'Fundamentos de produto', tone: 'warning', icon: 'graduation-cap' },
] as const

export const secondaryMetrics = [
  { title: 'Retenção de clientes', value: '92,4%', description: 'nos últimos 30 dias', tone: 'primary', icon: 'users-round' },
  { title: 'Ticket médio', value: 'R$ 124,57', description: 'nos últimos 30 dias', tone: 'success', icon: 'receipt-text' },
  { title: 'Conclusão de cursos', value: '76,3%', description: 'dos alunos ativos', tone: 'info', icon: 'graduation-cap' },
  { title: 'Satisfação (CSAT)', value: '96,2%', description: 'nos chamados avaliados', tone: 'warning', icon: 'life-buoy' },
] as const
