import { clientStatus, getInitials, initialClients, type CrmClient } from './crm'
import { demoInventory, demoOrders, formatMoney, formatOrderDate, orderStatuses, orderTotal, stockStatus, type Order, type Product } from './erp'
import { entryKindLabels, financeDateLabel, financeMoney, financeStatus, seedEntries, type FinanceEntry } from './financeiro'
import { displayDate, initialOrders, orderCode, statuses, statusTones, type ServiceOrder } from './servicos'

export type ListingAction = 'edit-client' | 'select-order' | 'adjust-stock' | 'settle-entry' | 'edit-service-order'
export type ListingCell = {
  text: string | number
  detail?: string
  avatar?: string
  dateTime?: string
  tone?: string
  action?: ListingAction
  actionLabel?: string
  href?: string
  sortValue?: string | number
}
export type ListingColumn = {
  key: string
  header: string
  align?: 'right'
  sortable?: boolean
  hideable?: boolean
  defaultHidden?: boolean
}
export type ListingRow = { id: string | number; status: string; search: string; cells: Record<string, ListingCell> }
export type Listing = {
  title: string
  description: string
  tableTitle: string
  filterLabel: string
  queryLabel: string
  queryPlaceholder: string
  emptyTitle: string
  emptyDescription: string
  recordName: string
  minimumTableWidth: number
  statusOptions?: { value: string; label: string }[]
  columns: ListingColumn[]
  rows: ListingRow[]
}
export type ListingSources = {
  clients: CrmClient[]
  orders: Order[]
  inventory: Product[]
  entries: FinanceEntry[]
  serviceOrders: ServiceOrder[]
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase()
}

export function filterListing(listing: Listing, query: string, status = '') {
  const terms = normalize(query).split(/\s+/u).filter(Boolean)
  return listing.rows.filter(row => (!status || status === row.status) && terms.every(term => normalize(row.search).includes(term)))
}

function crmClients(clients: CrmClient[]): Listing {
  return {
    title: 'Clientes', description: 'Consulte e atualize sua carteira de contatos.', tableTitle: 'Carteira de clientes',
    filterLabel: 'Filtros de clientes', queryLabel: 'Buscar clientes', queryPlaceholder: 'Nome, empresa, e-mail ou cidade',
    emptyTitle: 'Nenhum cliente encontrado', emptyDescription: 'Experimente outro termo ou situação.',
    recordName: 'clientes', minimumTableWidth: 680,
    statusOptions: Object.entries(clientStatus).map(([value, state]) => ({ value, label: state.label })),
    columns: [
      { key: 'name', header: 'Cliente', sortable: true, hideable: false },
      { key: 'email', header: 'E-mail', sortable: true },
      { key: 'city', header: 'Cidade', sortable: true },
      { key: 'status', header: 'Situação', sortable: true },
      { key: 'actions', header: 'Ação', hideable: false, align: 'right' },
    ],
    rows: clients.map(client => ({
      id: client.id, status: client.status, search: `${client.name} ${client.company} ${client.email} ${client.city}`,
      cells: {
        name: { text: client.name, detail: client.company, avatar: getInitials(client.name) },
        email: { text: client.email }, city: { text: client.city },
        status: { text: clientStatus[client.status].label, tone: clientStatus[client.status].tone },
        actions: { text: 'Editar', action: 'edit-client', actionLabel: `Editar ${client.name}` },
      },
    })),
  }
}

function erpOrders(orders: Order[]): Listing {
  return {
    title: 'Pedidos', description: 'Consulte os pedidos de venda e acompanhe cada etapa da entrega.', tableTitle: 'Pedidos de venda',
    filterLabel: 'Filtros de pedidos', queryLabel: 'Buscar pedidos', queryPlaceholder: 'Número ou cliente',
    emptyTitle: 'Nenhum pedido encontrado', emptyDescription: 'Busque outro cliente, número ou status.',
    recordName: 'pedidos', minimumTableWidth: 530,
    statusOptions: Object.entries(orderStatuses).map(([value, state]) => ({ value, label: state.label })),
    columns: [
      { key: 'id', header: 'Pedido', hideable: false, sortable: true },
      { key: 'customer', header: 'Cliente', sortable: true },
      { key: 'date', header: 'Data', sortable: true },
      { key: 'total', header: 'Total', align: 'right', sortable: true },
      { key: 'status', header: 'Situação', sortable: true },
      { key: 'payment', header: 'Pagamento', sortable: true, defaultHidden: true },
    ],
    rows: orders.map(order => ({
      id: order.id, status: order.status, search: `${order.id} ${order.customer}`,
      cells: {
        id: { text: `#${order.id}`, action: 'select-order', actionLabel: `Ver pedido #${order.id}`, sortValue: Number(order.id) },
        customer: { text: order.customer }, date: { text: formatOrderDate(order.date), dateTime: order.date, sortValue: order.date },
        total: { text: formatMoney(orderTotal(order)), sortValue: orderTotal(order) },
        status: { text: orderStatuses[order.status].label, tone: orderStatuses[order.status].tone },
        payment: { text: order.payment },
      },
    })),
  }
}

function erpInventory(inventory: Product[]): Listing {
  return {
    title: 'Estoque', description: 'Consulte os saldos por produto e registre entradas e saídas.', tableTitle: 'Posição de estoque',
    filterLabel: 'Filtros de estoque', queryLabel: 'Buscar no estoque', queryPlaceholder: 'Produto, SKU ou categoria',
    emptyTitle: 'Nenhum produto encontrado', emptyDescription: 'Busque outro produto, SKU ou categoria.',
    recordName: 'produtos', minimumTableWidth: 675,
    columns: [
      { key: 'sku', header: 'SKU', sortable: true, hideable: false },
      { key: 'name', header: 'Produto', sortable: true },
      { key: 'category', header: 'Categoria', sortable: true },
      { key: 'quantity', header: 'Saldo', sortable: true, align: 'right' },
      { key: 'minimum', header: 'Mínimo', sortable: true, align: 'right' },
      { key: 'status', header: 'Situação', sortable: true },
      { key: 'actions', header: 'Ações', align: 'right', hideable: false },
    ],
    rows: inventory.map(product => {
      const status = stockStatus(product)
      return {
        id: product.sku, status: status.label, search: `${product.name} ${product.sku} ${product.category}`,
        cells: {
          sku: { text: product.sku }, name: { text: product.name }, category: { text: product.category },
          quantity: { text: product.quantity }, minimum: { text: product.minimum },
          status: { text: status.label, tone: status.tone },
          actions: { text: 'Ajustar', action: 'adjust-stock', actionLabel: `Ajustar estoque de ${product.name}` },
        },
      }
    }),
  }
}

function financeEntries(entries: FinanceEntry[]): Listing {
  return {
    title: 'Lançamentos', description: 'Acompanhe as contas a receber e a pagar e registre as liquidações.', tableTitle: 'Contas a receber e a pagar',
    filterLabel: 'Filtros de lançamentos', queryLabel: 'Buscar lançamento', queryPlaceholder: 'Descrição, contato ou categoria',
    emptyTitle: 'Nenhum lançamento encontrado', emptyDescription: 'Experimente outro termo ou situação.',
    recordName: 'lançamentos', minimumTableWidth: 720,
    statusOptions: [{ value: 'pendente', label: 'Em aberto' }, { value: 'vencido', label: 'Vencido' }, { value: 'liquidado', label: 'Liquidado' }],
    columns: [
      { key: 'description', header: 'Lançamento', sortable: true, hideable: false },
      { key: 'kind', header: 'Tipo', sortable: true },
      { key: 'dueDate', header: 'Vencimento', sortable: true },
      { key: 'cents', header: 'Valor', sortable: true, align: 'right' },
      { key: 'status', header: 'Situação' },
      { key: 'settledDate', header: 'Liquidação', align: 'right', hideable: false },
    ],
    rows: entries.map(entry => {
      const status = financeStatus(entry)
      const income = entry.kind === 'entrada'
      const settleLabel = income ? 'Registrar recebimento' : 'Registrar pagamento'
      return {
        id: entry.id, status, search: `${entry.description} ${entry.contact} ${entry.category}`,
        cells: {
          description: { text: entry.description, detail: `${entry.contact} · ${entry.category}` },
          kind: { text: entryKindLabels[entry.kind], tone: income ? 'success' : 'info' },
          dueDate: { text: financeDateLabel(entry.dueDate), dateTime: entry.dueDate, sortValue: entry.dueDate },
          cents: { text: financeMoney(entry.cents), sortValue: entry.cents },
          status: { text: status === 'vencido' ? 'Vencido' : status === 'pendente' ? 'Em aberto' : income ? 'Recebido' : 'Pago',
            tone: status === 'vencido' ? 'danger' : status === 'pendente' ? 'warning' : 'success' },
          settledDate: entry.settledDate
            ? { text: financeDateLabel(entry.settledDate), dateTime: entry.settledDate }
            : { text: settleLabel, action: 'settle-entry', actionLabel: `${settleLabel} de ${entry.contact}` },
        },
      }
    }),
  }
}

function services(orders: ServiceOrder[]): Listing {
  return {
    title: 'Ordens de serviço', description: 'Consulte os chamados e acompanhe cada atendimento até a conclusão.', tableTitle: 'Fila de atendimento',
    filterLabel: 'Filtros de ordens de serviço', queryLabel: 'Buscar ordem', queryPlaceholder: 'Número, cliente, serviço ou técnico',
    emptyTitle: 'Nenhuma ordem encontrada', emptyDescription: 'Experimente outro termo ou situação.',
    recordName: 'ordens', minimumTableWidth: 730,
    statusOptions: statuses.map(value => ({ value, label: value })),
    columns: [
      { key: 'id', header: 'Ordem', sortable: true, hideable: false },
      { key: 'service', header: 'Serviço', sortable: true, hideable: false },
      { key: 'client', header: 'Cliente', sortable: true },
      { key: 'technician', header: 'Técnico', sortable: true },
      { key: 'date', header: 'Agendamento', sortable: true },
      { key: 'status', header: 'Situação', sortable: true },
    ],
    rows: orders.map(order => ({
      id: order.id, status: order.status, search: `${orderCode(order.id)} ${order.client} ${order.service} ${order.technician}`,
      cells: {
        id: { text: orderCode(order.id), action: 'edit-service-order', actionLabel: `Editar ${orderCode(order.id)}`, sortValue: order.id },
        service: { text: order.service }, client: { text: order.client }, technician: { text: order.technician || 'A definir' },
        date: order.date
          ? { text: `${displayDate(order.date)} · ${order.time}`, dateTime: `${order.date}T${order.time}`, sortValue: `${order.date} ${order.time}` }
          : { text: 'Agendar', href: `/app/servicos/agenda?ordem=${order.id}`, actionLabel: `Agendar ${orderCode(order.id)}` },
        status: { text: order.status, tone: statusTones[order.status] },
      },
    })),
  }
}

export function getListing(path: string, sources: Partial<ListingSources> = {}): Listing | undefined {
  if (path === '/app/crm/clientes') return crmClients(sources.clients ?? initialClients)
  if (path === '/app/erp/pedidos') return erpOrders(sources.orders ?? demoOrders)
  if (path === '/app/erp/estoque') return erpInventory(sources.inventory ?? demoInventory)
  if (path === '/app/financeiro/lancamentos') return financeEntries(sources.entries ?? seedEntries)
  if (path === '/app/servicos/ordens') return services(sources.serviceOrders ?? initialOrders)
  return undefined
}
