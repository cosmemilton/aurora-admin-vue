import type { Component } from 'vue'
import {
  Boxes, CalendarDays, ChartNoAxesCombined, ClipboardList,
  ContactRound, Factory, FileBarChart, Handshake, Home, Landmark, LayoutDashboard,
  Layers3, Package, ReceiptText, ShoppingBag, UsersRound, Wallet, Wrench,
} from 'lucide-vue-next'
import { catalogPath, categories } from './catalog'

type Page = {
  path: string
  label: string
  description: string
  icon: Component

}

type NavigationGroup = { label: string; icon: Component; overviewPath?: string; pages: Page[] }

// Uma entrada aqui registra a rota, o item da barra lateral e o resultado da busca.
export const navigation: NavigationGroup[] = [
  {
    label: 'Dashboards', icon: LayoutDashboard, overviewPath: '/app/dashboard',
    pages: [
      { path: '/app/dashboard', label: 'Visão geral', description: 'Indicadores de toda a operação', icon: Home },
      { path: '/app/dashboard/crm', label: 'CRM', description: 'Clientes e funil comercial', icon: UsersRound },
      { path: '/app/dashboard/erp', label: 'ERP', description: 'Pedidos e posição do estoque', icon: Factory },
      { path: '/app/dashboard/financeiro', label: 'Financeiro', description: 'Recebimentos, pagamentos e saldo', icon: Landmark },
      { path: '/app/dashboard/servicos', label: 'Ordens de serviço', description: 'Atendimentos e equipe em campo', icon: Wrench },
    ],
  },
  {
    label: 'CRM', icon: ContactRound, overviewPath: '/app/dashboard/crm',
    pages: [
      { path: '/app/crm/clientes', label: 'Clientes', description: 'Cadastro e contatos de clientes', icon: UsersRound },
      { path: '/app/crm/oportunidades', label: 'Oportunidades', description: 'Negociação e etapas do funil de vendas', icon: Handshake },
    ],
  },
  {
    label: 'ERP', icon: Boxes, overviewPath: '/app/dashboard/erp',
    pages: [
      { path: '/app/erp/pedidos', label: 'Pedidos', description: 'Pedidos de venda e expedição', icon: ShoppingBag },
      { path: '/app/erp/estoque', label: 'Estoque', description: 'Produtos, saldos e movimentação', icon: Package },
    ],
  },
  {
    label: 'Financeiro', icon: Wallet, overviewPath: '/app/dashboard/financeiro',
    pages: [
      { path: '/app/financeiro/lancamentos', label: 'Lançamentos', description: 'Contas a pagar e a receber', icon: ReceiptText },
      { path: '/app/financeiro/fluxo-de-caixa', label: 'Fluxo de caixa', description: 'Entradas, saídas e saldo', icon: ChartNoAxesCombined },
    ],
  },
  {
    label: 'Serviços', icon: Wrench, overviewPath: '/app/dashboard/servicos',
    pages: [
      { path: '/app/servicos/ordens', label: 'Ordens de serviço', description: 'Abertura e acompanhamento das OS', icon: ClipboardList },
      { path: '/app/servicos/agenda', label: 'Agenda técnica', description: 'Visitas agendadas por técnico', icon: CalendarDays },
    ],
  },
  {
    label: 'Relatórios', icon: FileBarChart,
    pages: [
      { path: '/app/relatorios/estoque', label: 'Posição de estoque', description: 'Saldos, mínimos e reposição por produto', icon: Package },
      { path: '/app/relatorios/financeiro', label: 'Lançamentos financeiros', description: 'Vencimentos, entradas, saídas e liquidações', icon: ReceiptText },
      { path: '/app/relatorios/servicos', label: 'Ordens por técnico', description: 'Equipe, agendamentos e situação das ordens', icon: ClipboardList },
    ],
  },
  {
    label: 'Componentes', icon: Layers3, overviewPath: catalogPath,
    pages: [
      { path: catalogPath, label: 'Catálogo', description: 'Exemplos dos componentes da cm-ui', icon: Layers3 },
      ...categories.map(category => ({
        path: catalogPath + '/' + category.id, label: category.label, description: category.description,
        icon: category.icon,
      })),
    ],
  },
]
