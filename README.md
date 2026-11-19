# Aurora Ops Admin para Vue e Nuxt

Template do Aurora Ops com Vue 3, Nuxt e o pacote `@cosmemilton/ui-vue` publicado no npm. As telas e a navegação são renderizadas em Vue.

## Executar

    npm ci
    npm run dev

Abra http://localhost:3000/app/login-v1. A conta de demonstração usa usuário e senha admin. O segundo layout fica em /app/login-v2.

A aplicação oferece temas Aurora, Claro e Escuro, navegação por contexto, dashboards, cadastros locais, agenda, relatórios com PDF/CSV/JSON e catálogo. Contas, sessão e alterações de exemplo usam o armazenamento deste navegador. A recuperação de senha emite um link local de demonstração.

O catálogo inclui exemplos nativos para os componentes disponíveis e identifica as demonstrações da edição React que ainda não foram portadas.

## Produção

    npm run typecheck
    npm run build
    npm run preview

Para hospedar como site estático, execute `npm run generate` e publique `.output/public`. Configure o servidor para servir `index.html` quando uma rota da aplicação for acessada diretamente.

Para publicar sob um subdiretório, defina `NUXT_APP_BASE_URL` com o prefixo, incluindo a barra final, antes de gerar o site. No PowerShell:

    $env:NUXT_APP_BASE_URL = '/aurora-admin-vue/'
    npm run generate
