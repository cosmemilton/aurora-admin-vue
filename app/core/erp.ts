type CmTone = 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'info'

export const orderStatuses = {
  pending: { label: 'Pendente', tone: 'warning' },
  approved: { label: 'Aprovado', tone: 'success' },
  shipped: { label: 'Enviado', tone: 'info' },
  delivered: { label: 'Entregue', tone: 'success' },
  canceled: { label: 'Cancelado', tone: 'danger' },
} as const satisfies Record<string, { label: string; tone: CmTone }>

export type OrderStatus = keyof typeof orderStatuses

export const statusOptions = Object.entries(orderStatuses).map(([value, { label }]) => ({
  value,
  label,
}))

type OrderItem = {
  name: string
  quantity: number
  unitPrice: number
}

export type Order = {
  id: string
  customer: string
  date: string
  payment: string
  status: OrderStatus
  items: OrderItem[]
}

export type Product = {
  sku: string
  name: string
  category: string
  quantity: number
  minimum: number
}

export const demoOrders: Order[] = [
  {
    id: '8426',
    customer: 'Helena Costa',
    date: '2026-06-25',
    payment: 'Pix',
    status: 'approved',
    items: [
      { name: 'Suporte de monitor Atlas', quantity: 2, unitPrice: 32900 },
      { name: 'Organizador modular Nexo', quantity: 1, unitPrice: 13900 },
    ],
  },
  {
    id: '8425',
    customer: 'Lucas Mendes',
    date: '2026-06-25',
    payment: 'Cartão',
    status: 'pending',
    items: [{ name: 'Luminária de mesa Lume', quantity: 1, unitPrice: 28900 }],
  },
  {
    id: '8424',
    customer: 'Ana Ribeiro',
    date: '2026-06-24',
    payment: 'Pix',
    status: 'shipped',
    items: [
      { name: 'Base para notebook Vértice', quantity: 1, unitPrice: 21900 },
      { name: 'Tapete de mesa Prisma', quantity: 2, unitPrice: 15900 },
    ],
  },
  {
    id: '8423',
    customer: 'Gabriel Lima',
    date: '2026-06-24',
    payment: 'Cartão',
    status: 'canceled',
    items: [{ name: 'Organizador modular Nexo', quantity: 1, unitPrice: 13900 }],
  },
  {
    id: '8422',
    customer: 'Marina Rocha',
    date: '2026-06-23',
    payment: 'Boleto',
    status: 'pending',
    items: [
      { name: 'Kit de cabos Fluxo', quantity: 3, unitPrice: 7900 },
      { name: 'Luminária de mesa Lume', quantity: 2, unitPrice: 28900 },
    ],
  },
  {
    id: '8421',
    customer: 'Rafael Alves',
    date: '2026-06-23',
    payment: 'Cartão',
    status: 'delivered',
    items: [{ name: 'Suporte de monitor Atlas', quantity: 4, unitPrice: 32900 }],
  },
  {
    id: '8420',
    customer: 'Beatriz Nunes',
    date: '2026-06-22',
    payment: 'Pix',
    status: 'approved',
    items: [
      { name: 'Tapete de mesa Prisma', quantity: 1, unitPrice: 15900 },
      { name: 'Base para notebook Vértice', quantity: 2, unitPrice: 21900 },
    ],
  },
]

export const demoInventory: Product[] = [
  { sku: 'ATL-104', name: 'Suporte de monitor Atlas', category: 'Ergonomia', quantity: 44, minimum: 12 },
  { sku: 'NXO-208', name: 'Organizador modular Nexo', category: 'Organização', quantity: 8, minimum: 12 },
  { sku: 'LUM-302', name: 'Luminária de mesa Lume', category: 'Iluminação', quantity: 27, minimum: 10 },
  { sku: 'VRT-119', name: 'Base para notebook Vértice', category: 'Ergonomia', quantity: 15, minimum: 10 },
  { sku: 'PRS-410', name: 'Tapete de mesa Prisma', category: 'Acessórios', quantity: 0, minimum: 8 },
  { sku: 'FLX-518', name: 'Kit de cabos Fluxo', category: 'Acessórios', quantity: 52, minimum: 15 },
  { sku: 'ARC-312', name: 'Luz de leitura Arco', category: 'Iluminação', quantity: 5, minimum: 6 },
]

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const shortDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' })

export function formatMoney(cents: number) {
  return currency.format(cents / 100)
}

export function formatOrderDate(date: string) {
  return shortDate.format(new Date(date))
}

export function orderTotal(order: Order) {
  return order.items.reduce((total, item) => total + item.unitPrice * item.quantity, 0)
}


export function stockStatus(product: Product) {
  if (product.quantity === 0) return { label: 'Sem estoque', tone: 'danger' } as const
  if (product.quantity <= product.minimum) return { label: 'Estoque baixo', tone: 'warning' } as const
  return { label: 'Disponível', tone: 'success' } as const
}

export const storageKeys = {
  erpOrders: 'aurora-ops.erp.orders.v1',
  erpInventory: 'aurora-ops.erp.inventory.v1',
} as const
