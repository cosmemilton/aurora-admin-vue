<script setup lang="ts">
import { Download, FileSearch } from 'lucide-vue-next'
import { CmButton, CmCard, CmCol, CmDataTable, CmPage, CmPageHeader, CmRow, CmSplitButton, CmStack,
  CmText, useCmToast } from '@cosmemilton/ui-vue'
import { downloadReport, getReport, reportRows, reportTotals, type ReportCell, type ReportFormat } from '../core/reports'
import { useAuroraData } from '../composables/useAuroraData'
import StatusFilter from './StatusFilter.vue'

const props = defineProps<{ path: string }>()
const { inventory, entries, serviceOrders } = useAuroraData()
const status = ref('')
const exporting = ref(false)
const { toast } = useCmToast()
const report = computed(() => getReport(props.path, { inventory: inventory.value, entries: entries.value, orders: serviceOrders.value })!)
const matching = computed(() => reportRows(report.value, status.value))
const tableRows = computed(() => matching.value.map(row => ({
  id: row.id, cells: Object.fromEntries(report.value.columns.map((column, index) => [column.key, row.cells[index]])),
})))
const totals = computed(() => reportTotals(report.value, matching.value))
const tableColumns = computed(() => report.value.columns.map((column, index) => ({ ...column, footer: totals.value?.[index] })))
const settings = computed(() => report.value.statusOptions.map(value => ({ value, label: value })))
const disabled = computed(() => exporting.value || !matching.value.length)
async function save(format: ReportFormat) {
  if (disabled.value) return
  const target = report.value
  const label = format.toUpperCase()
  exporting.value = true
  try {
    await downloadReport(target, status.value, format)
    toast(`Download de ${target.name} em ${label} iniciado.`, { tone: 'success' })
  } catch {
    toast(`Falha ao gerar o ${label}. Tente exportar novamente.`, { tone: 'danger' })
  } finally { exporting.value = false }
}
const exportItems = [
  { id: 'csv', label: 'Baixar CSV', onSelect: () => save('csv') },
  { id: 'json', label: 'Baixar JSON', onSelect: () => save('json') },
]
</script>

<template>
  <CmPage padding="none" gap="lg">
    <CmPageHeader :title="report.name" :description="report.description" layout="wrap">
      <template #actions>
        <CmSplitButton aria-label="Exportação do relatório" label="Exportar PDF" menu-label="Outros formatos"
          tone="primary" menu-variant="solid" :items="exportItems" :disabled="disabled" :loading="exporting"
          loading-label="Gerando arquivo" @click="save('pdf')">
          <template #icon><Download :size="16" aria-hidden="true" /></template>
        </CmSplitButton>
      </template>
    </CmPageHeader>
    <CmCard body-padding="md">
      <CmStack gap="md">
        <CmRow align="end" justify="between" gap="md" wrap>
          <CmCol grow width="12rem" max-width="min(100%, 16rem)">
            <StatusFilter id="report-status" v-model="status" :options="settings" />
          </CmCol>
          <CmText inline tone="muted" aria-live="polite">{{ matching.length }} {{ matching.length === 1 ? 'registro' : 'registros' }}</CmText>
        </CmRow>
        <CmDataTable :rows="tableRows" :columns="tableColumns" :page-reset-key="status" :page-size="12" :page-sizes="[12, 24, 48]"
          :column-settings="false" :label="report.name" :min-width="760" density="compact" empty-title="Nenhum registro encontrado"
          :empty-description="status ? 'Consulte as demais situações para ver outros registros.' : 'Os registros cadastrados no módulo aparecem aqui.'">
          <template #cell="{ value }">{{ (value as ReportCell)?.formatted || '—' }}</template>
          <template #emptyIcon><FileSearch aria-hidden="true" /></template>
          <template v-if="status" #emptyActions><CmButton tone="primary" @click="status = ''">Limpar filtro</CmButton></template>
        </CmDataTable>
      </CmStack>
    </CmCard>
  </CmPage>
</template>
