<script setup lang="ts">
import { computed, defineComponent, h, resolveComponent, type Component, type VNodeChild } from 'vue'
import { Home } from 'lucide-vue-next'
import { NuxtLink } from '#components'
import * as UI from '@cosmemilton/ui-vue'
import { APP_PATHS } from '../core/paths'
import type { CatalogItem } from '../core/catalog'
import metadata from '../core/catalogExamples.json'
import fixtures from '../core/catalogTrees.json'
import { chartMarkup, orderAxis, pipelineStages, revenueAxis, weeklyPoints } from '../core/catalogChartData'
import { useAuroraTheme } from '../composables/useAuroraTheme'
import AuroraThemeMenu from './AuroraThemeMenu.vue'
import CatalogMapDemo from './CatalogMapDemo.vue'
import IsolatedDemo from './IsolatedDemo.vue'

type Fixture = string | number | { tag: string; props: Record<string, unknown>; slots?: Record<string, Fixture[]>; children: Fixture[] }
type Section = { title: string; description?: string; frame?: 'basic' | 'advanced'; wide?: boolean }
const props = defineProps<{ item: CatalogItem; mode?: 'basic' | 'advanced' }>()
const { theme } = useAuroraTheme()
const { toast } = UI.useCmToast()
const display = ref(false)
const demoPage = ref(1)
const value = ref('')
const toggled = ref(false)
const choice = ref('pending')
const simpleDate = ref(new Date())
const scheduleDay = ref(new Date())
const dateFormat = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
const workHours = computed(() => [0, 6].includes(scheduleDay.value.getDay()) ? 'Plantão das 8h às 12h' : 'Atendimento das 8h às 18h')
const stations = ref(18)
const signal = ref(66)
const labelName = ref('Entrega E-142')
const printedName = ref('Pacote A-17')
const showLabelTools = ref(true)
const labelPattern = ref('dots')
const labelPatterns = [{ label: 'Pontos', value: 'dots' }, { label: 'Grade', value: 'grid' }]
const orderSource = 'const pedido = {\n  numero: 1048,\n  cliente: "Estúdio Aquarela",\n  total: 2600,\n}'
const LabelPreview = defineComponent({
  props: { title: String },
  setup(props) {
    return () => h(UI.CmBox, { as: 'article', surface: 'card', border: 'sm', padding: 'md', radius: 'md' }, {
      default: () => h(UI.CmItem, { title: props.title || 'Sem identificação', description: 'Depósito central · Doca 3' }, {
        meta: () => h(UI.CmBadge, { tone: 'primary' }, { default: () => 'Volume 1/4' }),
      }),
    })
  },
})
function moveMonth(delta: number) {
  scheduleDay.value = new Date(scheduleDay.value.getFullYear(), scheduleDay.value.getMonth() + delta, 1)
}
const library = UI as Record<string, unknown>
const nativeIcons: Record<string, Component> = { Home }
const nativeTags = new Set(['a','article','aside','b','button','canvas','caption','code','dd','details','div','dl','dt','em',
  'fieldset','figcaption','figure','footer','form','h1','h2','h3','h4','header','hr','i','img','input','label','legend',
  'li','main','nav','ol','option','p','pre','section','select','small','span','strong','summary','table','tbody','td','textarea',
  'tfoot','th','thead','time','tr','ul'])
const links = NuxtLink
const router = useRouter()
const entry = computed(() => (metadata as Record<string, { source: string; sections: Section[] }>)[props.item.name])
const trees = computed(() => (fixtures as unknown as Record<string, (Fixture[] | null)[]>)[props.item.name] ?? [])
const examples = computed(() => (entry.value?.sections ?? [{ title: props.item.label }]).map((section, index) => ({
  ...section, tree: trees.value[index] ?? undefined, index,
})))
const visible = computed(() => props.mode ? examples.value.filter(section => section.frame === props.mode).slice(0, 1) : examples.value)
const selectable = [{ label: 'Em aberto', value: 'pending' }, { label: 'Concluído', value: 'done' }, { label: 'Arquivado', value: 'archived' }]
const sampleRows = [
  { id: 'p1', cells: { code: 'PED-1024', name: 'Suporte de monitor Atlas', status: 'Em aberto' } },
  { id: 'p2', cells: { code: 'PED-1025', name: 'Organizador modular Nexo', status: 'Concluído' } },
]
const sampleColumns = [{ key: 'code', header: 'Pedido', sortable: true }, { key: 'name', header: 'Produto', sortable: true }, { key: 'status', header: 'Situação' }]
const serviceHours = ref(24)
const capacity = [{ label: 'Atendimento', value: 24, tone: 'primary' }, { label: 'Plantão', value: 16, tone: 'success' }]
const allocation = computed(() => capacity.map((segment, index) => ({
  ...segment, min: 4, value: index === 0 ? serviceHours.value : 40 - serviceHours.value,
})))
const allocatedHours = computed(() => allocation.value.map(item => ({ label: item.label, value: item.value + ' h' })))
const describeHours = ([service, onCall]: number[]) => service + ' horas de atendimento e ' + onCall + ' de plantão'
const menu = selectable.map(item => ({ id: item.value, label: item.label, onSelect: () => { choice.value = item.value; toast(item.label, { tone: 'success' }) } }))

function find(tag: string) {
  if (tag === 'AppLink' || tag === 'RouterLink') return links
  return (library[tag] ?? (/^[A-Z]/.test(tag) ? nativeIcons[tag] : undefined)) as Component | undefined
}
function understood(node: Fixture): boolean {
  if (typeof node !== 'object') return true
  return (nativeTags.has(node.tag) || !!find(node.tag)) &&
    node.children.every(understood) && Object.values(node.slots ?? {}).flat().every(understood)
}
function render(node: Fixture): VNodeChild {
  if (typeof node !== 'object') return node
  const props = { ...node.props }
  if (find(node.tag) === links) { props.to = props.href; delete props.href }
  if (node.tag === 'CmBreadcrumb' && Array.isArray(props.items)) {
    props.items = props.items.map(item => typeof item.href === 'string' && item.href.startsWith('/app/')
      ? { ...item, href: router.resolve(item.href).href } : item)
  }
  if ('htmlFor' in props) { props.for = props.htmlFor; delete props.htmlFor }
  if (node.tag === 'button') props.type ??= 'button'
  if (nativeTags.has(node.tag)) return h(node.tag, props, node.children.map(render))
  const target = find(node.tag)
  if (!target) return null
  return h(target, props, {
    default: () => node.children.map(render),
    ...Object.fromEntries(Object.entries(node.slots ?? {}).map(([key, values]) => [key, () => values.map(render)])),
  })
}
const StaticExample = defineComponent({
  props: { tree: { type: Array as () => Fixture[], required: true } },
  setup(input) { return () => input.tree.map(render) },
})
const layoutComponents = new Set(['CmBox','CmStack','CmRow','CmCol','CmContainer','CmGridContainer','CmPanel','CmListPanel','CmCard',
  'CmToolbar','CmFilterBar','CmScrollArea','CmAspectRatio','CmSectionHeader','CmPageHeader','CmPage','CmBadge','CmIconBadge',
  'CmStatusDot','CmMetricGrid','CmMetricCard','CmForm','CmFormActions','CmInputGroup','CmField','CmLabel','CmLink','CmAvatar',
  'CmEmpty','CmSkeleton','CmSeparator','CmButtonGroup','CmSummaryList','CmTimeline','CmItem','CmKbd'])
const nativeComponent = computed(() => layoutComponents.has(props.item.name) ? find(props.item.name) : undefined)
const sampleCode = computed(() => {
  const name = props.item.name
  if (!library[name]) return ''
  const simple = '  ' + (chartMarkup[name] ?? '<' + name + ' />')
  const markup = name === 'CmButton' ? '  <CmButton tone="primary">Salvar</CmButton>' : simple
  return "<script setup lang='ts'>\nimport { " + name + " } from '@cosmemilton/ui-vue'\n</" + "script>\n\n<template>\n" + markup + "\n</template>"
})
const renderable = (tree?: Fixture[]) => !!tree?.length && tree.every(understood)
const frameUrl = (section: Section) => router.resolve({
  path: `${APP_PATHS.isolatedExample}/${props.item.category.id}/${props.item.slug}/${section.frame}`,
  query: { tema: theme.value },
}).href
function notify() { toast('Alteração concluída.', { tone: 'success' }) }
</script>

<template>
  <IsolatedDemo v-if="mode" :name="item.name" :mode="mode" /><UI.CmPage v-else padding="none" gap="lg">
    <UI.CmPageHeader v-if="!mode" :title="item.label" :description="item.description" layout="wrap">
      <template #eyebrow><div class="cm-page-header__meta"><UI.CmText inline family="mono" size="sm" tone="muted">{{ item.name }}</UI.CmText></div></template>
      <template v-if="item.docs" #actions><a :href="item.docs" target="_blank" rel="noreferrer" class="cm-link cm-link--button">Documentação da API ↗</a></template>
    </UI.CmPageHeader>
    <UI.CmGridContainer :columns="{ base: 1, lg: 2 }" spacing="md">
      <div v-for="section in visible" :key="section.index" :class="{ 'aurora-span-full': section.wide }">
       <UI.CmPanel :title="section.title" :description="section.description" :heading-level="2" role="region" :aria-label="section.title">
        <iframe v-if="!mode && section.frame" :src="frameUrl(section)" :title="item.name + ' · ' + section.title"
          class="cm-frame cm-frame--framed" height="320" style="--cm-frame-height:320px" />
        <CatalogMapDemo v-else-if="item.name === 'CmMap'" :interactive="section.index > 0" />
        <StaticExample v-else-if="section.tree && renderable(section.tree)" :tree="section.tree" />
        <UI.CmButton v-else-if="item.reference || item.name.startsWith('CmToast')" tone="primary" @click="notify">
          {{ item.reference ? 'Testar aviso' : 'Exibir toast' }}
        </UI.CmButton>
        <UI.CmStack v-else-if="item.name === 'CmButton'" gap="md">
          <UI.CmRow gap="sm" wrap><UI.CmButton tone="primary" @click="notify">Salvar</UI.CmButton>
            <UI.CmButton variant="outline" @click="notify">Cancelar</UI.CmButton><UI.CmButton disabled>Indisponível</UI.CmButton></UI.CmRow>
        </UI.CmStack>
        <UI.CmInput v-else-if="item.name === 'CmInput'" v-model="value" label="Nome do produto" placeholder="Ex. Monitor" />
        <UI.CmTextarea v-else-if="item.name === 'CmTextarea'" v-model="value" label="Observações" placeholder="Digite uma observação" />
        <UI.CmNativeInput v-else-if="item.name === 'CmNativeInput'" v-model="value" label="Referência do pedido" />
        <UI.CmNativeSelect v-else-if="item.name === 'CmNativeSelect' || item.name === 'CmSelect'" v-model="choice" label="Situação" :options="selectable" />
        <UI.CmCheckbox v-else-if="item.name === 'CmCheckbox'" v-model="toggled">Receber atualizações</UI.CmCheckbox>
        <UI.CmSwitch v-else-if="item.name === 'CmSwitch'" v-model="toggled">Modo de acompanhamento</UI.CmSwitch>
        <UI.CmRadioGroup v-else-if="item.name === 'CmRadioGroup'" v-model="choice" label="Situação" :options="selectable" />
        <UI.CmSlider v-else-if="item.name === 'CmSlider'" label="Volume" :value="30" />
        <UI.CmFileUpload v-else-if="item.name === 'CmFileUpload'" multiple />
        <UI.CmCombobox v-else-if="item.name === 'CmCombobox'" v-model="choice" label="Situação do pedido" :options="selectable" />
        <component v-else-if="item.name === 'CmComboboxMulti' || item.name === 'CmMultiSelect'" :is="item.name === 'CmComboboxMulti' ? UI.CmComboboxMulti : UI.CmMultiSelect" label="Situações" :options="selectable" />
        <UI.CmInputOTP v-else-if="item.name === 'CmInputOTP'" v-model="value" :length="6" />
        <UI.CmRichTextEditor v-else-if="item.name === 'CmRichTextEditor'" v-model="value" label="Observações do pedido" />
        <UI.CmSignaturePad v-else-if="item.name === 'CmSignaturePad'" />
        <UI.CmLogView v-else-if="item.name === 'CmLogView'" :lines="['Pedido confirmado','Pagamento recebido','Envio programado']" />
        <UI.CmPasswordStrength v-else-if="item.name === 'CmPasswordStrength'" value="Aurora2026!" />
        <UI.CmPagination v-else-if="item.name === 'CmPagination'" v-model:page="demoPage" :page-count="8" />
        <template v-else-if="item.name === 'CmRatioBar'">
          <UI.CmRatioBar v-if="!section.index" aria-label="Capacidade da equipe: 24 h em atendimento e 16 h em plantão" :segments="capacity" />
          <UI.CmStack v-else gap="md">
            <UI.CmRatioBar :segments="allocation" :handle-index="0" handle-label="Horas de atendimento" :step="1"
              :value-text="describeHours" @change="(values: number[]) => serviceHours = values[0] ?? 24" />
            <UI.CmSummaryList divided :items="allocatedHours" />
          </UI.CmStack>
        </template>
        <UI.CmChoiceCardGroup v-else-if="item.name === 'CmChoiceCard' || item.name === 'CmChoiceCardGroup'" v-model="choice" label="Situação">
          <UI.CmChoiceCard v-for="option in selectable" :key="option.value" :title="option.label" :value="option.value" />
        </UI.CmChoiceCardGroup>
        <UI.CmOptionRow v-else-if="item.name === 'CmOptionRow'" v-model="toggled" title="Receber atualizações" description="Acompanhe o status do pedido." />
        <UI.CmCarousel v-else-if="item.name === 'CmCarousel'" :items="[{ title:'Pedido confirmado' }, { title:'Em separação' }, { title:'Saiu para entrega' }]" />
        <UI.CmStack v-else-if="item.name === 'CmDrawer'" gap="sm">
          <UI.CmButton tone="primary" @click="display = true">Abrir painel lateral</UI.CmButton>
          <UI.CmDrawer :open="display" title="Detalhes do pedido" @close="display = false"><UI.CmText>Pedido confirmado para separação.</UI.CmText></UI.CmDrawer>
        </UI.CmStack>
        <UI.CmPopover v-else-if="item.name === 'CmPopover' || item.name === 'CmHoverCard'" title="Ver detalhes">
          <UI.CmText>Entrega prevista para amanhã.</UI.CmText>
        </UI.CmPopover>
        <UI.CmResizable v-else-if="item.name === 'CmResizable'" width="20rem" height="10rem"><UI.CmText>Arraste a alça para redimensionar.</UI.CmText></UI.CmResizable>
        <UI.CmDataTable v-else-if="item.name === 'CmDataTable'" :columns="sampleColumns" :rows="sampleRows" />
        <template v-else-if="item.name === 'CmCalendar'">
          <UI.CmCalendar v-if="section.index === 0" v-model="simpleDate" />
          <UI.CmStack v-else gap="sm">
            <UI.CmRow gap="sm" wrap>
              <UI.CmButton variant="outline" size="sm" @click="moveMonth(-1)">Mês anterior</UI.CmButton>
              <UI.CmButton variant="outline" size="sm" @click="moveMonth(1)">Próximo mês</UI.CmButton>
            </UI.CmRow>
            <UI.CmCalendar v-model="scheduleDay" />
            <UI.CmText size="sm" aria-live="polite">{{ dateFormat.format(scheduleDay) }} · {{ workHours }}</UI.CmText>
          </UI.CmStack>
        </template>
        <template v-else-if="item.name === 'CmCodeBlock'">
          <UI.CmCodeBlock v-if="section.index === 0" language="json" code='{ "situacao": "Em análise" }' />
          <UI.CmCodeBlock v-else filename="pedido.ts" language="ts" :code="orderSource" copyable copy-label="Copiar pedido" />
        </template>
        <template v-else-if="item.name === 'CmGauge'">
          <UI.CmGauge v-if="section.index === 0" :value="74" label="Meta atingida" />
          <UI.CmStack v-else gap="md">
            <UI.CmGauge :value="stations" :max="24" :arc="220" :size="166" :thickness="12"
              :tone="stations > 20 ? 'warning' : 'success'" label="Postos ocupados"
              :value-format="item => item.value + ' / ' + item.max" />
            <UI.CmSlider v-model="stations" label="Postos ocupados" :min="0" :max="24" :step="1" />
          </UI.CmStack>
        </template>
        <template v-else-if="item.name === 'CmSignalBars'">
          <UI.CmStack v-if="section.index === 0" gap="xs">
            <UI.CmSignalBars :level="3" label="Sinal de rede: três de quatro barras" />
            <UI.CmText size="sm">Rede do escritório</UI.CmText>
          </UI.CmStack>
          <UI.CmStack v-else gap="sm">
            <UI.CmSignalBars :value="signal" :bars="5" :size="32" :label="'Sinal de rede em ' + signal + '%'" />
            <UI.CmSlider v-model="signal" label="Qualidade do sinal">
              <output>{{ signal }}%</output>
            </UI.CmSlider>
          </UI.CmStack>
        </template>
        <UI.CmWorkbench v-else-if="item.name === 'CmWorkbench'" :inspector-open="showLabelTools" inspector-width="13rem">
          <template #toolbar>
            <UI.CmButton variant="outline" size="sm" :aria-expanded="showLabelTools" @click="showLabelTools = !showLabelTools">
              {{ showLabelTools ? 'Recolher ferramentas' : 'Editar etiqueta' }}
            </UI.CmButton>
          </template>
          <template #inspector>
            <UI.CmInspector title="Texto da etiqueta"><UI.CmInput v-model="labelName" label="Identificação" /></UI.CmInspector>
          </template>
          <UI.CmCanvas pattern="dots" padding="md" :min-height="140"><LabelPreview :title="labelName" /></UI.CmCanvas>
        </UI.CmWorkbench>
        <UI.CmStack v-else-if="item.name === 'CmCanvas'" gap="sm">
          <UI.CmNativeSelect v-model="labelPattern" label="Fundo da prancheta" :options="labelPatterns" />
          <UI.CmCanvas :pattern="labelPattern" align="center" framed :min-height="160" padding="md">
            <LabelPreview title="Entrega E-142" />
          </UI.CmCanvas>
        </UI.CmStack>
        <UI.CmStack v-else-if="item.name === 'CmInspector'" gap="sm">
          <UI.CmInspector title="Impressão" description="Ajuste a identificação do volume." density="compact">
            <template #footer><UI.CmText size="sm">Uma etiqueta por volume</UI.CmText></template>
            <UI.CmInput v-model="printedName" label="Texto impresso" />
          </UI.CmInspector>
          <LabelPreview :title="printedName" />
        </UI.CmStack>
        <UI.CmDataTableActions v-else-if="item.name === 'CmDataTableActions'">
          <UI.CmButton variant="outline" size="sm" @click="notify">Conferir remessa</UI.CmButton>
          <UI.CmButton variant="ghost" size="sm" @click="notify">Marcar como conferida</UI.CmButton>
        </UI.CmDataTableActions>
        <UI.CmBarChart v-else-if="item.name === 'CmBarChart'" :data="pipelineStages"
          :title="section.index ? 'Pipeline comercial' : 'Oportunidades por etapa'"
          :height="section.index ? 180 : 160" :orientation="section.index ? 'horizontal' : 'vertical'"
          :bar-thickness="section.index ? 'sm' : undefined" :legend="!!section.index" legend-layout="list"
          :accessible-table-label="section.index ? 'Quantidade de oportunidades por etapa' : 'Oportunidades por etapa'" />
        <UI.CmComparisonLineChart v-else-if="item.name === 'CmComparisonLineChart'" :data="weeklyPoints"
          :title="section.index ? 'Receita e volume de pedidos' : 'Receita e pedidos'"
          :height="section.index ? 200 : 160" :curve="section.index ? 'smooth' : 'linear'"
          :x-labels="section.index ? 'responsive' : 'compact'" :legend-position="section.index ? 'header' : 'footer'"
          :left-axis="section.index ? revenueAxis : { label: 'Receita (R$)' }"
          :right-axis="section.index ? orderAxis : { label: 'Pedidos', tone: 'info' }"
          :accessible-table-label="section.index ? 'Receita em reais e número de pedidos por semana' : 'Receita e pedidos'" />
        <UI.CmDonutChart v-else-if="item.name === 'CmDonutChart'" :data="pipelineStages"
          :title="section.index ? 'Carteira por etapa' : 'Oportunidades'" :total-label="section.index ? 'oportunidades' : 'no funil'"
          :variant="section.index ? 'segmented' : 'continuous'" :legend-layout="section.index ? 'list' : 'inline'"
          :accessible-table-label="section.index ? 'Distribuição da carteira por etapa comercial' : 'Oportunidades'" />
        <UI.CmProgress v-else-if="item.name === 'CmProgress'" label="Conclusão" :value="72" show-value />
        <UI.CmAccordion v-else-if="item.name === 'CmAccordion'" :items="[{ id: '1', title: 'Detalhes do pedido', content: 'Entrega prevista para amanhã.' }, { id: '2', title: 'Contato', content: 'Equipe de atendimento.' }]" />
        <UI.CmTabs v-else-if="item.name.startsWith('CmTabs')" default-value="one">
          <UI.CmTabsList><UI.CmTabsTrigger value="one">Visão geral</UI.CmTabsTrigger><UI.CmTabsTrigger value="two">Detalhes</UI.CmTabsTrigger></UI.CmTabsList>
          <UI.CmTabsContent value="one">Resumo da operação.</UI.CmTabsContent><UI.CmTabsContent value="two">Detalhes da operação.</UI.CmTabsContent>
        </UI.CmTabs>
        <UI.CmDisclosure v-else-if="item.name === 'CmDisclosure' || item.name === 'CmCollapsible'" title="Detalhes do pedido">
          O pedido será entregue amanhã.
        </UI.CmDisclosure>
        <UI.CmStack v-else-if="item.name === 'CmDialog' || item.name === 'CmConfirmDialog'" gap="sm">
          <UI.CmButton tone="primary" @click="display = true">Abrir diálogo</UI.CmButton>
          <UI.CmConfirmDialog :open="display" title="Confirmar alteração" description="Revise os dados antes de salvar." @close="display = false" @confirm="display = false; notify()">
            O status do pedido será atualizado.
          </UI.CmConfirmDialog>
        </UI.CmStack>
        <UI.CmDropdownMenu v-else-if="item.name === 'CmDropdownMenu'" :items="menu">
          <template #trigger="{ triggerAttrs }"><UI.CmButton v-bind="triggerAttrs" variant="outline">Alterar situação</UI.CmButton></template>
        </UI.CmDropdownMenu>
        <UI.CmSplitButton v-else-if="item.name === 'CmSplitButton'" label="Confirmar" :items="menu" @click="notify" />
        <AuroraThemeMenu v-else-if="item.name.startsWith('CmTheme')" />
        <component v-else-if="nativeComponent" :is="nativeComponent" title="Resumo do pedido" label="Referência" value="42"
          :items="[{ title: 'Pedido confirmado', description: 'O pagamento foi recebido.', label: 'Situação', value: 'Confirmado' }]">
          <UI.CmText>Pedido da equipe comercial</UI.CmText>
        </component>
        <UI.CmText v-else tone="muted">Exemplo interativo disponível na documentação da versão React.</UI.CmText>
       </UI.CmPanel>
      </div>
    </UI.CmGridContainer>
    <UI.CmEmpty v-if="!visible.length" title="Exemplo não encontrado" />
    <template v-if="!mode">
      <UI.CmDisclosure v-if="sampleCode" title="Ver código do exemplo"><UI.CmCodeBlock :code="sampleCode" language="vue" copyable /></UI.CmDisclosure>
      <NuxtLink :to="item.categoryPath" class="cm-link">Voltar para {{ item.category.label.toLocaleLowerCase('pt-BR') }}</NuxtLink>
    </template>
  </UI.CmPage>
</template>
