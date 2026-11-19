<script setup lang="ts">
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Boxes, BriefcaseBusiness, CalendarDays, CheckCheck, CircleAlert, CircleCheck, CircleDollarSign, ClipboardList, HandCoins, PackageMinus, Users, Wallet, Wrench } from 'lucide-vue-next'
import type { Component } from 'vue'
import { CmBadge, CmBarChart, CmCard, CmDataTable, CmEmpty, CmGridContainer, CmIconBadge, CmMetricCard, CmMetricGrid,
  CmPage, CmPageHeader, CmProgress, CmRow, CmSectionHeader, CmStack, CmText } from '@cosmemilton/ui-vue'
import { getDomainDashboard } from '../core/domainDashboards'
import type { ListingCell } from '../core/listings'
import { useAuroraData } from '../composables/useAuroraData'

const props = defineProps<{ path: string }>()
const data = useAuroraData()
const dashboard = computed(() => getDomainDashboard(props.path, {
  clients: data.clients.value, opportunities: data.opportunities.value, orders: data.orders.value,
  inventory: data.inventory.value, entries: data.entries.value, serviceOrders: data.serviceOrders.value,
})!)
const sections = computed(() => dashboard.value.bottom ? [...dashboard.value.sections, dashboard.value.bottom] : dashboard.value.sections)
const icons: Record<string, Component> = { ArrowDownLeft, ArrowRight, ArrowUpRight, Boxes, BriefcaseBusiness, CalendarDays, CheckCheck, CircleAlert, CircleCheck, CircleDollarSign, ClipboardList, HandCoins, PackageMinus, Users, Wallet, Wrench }
const viewIcon = (identifier?: string) => {
  if (!identifier) return ArrowRight
  const name = identifier.split('-').map(part => part[0]?.toUpperCase() + part.slice(1)).join('')
  return icons[name] ?? ArrowRight
}
const cell = (value: unknown) => value as ListingCell
</script>

<template>
  <CmPage padding="none" gap="lg">
    <CmPageHeader :title="dashboard.title" :description="dashboard.description" layout="wrap">
      <template v-if="dashboard.actions.length" #actions>
        <CmRow gap="sm" wrap>
          <NuxtLink v-for="action in dashboard.actions" :key="action.href" :to="action.href"
            class="cm-link cm-link--button" :class="action.tone && 'cm-link--tone-' + action.tone">
            <component :is="viewIcon(action.icon)" :size="16" />{{ action.label }}
          </NuxtLink>
        </CmRow>
      </template>
    </CmPageHeader>
    <CmMetricGrid :label="dashboard.metricLabel">
      <CmMetricCard v-for="metric in dashboard.metrics" :key="metric.title" :title="metric.title" :value="metric.value"
        :description="metric.description" :tone="metric.tone" :variant="metric.variant">
        <template #icon><component :is="viewIcon(metric.icon)" :size="19" /></template>
      </CmMetricCard>
    </CmMetricGrid>
    <CmGridContainer :columns="{ base: 1, lg: 2 }" spacing="md">
      <CmCard v-for="(section, index) in sections" :key="section.title" :class="{ 'aurora-span-full': index >= dashboard.sections.length }">
        <template #header>
          <CmSectionHeader :title="section.title" :description="section.description">
            <template v-if="section.action" #actions>
              <NuxtLink :to="section.action.href" class="cm-link cm-link--quiet">{{ section.action.label }}
                <component :is="viewIcon(section.action.icon)" :size="15" /></NuxtLink>
            </template>
          </CmSectionHeader>
        </template>
        <CmStack v-if="section.kind === 'bar'" gap="md">
          <CmBarChart v-if="section.bars.length" :data="section.bars" :height="section.height" :value-format="section.formatter"
            orientation="horizontal" :accessible-table-label="section.title" />
          <CmEmpty v-else :title="section.emptyTitle" />
          <CmRow v-if="section.note" justify="between" align="center" gap="md" wrap>
            <CmStack gap="xs">
              <CmText size="sm" tone="muted">{{ section.note.label }}</CmText>
              <CmText weight="semibold">{{ section.note.title }}</CmText>
              <CmText size="sm" tone="muted">{{ section.note.description }}</CmText>
            </CmStack>
            <NuxtLink v-if="section.note.action" :to="section.note.action.href" class="cm-link cm-link--quiet">{{ section.note.action.label }}</NuxtLink>
          </CmRow>
        </CmStack>
        <CmStack v-else-if="section.kind === 'progress'" gap="md">
          <CmProgress v-for="bar in section.bars" :key="bar.label" :label="bar.label" :value="bar.value" :max="section.max"
            :value-format="({ value }: { value: number }) => value" show-value />
        </CmStack>
        <CmDataTable v-else-if="section.kind === 'table'" :rows="section.rows" :columns="section.columns" :min-width="section.minWidth"
          :empty-title="section.emptyTitle" :column-settings="false" :page-sizes="[10]" :label="section.title">
          <template #cell="{ value }">
            <CmBadge v-if="cell(value).tone" :tone="cell(value).tone">{{ cell(value).text }}</CmBadge>
            <span v-else>{{ cell(value).text }}</span>
          </template>
        </CmDataTable>
        <CmStack v-else gap="md" role="list">
          <CmRow v-for="item in section.items" :key="item.id" align="center" justify="between" gap="sm" role="listitem" wrap>
            <CmRow align="center" gap="sm" grow>
              <CmIconBadge v-if="item.avatar || section.kind === 'timeline'" :tone="item.tone ?? 'primary'">{{ item.avatar ?? '•' }}</CmIconBadge>
              <CmStack gap="none">
                <CmText v-if="item.label" size="xs" tone="muted">{{ item.label }}</CmText>
                <NuxtLink v-if="item.href" :to="item.href" class="cm-link">{{ item.title }}</NuxtLink>
                <CmText v-else weight="semibold">{{ item.title }}</CmText>
                <CmText size="sm" tone="muted">{{ item.description }}</CmText>
              </CmStack>
            </CmRow>
            <CmBadge v-if="item.badge" :tone="item.tone">{{ item.badge }}</CmBadge>
            <CmText v-if="item.value" weight="semibold">{{ item.value }}</CmText>
            <NuxtLink v-if="item.action" :to="item.action.href" class="cm-link">{{ item.action.label }}</NuxtLink>
          </CmRow>
          <CmEmpty v-if="!section.items.length" :title="section.emptyTitle" />
        </CmStack>
      </CmCard>
    </CmGridContainer>
  </CmPage>
</template>
