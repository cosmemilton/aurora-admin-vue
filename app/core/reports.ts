import { demoInventory, stockStatus, type Product } from './erp'
import { financeDate, financeStatus, seedEntries, type FinanceEntry } from './financeiro'
import { compareAppointments, displayDate, initialOrders, orderCode, statuses, type ServiceOrder } from './servicos'
import { downloadFile } from './downloadFile'

export type ReportFormat = 'pdf' | 'csv' | 'json'
type CellValue = string | number | null
type Format = 'integer' | 'currency' | 'date'
export type ReportCell = { raw: CellValue; formatted: string }
export type ReportColumn = {
  key: string
  header: string
  width: number
  align?: 'right'
  format?: Format
  noTotal?: boolean
}
export type ReportRow = { id: string | number; status: string; cells: ReportCell[] }
export type Report = {
  slug: string
  name: string
  description: string
  statusOptions: string[]
  columns: ReportColumn[]
  rows: ReportRow[]
}
export type ReportSources = { inventory: Product[]; entries: FinanceEntry[]; orders: ServiceOrder[] }

const nameOrder = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true })
const inventoryStatuses = ['Sem estoque', 'Estoque baixo', 'Disponível']
const financeLabels = { vencido: 'Vencido', pendente: 'Em aberto', entrada: 'Recebido', saida: 'Pago' }
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const integer = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const date = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

const inventoryColumns: ReportColumn[] = [
  { key: 'sku', header: 'SKU', width: 11 },
  { key: 'name', header: 'Produto', width: 24 },
  { key: 'category', header: 'Categoria', width: 15 },
  { key: 'quantity', header: 'Saldo', format: 'integer', align: 'right', width: 9 },
  { key: 'minimum', header: 'Mínimo', format: 'integer', align: 'right', noTotal: true, width: 9 },
  { key: 'missing', header: 'A repor', format: 'integer', align: 'right', width: 12 },
  { key: 'status', header: 'Situação', width: 20 },
]

const financeColumns: ReportColumn[] = [
  { key: 'dueDate', header: 'Vencimento', format: 'date', width: 12 },
  { key: 'description', header: 'Lançamento', width: 22 },
  { key: 'contact', header: 'Cliente ou fornecedor', width: 18 },
  { key: 'incoming', header: 'Entradas', format: 'currency', align: 'right', width: 13 },
  { key: 'outgoing', header: 'Saídas', format: 'currency', align: 'right', width: 13 },
  { key: 'status', header: 'Situação', width: 10 },
  { key: 'settledDate', header: 'Liquidação', format: 'date', width: 12 },
]

const serviceColumns: ReportColumn[] = [
  { key: 'technician', header: 'Técnico', width: 16 },
  { key: 'id', header: 'Ordem', width: 10 },
  { key: 'client', header: 'Cliente', width: 17 },
  { key: 'service', header: 'Serviço', width: 24 },
  { key: 'appointment', header: 'Agendamento', width: 18 },
  { key: 'status', header: 'Situação', width: 15 },
]

function cell(raw: CellValue, format: Format | undefined): ReportCell {
  if (raw === null) return { raw, formatted: '' }
  if (format === 'currency') return { raw, formatted: currency.format(Number(raw)) }
  if (format === 'integer') return { raw, formatted: integer.format(Number(raw)) }
  if (format === 'date') return { raw, formatted: date.format(new Date(`${raw}T12:00:00`)) }
  return { raw, formatted: String(raw) }
}

function reportRow(id: string | number, status: string, columns: ReportColumn[], values: CellValue[]): ReportRow {
  return { id, status, cells: columns.map((column, index) => cell(values[index] ?? null, column.format)) }
}

function inventoryReport(products: Product[]): Report {
  const inventory = products.map(product => ({
    ...product,
    missing: Math.max(0, product.minimum - product.quantity),
    status: stockStatus(product).label,
  })).sort((a, b) => inventoryStatuses.indexOf(a.status) - inventoryStatuses.indexOf(b.status)
    || b.missing - a.missing || nameOrder.compare(a.name, b.name))

  return {
    slug: 'posicao-de-estoque',
    name: 'Posição de estoque',
    description: 'Veja os produtos com estoque baixo e quantas unidades faltam para atingir o mínimo de cada item.',
    statusOptions: inventoryStatuses,
    columns: inventoryColumns,
    rows: inventory.map(row => reportRow(row.sku, row.status, inventoryColumns,
      [row.sku, row.name, row.category, row.quantity, row.minimum, row.missing, row.status])),
  }
}

function financeReport(entries: FinanceEntry[]): Report {
  const today = financeDate()
  const ordered = [...entries].sort((a, b) => a.dueDate.localeCompare(b.dueDate) || nameOrder.compare(a.description, b.description))
  return {
    slug: 'lancamentos-financeiros',
    name: 'Lançamentos financeiros',
    description: 'Confira entradas e saídas por vencimento, identifique valores em aberto e acompanhe as liquidações.',
    statusOptions: Object.values(financeLabels),
    columns: financeColumns,
    rows: ordered.map(row => {
      const state = financeStatus(row, today)
      const status = financeLabels[state === 'liquidado' ? row.kind : state]
      const amount = row.cents / 100
      return reportRow(row.id, status, financeColumns, [row.dueDate, row.description, row.contact,
        row.kind === 'entrada' ? amount : null, row.kind === 'saida' ? amount : null, status, row.settledDate ?? null])
    }),
  }
}

function serviceReport(orders: ServiceOrder[]): Report {
  const ordered = [...orders].sort((a, b) => nameOrder.compare(a.technician, b.technician) || compareAppointments(a, b))
  return {
    slug: 'ordens-por-tecnico',
    name: 'Ordens por técnico',
    description: 'Consulte os atendimentos de cada técnico em ordem de agendamento e identifique as ordens que aguardam atribuição.',
    statusOptions: [...statuses],
    columns: serviceColumns,
    rows: ordered.map(row => reportRow(row.id, row.status, serviceColumns, [row.technician || 'A definir', orderCode(row.id),
      row.client, row.service, row.date ? [displayDate(row.date), row.time].filter(Boolean).join(' · ') : 'A agendar', row.status])),
  }
}

export function getReport(path: string, sources: Partial<ReportSources> = {}): Report | undefined {
  if (path === '/app/relatorios/estoque') return inventoryReport(sources.inventory ?? demoInventory)
  if (path === '/app/relatorios/financeiro') return financeReport(sources.entries ?? seedEntries)
  if (path === '/app/relatorios/servicos') return serviceReport(sources.orders ?? initialOrders)
  return undefined
}

export function reportRows(report: Report, status: string) {
  return status ? report.rows.filter(row => row.status === status) : report.rows
}

export function reportTotals(report: Report, rows: ReportRow[]): string[] | undefined {
  const hasTotals = report.columns.some(column => !column.noTotal && (column.format === 'integer' || column.format === 'currency'))
  if (rows.length === 0 || !hasTotals) return undefined

  return report.columns.map((column, index) => {
    if (index === 0) return 'Total do relatório'
    if (column.noTotal || (column.format !== 'integer' && column.format !== 'currency')) return ''
    const sum = rows.reduce((total, row) => total + Number(row.cells[index]!.raw ?? 0), 0)
    return cell(sum, column.format).formatted
  })
}

function csvField(value: string, raw?: CellValue) {
  const safe = typeof raw !== 'number' && /^\s*[=+@-]/u.test(value) ? `'${value}` : value
  return /[;"\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe
}

export function reportCsv(report: Report, rows: ReportRow[]) {
  const header = report.columns.map(column => csvField(column.header)).join(';')
  const body = rows.map(row => row.cells.map(value => csvField(value.formatted, value.raw)).join(';'))
  return '\uFEFF' + [header, ...body].join('\r\n')
}

export function reportJson(report: Report, rows: ReportRow[]) {
  return JSON.stringify(rows.map(row => Object.fromEntries(report.columns.map((column, index) => [column.key, row.cells[index]!.raw]))))
}

export async function downloadReport(report: Report, status: string, format: ReportFormat) {
  const rows = reportRows(report, status)
  if (rows.length === 0) return
  const blob = format === 'pdf'
    ? (await import('./reportPdf')).reportPdf(report, rows, status, reportTotals(report, rows))
    : format === 'csv'
      ? new Blob([reportCsv(report, rows)], { type: 'text/csv;charset=utf-8' })
      : new Blob([reportJson(report, rows)], { type: 'application/json;charset=utf-8' })
  downloadFile(blob, `${report.slug}.${format}`)
}
