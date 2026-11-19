export const pipelineStages = [
  { id: 'contato', label: 'Primeiro contato', value: 42, tone: 'info' },
  { id: 'proposta', label: 'Proposta', value: 28, tone: 'primary' },
  { id: 'contrato', label: 'Contrato', value: 14, tone: 'success' },
]

export const weeklyPoints = [
  { id: 'sem1', label: 'Sem. 1', left: 8200, right: 12 },
  { id: 'sem2', label: 'Sem. 2', left: 9100, right: 16 },
  { id: 'sem3', label: 'Sem. 3', left: 7900, right: 13 },
  { id: 'sem4', label: 'Sem. 4', left: 12300, right: 21 },
]

const reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export const revenueAxis = { label: 'Receita', valueFormat: reais.format, tickFormat: reais.format, area: true, tone: 'primary' }
export const orderAxis = { label: 'Pedidos', tone: 'info', domain: [0, 30] as [number, number] }

const stageExample = ":data=\"[{ label: 'Primeiro contato', value: 42, tone: 'info' }, { label: 'Proposta', value: 28, tone: 'primary' }, { label: 'Contrato', value: 14, tone: 'success' }]\""
export const chartMarkup: Record<string, string> = {
  CmBarChart: '<CmBarChart title="Pipeline comercial" orientation="horizontal" bar-thickness="sm" legend\n    ' + stageExample + ' />',
  CmDonutChart: '<CmDonutChart title="Carteira por etapa" variant="segmented" legend-layout="list"\n    ' + stageExample + ' />',
  CmComparisonLineChart: `<CmComparisonLineChart title="Receita e pedidos"
    :data="[{ label: 'Sem. 1', left: 8200, right: 12 }, { label: 'Sem. 2', left: 9100, right: 16 }]"
    :left-axis="{ label: 'Receita (R$)' }" :right-axis="{ label: 'Pedidos' }" />`,
}
