<script setup lang="ts">
import { ArrowDownLeft, ArrowUpRight, ChartNoAxesCombined, Wallet } from 'lucide-vue-next'
import { CmLineChart, CmCard, CmDataTable, CmGridContainer, CmMetricCard, CmMetricGrid, CmNativeSelect, CmPage, CmPageHeader,
  CmSectionHeader, CmStack, CmSummaryList, CmText } from '@cosmemilton/ui-vue'
import { financeBalance, financeCompactMoney, financeDate, financeDateLabel, financeMoney, financeShortDate, sumFinance } from '../core/financeiro'
import { useAuroraData } from '../composables/useAuroraData'
const { entries } = useAuroraData()
const horizon = ref('30')
const days = computed(() => Number(horizon.value))
const realized = computed(() => financeBalance(entries.value))
const pending = computed(() => entries.value.filter(entry => !entry.settledDate))
const end = computed(() => financeDate(days.value - 1))
const overdue = computed(() => pending.value.filter(entry => entry.dueDate < financeDate()))
const included = computed(() => pending.value.filter(entry => entry.dueDate <= end.value))
const inflow = computed(() => sumFinance(included.value, 'entrada'))
const outflow = computed(() => sumFinance(included.value, 'saida'))
const weeks = computed(() => {
  let balance = realized.value
  const result = []
  for (let offset = 0; offset < days.value; offset += 7) {
    const start = financeDate(offset)
    const end = financeDate(Math.min(offset + 6, days.value - 1))
    const due = pending.value.filter(entry => entry.dueDate <= end && (offset === 0 || entry.dueDate >= start))
    const inflow = sumFinance(due, 'entrada')
    const outflow = sumFinance(due, 'saida')
    const opening = balance
    balance += inflow - outflow
    result.push({ start, end, inflow, outflow, opening, balance })
  }
  return result
})
const lowest = computed(() => weeks.value.reduce((result, week) => week.balance < result.balance ? week : result, weeks.value[0]!))
const forecast = computed(() => weeks.value.map(week => ({
  label: financeShortDate(week.end), value: week.balance, tone: week.balance < 0 ? 'danger' : 'primary',
})))
const rows = computed(() => weeks.value.map(week => ({ id: week.start, cells: {
  start: financeShortDate(week.start) + ' a ' + financeShortDate(week.end),
  opening: financeMoney(week.opening), inflow: financeMoney(week.inflow), outflow: financeMoney(week.outflow), balance: financeMoney(week.balance),
} })))
const columns = [{ key: 'start', header: 'Semana' },
  ...Object.entries({ opening: 'Saldo inicial', inflow: 'Entradas previstas', outflow: 'Saídas previstas', balance: 'Saldo final' })
    .map(([key, header]) => ({ key, header, align: 'right' as const }))]
const options = [30,60,90].map(value => ({ label: 'Próximos ' + value + ' dias', value: String(value) }))
const projectionSummary = computed(() => [
  { label: 'Menor saldo semanal', value: financeMoney(lowest.value.balance), detail: 'Em '+financeDateLabel(lowest.value.end) },
  { label: 'Contas vencidas a receber', value: financeMoney(sumFinance(overdue.value,'entrada')) },
  { label: 'Contas vencidas a pagar', value: financeMoney(sumFinance(overdue.value,'saida')) },
])
</script>

<template>
  <CmPage padding="none" gap="lg">
    <CmPageHeader title="Fluxo de caixa" description="Veja o saldo acumulado se os recebimentos e pagamentos em aberto forem liquidados no vencimento." layout="wrap">
      <template #actions><NuxtLink to="/app/financeiro/lancamentos" class="cm-link cm-link--button">Ver lançamentos</NuxtLink></template>
    </CmPageHeader>
    <CmMetricGrid label="Indicadores de fluxo de caixa">
      <CmMetricCard title="Saldo realizado" :value="financeMoney(realized)" description="Movimentações já liquidadas"><template #icon><Wallet :size="19" /></template></CmMetricCard>
      <CmMetricCard title="Entradas previstas" :value="financeMoney(inflow)" :description="'No horizonte de ' + days + ' dias'" tone="success"><template #icon><ArrowDownLeft :size="19" /></template></CmMetricCard>
      <CmMetricCard title="Saídas previstas" :value="financeMoney(outflow)" :description="'No horizonte de ' + days + ' dias'" tone="warning"><template #icon><ArrowUpRight :size="19" /></template></CmMetricCard>
      <CmMetricCard title="Saldo ao fim do período" :value="financeMoney(realized + inflow - outflow)" :description="'Projeção em ' + financeDateLabel(end)" tone="primary" variant="gradient"><template #icon><ChartNoAxesCombined :size="19" /></template></CmMetricCard>
    </CmMetricGrid>
    <CmGridContainer auto-fit min-column-width="26rem">
      <CmCard>
        <template #header><CmSectionHeader title="Evolução do saldo previsto" description="Saldo no fim de cada semana, com os lançamentos em atraso na primeira semana." /></template>
        <CmLineChart :data="forecast" :value-format="financeCompactMoney" :height="210" area />
      </CmCard>
      <CmCard>
        <template #header><CmSectionHeader title="Detalhes da projeção" /></template>
        <CmStack gap="md">
          <CmNativeSelect id="finance-projection-horizon" v-model="horizon" label="Horizonte da projeção" :options="options" />
          <CmSummaryList class="cm-summary-list--rows cm-summary-list--divided">
            <div v-for="item in projectionSummary" :key="item.label" class="cm-summary-list__item">
              <dt class="cm-summary-list__label">{{ item.label }}</dt><dd class="cm-summary-list__value">
                <CmStack v-if="item.detail" gap="xs"><CmText weight="bold">{{ item.value }}</CmText><CmText size="sm" tone="muted">{{ item.detail }}</CmText></CmStack>
                <template v-else>{{ item.value }}</template>
              </dd>
            </div>
          </CmSummaryList>
        </CmStack>
      </CmCard>
    </CmGridContainer>
    <CmCard>
      <template #header><CmSectionHeader title="Movimentação semanal" description="Valores previstos pela data de vencimento." /></template>
      <CmDataTable :rows="rows" :columns="columns" :pagination="false" :column-settings="false" :min-width="620" label="Projeção semanal do fluxo de caixa" />
    </CmCard>
  </CmPage>
</template>
