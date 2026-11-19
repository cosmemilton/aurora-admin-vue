<script setup lang="ts">
import { CmNativeSelect, CmStack, CmText, useCmToast } from '@cosmemilton/ui-vue'
import { mapLayers, mountCatalogMap, type MapPoint } from './catalog-map'
import './catalog-map.css'

const props = defineProps<{ interactive?: boolean }>()
const runtime = useRuntimeConfig()
const { toast } = useCmToast()
const canvas = ref<HTMLDivElement>()
const selection = ref<MapPoint>()
const layer = ref('local')
let map: Awaited<ReturnType<typeof mountCatalogMap>>
let disposed = false

watch(layer, value => map?.setLayer(value === 'ruas' ? 'ruas' : 'local'))
onMounted(async () => {
  if (!canvas.value) return
  const asset = new URL('catalog-map-grid.png', new URL(runtime.app.baseURL, window.location.origin))
  try {
    const next = await mountCatalogMap(canvas.value, asset.href, props.interactive ? point => { selection.value = point } : undefined)
    if (disposed) {
      next?.destroy()
      return
    }
    map = next
    map?.setLayer(layer.value === 'ruas' ? 'ruas' : 'local')
  } catch {
    if (!disposed) toast('Não foi possível carregar o mapa.', { tone: 'danger' })
  }
})
onBeforeUnmount(() => {
  disposed = true
  map?.destroy()
})
</script>

<template>
  <CmStack gap="sm">
    <CmNativeSelect v-if="interactive" v-model="layer" label="Fundo do mapa" :options="mapLayers" />
    <div class="aurora-catalog-map" :class="{ 'aurora-catalog-map--interactive': interactive }"
      role="region" :aria-label="interactive ? 'Seleção de ponto de visita' : 'Mapa esquemático das unidades do Aurora'">
      <div ref="canvas" />
    </div>
    <CmText v-if="interactive" size="sm" aria-live="polite">
      {{ selection
        ? (selection.label ?? 'Ponto de visita') + ' · ' + selection.lat.toFixed(5) + ', ' + selection.lng.toFixed(5)
        : 'Selecione uma unidade no mapa ou clique para posicionar uma visita.' }}
    </CmText>
  </CmStack>
</template>
