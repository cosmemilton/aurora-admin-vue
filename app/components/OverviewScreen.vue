<script setup lang="ts">
import { ArrowUpRight, BookOpen, Check, ClipboardList, Clock3, Download, FolderKanban, GraduationCap, Headphones, Layers3, LifeBuoy, ReceiptText, ShoppingBag, Sparkles, Target, UsersRound, Wallet } from 'lucide-vue-next'
import { CmAvatar, CmBadge, CmBarChart, CmButton, CmCard, CmComparisonLineChart, CmDataTable, CmDonutChart, CmGridContainer, CmIconBadge, CmMetricCard, CmMetricGrid,
  CmNativeSelect, CmPage, CmPageHeader, CmPanel, CmProgress, CmRatioBar, CmRow, CmSectionHeader, CmStack, CmSummaryList, CmText, CmTimeline, useCmToast } from '@cosmemilton/ui-vue'
import { dashboardPeriods, getDashboardMetrics, exportDashboardMetrics, formatCurrency, formatNumber, periodOptions, type DashboardPeriod } from '../core/dashboard'
import { pipeline, ticketStates, supportResponseTime, progressPanels, recentOrders, recentOrderDate, activity, activityDate, secondaryMetrics } from '../core/dashboardOperations'

const days = ref('30')
const period = computed(() => Number(days.value) as DashboardPeriod)
const summary = computed(() => dashboardPeriods[period.value])
const metrics = computed(() => getDashboardMetrics(period.value))
const icons = { revenue: Wallet, users: UsersRound, orders: ShoppingBag, conversion: Target }
const { toast } = useCmToast()
const shortcuts = [
  { to: '/app/crm/oportunidades', title: 'Oportunidades', area: 'CRM', icon: Target, tone: 'primary' },
  { to: '/app/erp/pedidos', title: 'Pedidos', area: 'ERP', icon: ShoppingBag, tone: 'success' },
  { to: '/app/financeiro/lancamentos', title: 'Lançamentos', area: 'Financeiro', icon: ReceiptText, tone: 'info' },
  { to: '/app/servicos/ordens', title: 'Ordens de serviço', area: 'Serviços', icon: ClipboardList, tone: 'warning' },
]
const reporting = {
  7: { revenueCeiling: 16000, orderCeiling: 100, sessions: 12480, revenue: [6,7,5,9,8,11,12], orders: [4,6,5,7,6,8,9], shares: [40,29,19,12] },
  30: { revenueCeiling: 60000, orderCeiling: 400, sessions: 48562, revenue: [10,17,14,23,19,29,26,35], orders: [7,11,12,16,12,19,17,23], shares: [43,29,17,11] },
  90: { revenueCeiling: 120000, orderCeiling: 1000, sessions: 142853, revenue: [17,23,19,25,24,27,31,38], orders: [12,13,17,15,18,21,22,24], shares: [39,28,21,12] },
}
const report = computed(() => reporting[period.value])
function distribute(total: number, weights: number[]) {
  const overall = weights.reduce((sum, value) => sum + value, 0)
  let passed = 0, allocated = 0
  return weights.map(weight => {
    passed += weight
    const next = Math.round(total * passed / overall)
    const amount = next - allocated
    allocated = next
    return amount
  })
}
const shortDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
const longDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', timeZone: 'UTC' })
const points = computed(() => {
  const revenue = distribute(summary.value.revenue, report.value.revenue)
  const orders = distribute(summary.value.orders, report.value.orders)
  return revenue.map((left, index) => {
    const day = 30 - (period.value - 1) + Math.round(index * (period.value - 1) / (revenue.length - 1))
    const date = new Date(Date.UTC(2026, 5, day))
    return { left, right: orders[index]!, label: shortDate.format(date), description: longDate.format(date) }
  })
})
const traffic = computed(() => distribute(report.value.sessions, report.value.shares).map((value, index) => ({
  label: ['Direto','Busca orgânica','Redes sociais','Referências'][index]!,
  tone: ['primary','primary-soft','success','warning'][index]!, value,
})))
const compact = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 })
function exportMetrics() {
  try { exportDashboardMetrics(period.value); toast('Download dos indicadores em CSV iniciado.', { tone: 'success' }) }
  catch { toast('Falha ao gerar o CSV. Tente exportar novamente.', { tone: 'danger' }) }
}
const ticketSegments = ticketStates.map(({ label: id, tone, value }) => ({ id, tone, value }))
const ticketSummary = ticketStates.map(item => ({ ...item, emphasis: true }))
const operationIcons = { 'graduation-cap': GraduationCap, 'folder-kanban': FolderKanban, 'layers-3': Layers3, 'book-open': BookOpen,
  'shopping-bag': ShoppingBag, headphones: Headphones, check: Check, 'users-round': UsersRound, 'receipt-text': ReceiptText, 'life-buoy': LifeBuoy }
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const recentRows = recentOrders.map(order => ({
  id: order.id, cells: { id: { text: '#' + order.id, sortValue: Number(order.id) }, customer: { text: order.customer, initials: order.initials },
    date: { text: recentOrderDate.format(new Date(order.date)), sortValue: order.date },
    total: { text: currency.format(order.total), sortValue: order.total }, status: { text: order.status, tone: order.tone } },
}))
const recentColumns = [
  { key: 'id', header: 'Pedido', sortable: true, hideable: false }, { key: 'customer', header: 'Cliente', sortable: true },
  { key: 'date', header: 'Data', sortable: true }, { key: 'total', header: 'Valor', sortable: true, align: 'right' as const },
  { key: 'status', header: 'Situação', sortable: true },
]
function recentValue(value: unknown) {
  return typeof value === 'object' && value !== null ? value as {text: string; tone?: string; initials?: string} : { text: String(value) }
}
</script>

<template>
  <CmPage id="visao-geral" as="section" full-width padding="none" gap="lg">
    <CmPageHeader title="Visão geral" :description="'Desempenho da operação · ' + summary.interval" layout="wrap">
      <template #actions>
        <CmRow align="end" gap="sm" wrap>
          <CmNativeSelect id="overview-period" v-model="days" label="Período do dashboard" :options="periodOptions" />
          <CmButton tone="primary" @click="exportMetrics"><template #icon><Download :size="16" /></template>Exportar CSV</CmButton>
        </CmRow>
      </template>
    </CmPageHeader>
    <CmCard variant="gradient" tone="primary" pattern="orbits" padding="lg" role="region" aria-labelledby="overview-goal-title">
      <CmStack gap="xs">
        <CmRow align="center" gap="xs"><Sparkles :size="15" /><CmText size="xs" weight="semibold" tone="inherit">Destaque do período</CmText></CmRow>
        <CmText id="overview-goal-title" as="h2" size="3xl" weight="extrabold" tracking="tight" family="heading" tone="inherit">Meta de receita ao alcance</CmText>
        <CmText tone="inherit">Faltam {{ formatCurrency.format(summary.goal - summary.revenue) }} para atingir a meta.</CmText>
      </CmStack>
      <template #aside>
        <CmStack gap="sm">
          <CmProgress tone="inherit" label="Meta de receita" :value="summary.revenue" :max="summary.goal" show-value />
          <CmText size="xs" tone="inherit">{{ formatCurrency.format(summary.revenue) }} de {{ formatCurrency.format(summary.goal) }}</CmText>
        </CmStack>
      </template>
    </CmCard>
    <CmMetricGrid label="Indicadores principais" aria-live="polite">
      <CmMetricCard v-for="item in metrics" :key="item.id" :title="item.label" :value="item.value" :tone="item.tone" variant="gradient"
        :trend="{ value: item.trend, formattedValue: formatNumber.format(Math.abs(item.trend)) + item.unit, label: 'vs. período anterior' }">
        <template #icon><component :is="icons[item.id as keyof typeof icons]" :size="18" /></template>
      </CmMetricCard>
    </CmMetricGrid>
    <CmGridContainer as="section" id="analise" aria-label="Análise de desempenho" spacing="md"
      :template-columns="{ base: 'minmax(0, 1fr)', xl: 'minmax(0, 1.95fr) minmax(0, 1fr)' }">
      <CmCard>
        <CmComparisonLineChart :key="days" :data="points" curve="smooth" x-labels="responsive" legend-position="header"
          :left-axis="{ label: 'Receita', domain: [0, report.revenueCeiling], area: true, valueFormat: formatCurrency.format, tickFormat: compact.format }"
          :right-axis="{ label: 'Pedidos', domain: [0, report.orderCeiling], tone: 'primary-soft', valueFormat: formatNumber.format }"
          title="Receita e pedidos" description="Receita em reais e volume de pedidos" accessible-table-label="Receita e pedidos no período" :height="216" />
      </CmCard>
      <CmCard><CmDonutChart :data="traffic" title="Tráfego do site" description="Sessões por canal de aquisição" total-label="sessões" variant="segmented" legend-layout="list" accessible-table-label="Sessões e participação por canal" :value-format="formatNumber.format" /></CmCard>
    </CmGridContainer>
    <CmStack as="section" gap="md" aria-label="Acesso rápido">
      <CmSectionHeader title="Acesso rápido" />
      <CmGridContainer :columns="{ base: 1, sm: 2, xl: 4 }" spacing="md">
        <NuxtLink v-for="item in shortcuts" :key="item.to" :to="item.to" class="cm-link cm-link--card">
          <CmRow align="center" full-width gap="sm">
            <CmIconBadge :tone="item.tone"><component :is="item.icon" :size="18" /></CmIconBadge>
            <CmStack grow :min-width="0" gap="none">
              <CmText weight="semibold" wrap="anywhere">{{ item.title }}</CmText><CmText size="xs" tone="muted">{{ item.area }}</CmText>
            </CmStack>
            <ArrowUpRight :size="15" aria-hidden="true" />
          </CmRow>
        </NuxtLink>
      </CmGridContainer>
    </CmStack>
    <CmStack as="section" gap="md" aria-label="Operações">
      <CmSectionHeader title="Operações" />
      <CmGridContainer :columns="{ base: 1, lg: 2 }" spacing="md">
        <CmPanel id="vendas" title="Pipeline de vendas" :heading-level="3" description="Oportunidades por etapa">
          <template #icon><Target :size="18" /></template>
          <CmBarChart :data="[...pipeline]" orientation="horizontal" bar-thickness="sm" legend show-values
            accessible-table-label="Quantidade de oportunidades por etapa do pipeline" />
        </CmPanel>
        <CmPanel id="suporte" title="Central de suporte" :heading-level="3" description="Situação dos chamados">
          <template #icon><Headphones :size="18" /></template>
          <CmStack gap="md">
            <CmRatioBar :segments="ticketSegments" :height="10" aria-hidden="true" />
            <CmSummaryList :divided="false" :items="ticketSummary" />
          </CmStack>
          <template #footer>
            <CmRow full-width align="center" justify="between" gap="sm" wrap>
              <CmRow align="center" gap="xs"><Clock3 :size="14" aria-hidden="true" /><CmText size="xs">Tempo médio de primeira resposta</CmText></CmRow>
              <CmText size="sm" weight="bold">{{ supportResponseTime }}</CmText>
            </CmRow>
          </template>
        </CmPanel>
        <CmPanel v-for="panel in progressPanels" :id="panel.id" :key="panel.id" :title="panel.title" :description="panel.description" :heading-level="3">
          <template #icon><component :is="operationIcons[panel.icon]" :size="18" /></template>
          <CmStack gap="md" role="list">
            <CmRow v-for="item in panel.items" :key="item.title" role="listitem" gap="sm" align="center">
              <CmAvatar v-if="'initials' in item" size="sm" :fallback="item.initials" aria-hidden="true" />
              <CmIconBadge v-else size="sm" aria-hidden="true"><component :is="operationIcons[item.icon]" :size="16" /></CmIconBadge>
              <CmStack grow :min-width="0" gap="xs"><CmProgress :value="item.progress" :label="item.title" show-value /><CmText size="xs" tone="muted">{{ item.detail }}</CmText></CmStack>
            </CmRow>
          </CmStack>
        </CmPanel>
      </CmGridContainer>
      <CmGridContainer spacing="md" :template-columns="{ base: 'minmax(0, 1fr)', xl: 'minmax(0, 1.6fr) minmax(0, 1fr)' }">
        <CmCard id="pedidos" role="region" aria-label="Pedidos recentes">
          <CmDataTable title="Pedidos recentes" description="Últimas transações registradas" :columns="recentColumns" :rows="recentRows"
            table-key="aurora.dashboard.pedidos-recentes" default-sort-key="date" default-sort-direction="desc" :pagination="false" :min-width="500" label="Pedidos recentes">
            <template #cell="{ value }">
              <CmRow v-if="recentValue(value).initials" align="center" gap="xs">
                <CmAvatar size="xs" :fallback="recentValue(value).initials" aria-hidden="true" />{{ recentValue(value).text }}
              </CmRow>
              <CmBadge v-else-if="recentValue(value).tone" :tone="recentValue(value).tone">{{ recentValue(value).text }}</CmBadge>
              <template v-else>{{ recentValue(value).text }}</template>
            </template>
          </CmDataTable>
        </CmCard>
        <CmPanel id="atividade" title="Atividade recente" :heading-level="3" :description="activityDate">
          <template #icon><Clock3 :size="18" /></template>
          <CmTimeline :items="activity" :label-width="44">
            <template #label="{ item }"><CmText as="time" :datetime="'2026-06-25T' + item.label + ':00-03:00'" inline size="xs">{{ item.label }}</CmText></template>
            <template #marker="{ item }"><component :is="operationIcons[item.icon as keyof typeof operationIcons]" :size="item.id === 'case' || item.id === 'purchase' ? 13 : 14" /></template>
          </CmTimeline>
        </CmPanel>
      </CmGridContainer>
      <CmMetricGrid label="Indicadores complementares">
        <CmMetricCard v-for="item in secondaryMetrics" :key="item.title" :title="item.title" :value="item.value" :description="item.description" :tone="item.tone">
          <template #icon><component :is="operationIcons[item.icon]" :size="16" aria-hidden="true" /></template>
        </CmMetricCard>
      </CmMetricGrid>
    </CmStack>
  </CmPage>
</template>
