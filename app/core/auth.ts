import { getStorageKey } from './storage'

export type User = { name: string; username: string; email?: string }
export type Registration = { name: string; email: string; username: string; password: string }
type PasswordRecord = { salt: string; passwordHash: string }
type Account = User & PasswordRecord & { email: string; usedResetToken?: string }
type ResetRequest = { token: string; expiresAt: number }

export const demoCredentials = { identifier: 'admin', password: 'admin' } as const
const admin: User = { name: 'Administrador', username: demoCredentials.identifier }
const accountsKey = 'aurora-auth-accounts'
const sessionKey = 'aurora-auth-session'
const resetDuration = 30 * 60 * 1000
export const minPasswordLength = 8
export const minUsernameLength = 3
export const maxUsernameLength = 30
export const usernamePattern = /^[a-z\d._-]+$/i
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const tokenPattern = /^[a-f\d]{64}$/
const saltPattern = /^[a-f\d]{32}$/
const storageError = 'Libere o armazenamento deste site no navegador e tente novamente.'
const invalidCredentials = 'Usuário, e-mail ou senha incorretos. Confira os dados e tente novamente.'
const invalidReset = 'O link de redefinição é inválido, expirou ou já foi usado. Solicite um novo link.'

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function readStorage(storage: 'localStorage' | 'sessionStorage', key: string) {
  try {
    return window[storage].getItem(key)
  } catch {
    throw new Error(storageError)
  }
}

function writeStorage(storage: 'localStorage' | 'sessionStorage', key: string, value: string | null) {
  try {
    if (value === null) window[storage].removeItem(key)
    else window[storage].setItem(key, value)
  } catch {
    throw new Error(storageError)
  }
}

function isAccount(value: unknown): value is Account {
  if (!value || typeof value !== 'object') return false
  const account = value as Partial<Account>
  return typeof account.name === 'string' && typeof account.username === 'string' &&
    typeof account.email === 'string' && emailPattern.test(account.email) &&
    typeof account.salt === 'string' && saltPattern.test(account.salt) &&
    typeof account.passwordHash === 'string' && tokenPattern.test(account.passwordHash)
}

function readAccounts(baseURL: string): Account[] {
  const stored = readStorage('localStorage', getStorageKey(baseURL, accountsKey))
  if (stored === null) return []

  try {
    const accounts: unknown = JSON.parse(stored)
    if (Array.isArray(accounts) && accounts.every(isAccount)) return accounts
  } catch {
    // A leitura também pode encontrar dados alterados fora da aplicação.
  }
  throw new Error('Os cadastros salvos neste navegador estão ilegíveis. Use outro perfil do navegador para continuar.')
}

function writeAccounts(baseURL: string, accounts: Account[]) {
  writeStorage('localStorage', getStorageKey(baseURL, accountsKey), JSON.stringify(accounts))
}

async function updateAccounts(baseURL: string, action: () => void) {
  // As abas da mesma origem podem concluir o cálculo da senha ao mesmo tempo.
  if (navigator.locks) await navigator.locks.request(getStorageKey(baseURL, accountsKey), action)
  else action()
}

function userFromAccount({ name, username, email }: Account): User {
  return { name, username, email }
}

export function readSession(baseURL = '/'): User | null {
  try {
    const username = readStorage('sessionStorage', getStorageKey(baseURL, sessionKey))
    if (username === null) return null
    if (username === admin.username) return admin

    const account = readAccounts(baseURL).find(entry => normalize(entry.username) === username)
    return account ? userFromAccount(account) : null
  } catch {
    return null
  }
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

function randomHex(length: number) {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('Abra a aplicação em um navegador atualizado para cadastrar ou recuperar uma conta.')
  }
  return toHex(globalThis.crypto.getRandomValues(new Uint8Array(length)))
}

async function hashPassword(password: string, salt: string) {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) throw new Error('Abra a aplicação em localhost ou HTTPS para usar contas cadastradas.')

  try {
    const saltBytes = Uint8Array.from(salt.match(/.{2}/g) ?? [], byte => Number.parseInt(byte, 16))
    const key = await subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
    const bits = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: 600_000 }, key, 256)
    return toHex(new Uint8Array(bits))
  } catch {
    throw new Error('O navegador não conseguiu processar a senha. Atualize a página e tente novamente.')
  }
}

async function createPasswordRecord(password: string): Promise<PasswordRecord> {
  if (password.length < minPasswordLength) throw new Error(`Use uma senha com pelo menos ${minPasswordLength} caracteres.`)
  const salt = randomHex(16)
  return { salt, passwordHash: await hashPassword(password, salt) }
}

function checkRegistration(accounts: Account[], username: string, email: string) {
  if (normalize(username) === admin.username || accounts.some(account => normalize(account.username) === normalize(username))) {
    throw new Error('Esse nome de usuário já está em uso. Escolha outro usuário.')
  }
  if (accounts.some(account => account.email === email)) {
    throw new Error('Esse e-mail já está cadastrado. Entre na conta ou solicite uma nova senha.')
  }
}

export async function register(values: Registration, baseURL = '/') {
  const { name, username, email } = { name: values.name.trim(), username: values.username.trim(), email: normalize(values.email) }
  if (!name) throw new Error('Informe seu nome.')
  if (!emailPattern.test(email)) throw new Error('Informe um endereço de e-mail válido.')
  if (username.length < minUsernameLength || username.length > maxUsernameLength || !usernamePattern.test(username)) {
    throw new Error(`Use de ${minUsernameLength} a ${maxUsernameLength} caracteres no usuário, com letras sem acentos, números, ponto, hífen ou sublinhado.`)
  }

  checkRegistration(readAccounts(baseURL), username, email)
  const password = await createPasswordRecord(values.password)
  await updateAccounts(baseURL, () => {
    const accounts = readAccounts(baseURL)
    checkRegistration(accounts, username, email)
    writeAccounts(baseURL, [...accounts, { name, username, email, ...password }])
  })
}

function resetKey(baseURL: string, username: string) {
  return getStorageKey(baseURL, `aurora-auth-reset:${normalize(username)}`)
}

function readReset(baseURL: string, username: string): ResetRequest | null {
  const value = readStorage('localStorage', resetKey(baseURL, username))
  if (value === null) return null

  try {
    const request = JSON.parse(value) as Partial<ResetRequest> | null
    if (typeof request?.token === 'string' && typeof request.expiresAt === 'number') {
      return { token: request.token, expiresAt: request.expiresAt }
    }
  } catch {
    // Um novo pedido de redefinição pode substituir dados ilegíveis.
  }
  return null
}

export function requestPasswordReset(value: string, baseURL = '/') {
  const email = normalize(value)
  if (!emailPattern.test(email)) throw new Error('Informe um endereço de e-mail válido.')

  const account = readAccounts(baseURL).find(entry => entry.email === email)
  if (!account) return null

  const request: ResetRequest = { token: randomHex(32), expiresAt: Date.now() + resetDuration }
  writeStorage('localStorage', resetKey(baseURL, account.username), JSON.stringify(request))
  return request.token
}

function resetMatches(baseURL: string, account: Account, token: string) {
  if (account.usedResetToken === token) return false
  const request = readReset(baseURL, account.username)
  return request?.token === token && request.expiresAt > Date.now()
}

function findResetAccount(baseURL: string, token: string) {
  return tokenPattern.test(token) ? readAccounts(baseURL).find(account => resetMatches(baseURL, account, token)) : undefined
}

export function canResetPassword(token: string, baseURL = '/') {
  try {
    return Boolean(findResetAccount(baseURL, token))
  } catch {
    return false
  }
}

export async function resetPassword(token: string, value: string, baseURL = '/') {
  if (!findResetAccount(baseURL, token)) throw new Error(invalidReset)
  const password = await createPasswordRecord(value)

  await updateAccounts(baseURL, () => {
    const accounts = readAccounts(baseURL)
    const index = accounts.findIndex(account => resetMatches(baseURL, account, token))
    if (index < 0) throw new Error(invalidReset)
    // A mesma gravação troca a senha e consome o link, preservando um eventual pedido posterior.
    accounts[index] = { ...accounts[index]!, ...password, usedResetToken: token }
    writeAccounts(baseURL, accounts)
  })
}

export function findRegisteredEmail(username: string, baseURL = '/') {
  const identifier = normalize(username)
  if (!identifier) throw new Error('Informe o nome de usuário cadastrado.')
  const email = readAccounts(baseURL).find(entry => normalize(entry.username) === identifier)?.email
  if (!email) return null

  const [local, domain] = email.split('@')
  return `${local?.[0] ?? ''}•••@${domain}`
}

export function createBrowserAuth(onChange?: (user: User | null) => void, baseURL = '/') {
  const storageKey = getStorageKey(baseURL, sessionKey)
  let user = readSession(baseURL)
  let loginAttempt = 0

  async function login(identifier: string, password: string) {
    const attempt = ++loginAttempt
    const username = normalize(identifier)
    if (!username || !password) throw new Error('Informe o usuário ou e-mail e a senha.')

    let nextUser: User
    if (username === admin.username) {
      if (password !== demoCredentials.password) throw new Error(invalidCredentials)
      nextUser = admin
    } else {
      const account = readAccounts(baseURL).find(entry => normalize(entry.username) === username || entry.email === username)
      if (!account || await hashPassword(password, account.salt) !== account.passwordHash) throw new Error(invalidCredentials)

      const current = readAccounts(baseURL).find(entry => entry.username === account.username)
      if (!current || current.salt !== account.salt || current.passwordHash !== account.passwordHash) {
        throw new Error('A senha da conta mudou. Tente entrar novamente com a senha atual.')
      }
      nextUser = userFromAccount(current)
    }

    if (attempt !== loginAttempt) throw new Error('A tentativa de acesso foi substituída. Tente novamente.')
    writeStorage('sessionStorage', storageKey, normalize(nextUser.username))
    user = nextUser
    onChange?.(user)
    return user
  }

  function logout() {
    loginAttempt++
    writeStorage('sessionStorage', storageKey, null)
    user = null
    onChange?.(user)
  }

  return {
    get user() { return user },
    login,
    logout,
    register: (values: Registration) => register(values, baseURL),
    requestPasswordReset: (email: string) => requestPasswordReset(email, baseURL),
    canResetPassword: (token: string) => canResetPassword(token, baseURL),
    resetPassword: (token: string, password: string) => resetPassword(token, password, baseURL),
    findRegisteredEmail: (username: string) => findRegisteredEmail(username, baseURL),
  }
}
