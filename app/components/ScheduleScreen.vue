<script setup lang="ts">
import { CalendarPlus } from 'lucide-vue-next'
import { CmBadge, CmButton, CmCard, CmDataTable, CmDialog, CmForm, CmFormActions, CmGridContainer, CmNativeInput, CmNativeSelect,
  CmPage, CmPageHeader, CmSectionHeader, CmStack, useCmToast } from '@cosmemilton/ui-vue'
import { compareAppointments, displayDate, localDate, orderCode, statusTones, technicians, type ServiceOrder } from '../core/servicos'
import { useAuroraData } from '../composables/useAuroraData'
const { serviceOrders } = useAuroraData()
const route = useRoute()
const router = useRouter()
const { toast } = useCmToast()
const currentDate = ref(localDate())
const technician = ref('')
const form = reactive({ technician: '', date: '', time: '' })
const formId = useId()
const eligible = computed(() => serviceOrders.value.filter(item => item.status !== 'Concluída'))
const next = computed(() => eligible.value.find(item => item.status === 'Aberta') ?? eligible.value[0])
const selected = computed(() => eligible.value.find(item => String(item.id) === String(route.query.ordem ?? '')))
const appointments = computed(() => serviceOrders.value.filter(item => item.date && item.date === currentDate.value &&
  (!technician.value || item.technician === technician.value)).sort(compareAppointments))
const rows = computed(() => appointments.value.map(item => ({ id: item.id, cells: {
  time: item.time, service: item.service, client: item.client, technician: item.technician, status: item.status,
  id: orderCode(item.id),
} })))
const columns = [
  { key: 'time', header: 'Horário', sortable: true, hideable: false },
  { key: 'service', header: 'Serviço', sortable: true }, { key: 'client', header: 'Cliente', sortable: true },
  { key: 'technician', header: 'Técnico', sortable: true }, { key: 'status', header: 'Situação' }, { key: 'id', header: 'Ordem', hideable: false },
]
const team = [{ value: '', label: 'Toda a equipe' }, ...technicians.map(value => ({ value, label: value }))]
const allTechnicians = [{ value: '', label: 'Selecione um técnico' }, ...team.slice(1)]
watch(selected, item => {
  if (item) Object.assign(form, { technician: item.technician, date: item.date || currentDate.value, time: item.time })
}, { immediate: true })
function choose(item?: ServiceOrder) {
  if (!item) return
  void router.replace({ query: { ...route.query, ordem: String(item.id) } })
}
function close() { void router.replace({ query: { ...route.query, ordem: undefined } }) }
function save() {
  const item = selected.value
  if (!item || !form.date || !form.time || !form.technician) return
  if (serviceOrders.value.some(order => order.id !== item.id && order.status !== 'Concluída' &&
    order.date === form.date && order.time === form.time && order.technician === form.technician)) {
    toast('Já existe um atendimento para este técnico neste horário.', { tone: 'danger' }); return
  }
  serviceOrders.value = serviceOrders.value.map(order => order.id === item.id ? { ...item, ...form, status: 'Agendada' } : order)
  currentDate.value = form.date
  toast('Agendamento salvo.', { tone: 'success' })
  close()
}
</script>

<template>
  <CmPage padding="none" gap="lg">
    <CmPageHeader title="Agenda técnica" description="Distribua os atendimentos por técnico, data e horário." layout="wrap">
      <template #actions><CmButton tone="primary" :disabled="!next" @click="choose(next)"><template #icon><CalendarPlus :size="16" /></template>Agendar atendimento</CmButton></template>
    </CmPageHeader>
    <CmCard body-padding="md">
      <template #header>
        <CmSectionHeader :title="currentDate ? 'Visitas de ' + displayDate(currentDate) : 'Selecione a data da visita'"
          :description="appointments.length + (appointments.length === 1 ? ' atendimento' : ' atendimentos')">
          <template #actions><CmButton variant="outline" size="sm" @click="currentDate = localDate()">Hoje</CmButton></template>
        </CmSectionHeader>
      </template>
      <CmStack gap="md">
        <CmGridContainer :columns="{ base: 1, sm: 2 }" preset="filters" role="group" aria-label="Filtros da agenda técnica">
          <CmNativeInput id="schedule-date" v-model="currentDate" label="Data da agenda" type="date" />
          <CmNativeSelect id="schedule-technician" v-model="technician" label="Técnico" :options="team" />
        </CmGridContainer>
        <CmDataTable
          :rows="rows" :columns="columns" :min-width="670" :page-sizes="[20]" :page-size="20"
          empty-title="Agenda livre" empty-description="Nenhuma visita para a data e o técnico selecionados." label="Agenda de atendimentos"
        >
          <template #cell="{ row, column, value }">
            <CmBadge v-if="column.key === 'status'" :tone="statusTones[value as ServiceOrder['status']]">{{ value }}</CmBadge>
            <template v-else-if="column.key === 'id'">
              <NuxtLink v-if="row.cells.status === 'Concluída'" :to="{ path: '/app/servicos/ordens', query: { ordem: row.id } }" class="cm-link">{{ value }}</NuxtLink>
              <CmButton v-else variant="link" tone="primary" :aria-label="'Reagendar ' + value" @click="choose(eligible.find(item => item.id === row.id))">Reagendar</CmButton>
            </template>
            <span v-else>{{ value }}</span>
          </template>
        </CmDataTable>
      </CmStack>
    </CmCard>
    <CmDialog :open="!!selected" :title="selected ? 'Agendar ' + orderCode(selected.id) : 'Agendar atendimento'" @close="close">
      <CmForm :id="formId" surface="plain" gap="md" @submit.prevent="save">
        <CmNativeSelect v-model="form.technician" label="Técnico" :options="allTechnicians" required />
        <CmNativeInput v-model="form.date" label="Data da visita" type="date" required />
        <CmNativeInput v-model="form.time" label="Horário" type="time" required />
      </CmForm>
      <template #footer><CmFormActions :form-id="formId" submit-label="Salvar agendamento" @cancel="close" /></template>
    </CmDialog>
  </CmPage>
</template>