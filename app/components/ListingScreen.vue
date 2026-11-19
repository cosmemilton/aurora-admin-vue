<script setup lang="ts">
import { ClipboardList, PackageSearch, Plus, UserRoundPlus, Users, Wallet } from 'lucide-vue-next'
import { CmAvatar, CmBadge, CmButton, CmCard, CmDataTable, CmDialog, CmForm, CmFormActions, CmListPanel,
  CmNativeInput, CmNativeSelect, CmPage, CmPageHeader, CmRow, CmSectionHeader, CmStack, CmText, useCmToast } from '@cosmemilton/ui-vue'
import { filterListing, getListing, type ListingAction, type ListingCell } from '../core/listings'
import { clientStatus, newCrmId, type CrmClient } from '../core/crm'
import { formatMoney, formatOrderDate, orderStatuses, orderTotal, statusOptions as orderOptions, type OrderStatus } from '../core/erp'
import { entryKindLabels, financeDate, financeMoney, type EntryKind, type FinanceEntry } from '../core/financeiro'
import { emptyOrder, statuses, technicians, type ServiceOrder } from '../core/servicos'
import { useAuroraData } from '../composables/useAuroraData'
import StatusFilter from './StatusFilter.vue'

type EditorAction = ListingAction | 'new-entry' | 'new-client' | 'new-service'
type Option = { label: string; value: string }
type Field = { key: string; label: string; type?: string; options?: Option[]; required?: boolean; min?: number }
const props = defineProps<{ path: string }>()
const route = useRoute()
const router = useRouter()
const { clients, inventory, orders, entries, serviceOrders } = useAuroraData()
const { toast } = useCmToast()
const query = ref('')
const searchField = ref<{ focus: () => void }>()
const isServiceOrders = props.path === '/app/servicos/ordens'
const isFinance = props.path === '/app/financeiro/lancamentos'
const isInventory = props.path === '/app/erp/estoque'
const status = ref('')
const kind = ref('')
const editor = ref<{ action: EditorAction; id?: string | number }>()
const draft = reactive<Record<string, string>>({})
const formId = useId()
const selectedOrderId = ref('')
const listing = computed(() => getListing(props.path, { clients: clients.value, inventory: inventory.value,
  orders: orders.value, entries: entries.value, serviceOrders: serviceOrders.value })!)
if (typeof route.query.situacao === 'string' && listing.value.statusOptions?.some(option => option.value === route.query.situacao)) {
  status.value = route.query.situacao
}
const filtered = computed(() => filterListing(listing.value, query.value, status.value, kind.value))
const pageResetKey = computed(() => JSON.stringify([query.value, status.value, kind.value]))
const kinds = [{ label: 'Todos os tipos', value: '' },
  ...Object.entries(entryKindLabels).map(([value, label]) => ({ value, label }))]
const emptyIcons = new Map([['/app/crm/clientes', Users], ['/app/erp/estoque', PackageSearch], ['/app/financeiro/lancamentos', Wallet]])
const emptyIcon = emptyIcons.get(props.path) ?? ClipboardList
const tableDescription = computed(() => {
  const count = filtered.value.length
  if (isInventory) return count + (count === 1 ? ' produto encontrado' : ' produtos encontrados')
  return count + ' de ' + listing.value.rows.length + ' ' + listing.value.recordName
})
const displayedOrder = computed(() => orders.value.find(item => item.id === selectedOrderId.value))
const newButton = computed(() => ({
  '/app/crm/clientes': { label: 'Novo cliente', action: 'new-client' as const },
  '/app/financeiro/lancamentos': { label: 'Novo lançamento', action: 'new-entry' as const },
  '/app/servicos/ordens': { label: 'Nova ordem', action: 'new-service' as const },
})[props.path])
const cell = (raw: unknown) => raw as ListingCell
const toOptions = (values: readonly string[]): Option[] => values.map(value => ({ value, label: value }))
const option = (value: string, label: string) => ({ value, label })
const editors: Record<Exclude<EditorAction, 'select-order'>, { title: string; label: string; fields: Field[] }> = {
  'edit-client': { title: 'Editar cliente', label: 'Salvar cliente', fields: clientFields() },
  'new-client': { title: 'Novo cliente', label: 'Salvar cliente', fields: clientFields() },
  'adjust-stock': { title: 'Ajustar estoque', label: 'Salvar ajuste', fields: [
    { key: 'movement', label: 'Movimento', options: [option('entrada', 'Entrada'), option('saida', 'Saída')] },
    { key: 'quantity', label: 'Quantidade', type: 'number', min: 1, required: true },
  ] },
  'settle-entry': { title: 'Registrar liquidação', label: 'Confirmar', fields: [
    { key: 'settledDate', label: 'Data da liquidação', type: 'date', required: true },
  ] },
  'new-entry': { title: 'Novo lançamento', label: 'Salvar lançamento', fields: [
    { key: 'kind', label: 'Tipo de lançamento', options: [option('entrada', 'A receber'), option('saida', 'A pagar')] },
    { key: 'description', label: 'Descrição', required: true }, { key: 'contact', label: 'Contato', required: true },
    { key: 'category', label: 'Categoria', required: true }, { key: 'amount', label: 'Valor (R$)', required: true },
    { key: 'dueDate', label: 'Vencimento', type: 'date', required: true },
  ] },
  'edit-service-order': { title: 'Editar ordem', label: 'Salvar ordem', fields: serviceFields() },
  'new-service': { title: 'Nova ordem de serviço', label: 'Salvar ordem', fields: serviceFields() },
}
const details = computed(() => editor.value?.action && editor.value.action !== 'select-order' ? editors[editor.value.action] : undefined)
function clientFields(): Field[] {
  return [{ key: 'name', label: 'Nome completo', required: true }, { key: 'company', label: 'Empresa', required: true },
    { key: 'email', label: 'E-mail', type: 'email', required: true }, { key: 'city', label: 'Cidade', required: true },
    { key: 'status', label: 'Situação', options: Object.entries(clientStatus).map(([value, item]) => option(value, item.label)) }]
}
function serviceFields(): Field[] {
  return [{ key: 'service', label: 'Serviço', required: true }, { key: 'client', label: 'Cliente', required: true },
    { key: 'technician', label: 'Técnico', options: [option('', 'A definir'), ...toOptions(technicians)] },
    { key: 'status', label: 'Situação', options: toOptions(statuses) },
    { key: 'date', label: 'Data', type: 'date' }, { key: 'time', label: 'Horário', type: 'time' }]
}
function close() {
  if (isServiceOrders) updateServiceQuery({ ordem: undefined })
  else editor.value = undefined
}
function updateServiceQuery(query: { ordem?: string; situacao?: string }) {
  return router.replace({ query: { ...route.query, ...query } })
}
function changeStatus(value: string) {
  status.value = value
  if (isServiceOrders) void updateServiceQuery({ situacao: value || undefined })
}
function clearFilters() {
  query.value = ''
  kind.value = ''
  changeStatus('')
  nextTick(() => searchField.value?.focus())
}
function edit(action: EditorAction, id?: string | number) {
  if (isServiceOrders) void updateServiceQuery({ ordem: id ? String(id) : 'nova' })
  else open(action, id)
}
function open(action: EditorAction, id?: string | number) {
  if (action === 'select-order') { selectedOrderId.value = String(id); return }
  for (const key of Object.keys(draft)) delete draft[key]
  editor.value = { action, id }
  const record = action === 'edit-client' ? clients.value.find(item => item.id === id)
    : action === 'edit-service-order' ? serviceOrders.value.find(item => item.id === id)
    : action === 'new-service' ? emptyOrder()
    : action === 'new-client' ? { status: 'active' }
    : action === 'new-entry' ? { kind: 'entrada', dueDate: financeDate() }
    : action === 'adjust-stock' ? { movement: 'entrada', quantity: 1 }
    : { settledDate: financeDate() }
  if (record) for (const [key, value] of Object.entries(record)) draft[key] = String(value ?? '')
}
if (isServiceOrders) {
  watch(() => route.query.ordem, selected => {
    if (selected === 'nova') open('new-service')
    else if (typeof selected === 'string' && serviceOrders.value.some(item => item.id === Number(selected))) open('edit-service-order', Number(selected))
    else editor.value = undefined
  }, { immediate: true })
  watch(() => route.query.situacao, value => {
    status.value = listing.value.statusOptions?.find(option => option.value === value)?.value ?? ''
  })
}

function save() {
  if (!editor.value) return
  const { action, id } = editor.value
  if (action === 'new-client' || action === 'edit-client') {
    const oldClient = clients.value.find(item => item.id === id)
    if (clients.value.some(item => item.id !== id && item.email.toLowerCase() === draft.email?.trim().toLowerCase())) {
      toast('Já existe um cliente com este e-mail.', { tone: 'danger' }); return
    }
    const client: CrmClient = { id: oldClient?.id ?? newCrmId(), name: draft.name!.trim(), company: draft.company!.trim(),
      email: draft.email!.trim(), city: draft.city!.trim(), status: draft.status as CrmClient['status'],
      createdAt: oldClient?.createdAt ?? new Date().toISOString() }
    clients.value = oldClient ? clients.value.map(item => item.id === id ? client : item) : [client, ...clients.value]
    toast(oldClient ? 'Cliente atualizado.' : 'Cliente cadastrado.', { tone: 'success' })
  } else if (action === 'adjust-stock') {
    const product = inventory.value.find(item => item.sku === id)
    if (!product) return close()
    const count = Number(draft.quantity)
    const quantity = product.quantity + (draft.movement === 'entrada' ? count : -count)
    if (!Number.isSafeInteger(count) || count < 1 || quantity < 0) {
      toast('Informe uma quantidade válida para o saldo em estoque.', { tone: 'danger' }); return
    }
    inventory.value = inventory.value.map(item => item.sku === id ? { ...item, quantity } : item)
    toast('Estoque atualizado.', { tone: 'success' })
  } else if (action === 'settle-entry') {
    entries.value = entries.value.map(item => item.id === id ? { ...item, settledDate: draft.settledDate } : item)
    toast('Liquidação registrada.', { tone: 'success' })
  } else if (action === 'new-entry') {
    const raw = draft.amount!.trim()
    const amount = Number(raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw)
    if (!Number.isFinite(amount) || amount <= 0) { toast('Informe um valor válido.', { tone: 'danger' }); return }
    const entry: FinanceEntry = { id: newCrmId(), kind: draft.kind as EntryKind, cents: Math.round(amount * 100),
      description: draft.description!.trim(), dueDate: draft.dueDate!, contact: draft.contact!.trim(), category: draft.category!.trim() }
    entries.value = [entry, ...entries.value]
    toast('Lançamento cadastrado.', { tone: 'success' })
  } else if (action === 'new-service' || action === 'edit-service-order') {
    if (draft.status === 'Agendada' && (!draft.date || !draft.time || !draft.technician)) {
      toast('Informe técnico, data e horário para o agendamento.', { tone: 'danger' }); return
    }
    const order: ServiceOrder = { id: typeof id === 'number' ? id : Math.max(0, ...serviceOrders.value.map(item => item.id)) + 1,
      service: draft.service!.trim(), client: draft.client!.trim(), status: draft.status as ServiceOrder['status'],
      technician: draft.technician ?? '', date: draft.date ?? '', time: draft.time ?? '' }
    serviceOrders.value = id ? serviceOrders.value.map(item => item.id === id ? order : item) : [order, ...serviceOrders.value]
    toast('Ordem de serviço salva.', { tone: 'success' })
  }
  close()
}
function changeOrder(value: string) {
  orders.value = orders.value.map(item => item.id === selectedOrderId.value ? { ...item, status: value as OrderStatus } : item)
  toast('Situação do pedido atualizada.', { tone: 'success' })
}
</script>

<template>
  <CmPage padding="none" gap="lg">
    <CmPageHeader :title="listing.title" :description="listing.description" layout="wrap">
      <template v-if="newButton" #actions>
        <NuxtLink v-if="isFinance" to="/app/dashboard/financeiro" class="cm-link cm-link--button">Visão financeira</NuxtLink>
        <CmButton tone="primary" @click="edit(newButton.action)">
          <template #icon><component :is="newButton.action === 'new-client' ? UserRoundPlus : Plus" :size="isServiceOrders || isFinance ? 16 : 17" aria-hidden="true" /></template>{{ newButton.label }}
        </CmButton>
      </template>
    </CmPageHeader>
    <CmListPanel :title="listing.tableTitle" :filter-label="listing.filterLabel">
      <template #description><CmText inline tone="muted" aria-live="polite">{{ tableDescription }}</CmText></template>
      <template #filters>
        <CmNativeInput ref="searchField" v-model="query" type="search" :label="listing.queryLabel" :placeholder="listing.queryPlaceholder" />
        <CmNativeSelect v-if="isFinance" v-model="kind" label="Tipo" :options="kinds" />
        <StatusFilter v-if="listing.statusOptions" :model-value="status" :options="listing.statusOptions" @update:model-value="changeStatus" />
      </template>
        <CmDataTable
          :columns="listing.columns" :rows="filtered" :table-key="path" :label="listing.tableTitle" :record-name="listing.recordName"
          :pagination="props.path === '/app/erp/pedidos' || isFinance" :page-size="isFinance ? 20 : 10" :page-reset-key="pageResetKey"
          :default-sort-key="isFinance ? 'dueDate' : undefined" :default-sort-direction="isFinance ? 'desc' : 'asc'"
          :min-width="listing.minimumTableWidth" :empty-title="listing.emptyTitle" :empty-description="listing.emptyDescription"
        >
          <template #emptyIcon><component :is="emptyIcon" :size="24" aria-hidden="true" /></template>
          <template #emptyActions><CmButton variant="outline" size="sm" @click="clearFilters">{{ isInventory ? 'Limpar busca' : 'Limpar filtros' }}</CmButton></template>
          <template #cell="{ row, value }">
            <CmButton v-if="cell(value).action === 'select-order' || cell(value).action === 'edit-service-order'" variant="link" tone="primary" size="sm"
              :aria-label="cell(value).action === 'select-order' ? 'Ver detalhes do pedido #' + row.id : cell(value).actionLabel" @click="edit(cell(value).action!, row.id)">{{ cell(value).text }}</CmButton>
            <CmButton v-else-if="cell(value).action" variant="outline" presentation="tableAction" size="sm"
              :aria-label="cell(value).actionLabel" @click="edit(cell(value).action!, row.id)">{{ cell(value).text }}</CmButton>
            <NuxtLink v-else-if="cell(value).href" :to="cell(value).href" class="cm-link cm-link--default cm-link--tone-primary" :aria-label="cell(value).actionLabel">{{ cell(value).text }}</NuxtLink>
            <CmBadge v-else-if="cell(value).tone" :tone="cell(value).tone">{{ cell(value).text }}</CmBadge>
            <CmRow v-else-if="cell(value).detail" align="center" gap="sm">
              <CmAvatar v-if="cell(value).avatar" :fallback="cell(value).avatar" size="sm" aria-hidden="true" />
              <CmStack gap="xs" :min-width="0">
                <CmText :weight="cell(value).emphasis ? 'bold' : 'semibold'" wrap="anywhere">{{ cell(value).text }}</CmText>
                <CmText size="sm" tone="muted" wrap="anywhere">{{ cell(value).detail }}</CmText>
              </CmStack>
            </CmRow>
            <CmText v-else-if="cell(value).dateTime" as="time" :datetime="cell(value).dateTime" :white-space="cell(value).noWrap ? 'nowrap' : undefined">{{ cell(value).text }}</CmText>
            <CmText v-else-if="cell(value).emphasis" inline weight="bold" :white-space="cell(value).noWrap ? 'nowrap' : undefined">{{ cell(value).text }}</CmText>
            <span v-else>{{ cell(value).text }}</span>
          </template>
        </CmDataTable>
    </CmListPanel>
    <CmCard v-if="displayedOrder" body-padding="md">
      <template #header>
        <CmSectionHeader :title="'Pedido #' + displayedOrder.id" :description="displayedOrder.customer + ' · ' + formatOrderDate(displayedOrder.date)">
          <template #actions><CmButton variant="ghost" @click="selectedOrderId = ''">Fechar detalhes</CmButton></template>
        </CmSectionHeader>
      </template>
      <CmStack gap="md">
        <CmRow justify="between" align="center" wrap>
          <CmBadge :tone="orderStatuses[displayedOrder.status].tone">{{ orderStatuses[displayedOrder.status].label }}</CmBadge>
          <CmNativeSelect :model-value="displayedOrder.status" label="Situação do pedido" :options="orderOptions" @update:model-value="changeOrder" />
        </CmRow>
        <CmRow justify="between"><strong>Item</strong><strong>Subtotal</strong></CmRow>
        <CmRow v-for="item in displayedOrder.items" :key="item.name" justify="between" wrap>
          <span>{{ item.quantity }} × {{ item.name }}</span><strong>{{ formatMoney(item.quantity * item.unitPrice) }}</strong>
        </CmRow>
        <CmRow justify="between"><strong>Total</strong><strong>{{ formatMoney(orderTotal(displayedOrder)) }}</strong></CmRow>
      </CmStack>
    </CmCard>
    <CmDialog :open="!!details" :title="details?.title" size="md" @close="close">
      <CmForm v-if="details" :id="formId" surface="plain" gap="md" @submit.prevent="save">
        <CmText v-if="editor?.action === 'adjust-stock'" tone="muted">Produto {{ inventory.find(item => item.sku === editor?.id)?.name }}</CmText>
        <CmText v-if="editor?.action === 'settle-entry'" tone="muted">
          {{ entries.find(item => item.id === editor?.id)?.description }} · {{ financeMoney(entries.find(item => item.id === editor?.id)?.cents ?? 0) }}
        </CmText>
        <template v-for="field in details.fields" :key="field.key">
          <CmNativeSelect v-if="field.options" v-model="draft[field.key]" :label="field.label" :name="field.key" :options="field.options" />
          <CmNativeInput v-else v-model="draft[field.key]" :label="field.label" :name="field.key" :type="field.type" :required="field.required" :min="field.min" />
        </template>
      </CmForm>
      <template #footer><CmFormActions :form-id="formId" :submit-label="details?.label" @cancel="close" /></template>
    </CmDialog>
  </CmPage>
</template>
