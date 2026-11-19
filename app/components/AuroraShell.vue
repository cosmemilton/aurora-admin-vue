<script setup lang="ts">
import { computed, defineComponent, h, nextTick, ref, watch, type VNode } from 'vue'
import { RouterLink } from 'vue-router'
import { Activity, ArrowRight, Bell, CalendarDays, ChevronDown, Home, Layers3, Search } from 'lucide-vue-next'
import { CmAppShell, CmButton, CmContainer, CmDropdownMenu, CmMegaMenuSearch, CmRow, CmSeparator, CmSidebar, CmText, CmTopbar, useCmToast, type MegaMenuGroup, type MegaMenuItem, type SidebarGroup } from '@cosmemilton/ui-vue'
import { APP_PATHS } from '../core/paths'
import { navigation } from '../core/navigation'
import { catalog, catalogByPath, categories } from '../core/catalog'
import { useAuroraAuth } from '../composables/useAuroraAuth'
import AuroraThemeMenu from './AuroraThemeMenu.vue'

const route = useRoute()
const router = useRouter()
const { user, auth } = useAuroraAuth()
const userInitials = computed(() => {
  const words = user.value?.name.trim().split(/\s+/) ?? []
  const first = words[0] ?? ''
  return (words.length > 1 ? first.charAt(0) + (words.at(-1) ?? '').charAt(0) : first.slice(0, 2)).toUpperCase()
})
const { toast } = useCmToast()
const pathname = computed(() => route.path.toLowerCase().replace(/\/+$/, ''))
const inCatalog = computed(() => pathname.value === APP_PATHS.catalog || pathname.value.startsWith(APP_PATHS.catalog + '/'))
const selectedDemo = computed(() => catalogByPath.get(pathname.value))
const sidebarPath = computed(() => selectedDemo.value?.categoryPath ?? pathname.value)
const group = computed(() => navigation.find(item => item.pages.some(page => page.path === sidebarPath.value)))
const currentPage = computed(() => group.value?.pages.find(page => page.path === sidebarPath.value))
const pageLabel = computed(() => selectedDemo.value?.label ?? currentPage.value?.label ?? 'Página não encontrada')
const groups = computed<SidebarGroup[]>(() => {
  if (inCatalog.value) {
    return [
      { id: APP_PATHS.catalog, label: 'Todos os componentes', direct: true, icon: Layers3,
        items: [{ id: APP_PATHS.catalog, to: APP_PATHS.catalog, label: 'Todos os componentes' }] },
      ...categories.map(category => {
        const path = APP_PATHS.catalog + '/' + category.id
        return { id: category.id, label: category.label, icon: category.icon, items: [
          { id: path, label: 'Visão da categoria', to: path },
          ...catalog.filter(item => item.category.id === category.id).map(item => ({ id: item.path, label: item.label, to: item.path })),
        ] }
      }),
      { id: APP_PATHS.dashboard, label: 'Voltar ao dashboard', icon: Home, direct: true,
        items: [{ id: APP_PATHS.dashboard, to: APP_PATHS.dashboard, label: 'Voltar ao dashboard' }] },
    ]
  }
  return navigation.map(item => ({
    id: item.label, label: item.label, icon: item.icon, direct: item.overviewPath === APP_PATHS.catalog,
    items: item.pages.map(page => ({ id: page.path, label: page.path === APP_PATHS.catalog ? 'Componentes' : page.label,
      to: page.path, icon: page.icon })),
  }))
})

const query = ref('')
const searchGroups: MegaMenuGroup[] = [
  ...navigation.map(group => ({ id: group.label, label: group.label, items: group.pages.map(page => ({
    id: page.path, href: page.path, label: page.label, description: page.description,
    icon: h(page.icon, { size: 17, 'aria-hidden': true }),
  })) })),
  { id: 'component-examples', label: 'Exemplos da cm-ui', items: [...catalog].sort((a,b) => a.name.localeCompare(b.name)).map(item => ({
    id: item.path, href: item.path, label: item.label, description: item.name + ' · ' + item.description,
    keywords: [item.slug.replaceAll('-', ' ')], icon: h(item.category.icon, { size: 17, 'aria-hidden': true }),
  })) },
]
async function select(item: MegaMenuItem, event?: Event) {
  if (!item.href) return
  event?.preventDefault()
  query.value = ''
  await router.push(item.href)
}
function logout() {
  try { auth?.logout(); void router.replace(APP_PATHS.loginV1) }
  catch (error) { toast(error instanceof Error ? error.message : 'Tente novamente.', { title: 'Não foi possível sair', tone: 'danger' }) }
}
const userItems = computed(() => [
  { id: 'agenda', label: 'Agenda da equipe', icon: h(CalendarDays, { size: 16 }), onSelect: () => void router.push('/app/servicos/agenda') },
  { id: 'activity', label: 'Atividade recente', icon: h(Activity, { size: 16 }), onSelect: () => void router.push('/app/dashboard#atividade') },
  { id: 'logout', label: 'Sair', icon: h(ArrowRight, { size: 16 }), onSelect: logout },
])
const RenderNode = defineComponent({ props: { node: { type: Object, required: true } }, setup: props => () => props.node as VNode })
useHead({ title: computed(() => pageLabel.value + ' | Aurora Ops') })
watch(() => route.fullPath, async () => {
  query.value = ''
  if (!route.hash || !import.meta.client) return
  await nextTick()
  requestAnimationFrame(() => document.getElementById(route.hash.slice(1))?.scrollIntoView())
}, { immediate: true })
</script>

<template>
  <CmAppShell :content-key="pathname" skip-link-label="Ir para o conteúdo">
    <template #sidebar="{ closeMobileSidebar, mobileSidebarOpen }">
      <CmSidebar
        :groups="groups" :active-pathname="pathname" :link-component="RouterLink"
        :default-open-group="pathname === APP_PATHS.catalog ? categories[0].id : undefined"
        :force-open="mobileSidebarOpen" :nav-label="inCatalog ? 'Menu de componentes' : 'Menu principal'"
        brand="Aurora Ops" @navigate="closeMobileSidebar"
      >
        <template #brandIcon><Activity :size="22" /></template>
        <template #footer><CmText size="sm" tone="muted" spacing="none">Workspace de demonstração</CmText></template>
      </CmSidebar>
    </template>
    <template #topbar="{ mobileMenuButton, mobileSidebarOpen }">
      <CmTopbar class="cm-topbar--bordered">
        <template #start>
          <RenderNode :node="mobileMenuButton" />
          <nav aria-label="breadcrumb" class="cm-breadcrumb">
            <span class="cm-breadcrumb__item">
              <NuxtLink v-if="group?.overviewPath && group.overviewPath !== pathname" :to="group.overviewPath" class="cm-breadcrumb__link">
                <CmRow as="span" align="center" gap="xs"><component :is="group?.icon ?? Home" :size="16" />{{ group?.label ?? 'Início' }}</CmRow>
              </NuxtLink>
              <CmRow v-else as="span" align="center" gap="xs"><component :is="group?.icon ?? Home" :size="16" />{{ group?.label ?? 'Início' }}</CmRow>
              <span aria-hidden="true" class="cm-breadcrumb__separator">/</span>
            </span>
            <span v-if="selectedDemo" class="cm-breadcrumb__item">
              <NuxtLink :to="selectedDemo.categoryPath" class="cm-breadcrumb__link">{{ selectedDemo.category.label }}</NuxtLink>
              <span aria-hidden="true" class="cm-breadcrumb__separator">/</span>
            </span>
            <span class="cm-breadcrumb__item"><span aria-current="page" class="cm-breadcrumb__current">{{ pageLabel }}</span></span>
          </nav>
        </template>
        <template #center>
          <CmMegaMenuSearch v-model="query" :groups="searchGroups" :link-component="RouterLink" :disabled="mobileSidebarOpen"
            class="cm-mega-search--md" placeholder="Buscar páginas" aria-label="Buscar páginas" keyboard-shortcut="k" @select="select">
            <template #icon><Search :size="17" aria-hidden="true" /></template>
          </CmMegaMenuSearch>
        </template>
        <template #end>
          <CmRow align="center" gap="clamp(var(--space-xs), 1cqi, var(--space-lg))">
            <AuroraThemeMenu />
            <NuxtLink to="/app/dashboard#atividade" aria-label="Ver atividade recente" class="cm-link cm-link--button cm-link--tone-default"><Bell :size="17" aria-hidden="true" /></NuxtLink>
            <CmSeparator orientation="vertical" length="1.5rem" spacing="none" aria-hidden="true" />
            <CmDropdownMenu v-if="user" :items="userItems" align="end">
              <template #trigger="{ triggerAttrs }">
                <CmButton v-bind="triggerAttrs" variant="plain" size="sm" class="cm-user-menu__trigger cm-user-menu__trigger--slim cm-user-menu__trigger--slim-avatar-auto" :aria-label="[user.name, user.username].join(', ')">
                  <span class="cm-avatar cm-avatar--sm">{{ userInitials }}</span>
                  <span class="cm-user-menu__trigger-text"><span class="cm-user-menu__trigger-title">{{ user.name }}</span><span class="cm-user-menu__trigger-subtitle">{{ user.username }}</span></span>
                  <span class="cm-user-menu__trigger-chevron" aria-hidden="true"><ChevronDown :size="14" /></span>
                </CmButton>
              </template>
            </CmDropdownMenu>
          </CmRow>
        </template>
      </CmTopbar>
    </template>
    <CmContainer max-width="100rem" padding="clamp(1rem, 2.4vw, 2.5rem)"><slot /></CmContainer>
  </CmAppShell>
</template>
