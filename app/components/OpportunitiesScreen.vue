<script setup lang="ts">
import { ArrowRight, CalendarDays, Check, Plus, UserRound } from 'lucide-vue-next'
import { CmBadge, CmButton, CmCard, CmDialog, CmForm, CmFormActions, CmGridContainer, CmListPanel, CmNativeInput, CmNativeSelect,
  CmPage, CmPageHeader, CmRow, CmStack, CmText, useCmToast } from '@cosmemilton/ui-vue'
import { formatCrmCurrency, formatCrmShortDate, newCrmId, opportunityStages, type CrmOpportunity } from '../core/crm'
import { useAuroraData } from '../composables/useAuroraData'
const { clients, opportunities } = useAuroraData()
const route = useRoute()
const router = useRouter()
const { toast } = useCmToast()
const query = ref('')
const stageFilter = computed(() => opportunityStages.find(stage => stage.id === route.query.etapa)?.id ?? '')
const editor = ref(false)
const formId = useId()
const draft = reactive({ title: '', clientId: '', value: '', expectedAt: '', owner: '' })
const clientOptions = computed(() => [{ value: '', label: 'Selecione uma empresa' },
  ...clients.value.map(client => ({ value: client.id, label: client.company }))])
const stageOptions = [{ label: 'Todas as etapas', value: '' }, ...opportunityStages.map(stage => ({ label: stage.label, value: stage.id }))]
const searchText = (text: string) => text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
const company = (deal: CrmOpportunity) => clients.value.find(client => client.id === deal.clientId)?.company ?? 'Cliente indisponível'
const results = computed(() => opportunities.value.filter(deal => (!stageFilter.value || deal.stage === stageFilter.value) &&
  searchText(deal.title + ' ' + company(deal) + ' ' + deal.owner).includes(searchText(query.value.trim()))))
const stages = computed(() => opportunityStages.filter(stage => !stageFilter.value || stage.id === stageFilter.value)
  .map(stage => ({ ...stage, deals: results.value.filter(deal => deal.stage === stage.id) })))
function changeStage(value: string) {
  void router.replace({ query: { ...route.query, etapa: value || undefined } })
}
function open() { Object.assign(draft, { title:'', clientId:'', value:'', expectedAt:'', owner:'' }); editor.value = true }
function save() {
  const value = Number(draft.value)
  if (!Number.isFinite(value) || value <= 0 || !draft.title.trim() || !draft.owner.trim() || !draft.clientId) {
    toast('Confira os campos obrigatórios da oportunidade.', { tone: 'danger' }); return
  }
  opportunities.value = [{ id: newCrmId(), title: draft.title.trim(), clientId: draft.clientId, value,
    stage: 'qualification', expectedAt: draft.expectedAt, owner: draft.owner.trim() }, ...opportunities.value]
  query.value = ''
  changeStage('')
  editor.value = false
  toast('Oportunidade cadastrada.', { tone: 'success' })
}
function advance(deal: CrmOpportunity) {
  const next = opportunityStages[opportunityStages.findIndex(stage => stage.id === deal.stage) + 1]
  if (!next) return
  opportunities.value = opportunities.value.map(item => item.id === deal.id ? { ...item, stage: next.id } : item)
  toast(`${deal.title} passou para ${next.label}.`, { tone: 'success' })
  nextTick(() => {
    const target = stageFilter.value ? `crm-stage-${stageFilter.value}` : `crm-deal-${deal.id}`
    document.getElementById(target)?.focus()
  })
}
</script>
<template>
  <CmPage padding="none" gap="lg">
    <CmPageHeader title="Oportunidades" description="Organize seu funil e avance as negociações conforme evoluem." layout="wrap">
      <template #actions><CmButton tone="primary" :disabled="!clients.length" @click="open"><template #icon><Plus :size="17" aria-hidden="true" /></template>Nova oportunidade</CmButton></template>
    </CmPageHeader>
    <CmText v-if="!clients.length">
      Para criar uma oportunidade, <NuxtLink to="/app/crm/clientes" class="cm-link cm-link--default">cadastre um cliente</NuxtLink>.
    </CmText>
    <CmListPanel title="Funil de oportunidades" filter-label="Filtros de oportunidades">
      <template #description><CmText inline tone="muted" aria-live="polite">{{ results.length }} de {{ opportunities.length }} oportunidades</CmText></template>
      <template #filters>
        <CmNativeInput id="crm-deal-search" v-model="query" label="Buscar oportunidades" type="search" placeholder="Título, empresa ou responsável" />
        <CmNativeSelect id="crm-deal-stage" :model-value="stageFilter" label="Etapa do funil" :options="stageOptions" @update:model-value="changeStage" />
      </template>
        <CmGridContainer spacing="md" :columns="{ base: 1, sm: 2, xl: 4 }" :template-columns="stageFilter ? 'minmax(0, 28rem)' : undefined">
          <CmStack v-for="stage in stages" :key="stage.id" as="section" :aria-labelledby="`crm-stage-${stage.id}`"
            gap="sm" padding="sm" radius="lg" border="sm" surface="muted" :min-width="0">
              <CmRow justify="between" align="center" gap="sm" wrap>
                <CmText as="h3" :id="`crm-stage-${stage.id}`" tabindex="-1" weight="bold" wrap="anywhere">{{ stage.label }}</CmText>
                <CmBadge :tone="stage.tone" :aria-label="`${stage.deals.length} oportunidades`">{{ stage.deals.length }}</CmBadge>
              </CmRow>
              <CmText tone="muted" size="sm">{{ formatCrmCurrency(stage.deals.reduce((sum, deal) => sum + deal.value, 0)) }}</CmText>
              <CmCard v-for="deal in stage.deals" :key="deal.id" padding="sm">
                <CmStack gap="xs" align="start">
                  <CmText as="h4" :id="`crm-deal-${deal.id}`" tabindex="-1" weight="bold" wrap="anywhere">{{ deal.title }}</CmText>
                  <CmText tone="muted" size="sm" wrap="anywhere">{{ company(deal) }}</CmText>
                  <CmText weight="bold">{{ formatCrmCurrency(deal.value) }}</CmText>
                  <CmRow wrap gap="sm">
                    <CmRow as="span" align="center" gap="xs">
                      <UserRound :size="14" aria-hidden="true" />
                      <CmText inline size="sm" tone="muted" wrap="anywhere">{{ deal.owner }}</CmText>
                    </CmRow>
                    <CmRow as="span" align="center" gap="xs">
                      <CalendarDays :size="14" aria-hidden="true" />
                      <CmText as="time" size="sm" tone="muted" :datetime="deal.expectedAt">{{ formatCrmShortDate(deal.expectedAt) }}</CmText>
                    </CmRow>
                  </CmRow>
                  <CmBadge v-if="deal.stage === 'won'" variant="soft" tone="success"><Check :size="13" aria-hidden="true" /> Ganha</CmBadge>
                  <CmButton v-else variant="outline" tone="primary" size="sm"
                    :aria-label="(deal.stage === 'negotiation' ? 'Fechar venda' : 'Avançar') + ': ' + deal.title" @click="advance(deal)">
                    {{ deal.stage === 'negotiation' ? 'Fechar venda' : 'Avançar' }}<template #trailingIcon><ArrowRight :size="14" aria-hidden="true" /></template>
                  </CmButton>
                </CmStack>
              </CmCard>
              <CmText v-if="!stage.deals.length" size="sm" tone="muted">Nenhuma oportunidade nesta etapa.</CmText>
          </CmStack>
        </CmGridContainer>
    </CmListPanel>
    <CmDialog :open="editor" title="Nova oportunidade" description="A negociação começa em qualificação." @close="editor = false">
      <CmForm :id="formId" surface="plain" gap="sm" @submit.prevent="save">
        <CmNativeInput v-model="draft.title" label="Título" required maxlength="110" />
        <CmNativeSelect v-model="draft.clientId" label="Empresa cliente" :options="clientOptions" required />
        <CmNativeInput v-model="draft.value" label="Valor em reais" type="number" required :min="0.01" step="0.01" />
        <CmNativeInput v-model="draft.expectedAt" label="Previsão de fechamento" type="date" required />
        <CmNativeInput v-model="draft.owner" label="Responsável" required maxlength="80" />
      </CmForm>
      <template #footer><CmFormActions :form-id="formId" submit-label="Criar oportunidade" @cancel="editor = false" /></template>
    </CmDialog>
  </CmPage>
</template>
