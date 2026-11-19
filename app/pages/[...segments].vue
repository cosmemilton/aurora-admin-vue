<script setup lang="ts">
import { APP_PATHS } from '../core/paths'
import { navigation } from '../core/navigation'
import { catalogByPath } from '../core/catalog'
import { getListing } from '../core/listings'
import AuthScreen from '../components/AuthScreen.vue'
import AuroraShell from '../components/AuroraShell.vue'

const OverviewScreen = defineAsyncComponent(() => import('../components/OverviewScreen.vue'))
const DomainDashboardScreen = defineAsyncComponent(() => import('../components/DomainDashboardScreen.vue'))
const ListingScreen = defineAsyncComponent(() => import('../components/ListingScreen.vue'))
const ReportScreen = defineAsyncComponent(() => import('../components/ReportScreen.vue'))
const CatalogScreen = defineAsyncComponent(() => import('../components/CatalogScreen.vue'))
const CatalogDemo = defineAsyncComponent(() => import('../components/CatalogDemo.vue'))
const OpportunitiesScreen = defineAsyncComponent(() => import('../components/OpportunitiesScreen.vue'))
const ScheduleScreen = defineAsyncComponent(() => import('../components/ScheduleScreen.vue'))
const CashFlowScreen = defineAsyncComponent(() => import('../components/CashFlowScreen.vue'))

const route = useRoute()
const path = computed(() => route.path.toLowerCase().replace(/\/+$/, ''))
const publicPages = ['login-v1','login-v2','inscricao','recuperar-email','recuperar-senha','cadastro-de-senha','nao-encontrado'] as const
const authPage = computed(() => publicPages.find(page => path.value === '/app/' + page))
const demo = computed(() => catalogByPath.get(path.value))
const isolated = computed(() => {
  if (!path.value.startsWith(APP_PATHS.isolatedExample + '/')) return
  const [category, slug, mode, extra] = path.value.slice(APP_PATHS.isolatedExample.length + 1).split('/')
  if (extra || (mode !== 'advanced' && mode !== 'basic')) return
  const item = catalogByPath.get(APP_PATHS.catalog + '/' + category + '/' + slug)
  return item ? { item, mode: mode as 'basic' | 'advanced' } : undefined
})
const registered = computed(() => demo.value || navigation.some(group => group.pages.some(page => page.path === path.value)))
const listed = computed(() => !!getListing(path.value))
</script>

<template>
  <AuthScreen v-if="authPage" :key="route.fullPath" :page="authPage" />
  <div v-else-if="isolated" class="aurora-isolated"><CatalogDemo :item="isolated.item" :mode="isolated.mode" /></div>
  <AuroraShell v-else-if="registered">
    <OverviewScreen v-if="path === APP_PATHS.dashboard" />
    <DomainDashboardScreen v-else-if="path.startsWith(APP_PATHS.dashboard + '/')" :key="path" :path="path" />
    <ListingScreen v-else-if="listed" :key="path" :path="path" />
    <ReportScreen v-else-if="path.startsWith('/app/relatorios/')" :key="path" :path="path" />
    <OpportunitiesScreen v-else-if="path === '/app/crm/oportunidades'" />
    <ScheduleScreen v-else-if="path === '/app/servicos/agenda'" />
    <CashFlowScreen v-else-if="path === '/app/financeiro/fluxo-de-caixa'" />
    <CatalogDemo v-else-if="demo" :key="path" :item="demo" />
    <CatalogScreen v-else :key="path" :path="path" />
  </AuroraShell>
  <AuthScreen v-else page="nao-encontrado" />
</template>