export const themeStorageKey = 'aurora-ops-theme'

export function getStorageKey(baseURL: string, key: string) {
  const namespace = baseURL.replace(/^\/+|\/+$/g, '')
  return namespace ? `${namespace}:${key}` : key
}
