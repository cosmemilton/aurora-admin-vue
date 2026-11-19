import { clientStatus, formatCrmCurrency, getInitials, initialClients, initialOpportunities, opportunityStages, type CrmClient, type CrmOpportunity } from './crm'
import { demoInventory, demoOrders, formatMoney, orderTotal, statusOptions, stockStatus, type Order, type Product } from './erp'
import { financeBalance, financeCompactMoney, financeDate, financeMoney, financeShortDate, financeStatus, seedEntries, sumFinance, type FinanceEntry } from './financeiro'
import { compareAppointments, displayDate, initialOrders, localDate, orderCode, statusTones, technicians, type ServiceOrder } from './servicos'
import { getListing, type ListingColumn, type ListingRow } from './listings'

export type DashboardLink = { label: string; href: string; icon?: string; tone?: string }
export type DashboardMetric = { title: string; value: string | number; description: string; tone: string; icon: string; variant?: 'gradient' | 'soft' }
export type DashboardBar = { label: string; value: number; tone?: string }
export type DashboardItem = {
  id: string | number
  title: string
  description: string
  label?: string
  value?: string
  avatar?: string
  badge?: string
  dateTime?: string
  tone?: string
  href?: string
  action?: DashboardLink
}

type Section = { title: string; description?: string; action?: DashboardLink; emptyTitle?: string; emptyDescription?: string; emptyIcon?: string }
export type DashboardSection = Section & (
  | { kind: 'bar'; bars: DashboardBar[]; standalone?: boolean; height?: number; formatter?: (value: number) => string; note?: DashboardItem; chartLabel?: string }
  | { kind: 'progress'; bars: DashboardBar[]; max: number }
  | { kind: 'list' | 'timeline'; items: DashboardItem[]; connected?: boolean }
  | { kind: 'table'; columns: ListingColumn[]; rows: ListingRow[]; minWidth: number; density?: string }
)

export type DomainDashboard = {
  title: string
  description: string
  metricLabel: string
  minColumnWidth: string
  sectionSpacing?: 'md'
  metricIconSize: number
  actions: DashboardLink[]
  metrics: DashboardMetric[]
  sections: DashboardSection[]
  bottom?: DashboardSection
}

export type DomainDashboardSources = {
  clients: CrmClient[]; opportunities: CrmOpportunity[]; orders: Order[];
  inventory: Product[]; entries: FinanceEntry[]; serviceOrders: ServiceOrder[];
}

function crmDashboard(clients: CrmClient[], opportunities: CrmOpportunity[]): DomainDashboard {
  const open = opportunities.filter(deal => deal.stage !== 'won')
  const won = opportunities.filter(deal => deal.stage === 'won')
  const mainDeal = [...open].sort((a, b) => b.value - a.value)[0]
  const mainClient = clients.find(client => client.id === mainDeal?.clientId)
  const recent = [...clients].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4)

  return {
    title: 'CRM', description: 'Acompanhe sua carteira de clientes e negociações em andamento.',
    metricLabel: 'Indicadores de CRM', minColumnWidth: '26rem', metricIconSize: 18, actions: [],
    metrics: [
      { title: 'Valor em aberto', value: formatCrmCurrency(open.reduce((sum, deal) => sum + deal.value, 0)), description: 'No funil comercial', tone: 'primary', variant: 'gradient', icon: 'hand-coins' },
      { title: 'Clientes ativos', value: clients.filter(client => client.status === 'active').length, description: `${clients.filter(client => client.status === 'prospect').length} em prospecção`, tone: 'info', icon: 'users' },
      { title: 'Em negociação', value: open.filter(deal => deal.stage === 'negotiation').length, description: `${open.length} oportunidades em aberto`, tone: 'warning', icon: 'briefcase-business' },
      { title: 'Vendas fechadas', value: formatCrmCurrency(won.reduce((sum, deal) => sum + deal.value, 0)), description: `${won.length} oportunidades ganhas`, tone: 'success', icon: 'circle-check' },
    ],
    sections: [
      { kind: 'bar', title: 'Distribuição do funil', description: 'Valor das oportunidades em aberto por etapa.',
        action: { label: 'Ver funil', href: '/app/crm/oportunidades', icon: 'arrow-right' }, chartLabel: 'Valor por etapa do funil',
        bars: open.length ? opportunityStages.filter(stage => stage.id !== 'won').map(stage => ({
          label: stage.label, tone: stage.tone,
          value: open.filter(deal => deal.stage === stage.id).reduce((sum, deal) => sum + deal.value, 0),
        })) : [], formatter: formatCrmCurrency, emptyTitle: 'Nenhuma oportunidade em aberto',
        note: mainDeal ? {
          id: mainDeal.id, label: 'Maior oportunidade em aberto', title: mainDeal.title,
          description: `${mainClient?.company ?? ''} · ${formatCrmCurrency(mainDeal.value)}`,
          action: { label: opportunityStages.find(stage => stage.id === mainDeal.stage)?.label ?? 'Ver etapa', href: `/app/crm/oportunidades?etapa=${mainDeal.stage}`, icon: 'arrow-right' },
        } : undefined },
      { kind: 'list', title: 'Clientes recentes', description: 'Últimos contatos incluídos na carteira.',
        action: { label: 'Ver clientes', href: '/app/crm/clientes', icon: 'arrow-right' },
        items: recent.map(client => ({ id: client.id, title: client.name, description: `${client.company} · ${client.city}`,
          avatar: getInitials(client.name), badge: clientStatus[client.status].label, tone: clientStatus[client.status].tone })),
        emptyTitle: 'A carteira ainda não tem clientes' },
    ],
  }
}

function erpDashboard(orders: Order[], products: Product[]): DomainDashboard {
  const sold = orders.filter(order => order.status !== 'pending' && order.status !== 'canceled')
  const pending = orders.filter(order => order.status === 'pending')
  const lowStock = products.filter(product => product.quantity <= product.minimum)
  const recent = [...orders].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 5)
  const orderList = getListing('/app/erp/pedidos', { orders: recent })!

  return {
    title: 'Painel do ERP', description: 'Acompanhe vendas, pedidos e os produtos que precisam de reposição.',
    metricLabel: 'Indicadores do ERP', minColumnWidth: '26rem', metricIconSize: 18,
    actions: [{ label: 'Gerenciar pedidos', href: '/app/erp/pedidos', icon: 'clipboard-list' }],
    metrics: [
      { title: 'Receita confirmada', value: formatMoney(sold.reduce((sum, order) => sum + orderTotal(order), 0)), description: 'Pedidos aprovados, enviados e entregues', tone: 'primary', variant: 'gradient', icon: 'circle-dollar-sign' },
      { title: 'Pedidos pendentes', value: pending.length, description: 'Aguardando aprovação', tone: 'warning', variant: 'soft', icon: 'clipboard-list' },
      { title: 'Produtos cadastrados', value: products.length, description: 'SKUs acompanhados', tone: 'info', variant: 'soft', icon: 'boxes' },
      { title: 'Itens a repor', value: lowStock.length, description: 'Com saldo no mínimo ou abaixo', tone: 'danger', variant: 'soft', icon: 'package-minus' },
    ],
    sections: [
      { kind: 'progress', title: 'Pedidos por status', description: `${orders.length} pedidos de venda`, max: Math.max(orders.length, 1),
        bars: statusOptions.map(({ value, label }) => ({ label, value: orders.filter(order => order.status === value).length })) },
      { kind: 'table', title: 'Atenção ao estoque', description: 'Produtos no limite de reposição',
        action: { label: 'Ver estoque', href: '/app/erp/estoque', icon: 'arrow-right' }, minWidth: 300, density: 'compact',
        emptyTitle: 'Estoque em dia', emptyDescription: 'Todos os produtos estão acima do saldo mínimo.', emptyIcon: 'package-check', columns: [
          { key: 'name', header: 'Produto', sortable: true }, { key: 'quantity', header: 'Saldo', align: 'right', sortable: true },
          { key: 'minimum', header: 'Mínimo', align: 'right', sortable: true },
        ], rows: lowStock.map(product => ({
          id: product.sku, search: product.name, status: stockStatus(product).label,
          cells: { name: { text: product.name }, quantity: { text: product.quantity, tone: stockStatus(product).tone }, minimum: { text: product.minimum } },
        })) },
    ],
    bottom: { kind: 'table', title: 'Pedidos recentes', emptyTitle: 'Nenhum pedido registrado', emptyIcon: 'clipboard-list', minWidth: 500,
      action: { label: 'Ver pedidos', href: '/app/erp/pedidos', icon: 'arrow-right' },
      columns: orderList.columns.filter(column => column.key !== 'payment'), rows: orderList.rows.map(row => ({
        ...row, cells: { ...row.cells, id: { text: row.cells.id?.text ?? '', sortValue: row.cells.id?.sortValue, emphasis: true } },
      })) },
  }
}

function financeDashboard(entries: FinanceEntry[]): DomainDashboard {
  const today = financeDate()
  const end = financeDate(14)
  const pending = entries.filter(entry => !entry.settledDate)
  const overdue = pending.filter(entry => financeStatus(entry, today) === 'vencido')
  const upcoming = pending.filter(entry => entry.dueDate >= today && entry.dueDate <= end)
  const next = [...pending].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 5)

  return {
    title: 'Financeiro', description: 'Acompanhe as contas a receber, os pagamentos e o saldo da operação.',
    metricLabel: 'Indicadores financeiros', minColumnWidth: '26rem', metricIconSize: 19, actions: [
      { label: 'Ver fluxo de caixa', href: '/app/financeiro/fluxo-de-caixa' },
      { label: 'Lançamentos', href: '/app/financeiro/lancamentos', icon: 'arrow-right', tone: 'primary' },
    ],
    metrics: [
      { title: 'Saldo realizado', value: financeMoney(financeBalance(entries)), description: 'Entradas menos saídas liquidadas', tone: 'primary', variant: 'gradient', icon: 'wallet' },
      { title: 'Contas a receber', value: financeMoney(sumFinance(pending, 'entrada')), description: 'Recebimentos em aberto', tone: 'success', icon: 'arrow-down-left' },
      { title: 'Contas a pagar', value: financeMoney(sumFinance(pending, 'saida')), description: 'Pagamentos em aberto', tone: 'warning', icon: 'arrow-up-right' },
      { title: 'Lançamentos vencidos', value: overdue.length, description: `${financeMoney(overdue.reduce((sum, entry) => sum + entry.cents, 0))} em atraso`, tone: 'danger', icon: 'circle-alert' },
    ],
    sections: [
      { kind: 'bar', title: 'Compromissos dos próximos 15 dias', description: 'Vencimentos a partir de hoje, sem incluir os atrasados.', height: 160, formatter: financeCompactMoney,
        bars: [{ label: 'A receber', value: sumFinance(upcoming, 'entrada'), tone: 'success' }, { label: 'A pagar', value: sumFinance(upcoming, 'saida'), tone: 'warning' }] },
      { kind: 'list', title: 'Agenda de vencimentos', description: 'Os cinco lançamentos em aberto com vencimento mais próximo ou em atraso.',
        emptyTitle: 'Nenhum vencimento em aberto', emptyIcon: 'calendar-clock', items: next.map(entry => ({
          id: entry.id, title: entry.contact, label: `${entry.kind === 'entrada' ? 'Receber' : 'Pagar'} até`,
          description: financeShortDate(entry.dueDate), dateTime: entry.dueDate,
          value: financeMoney(entry.cents), badge: financeStatus(entry, today) === 'vencido' ? 'Vencido' : undefined, tone: 'danger',
        })) },
    ],
  }
}

function servicesDashboard(orders: ServiceOrder[]): DomainDashboard {
  const today = localDate()
  const waiting = orders.filter(order => order.status === 'Aberta')
  const upcoming = orders.filter(order => order.date >= today && order.status !== 'Concluída').sort(compareAppointments).slice(0, 4)

  return {
    title: 'Operação de serviços', description: 'Acompanhe os chamados, as visitas e a agenda da equipe técnica.',
    metricLabel: 'Indicadores de serviços', minColumnWidth: '25rem', sectionSpacing: 'md', metricIconSize: 20,
    actions: [{ label: 'Nova ordem de serviço', href: '/app/servicos/ordens?ordem=nova', tone: 'primary' }],
    metrics: [
      { title: 'Aguardando agenda', value: waiting.length, description: 'Ordens sem visita marcada', tone: 'primary', variant: 'gradient', icon: 'clipboard-list' },
      { title: 'Visitas de hoje', value: orders.filter(order => order.date === today).length, description: displayDate(today), tone: 'info', variant: 'gradient', icon: 'calendar-days' },
      { title: 'Em atendimento', value: orders.filter(order => order.status === 'Em atendimento').length, description: 'Serviços em execução', tone: 'warning', variant: 'gradient', icon: 'wrench' },
      { title: 'Concluídas', value: orders.filter(order => order.status === 'Concluída').length, description: 'Serviços finalizados', tone: 'success', variant: 'gradient', icon: 'check-check' },
    ],
    sections: [
      { kind: 'timeline', connected: true, title: 'Roteiro de visitas', description: 'Atendimentos em aberto a partir de hoje',
        action: { label: 'Ver agenda', href: '/app/servicos/agenda', tone: 'primary' }, emptyTitle: 'Nenhuma visita prevista',
        items: upcoming.map(order => ({ id: order.id, label: order.time, tone: statusTones[order.status], title: order.service,
          href: `/app/servicos/ordens?ordem=${order.id}`, description: `${displayDate(order.date)} · ${order.technician} · ${order.client}` })) },
      { kind: 'bar', standalone: true, title: 'Carga por técnico', description: 'Atendimentos agendados ou em execução', height: 215,
        bars: technicians.map(technician => ({ label: technician, tone: 'info', value: orders.filter(order => order.technician === technician && order.status !== 'Concluída').length })) },
    ],
    bottom: { kind: 'timeline', title: 'Ordens aguardando agendamento', emptyTitle: 'Todas as ordens têm atendimento marcado',
      action: { label: 'Ver fila', href: '/app/servicos/ordens?situacao=Aberta', tone: 'primary' },
      items: waiting.slice(0, 4).map(order => ({ id: order.id, tone: 'warning', title: order.service, description: `${orderCode(order.id)} · ${order.client}`,
        action: { label: 'Agendar', href: `/app/servicos/agenda?ordem=${order.id}`, tone: 'primary' } })) },
  }
}

export function getDomainDashboard(path: string, data: Partial<DomainDashboardSources> = {}): DomainDashboard | undefined {
  if (path === '/app/dashboard/crm') return crmDashboard(data.clients ?? initialClients, data.opportunities ?? initialOpportunities)
  if (path === '/app/dashboard/erp') return erpDashboard(data.orders ?? demoOrders, data.inventory ?? demoInventory)
  if (path === '/app/dashboard/financeiro') return financeDashboard(data.entries ?? seedEntries)
  if (path === '/app/dashboard/servicos') return servicesDashboard(data.serviceOrders ?? initialOrders)
  return undefined
}
