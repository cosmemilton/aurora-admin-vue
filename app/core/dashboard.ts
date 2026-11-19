import { downloadFile } from './downloadFile'

export type DashboardPeriod = 7 | 30 | 90

export const dashboardPeriods = {
  7: {
    label: 'Últimos 7 dias',
    interval: '24–30 jun. 2026',
    revenue: 48360,
    users: 6446,
    orders: 372,
    conversion: 3.81,
    revenueTrend: 9.2,
    usersTrend: 6.4,
    ordersTrend: 5.6,
    conversionTrend: -0.12,
    goal: 50000,
  },
  30: {
    label: 'Últimos 30 dias',
    interval: '1–30 jun. 2026',
    revenue: 184620,
    users: 24892,
    orders: 1482,
    conversion: 3.64,
    revenueTrend: 12.8,
    usersTrend: 8.2,
    ordersTrend: 5.4,
    conversionTrend: -0.26,
    goal: 200000,
  },
  90: {
    label: 'Últimos 90 dias',
    interval: '2 abr.–30 jun. 2026',
    revenue: 536840,
    users: 67428,
    orders: 4296,
    conversion: 3.48,
    revenueTrend: 16.2,
    usersTrend: 11.5,
    ordersTrend: 7.8,
    conversionTrend: -0.08,
    goal: 600000,
  },
} as const

export const periodOptions = ([7, 30, 90] as const).map((days) => ({
  value: String(days),
  label: dashboardPeriods[days].label,
}))

export const formatCurrency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})
export const formatNumber = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

export function getDashboardMetrics(days: DashboardPeriod) {
  const period = dashboardPeriods[days]

  return [
    {
      id: 'revenue',
      label: 'Receita total',
      value: formatCurrency.format(period.revenue),
      trend: period.revenueTrend,
      unit: '%',
      tone: 'primary',
    },
    {
      id: 'users',
      label: 'Usuários ativos',
      value: formatNumber.format(period.users),
      trend: period.usersTrend,
      unit: '%',
      tone: 'info',
    },
    {
      id: 'orders',
      label: 'Pedidos',
      value: formatNumber.format(period.orders),
      trend: period.ordersTrend,
      unit: '%',
      tone: 'success',
    },
    {
      id: 'conversion',
      label: 'Taxa de conversão',
      value: `${formatNumber.format(period.conversion)}%`,
      trend: period.conversionTrend,
      unit: ' p.p.',
      tone: 'warning',
    },
  ] as const
}

export function exportDashboardMetrics(days: DashboardPeriod) {
  const rows = [
    ['Indicador', 'Valor', 'Variação', 'Período'],
    ...getDashboardMetrics(days).map(({ label, value, trend, unit }) => [
      label,
      value,
      `${formatNumber.format(trend)}${unit}`,
      dashboardPeriods[days].interval,
    ]),
  ]
  const csv =
    '\uFEFF' + rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(';')).join('\r\n')
  downloadFile(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `aurora-ops-indicadores-${days}-dias.csv`)
}
