<script setup lang="ts">
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Boxes, BriefcaseBusiness, CalendarDays, CheckCheck, CircleAlert, CircleCheck, CircleDollarSign, ClipboardList, HandCoins, PackageMinus, Users, Wallet, Wrench } from 'lucide-vue-next'
import type { Component } from 'vue'
import { CmGridContainer, CmMetricCard, CmMetricGrid, CmPage, CmPageHeader } from '@cosmemilton/ui-vue'
import { getDomainDashboard } from '../core/domainDashboards'
import { useAuroraData } from '../composables/useAuroraData'
import DomainDashboardSection from './DomainDashboardSection.vue'

const props = defineProps<{ path: string }>()
const data = useAuroraData()
const dashboard = computed(() => getDomainDashboard(props.path, {
  clients: data.clients.value, opportunities: data.opportunities.value, orders: data.orders.value,
  inventory: data.inventory.value, entries: data.entries.value, serviceOrders: data.serviceOrders.value,
})!)
const icons: Record<string, Component> = { ArrowDownLeft, ArrowRight, ArrowUpRight, Boxes, BriefcaseBusiness, CalendarDays, CheckCheck, CircleAlert, CircleCheck, CircleDollarSign, ClipboardList, HandCoins, PackageMinus, Users, Wallet, Wrench }
const viewIcon = (identifier?: string) => {
  if (!identifier) return ArrowRight
  const name = identifier.split('-').map(part => part[0]?.toUpperCase() + part.slice(1)).join('')
  return icons[name] ?? ArrowRight
}
</script>

<template>
  <CmPage padding="none" gap="lg">
    <CmPageHeader :title="dashboard.title" :description="dashboard.description" layout="wrap">
      <template v-if="dashboard.actions.length" #actions>
        <NuxtLink v-for="action in dashboard.actions" :key="action.href" :to="action.href"
          class="cm-link cm-link--button" :class="action.tone && 'cm-link--tone-' + action.tone">
          <component v-if="action.icon && action.icon !== 'arrow-right'" :is="viewIcon(action.icon)" :size="16" aria-hidden="true" />
          {{ action.label }}
          <ArrowRight v-if="action.icon === 'arrow-right'" :size="16" aria-hidden="true" />
        </NuxtLink>
      </template>
    </CmPageHeader>
    <CmMetricGrid :label="dashboard.metricLabel">
      <CmMetricCard v-for="metric in dashboard.metrics" :key="metric.title" :title="metric.title" :value="metric.value"
        :description="metric.description" :tone="metric.tone" :variant="metric.variant">
        <template #icon><component :is="viewIcon(metric.icon)" :size="dashboard.metricIconSize" aria-hidden="true" /></template>
      </CmMetricCard>
    </CmMetricGrid>
    <CmGridContainer auto-fit :min-column-width="dashboard.minColumnWidth" :spacing="dashboard.sectionSpacing">
      <DomainDashboardSection v-for="section in dashboard.sections" :key="section.title" :section="section" />
    </CmGridContainer>
    <DomainDashboardSection v-if="dashboard.bottom" :section="dashboard.bottom" />
  </CmPage>
</template>
