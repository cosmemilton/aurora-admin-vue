<script setup lang="ts">
import { ArrowRight, CalendarClock, ClipboardList, PackageCheck } from 'lucide-vue-next'
import { NuxtLink } from '#components'
import { CmAvatar, CmBadge, CmBarChart, CmCard, CmDataTable, CmEmpty, CmProgress, CmRow, CmSectionHeader, CmStack,
  CmText, CmTimeline } from '@cosmemilton/ui-vue'
import type { DashboardSection } from '../core/domainDashboards'
import type { ListingCell } from '../core/listings'

defineProps<{ section: DashboardSection }>()
const emptyIcons = { 'calendar-clock': CalendarClock, 'clipboard-list': ClipboardList, 'package-check': PackageCheck }
const cell = (value: unknown) => value as ListingCell
const primaryLink = 'cm-link cm-link--default cm-link--tone-primary'

function timelineItems(section: Extract<DashboardSection, { items: unknown[] }>) {
  const link = (to: string, label: string) => h(NuxtLink, { to, class: primaryLink }, () => label)
  return section.items.map(item => ({
    ...item, title: item.href ? link(item.href, item.title) : item.title,
    trailing: item.action ? link(item.action.href, item.action.label) : undefined,
  }))
}
</script>

<template>
  <CmBarChart v-if="section.kind === 'bar' && section.standalone" :title="section.title" :description="section.description"
    :data="section.bars" :height="section.height" orientation="horizontal" />
  <CmCard v-else body-padding="md">
    <template #header>
      <CmSectionHeader :title="section.title" :description="section.description">
        <template v-if="section.action" #actions>
          <NuxtLink :to="section.action.href" :class="section.action.tone ? primaryLink : 'cm-link cm-link--quiet'">
            {{ section.action.label }} <ArrowRight v-if="section.action.icon" :size="15" aria-hidden="true" />
          </NuxtLink>
        </template>
      </CmSectionHeader>
    </template>
    <CmStack v-if="section.kind === 'bar'" gap="md">
      <CmBarChart v-if="section.bars.length" :data="section.bars" :height="section.height" :value-format="section.formatter"
        orientation="horizontal" :accessible-table-label="section.chartLabel ?? section.title" />
      <CmEmpty v-else :title="section.emptyTitle" />
      <CmRow v-if="section.note" surface="muted" radius="md" border="sm" padding="md" gap="md" align="center" justify="between" wrap>
        <CmStack gap="xs" :min-width="0">
          <CmText size="sm" tone="muted">{{ section.note.label }}</CmText>
          <CmText weight="bold" wrap="anywhere">{{ section.note.title }}</CmText>
          <CmText size="sm" tone="muted" wrap="anywhere">{{ section.note.description }}</CmText>
        </CmStack>
        <NuxtLink v-if="section.note.action" :to="section.note.action.href" class="cm-link cm-link--quiet">
          {{ section.note.action.label }} <ArrowRight v-if="section.note.action.icon" :size="14" aria-hidden="true" />
        </NuxtLink>
      </CmRow>
    </CmStack>
    <CmStack v-else-if="section.kind === 'progress'" gap="md">
      <CmProgress v-for="bar in section.bars" :key="bar.label" :label="bar.label" :value="bar.value" :max="section.max"
        :value-format="({ value }: { value: number }) => value" show-value />
    </CmStack>
    <CmDataTable v-else-if="section.kind === 'table'" :rows="section.rows" :columns="section.columns" :min-width="section.minWidth"
      :empty-title="section.emptyTitle" :empty-description="section.emptyDescription" :column-settings="false" :pagination="false"
      :density="section.density" :label="section.title">
      <template v-if="section.emptyIcon" #emptyIcon>
        <component :is="emptyIcons[section.emptyIcon as keyof typeof emptyIcons]" aria-hidden="true" />
      </template>
      <template #cell="{ value }">
        <CmBadge v-if="cell(value).tone" :tone="cell(value).tone">{{ cell(value).text }}</CmBadge>
        <CmText v-else-if="cell(value).dateTime" as="time" :datetime="cell(value).dateTime">{{ cell(value).text }}</CmText>
        <CmText v-else-if="cell(value).emphasis" inline weight="bold">{{ cell(value).text }}</CmText>
        <span v-else>{{ cell(value).text }}</span>
      </template>
    </CmDataTable>
    <template v-else-if="section.kind === 'timeline'">
      <CmTimeline v-if="section.items.length" :items="timelineItems(section)" :variant="section.connected ? 'connected' : 'default'" :label-width="section.connected ? 52 : undefined" />
      <CmEmpty v-else :title="section.emptyTitle" />
    </template>
    <CmStack v-else-if="section.items.length" gap="md" role="list">
      <CmRow v-for="item in section.items" :key="item.id" align="center" justify="between" gap="sm" role="listitem" :wrap="!item.avatar">
        <CmAvatar v-if="item.avatar" :fallback="item.avatar" size="sm" aria-hidden="true" />
        <CmStack gap="xs" :min-width="0" grow>
          <CmText :weight="item.avatar ? 'semibold' : 'bold'" wrap="anywhere">{{ item.title }}</CmText>
          <CmRow v-if="item.dateTime" align="center" wrap gap="xs">
            <CmText size="sm" tone="muted">
              {{ item.label }} <CmText as="time" size="sm" tone="muted" :datetime="item.dateTime">{{ item.description }}</CmText>
            </CmText>
            <CmBadge v-if="item.badge" :tone="item.tone">{{ item.badge }}</CmBadge>
          </CmRow>
          <CmText v-else size="sm" tone="muted" wrap="anywhere">{{ item.description }}</CmText>
        </CmStack>
        <CmBadge v-if="item.avatar && item.badge" :tone="item.tone" variant="soft">{{ item.badge }}</CmBadge>
        <CmText v-if="item.value" weight="semibold" white-space="nowrap">{{ item.value }}</CmText>
      </CmRow>
    </CmStack>
    <CmEmpty v-else :title="section.emptyTitle">
      <template v-if="section.emptyIcon" #icon>
        <component :is="emptyIcons[section.emptyIcon as keyof typeof emptyIcons]" :size="22" aria-hidden="true" />
      </template>
    </CmEmpty>
  </CmCard>
</template>
