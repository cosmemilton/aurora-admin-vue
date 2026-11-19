<script setup lang="ts">
import { CmBadge, CmButton, CmCard, CmDisclosure, CmEmpty, CmGridContainer, CmIconBadge, CmNativeInput, CmPage, CmPageHeader, CmRow,
  CmStack, CmText } from '@cosmemilton/ui-vue'
import { APP_PATHS } from '../core/paths'
import { catalog, categories } from '../core/catalog'
import { normalizeSearch } from '../core/normalizeSearch'

const props = defineProps<{ path: string }>()
const route = useRoute()
const router = useRouter()
const query = computed({
  get: () => typeof route.query.q === 'string' ? route.query.q : '',
  set: (value: string) => { void router.replace({ path: route.path, query: { ...route.query, q: value || undefined }, hash: route.hash }) },
})
const category = computed(() => categories.find(item => props.path === APP_PATHS.catalog + '/' + item.id))
const groups = categories.map(group => ({ ...group, entries: catalog.filter(item => item.category.id === group.id) }))
const search = computed(() => normalizeSearch(query.value))
const results = computed(() => catalog.filter(item => (!category.value || item.category.id === category.value.id) &&
  normalizeSearch([item.label, item.name, item.slug.replaceAll('-', ' '), item.description, item.category.label].join(' ')).includes(search.value)))
</script>
<template>
  <CmPage padding="none" gap="lg">
    <CmPageHeader :title="category?.label ?? 'Catálogo de componentes'"
      :description="category?.description ?? ('Explore os ' + catalog.length + ' componentes da cm-ui com exemplos do Aurora Ops.')" layout="wrap">
      <template v-if="category" #actions><NuxtLink :to="APP_PATHS.catalog" class="cm-link cm-link--button cm-link--tone-default">Todas as categorias</NuxtLink></template>
    </CmPageHeader>
    <CmNativeInput v-model="query" label="Buscar componentes" type="search"
      :placeholder="category ? 'Buscar nesta categoria' : 'Nome, finalidade ou categoria'" />
    <CmStack v-if="!category && !search" gap="sm">
      <CmDisclosure v-for="group in groups" :key="group.id" :default-open="group.id === 'navegacao'" class="cm-density-compact">
        <template #title>
          <span class="cm-disclosure__title"><CmRow as="span" align="center" gap="sm">
            <CmIconBadge size="sm" :tone="group.tone"><component :is="group.icon" :size="17" aria-hidden="true" /></CmIconBadge>{{ group.label }}
          </CmRow></span><span class="cm-disclosure__meta">{{ group.entries.length }} componentes</span>
        </template>
        <CmStack gap="md">
          <CmGridContainer :columns="{ base: 1, sm: 2, lg: 3 }" spacing="sm">
            <NuxtLink v-for="entry in group.entries" :key="entry.path" :to="entry.path" class="cm-link cm-link--default cm-link--tone-primary">{{ entry.label }}</NuxtLink>
          </CmGridContainer>
          <NuxtLink :to="APP_PATHS.catalog + '/' + group.id" class="cm-link cm-link--default cm-link--tone-default">Ver categoria {{ group.label.toLocaleLowerCase('pt-BR') }}</NuxtLink>
        </CmStack>
      </CmDisclosure>
    </CmStack>
    <CmStack v-else gap="md">
      <CmText tone="muted" size="sm" role="status">{{ results.length }} {{ results.length === 1 ? 'componente encontrado' : 'componentes encontrados' }}</CmText>
      <CmGridContainer v-if="results.length" min-column-width="min(100%, 19rem)" auto-fit spacing="md">
        <CmCard v-for="entry in results" :key="entry.path" padding="md">
          <CmStack gap="sm">
            <CmRow gap="sm" align="center" wrap><NuxtLink :to="entry.path" class="cm-link cm-link--default cm-link--tone-primary">{{ entry.label }}</NuxtLink>
              <CmBadge v-if="entry.reference" variant="outline">Referência</CmBadge></CmRow>
            <CmText family="mono" size="sm" tone="muted" wrap="anywhere">{{ entry.name }}</CmText>
            <CmText size="sm" tone="muted">{{ entry.description }}</CmText>
          </CmStack>
        </CmCard>
      </CmGridContainer>
      <CmEmpty v-else title="Nenhum componente encontrado" description="Experimente outro nome ou termo de busca.">
        <template #actions><CmButton tone="primary" @click="query = ''">Limpar busca</CmButton></template>
      </CmEmpty>
    </CmStack>
  </CmPage>
</template>
