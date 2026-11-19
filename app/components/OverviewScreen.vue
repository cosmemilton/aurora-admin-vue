<script setup lang="ts">
import { ArrowUpRight, ClipboardList, Clock3, Download, FolderKanban, GraduationCap, Headphones, ReceiptText, ShoppingBag, Sparkles, Target, UsersRound, Wallet } from 'lucide-vue-next'
import { CmBadge, CmBarChart, CmButton, CmCard, CmComparisonLineChart, CmDataTable, CmDonutChart, CmGridContainer, CmIconBadge, CmMetricCard, CmMetricGrid,
  CmNativeSelect, CmPage, CmPageHeader, CmProgress, CmRatioBar, CmRow, CmSectionHeader, CmStack, CmSummaryList, CmText, useCmToast } from '@cosmemilton/ui-vue'
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
const tickets = ticketStates.map(item => ({ id: item.label, ...item }))
const panelIcons = { cursos: GraduationCap, projetos: FolderKanban }
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const recentRows = recentOrders.map(order => ({
  id: order.id, cells: { id: '#' + order.id, name: order.customer, date: recentOrderDate.format(new Date(order.date)),
    total: { text: currency.format(order.total), sortValue: order.total }, status: { text: order.status, tone: order.tone } },
}))
const recentColumns = [
  { key: 'id', header: 'Pedido', sortable: true }, { key: 'name', header: 'Cliente', sortable: true },
  { key: 'date', header: 'Data', sortable: true }, { key: 'total', header: 'Valor', sortable: true, align: 'right' as const },
  { key: 'status', header: 'Situação', sortable: true },
]
function recentValue(value: unknown) {
  return typeof value === 'object' && value !== null ? value as {text: string; tone?: string} : { text: String(value) }
}
</script>

<template>
  <CmPage id="visao-geral" padding="none" gap="lg">
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
    <section id="analise" class="aurora-overview-charts" aria-label="Análise de desempenho">
      <CmCard>
        <CmComparisonLineChart :key="days" :data="points" :left-axis="{ label: 'Receita', domain: [0, report.revenueCeiling], valueFormat: formatCurrency.format, tickFormat: compact.format }"
          :right-axis="{ label: 'Pedidos', domain: [0, report.orderCeiling], tone: 'primary-soft', valueFormat: formatNumber.format }"
          title="Receita e pedidos" description="Receita em reais e volume de pedidos" accessible-table-label="Receita e pedidos no período" :height="216" />
      </CmCard>
      <CmCard><CmDonutChart :data="traffic" title="Tráfego do site" description="Sessões por canal de aquisição" total-label="sessões" variant="segmented" legend-layout="list" accessible-table-label="Sessões e participação por canal" :value-format="formatNumber.format" /></CmCard>
    </section>
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
        <CmCard id="vendas"><template #header><CmSectionHeader title="Pipeline de vendas" description="Oportunidades por etapa" /></template><CmBarChart :data="[...pipeline]" /></CmCard>
        <CmCard id="suporte">
          <template #header><CmSectionHeader title="Central de suporte" description="Situação dos chamados">
            <template #icon><Headphones :size="18" aria-hidden="true" /></template>
          </CmSectionHeader></template>
          <CmStack gap="md">
            <CmRatioBar :segments="tickets" :height="10" aria-hidden="true" />
            <CmSummaryList :divided="false" :items="tickets.map(item => ({ ...item, emphasis: true }))" />
          </CmStack>
          <template #footer>
            <CmRow full-width align="center" justify="between" gap="sm" wrap>
              <CmRow align="center" gap="xs"><Clock3 :size="14" aria-hidden="true" /><CmText size="xs">Tempo médio de primeira resposta</CmText></CmRow>
              <CmText size="sm" weight="bold">{{ supportResponseTime }}</CmText>
            </CmRow>
          </template>
        </CmCard>
        <CmCard v-for="panel in progressPanels" :id="panel.id" :key="panel.id">
          <template #header><CmSectionHeader :title="panel.title" :description="panel.description" /></template>
          <CmStack gap="md" role="list">
            <CmRow v-for="item in panel.items" :key="item.title" role="listitem" gap="sm" align="center">
              <CmIconBadge tone="primary"><component :is="panelIcons[panel.id]" :size="16" /></CmIconBadge>
              <CmStack grow gap="xs"><CmProgress :value="item.progress" :label="item.title" show-value /><CmText size="xs" tone="muted">{{ item.detail }}</CmText></CmStack>
            </CmRow>
          </CmStack>
        </CmCard>
        <CmCard><template #header><CmSectionHeader title="Pedidos recentes" description="Últimas transações registradas" /></template>
          <CmDataTable :columns="recentColumns" :rows="recentRows" :pagination="false" :min-width="500" label="Pedidos recentes">
            <template #cell="{ value }"><CmBadge v-if="recentValue(value).tone" :tone="recentValue(value).tone">{{ recentValue(value).text }}</CmBadge><span v-else>{{ recentValue(value).text }}</span></template>
          </CmDataTable>
        </CmCard>
        <CmCard id="atividade"><template #header><CmSectionHeader title="Atividade recente" :description="activityDate" /></template>
          <CmStack role="list" gap="md">
            <CmRow v-for="item in activity" :key="item.label" gap="sm" align="center" role="listitem">
              <CmIconBadge :tone="item.tone"><Clock3 :size="15" /></CmIconBadge>
              <CmStack gap="none" grow><CmText weight="semibold">{{ item.title }}</CmText><CmText size="xs" tone="muted">{{ item.description }}</CmText></CmStack>
              <CmText size="sm" tone="muted">{{ item.label }}</CmText>
            </CmRow>
          </CmStack>
        </CmCard>
      </CmGridContainer>
      <CmMetricGrid label="Indicadores operacionais"><CmMetricCard v-for="item in secondaryMetrics" :key="item.title" :title="item.title" :value="item.value" :description="item.description" :tone="item.tone" /></CmMetricGrid>
    </CmStack>
  </CmPage>
</template>