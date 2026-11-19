<script setup lang="ts">
import { ArrowRight, ArrowUpRight, ContactRound, FileSearch, LifeBuoy, UserRound, UserRoundPlus, Activity } from 'lucide-vue-next'
import { CmAuthLayout, CmButton, CmForm, CmInput, CmRow, CmStack, CmText, useCmToast } from '@cosmemilton/ui-vue'
import { demoCredentials, minPasswordLength, minUsernameLength, maxUsernameLength, usernamePattern } from '../core/auth'
import { APP_PATHS, getLoginPath, getReturnPath } from '../core/paths'
import { useAuroraAuth } from '../composables/useAuroraAuth'
import { useAuroraTheme } from '../composables/useAuroraTheme'
import AuroraThemeMenu from './AuroraThemeMenu.vue'

type AuthPage = 'login-v1' | 'login-v2' | 'inscricao' | 'recuperar-email' | 'recuperar-senha' | 'cadastro-de-senha' | 'nao-encontrado'
const props = defineProps<{ page: AuthPage }>()
const { auth, user } = useAuroraAuth()
const { theme } = useAuroraTheme()
const { toast } = useCmToast()
const route = useRoute()
const router = useRouter()
const login = computed(() => props.page === 'login-v1' || props.page === 'login-v2')
const split = computed(() => props.page === 'login-v2')
const historyState = router.options.history.state
const routeState = { returnTo: historyState.returnTo, identifier: historyState.identifier, loginVersion: historyState.loginVersion }
const accountState = { ...routeState, loginVersion: split.value ? 'LoginV2' : 'LoginV1' }
const savedIdentifier = typeof routeState.identifier === 'string' ? routeState.identifier : undefined
const identifier = ref(savedIdentifier ?? demoCredentials.identifier)
const password = ref(savedIdentifier === undefined ? demoCredentials.password : '')
const showPassword = ref(false)
const pending = ref(false)
const invalid = ref('')
const answer = ref<string | null>(null)
const token = computed(() => String(route.query.token ?? ''))
const validToken = computed(() => auth?.canResetPassword(token.value))
const identifierId = useId()
const passwordId = useId()
const description = computed(() => ({
  'login-v1': '', 'login-v2': '',
  'inscricao': 'Cadastre seus dados para acessar o Aurora Ops neste navegador.',
  'recuperar-email': 'Informe o usuário para conferir uma parte do e-mail vinculado à conta neste navegador.',
  'recuperar-senha': 'Informe o e-mail da sua conta para gerar um link de recuperação neste navegador.',
  'cadastro-de-senha': validToken.value ? 'Escolha uma nova senha para acessar a conta.'
    : 'O link é inválido, expirou ou já foi usado. Solicite um novo link.',
  'nao-encontrado': 'Confira o endereço ou volte para uma página do Aurora Ops.',
})[props.page])
const title = computed(() => ({
  'login-v1': 'Entrar no Aurora Ops', 'login-v2': 'Entre na sua conta',
  'inscricao': 'Crie sua conta', 'recuperar-email': 'Recuperar e-mail',
  'recuperar-senha': 'Recuperar senha', 'cadastro-de-senha': 'Cadastrar nova senha',
  'nao-encontrado': 'Página não encontrada',
})[props.page])
const artwork = useAuthArtwork(theme)
const icons = { 'inscricao': UserRoundPlus, 'recuperar-email': ContactRound, 'recuperar-senha': LifeBuoy,
  'cadastro-de-senha': LifeBuoy, 'nao-encontrado': FileSearch }
const pageIcon = computed(() => login.value ? null : icons[props.page as keyof typeof icons])
const accountLink = (path: string) => ({ path, state: login.value ? accountState : routeState })
const loginLink = computed(() => accountLink(getLoginPath(routeState)))
useHead({ title: computed(() => (login.value ? split.value ? 'LoginV2' : 'LoginV1' : title.value) + ' | Aurora Ops') })

function clear() { invalid.value = ''; answer.value = null }
function fail(form: HTMLFormElement, name: string, message: string) {
  invalid.value = name
  const field = form.elements.namedItem(name)
  if (field instanceof HTMLElement) field.focus()
  toast(message, { tone: 'danger' })
}

async function submit(event: Event) {
  if (!auth || pending.value || !(event.currentTarget instanceof HTMLFormElement)) return
  const form = event.currentTarget
  const values = new FormData(form)
  const value = (name: string) => String(values.get(name) ?? '')
  if (login.value) {
    if (!value('identifier').trim()) return fail(form, 'identifier', 'Informe seu usuário ou e-mail.')
    if (!value('password')) return fail(form, 'password', 'Informe sua senha.')
  }
  if (props.page === 'inscricao') {
    if (!value('name').trim()) return fail(form, 'name', 'Informe seu nome completo.')
    const username = value('username').trim()
    if (username.length < minUsernameLength || username.length > maxUsernameLength || !usernamePattern.test(username)) {
      return fail(form, 'username', 'Use entre 3 e 30 caracteres com letras, números, pontos, hífens ou sublinhados.')
    }
  }
  if (props.page === 'inscricao' || props.page === 'recuperar-senha') {
    const field = form.elements.namedItem('email')
    if (!(field instanceof HTMLInputElement) || !field.validity.valid) {
      return fail(form, 'email', 'Informe um endereço de e-mail válido.')
    }
  }
  if ((props.page === 'inscricao' || props.page === 'cadastro-de-senha') && value('password').length < minPasswordLength) {
    return fail(form, 'password', 'Use pelo menos ' + minPasswordLength + ' caracteres.')
  }
  if (props.page === 'cadastro-de-senha' && value('confirmation') !== value('password')) {
    return fail(form, 'confirmation', 'A confirmação deve ser igual à senha.')
  }
  if (props.page === 'recuperar-email' && !value('username').trim()) {
    return fail(form, 'username', 'Informe o nome de usuário cadastrado.')
  }

  pending.value = true
  try {
    if (login.value) {
      await auth.login(value('identifier'), value('password'))
      await router.replace(getReturnPath(routeState))
    } else if (props.page === 'inscricao') {
      const username = value('username').trim()
      await auth.register({ name: value('name'), email: value('email'), username, password: value('password') })
      toast('Conta criada. Entre com seu usuário e senha.', { tone: 'success' })
      await router.replace({ path: getLoginPath(routeState), state: { ...routeState, identifier: username } })
    } else if (props.page === 'recuperar-email') {
      answer.value = auth.findRegisteredEmail(value('username'))
      if (!answer.value) toast('Nenhuma conta com esse usuário foi encontrada neste navegador.', { tone: 'warning' })
    } else if (props.page === 'recuperar-senha') {
      answer.value = auth.requestPasswordReset(value('email'))
      toast(answer.value ? 'Link de recuperação gerado.' : 'Nenhuma conta com esse e-mail foi encontrada neste navegador.',
        { tone: answer.value ? 'success' : 'warning' })
    } else if (props.page === 'cadastro-de-senha') {
      await auth.resetPassword(token.value, value('password'))
      toast('Senha salva. Entre com a nova senha.', { tone: 'success' })
      await router.replace({ path: getLoginPath(routeState), state: { ...routeState, identifier: '' } })
    }
  } catch (error) {
    toast(error instanceof Error ? error.message : 'Tente novamente em instantes.',
      { title: login.value ? 'Não foi possível entrar' : undefined, tone: 'danger' })
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <CmAuthLayout
    :layout="split ? 'split' : 'centered'" :appearance="login ? 'glass' : 'plain'"
    :title="title" :description="description" brand="Aurora Ops"
    :eyebrow="page === 'nao-encontrado' ? 'Erro 404' : undefined"
    :background-image="login && !split ? artwork.background : undefined"
    :artwork-image="split ? artwork.side : undefined"
  >
    <template #brandIcon><Activity :size="20" /></template>
    <template v-if="pageIcon" #icon><component :is="pageIcon" :size="21" aria-hidden="true" /></template>
    <template v-if="login" #actions>
      <NuxtLink
        :to="{ path: split ? APP_PATHS.loginV1 : APP_PATHS.loginV2, query: route.query, hash: route.hash, state: routeState }"
        class="cm-auth__switch"
      >{{ split ? 'LoginV1' : 'LoginV2' }} <ArrowUpRight :size="15" aria-hidden="true" /></NuxtLink>
    </template>

    <CmForm v-if="login" surface="plain" gap="md" class="cm-auth-form" novalidate @submit.prevent="submit">
      <CmStack gap="xs">
        <CmText as="label" :for="identifierId" class="cm-auth__field-label" size="sm" weight="semibold" spacing="none">
          Usuário ou e-mail
        </CmText>
        <CmInput
          :id="identifierId" v-model="identifier" name="identifier" required density="comfortable" autocomplete="username"
          autocapitalize="none" :spellcheck="false" :aria-invalid="invalid === 'identifier' || undefined" @input="clear"
        >
          <template #startIcon><UserRound :size="17" aria-hidden="true" /></template>
        </CmInput>
      </CmStack>
      <CmStack gap="xs">
        <CmText as="label" :for="passwordId" class="cm-auth__field-label" size="sm" weight="semibold" spacing="none">Senha</CmText>
        <CmInput
          :id="passwordId" v-model="password" :type="showPassword ? 'text' : 'password'" name="password" required
          density="comfortable" autocomplete="current-password" :aria-invalid="invalid === 'password' || undefined" @input="clear"
        >
          <template #endButton>
            <CmButton variant="ghost" size="sm" class="cm-auth__password-toggle"
              :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'" @click="showPassword = !showPassword"
            >{{ showPassword ? 'Ocultar' : 'Mostrar' }}</CmButton>
          </template>
        </CmInput>
      </CmStack>
      <CmRow class="cm-auth__form-links" justify="between" gap="xs" wrap>
        <NuxtLink :to="accountLink(APP_PATHS.recoverEmail)" class="cm-auth-link">{{ split ? 'Recuperar e-mail' : 'Esqueci meu e-mail' }}</NuxtLink>
        <NuxtLink :to="accountLink(APP_PATHS.recoverPassword)" class="cm-auth-link">{{ split ? 'Recuperar senha' : 'Esqueci minha senha' }}</NuxtLink>
      </CmRow>
      <CmStack gap="sm">
        <CmButton class="cm-auth__submit" type="submit" tone="primary" size="lg" full-width :loading="pending" loading-label="Entrando…">
          Entrar <template #trailingIcon><ArrowRight :size="18" aria-hidden="true" /></template>
        </CmButton>
        <CmText class="cm-auth__demo-hint" align="center" size="sm" tone="muted" spacing="none">
          Usuário <CmText as="code" family="mono" inline>{{ demoCredentials.identifier }}</CmText>
          · Senha <CmText as="code" family="mono" inline>{{ demoCredentials.password }}</CmText>
        </CmText>
      </CmStack>
    </CmForm>

    <CmRow v-else-if="page === 'nao-encontrado'" gap="sm" wrap>
      <NuxtLink class="cm-link cm-link--button" :to="user ? APP_PATHS.dashboard : APP_PATHS.loginV1">
        {{ user ? 'Voltar ao dashboard' : 'Ir para o login' }}
      </NuxtLink>
    </CmRow>
    <NuxtLink v-else-if="page === 'cadastro-de-senha' && !validToken" class="cm-auth-link" :to="accountLink(APP_PATHS.recoverPassword)">
      Solicitar link de recuperação
    </NuxtLink>
    <CmForm v-else surface="plain" gap="sm" class="cm-auth-form" novalidate @submit.prevent="submit" @input="clear">
      <CmInput v-if="page === 'inscricao'" name="name" label="Nome completo" autocomplete="name" required :aria-invalid="invalid === 'name' || undefined" />
      <CmInput v-if="page === 'inscricao' || page === 'recuperar-senha'" name="email" label="E-mail" type="email" required autocomplete="email" :aria-invalid="invalid === 'email' || undefined" />
      <CmInput v-if="page === 'inscricao' || page === 'recuperar-email'" name="username" label="Usuário" required autocomplete="username" :aria-invalid="invalid === 'username' || undefined" />
      <template v-if="page === 'inscricao' || page === 'cadastro-de-senha'">
        <CmInput
          name="password" :label="page === 'inscricao' ? 'Senha' : 'Nova senha'" required
          :type="showPassword ? 'text' : 'password'" autocomplete="new-password"
          :aria-invalid="invalid === 'password' || undefined" :helper-text="'Use pelo menos ' + minPasswordLength + ' caracteres.'"
        >
          <template #endButton>
            <CmButton variant="ghost" size="sm" class="cm-auth__password-toggle"
              :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'" @click="showPassword = !showPassword"
            >{{ showPassword ? 'Ocultar' : 'Mostrar' }}</CmButton>
          </template>
        </CmInput>
        <CmInput v-if="page === 'cadastro-de-senha'" name="confirmation" label="Confirmar nova senha" type="password" required autocomplete="new-password" :aria-invalid="invalid === 'confirmation' || undefined" />
      </template>
      <CmButton type="submit" tone="primary" size="lg" full-width :loading="pending">
        {{ page === 'inscricao' ? 'Criar conta' : page === 'recuperar-email' ? 'Consultar e-mail' : page === 'recuperar-senha' ? 'Gerar link de recuperação' : 'Salvar nova senha' }}
        <template #trailingIcon><ArrowRight :size="18" aria-hidden="true" /></template>
      </CmButton>
      <CmText v-if="answer && page === 'recuperar-email'" tone="muted">E-mail da conta: <strong>{{ answer }}</strong></CmText>
      <template v-if="page === 'recuperar-senha'">
        <CmStack v-if="answer" surface="muted" radius="md" padding="md" gap="xs">
          <CmText tone="muted" size="sm" spacing="none">Link da demonstração. Válido por 30 minutos e para um único uso.</CmText>
          <NuxtLink class="cm-auth-link" :to="{ path: APP_PATHS.setPassword, query: { token: answer }, state: routeState }">Abrir link para cadastrar nova senha</NuxtLink>
        </CmStack>
        <CmText v-else size="sm" tone="muted" spacing="none">Na demonstração, o link aparece aqui após a consulta.</CmText>
      </template>
      <NuxtLink v-if="page === 'recuperar-email'" class="cm-auth-link" :to="accountLink(APP_PATHS.recoverPassword)">Recuperar senha</NuxtLink>
    </CmForm>

    <template v-if="page !== 'nao-encontrado'" #footer>
      <CmRow v-if="login" align="center" justify="between" gap="xs" wrap>
        <CmText size="sm" tone="muted" spacing="none">
          <template v-if="!split">Ainda não tem uma conta? </template>
          <NuxtLink :to="accountLink(APP_PATHS.register)">Inscreva-se</NuxtLink>
        </CmText>
        <AuroraThemeMenu trigger-class="cm-auth__theme-menu" />
      </CmRow>
      <NuxtLink v-else :to="loginLink" class="cm-auth-link">Voltar ao login</NuxtLink>
    </template>
  </CmAuthLayout>
</template>
