<script setup lang="ts">
import { ChevronDown, Download } from 'lucide-vue-next'
import { CmButton, CmButtonGroup, CmCard, CmCol, CmDataTable, CmDropdownMenu, CmPage, CmPageHeader, CmRow, CmStack,
  CmText, useCmToast } from '@cosmemilton/ui-vue'
import { downloadReport, getReport, reportRows, reportTotals, type ReportCell, type ReportFormat } from '../core/reports'
import { useAuroraData } from '../composables/useAuroraData'
import StatusFilter from './StatusFilter.vue'

const props = defineProps<{ path: string }>()
const { inventory, entries, serviceOrders } = useAuroraData()
const status = ref('')
const { toast } = useCmToast()
const report = computed(() => getReport(props.path, { inventory: inventory.value, entries: entries.value, orders: serviceOrders.value })!)
const matching = computed(() => reportRows(report.value, status.value))
const tableRows = computed(() => matching.value.map(row => ({
  id: row.id, cells: Object.fromEntries(report.value.columns.map((column, index) => [column.key, row.cells[index]])),
})))
const totals = computed(() => reportTotals(report.value, matching.value))
const settings = computed(() => report.value.statusOptions.map(value => ({ value, label: value })))
function save(format: ReportFormat) {
  try {
    downloadReport(report.value, status.value, format)
    toast('Download do relatório em ' + format.toUpperCase() + ' iniciado.', { tone: 'success' })
  } catch (error) {
    toast(error instanceof Error ? error.message : 'Falha ao exportar o relatório.', { tone: 'danger' })
  }
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
        <CmButtonGroup aria-label="Exportação do relatório">
          <CmButton tone="primary" :disabled="!matching.length" @click="save('pdf')"><template #icon><Download :size="16" /></template>Exportar PDF</CmButton>
          <CmDropdownMenu :items="exportItems">
            <template #trigger="{ triggerAttrs }">
              <CmButton v-bind="triggerAttrs" tone="primary" icon-only :disabled="!matching.length" aria-label="Outros formatos">
                <template #icon><ChevronDown :size="16" aria-hidden="true" /></template>
              </CmButton>
            </template>
          </CmDropdownMenu>
        </CmButtonGroup>
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
        <CmDataTable :rows="tableRows" :columns="report.columns" :table-key="path" :page-size="12" :page-sizes="[12, 24, 48]"
          :column-settings="false" :label="report.name" :min-width="760" density="compact" empty-title="Nenhum registro encontrado">
          <template #cell="{ value }">{{ (value as ReportCell)?.formatted }}</template>
          <template v-if="totals" #totals="{ columns }">
            <tr><td v-for="(column, index) in columns" :key="column.key" class="cm-data-table__cell"
              :class="column.align && 'cm-data-table__cell--' + column.align">{{ totals[Number(index)] }}</td></tr>
          </template>
        </CmDataTable>
      </CmStack>
    </CmCard>
  </CmPage>
</template>