<script setup lang="ts">
import { ArrowUpRight, Layers3 } from 'lucide-vue-next'
import { CmBadge, CmCard, CmEmpty, CmGridContainer, CmIconBadge, CmNativeInput, CmPage, CmPageHeader, CmRow,
  CmSectionHeader, CmStack, CmText } from '@cosmemilton/ui-vue'
import { APP_PATHS } from '../core/paths'
import { catalog, categories } from '../core/catalog'
import { normalizeSearch } from '../core/normalizeSearch'

const props = defineProps<{ path: string }>()
const query = ref('')
const category = computed(() => categories.find(item => props.path === APP_PATHS.catalog + '/' + item.id))
const groups = computed(() => categories.filter(item => !category.value || item.id === category.value.id).map(item => ({
  ...item,
  entries: catalog.filter(entry => entry.category.id === item.id && normalizeSearch(entry.name + ' ' + entry.label + ' ' + entry.description + ' ' + item.label)
    .includes(normalizeSearch(query.value))),
})).filter(group => group.entries.length))
</script>
<template>
  <CmPage padding="none" gap="lg">
    <CmPageHeader :title="category?.label ?? 'Catálogo de componentes'"
      :description="category?.description ?? ('Explore os ' + catalog.length + ' componentes da cm-ui com exemplos do Aurora Ops.')" layout="wrap">
      <template v-if="category" #actions><NuxtLink :to="APP_PATHS.catalog" class="cm-link cm-link--button"><Layers3 :size="16" /> Catálogo completo</NuxtLink></template>
    </CmPageHeader>
    <CmNativeInput v-model="query" label="Buscar componentes" type="search"
      :placeholder="category ? 'Buscar nesta categoria' : 'Nome, finalidade ou categoria'" />
    <CmCard v-for="group in groups" :key="group.id" body-padding="md">
      <template #header>
        <CmSectionHeader :description="group.description">
          <template #title><CmRow as="span" align="center" gap="sm">
            <CmIconBadge :tone="group.tone"><component :is="group.icon" :size="18" /></CmIconBadge>
            {{ group.label }} <CmBadge :tone="group.tone">{{ group.entries.length }}</CmBadge>
          </CmRow></template>
          <template v-if="!category" #actions><NuxtLink :to="APP_PATHS.catalog + '/' + group.id" class="cm-link cm-link--quiet">Ver categoria <ArrowUpRight :size="14" /></NuxtLink></template>
        </CmSectionHeader>
      </template>
      <CmGridContainer :columns="{ base: 1, sm: 2, xl: 3 }">
        <NuxtLink v-for="entry in group.entries" :key="entry.name" :to="entry.path" class="cm-link cm-link--card">
          <CmStack gap="xs">
            <CmRow align="center" justify="between" gap="sm"><CmText weight="semibold">{{ entry.label }}</CmText><ArrowUpRight :size="14" aria-hidden="true" /></CmRow>
            <CmText as="code" family="mono" tone="muted" size="xs">{{ entry.name }}</CmText>
            <CmText tone="muted" size="sm">{{ entry.description }}</CmText>
          </CmStack>
        </NuxtLink>
      </CmGridContainer>
    </CmCard>
    <CmEmpty v-if="!groups.length" title="Nenhum componente encontrado" description="Experimente outro nome ou termo de busca." />
  </CmPage>
</template>