<script setup lang="ts">
import { ArrowRight, ClipboardList, Plus, UserRoundPlus } from 'lucide-vue-next'
import { CmAvatar, CmBadge, CmButton, CmCard, CmDataTable, CmDialog, CmForm, CmFormActions, CmGridContainer,
  CmNativeInput, CmNativeSelect, CmPage, CmPageHeader, CmRow, CmSectionHeader, CmStack, CmText, useCmToast } from '@cosmemilton/ui-vue'
import { filterListing, getListing, type ListingAction, type ListingCell } from '../core/listings'
import { clientStatus, newCrmId, type CrmClient } from '../core/crm'
import { formatMoney, formatOrderDate, orderStatuses, orderTotal, statusOptions as orderOptions, type OrderStatus } from '../core/erp'
import { financeDate, financeMoney, type EntryKind, type FinanceEntry } from '../core/financeiro'
import { emptyOrder, orderCode, statuses, technicians, type ServiceOrder } from '../core/servicos'
import { useAuroraData } from '../composables/useAuroraData'
import StatusFilter from './StatusFilter.vue'

type EditorAction = ListingAction | 'new-entry' | 'new-client' | 'new-service'
type Option = { label: string; value: string }
type Field = { key: string; label: string; type?: string; options?: Option[]; required?: boolean; min?: number }
const props = defineProps<{ path: string }>()
const route = useRoute()
const { clients, inventory, orders, entries, serviceOrders } = useAuroraData()
const { toast } = useCmToast()
const query = ref('')
const status = ref(typeof route.query.situacao === 'string' ? route.query.situacao : '')
const editor = ref<{ action: EditorAction; id?: string | number }>()
const draft = reactive<Record<string, string>>({})
const formId = useId()
const selectedOrderId = ref('')
const listing = computed(() => getListing(props.path, { clients: clients.value, inventory: inventory.value,
  orders: orders.value, entries: entries.value, serviceOrders: serviceOrders.value })!)
const filtered = computed(() => filterListing(listing.value, query.value, status.value))
const tableDescription = computed(() => {
  const count = filtered.value.length
  if (props.path === '/app/erp/estoque') return count + (count === 1 ? ' produto encontrado' : ' produtos encontrados')
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
function close() { editor.value = undefined }
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
if (props.path === '/app/servicos/ordens') {
  if (route.query.ordem === 'nova') open('new-service')
  else if (route.query.ordem && serviceOrders.value.some(item => item.id === Number(route.query.ordem))) open('edit-service-order', Number(route.query.ordem))
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
        <CmButton tone="primary" @click="open(newButton.action)">
          <template #icon><component :is="newButton.action === 'new-client' ? UserRoundPlus : Plus" :size="17" aria-hidden="true" /></template>{{ newButton.label }}
        </CmButton>
      </template>
    </CmPageHeader>
    <CmCard body-padding="md">
      <template #header><CmSectionHeader :title="listing.tableTitle" :description="tableDescription" /></template>
      <CmStack gap="md">
        <CmGridContainer :columns="{ base: 1, sm: 2 }" spacing="md" preset="filters" role="group" :aria-label="listing.filterLabel">
          <CmNativeInput v-model="query" type="search" :label="listing.queryLabel" :placeholder="listing.queryPlaceholder" />
          <StatusFilter v-if="listing.statusOptions" v-model="status" :options="listing.statusOptions" />
        </CmGridContainer>
        <CmDataTable
          :columns="listing.columns" :rows="filtered" :table-key="path" :label="listing.tableTitle" :record-name="listing.recordName"
          :pagination="props.path === '/app/erp/pedidos' || props.path === '/app/financeiro/lancamentos'"
          :min-width="listing.minimumTableWidth" :empty-title="listing.emptyTitle" :empty-description="listing.emptyDescription"
        >
          <template #cell="{ row, value }">
            <CmButton v-if="cell(value).action" :variant="cell(value).action === 'select-order' ? 'link' : 'outline'" size="sm"
              :aria-label="cell(value).action === 'select-order' ? 'Ver detalhes do pedido #' + row.id : cell(value).actionLabel" @click="open(cell(value).action!, row.id)">{{ cell(value).text }}</CmButton>
            <NuxtLink v-else-if="cell(value).href" :to="cell(value).href" class="cm-link" :aria-label="cell(value).actionLabel">{{ cell(value).text }}</NuxtLink>
            <CmBadge v-else-if="cell(value).tone" :tone="cell(value).tone">{{ cell(value).text }}</CmBadge>
            <CmRow v-else-if="cell(value).detail" align="center" gap="sm">
              <CmAvatar v-if="cell(value).avatar" :name="cell(value).text" :initials="cell(value).avatar" size="sm" />
              <CmStack gap="none">
                <CmText as="span" weight="semibold" spacing="none">{{ cell(value).text }}</CmText>
                <CmText as="span" size="sm" tone="muted" spacing="none">{{ cell(value).detail }}</CmText>
              </CmStack>
            </CmRow>
            <time v-else-if="cell(value).dateTime" :datetime="cell(value).dateTime">{{ cell(value).text }}</time>
            <span v-else>{{ cell(value).text }}</span>
          </template>
        </CmDataTable>
      </CmStack>
    </CmCard>
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