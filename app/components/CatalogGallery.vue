<script setup lang="ts">
import { CmButton, CmDialog, CmRow, CmStack, CmText } from '@cosmemilton/ui-vue'
import panels from '../core/catalogGallery.json'

const props = defineProps<{ advanced: boolean; lightbox?: boolean }>()
const base = useRuntimeConfig().app.baseURL.replace(/\/+$/, '')
const images = computed(() => props.advanced ? panels : panels.slice(0, props.lightbox ? 1 : 2))
const selected = ref(0)
const open = ref(false)
const active = computed(() => images.value[selected.value] ?? panels[0]!)
const galleryStyle = computed(() => ({
  '--cm-gallery-ratio': 16 / 10,
  '--cm-gallery-columns-base': props.advanced ? 1 : 2,
  '--cm-gallery-columns-sm': 2,
  '--cm-gallery-columns-md': 2,
  '--cm-gallery-columns-lg': props.advanced ? 3 : 2,
  '--cm-gallery-columns-xl': props.advanced ? 3 : 2,
}))

function show(index: number) {
  selected.value = index
  open.value = true
}

function move(direction: number) {
  selected.value = (selected.value + direction + images.value.length) % images.value.length
}
</script>

<template>
  <CmStack v-if="lightbox" gap="md">
    <CmRow gap="sm" wrap>
      <CmButton v-for="(image, index) in images" :key="image.file" variant="outline" aria-haspopup="dialog" @click="show(index)">
        {{ advanced ? image.caption : 'Ampliar visão geral' }}
      </CmButton>
    </CmRow>
    <CmText v-if="advanced" size="sm" tone="muted">Painel selecionado: {{ active.caption }}</CmText>
  </CmStack>
  <ul v-else class="cm-gallery" :style="galleryStyle">
    <li v-for="(image, index) in images" :key="image.file" class="cm-gallery__cell">
      <button v-if="advanced" class="cm-gallery__item" type="button" :aria-label="image.alt" aria-haspopup="dialog" @click="show(index)">
        <img class="cm-gallery__image" :src="base + '/catalog-gallery/' + image.file" alt="" loading="lazy">
      </button>
      <div v-else class="cm-gallery__item">
        <img class="cm-gallery__image" :src="base + '/catalog-gallery/' + image.file" :alt="image.alt" loading="lazy">
      </div>
    </li>
  </ul>

  <CmDialog v-model:open="open" title="Galeria de imagens" size="xl">
    <CmStack gap="md" @keydown.left.prevent="move(-1)" @keydown.right.prevent="move(1)">
      <img class="cm-gallery__image" :src="base + '/catalog-gallery/' + active.file" :alt="active.alt">
      <CmText size="sm" aria-live="polite">{{ active.caption }} <template v-if="advanced">· {{ selected + 1 }} / {{ images.length }}</template></CmText>
      <CmRow v-if="advanced" gap="sm" wrap>
        <CmButton variant="outline" @click="move(-1)">Painel anterior</CmButton>
        <CmButton variant="outline" @click="move(1)">Próximo painel</CmButton>
      </CmRow>
      <div v-if="advanced" class="cm-lightbox__thumbs" role="group" aria-label="Miniaturas">
        <button v-for="(image, index) in images" :key="image.file" type="button" class="cm-lightbox__thumb"
          :class="{ 'cm-lightbox__thumb--active': index === selected }" :aria-pressed="index === selected"
          :aria-label="image.caption" @click="selected = index">
          <img class="cm-lightbox__thumb-image" :src="base + '/catalog-gallery/' + image.file" alt="">
        </button>
      </div>
    </CmStack>
  </CmDialog>
</template>
