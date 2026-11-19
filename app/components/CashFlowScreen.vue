<script setup lang="ts">
import { ArrowDownLeft, ArrowUpRight, ChartNoAxesCombined, Wallet } from 'lucide-vue-next'
import { CmLineChart, CmCard, CmDataTable, CmGridContainer, CmMetricCard, CmMetricGrid, CmNativeSelect, CmPage, CmPageHeader,
  CmRow, CmSectionHeader, CmStack, CmText } from '@cosmemilton/ui-vue'
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
const options = [15,30,60,90].map(value => ({ label: value + ' dias', value: String(value) }))
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
    <CmGridContainer :columns="{ base: 1, lg: 2 }">
      <CmCard>
        <template #header><CmSectionHeader title="Evolução do saldo previsto" description="Saldo no fim de cada semana, com os lançamentos em atraso na primeira semana." /></template>
        <CmLineChart :data="forecast" :value-format="financeCompactMoney" area />
      </CmCard>
      <CmCard>
        <template #header><CmSectionHeader title="Detalhes da projeção" /></template>
        <CmStack gap="md">
          <CmNativeSelect id="finance-projection-horizon" v-model="horizon" label="Horizonte da projeção" :options="options" />
          <CmRow justify="between"><CmText tone="muted">Menor saldo previsto</CmText><CmText weight="bold">{{ financeMoney(lowest.balance) }}</CmText></CmRow>
          <CmRow justify="between"><CmText tone="muted">Lançamentos em atraso</CmText><CmText weight="bold">{{ overdue.length }}</CmText></CmRow>
        </CmStack>
      </CmCard>
    </CmGridContainer>
    <CmCard>
      <template #header><CmSectionHeader title="Movimentação semanal" description="Valores previstos pela data de vencimento." /></template>
      <CmDataTable :rows="rows" :columns="columns" :page-sizes="[20]" :page-size="20" :column-settings="false" :min-width="550" label="Movimentação semanal" />
    </CmCard>
  </CmPage>
</template>