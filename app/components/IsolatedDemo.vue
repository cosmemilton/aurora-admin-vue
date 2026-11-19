<script setup lang="ts">
import { Boxes, CalendarDays, Package, ShoppingBag } from 'lucide-vue-next'
import { defineComponent, type VNode } from 'vue'
import { CmAppShell, CmAuthLayout, CmBadge, CmBox, CmButton, CmCard, CmForm, CmGridContainer, CmInput, CmItem, CmNativeSelect,
  CmPageHeader, CmRow, CmSectionHeader, CmSidebar, CmStack, CmText, CmThemeProvider, CmThemeScope, CmThemeToggle,
  CmTopbar, useCmToast, type SidebarGroup } from '@cosmemilton/ui-vue'
import { asTheme, themes, useAuroraTheme } from '../composables/useAuroraTheme'
import { normalizeSearch } from '../core/normalizeSearch'

const props = defineProps<{ name: string; mode: 'basic' | 'advanced' }>()
const route = useRoute()
const advanced = computed(() => props.mode === 'advanced')
const { theme } = useAuroraTheme()
const { toast } = useCmToast()
const palette = computed(() => asTheme(route.query.tema ?? theme.value))
const art = useAuthArtwork(palette)
const selected = ref('recebimento')
const query = ref('')
const period = ref('today')
const themeChoice = ref('cm-v4-aurora')
const areas = [
  { id: 'recebimento', label: 'Recebimento', description: '4 remessas aguardam conferência.', icon: Boxes },
  { id: 'separacao', label: 'Separação', description: '12 pedidos aguardam a montagem dos volumes.', icon: Package },
  { id: 'coleta', label: 'Coleta', description: '6 volumes prontos para o motorista.', icon: ShoppingBag },
]
const area = computed(() => areas.find(item => item.id === selected.value)!)
const matches = computed(() => areas.filter(item => normalizeSearch(item.label).includes(normalizeSearch(query.value))))
const groups = computed<SidebarGroup[]>(() => [{ id: 'etapas', label: 'Etapas', items: areas.map(item => ({
  ...item, icon: advanced.value ? item.icon : undefined, to: item.id, active: item.id === selected.value,
})) }])
const SelectStep = defineComponent({
  props: { to: { type: String, required: true } },
  setup(props, { slots, attrs }) {
    return () => h('button', { ...attrs, type: 'button', onClick: () => { selected.value = props.to; (attrs.onClick as (() => void) | undefined)?.() } }, slots.default?.())
  },
})
const Render = defineComponent({ props: { node: { type: Object, required: true } }, setup: props => () => props.node as VNode })
const periods = [{ value: 'today', label: 'Hoje' }, { value: 'week', label: 'Esta semana' }, { value: 'month', label: 'Este mês' }]
const themeOptions = themes.map(option => ({ value: option.id, label: option.label }))
</script>

<template>
  <CmAuthLayout v-if="name === 'CmAuthLayout'" title="Área de demonstração" brand="Aurora Ops" appearance="glass"
    :layout="advanced ? 'split' : 'centered'" :background-image="advanced ? undefined : art.background" :artwork-image="advanced ? art.side : undefined">
    <CmForm surface="plain" @submit.prevent="toast('Formulário de demonstração validado.', { tone: 'success' })">
      <CmInput name="email" type="email" label="E-mail" required autocomplete="email" />
      <CmButton type="submit" tone="primary" full-width>Validar exemplo</CmButton>
    </CmForm>
  </CmAuthLayout>
  <CmGridContainer v-else-if="name === 'CmSidebar'" :template-columns="{ base: 'minmax(0, 1fr)', sm: 'auto minmax(0, 1fr)' }" gap="md">
    <CmSidebar :groups="groups" :active-pathname="selected" :link-component="SelectStep" brand="Expedição" nav-label="Etapas da expedição"
      width="min(14rem, calc(100vw - 2rem))" :min-height="240" :rail="advanced ? 'connectors' : 'edge'">
      <template #brandIcon><Package :size="18" /></template>
      <template v-if="advanced" #footer><CmText size="sm" tone="muted">Depósito central</CmText></template>
    </CmSidebar>
    <CmBox as="section" surface="muted" radius="md" padding="md">
      <CmItem :title="area.label" :description="area.description" />
    </CmBox>
  </CmGridContainer>
  <CmAppShell v-else-if="name === 'CmAppShell'" :style="{ '--cm-app-shell-height': advanced ? '21rem' : '11rem', '--cm-app-shell-sidebar-width': '14rem' }">
    <template v-if="advanced" #sidebar="{ closeMobileSidebar, mobileSidebarOpen }">
      <CmSidebar :groups="groups" :active-pathname="selected" :link-component="SelectStep" :force-open="mobileSidebarOpen"
        width="14rem" :min-height="240" brand="Expedição" nav-label="Etapas da expedição" @navigate="closeMobileSidebar">
        <template #brandIcon><Package :size="18" /></template>
      </CmSidebar>
    </template>
    <template #topbar="{ mobileMenuButton }">
      <CmTopbar>
        <template #start><CmRow gap="sm" align="center">
          <Render v-if="advanced" :node="mobileMenuButton" />
          <CmText weight="bold">{{ advanced ? 'Depósito central' : 'Área de retirada' }}</CmText>
        </CmRow></template>
        <template v-if="advanced" #end><CmBadge>Turno 1</CmBadge></template>
      </CmTopbar>
    </template>
    <CmSectionHeader v-if="advanced" :title="area.label" :description="area.description" />
    <CmText v-else>Dois pedidos aguardam retirada no balcão.</CmText>
  </CmAppShell>
  <CmStack v-else-if="name === 'CmTopbar'" gap="md">
    <CmTopbar>
      <template #start><CmText weight="bold">{{ advanced ? 'Expedição' : 'Depósito central' }}</CmText></template>
      <template v-if="advanced" #center><CmInput v-model="query" label="Buscar etapa" type="search" /></template>
      <template #end><CmBadge tone="success">Em operação</CmBadge></template>
    </CmTopbar>
    <template v-if="advanced">
      <CmItem v-for="item in matches" :key="item.id" :title="item.label" :description="item.description" />
      <CmText v-if="!matches.length" role="status">Nenhuma etapa para esta busca.</CmText>
    </template>
  </CmStack>
  <CmPageHeader v-else-if="name === 'CmPageHeader'" :title="advanced ? 'Agenda técnica' : 'Área de retirada'"
    :description="advanced ? 'Acompanhe os atendimentos do período.' : 'Dois pedidos aguardam retirada no balcão.'" layout="wrap">
    <template #icon><CalendarDays :size="24" /></template>
    <template v-if="advanced" #actions><CmNativeSelect v-model="period" label="Período da agenda" :options="periods" /></template>
  </CmPageHeader>
  <CmGridContainer v-else-if="name === 'CmThemeScope'" :columns="{base:1,sm:2}">
    <CmThemeScope theme-name="cm-v4-dark"><CmCard><CmSectionHeader title="Entrega E-142" description="Depósito central · Doca 3" /></CmCard></CmThemeScope>
    <CmThemeScope v-if="advanced" theme-name="cm-v4-light"><CmCard><CmSectionHeader title="Entrega E-142" description="Depósito central · Doca 3" /></CmCard></CmThemeScope>
  </CmGridContainer>
  <CmStack v-else-if="name === 'CmThemeScript'" gap="md">
    <CmNativeSelect v-if="advanced" v-model="themeChoice" label="Paleta inicial" :options="themeOptions" />
    <pre class="aurora-demo-code"><code>{{ '&lt;html data-theme="' + themeChoice + '"&gt;' }}</code></pre>
  </CmStack>
  <CmThemeProvider v-else :scoped="name !== 'CmThemeProvider'" :storage-key="false" skin="aurora-ops"
    :default-theme-name="name === 'CmThemeProvider' ? (advanced ? 'cm-v4-aurora' : 'cm-v4-dark') : palette">
    <CmStack gap="md">
      <CmThemeToggle label-visibility="always" :presentation="advanced || name === 'CmThemeMenu' ? 'compact' : 'default'" />
      <CmCard><CmSectionHeader title="Entrega E-142" description="Depósito central · Doca 3" /></CmCard>
    </CmStack>
  </CmThemeProvider>
</template>
