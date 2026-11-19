import { initialClients, initialOpportunities, storageKeys as crm } from '../core/crm'
import { demoOrders, demoInventory, storageKeys as erp } from '../core/erp'
import { seedEntries, storageKeys as finance } from '../core/financeiro'
import { initialOrders, storageKeys as service } from '../core/servicos'
import { getStorageKey } from '../core/storage'

function records<T>(key: string, defaultValue: T[]) {
  const storageKey = getStorageKey(useRuntimeConfig().app.baseURL, key)
  const values = useState<T[]>(key, () => {
    if (!import.meta.client) return defaultValue
    try {
      const stored = localStorage.getItem(storageKey)
      const parsed: unknown = stored ? JSON.parse(stored) : null
      return Array.isArray(parsed) ? parsed as T[] : defaultValue
    } catch { return defaultValue }
  })
  if (import.meta.client) {
    watch(values, value => {
      try { localStorage.setItem(storageKey, JSON.stringify(value)) } catch {}
    }, { deep: true })
  }
  return values
}

export function useAuroraData() {
  return {
    clients: records(crm.crmClients, initialClients),
    opportunities: records(crm.crmOpportunities, initialOpportunities),
    orders: records(erp.erpOrders, demoOrders),
    inventory: records(erp.erpInventory, demoInventory),
    entries: records(finance.financeEntries, seedEntries),
    serviceOrders: records(service.serviceOrders, initialOrders),
  }
}
