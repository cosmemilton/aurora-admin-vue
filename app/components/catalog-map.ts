import type { Marker, TileLayer } from 'leaflet'

export type MapLayer = 'local' | 'ruas'
export type MapPoint = { lat: number; lng: number; label?: string }

export const mapLayers = [
  { value: 'local', label: 'Malha esquemática (offline)' },
  { value: 'ruas', label: 'Ruas de Fortaleza (OpenStreetMap)' },
]

const units = [
  { lat: -3.7295, lng: -38.5269, label: 'Unidade Centro', detail: 'Atendimento e retirada', tone: 'primary' },
  { lat: -3.7451, lng: -38.5360, label: 'Unidade Benfica', detail: 'Centro de distribuição', tone: 'success' },
] as const

const streetTiles = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const streetAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

export async function mountCatalogMap(host: HTMLElement, localTile: string, onPick?: (point: MapPoint) => void) {
  const imported = await import('leaflet')
  const L = 'default' in imported && imported.default ? imported.default as typeof import('leaflet') : imported
  if (!host.isConnected) return

  const map = L.map(host, { center: [-3.738, -38.532], zoom: 13, scrollWheelZoom: false })
  let activeLayer: MapLayer | undefined
  let tiles: TileLayer | undefined
  let selected: Marker | undefined
  const pin = (tone: 'primary' | 'success', picking = false) => {
    const icon = host.ownerDocument.createElement('span')
    icon.classList.add('aurora-map-pin', 'aurora-map-pin--' + tone)
    if (picking) icon.classList.add('aurora-map-pin--picked')
    return L.divIcon({ className: 'aurora-map-pin-anchor', html: icon,
      iconSize: [26, 34], iconAnchor: [13, 32], popupAnchor: [0, -30] })
  }
  function setLayer(layer: MapLayer) {
    if (layer === activeLayer) return
    tiles?.remove()
    activeLayer = layer
    tiles = L.tileLayer(layer === 'local' ? localTile : streetTiles,
      { maxZoom: 19, attribution: layer === 'local' ? 'Base esquemática local' : streetAttribution }).addTo(map)
  }
  function pick(point: MapPoint) {
    if (!onPick) return
    if (!selected) {
      selected = L.marker([point.lat, point.lng], { icon: pin('primary', true), draggable: true, zIndexOffset: 1000,
        title: 'Local selecionado', alt: 'Local selecionado' }).addTo(map)
      selected.on('dragend', () => {
        const position = selected?.getLatLng()
        if (position) onPick({ lat: position.lat, lng: position.lng })
      })
    } else selected.setLatLng([point.lat, point.lng])
    onPick(point)
  }
  setLayer('local')
  for (const unit of units) {
    const popup = host.ownerDocument.createElement('div')
    popup.textContent = unit.label + ' · ' + unit.detail
    L.marker([unit.lat, unit.lng], { icon: pin(unit.tone), title: unit.label, alt: unit.label })
      .addTo(map).bindPopup(popup).on('click', () => pick(unit))
  }
  if (onPick) {
    map.fitBounds(L.latLngBounds(units.map(unit => L.latLng(unit.lat, unit.lng))), { padding: [24, 24], maxZoom: 16 })
    map.on('click', event => pick({ lat: event.latlng.lat, lng: event.latlng.lng }))
  }
  const resize = typeof ResizeObserver === 'undefined' ? undefined :
    new ResizeObserver(() => map.invalidateSize({ pan: false }))
  resize?.observe(host)
  return { setLayer, destroy() { resize?.disconnect(); map.remove() } }
}
