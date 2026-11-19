import { Boxes, ChartNoAxesCombined, ClipboardList, Layers3, LifeBuoy, Palette } from 'lucide-vue-next'
import { APP_PATHS } from './paths'
import componentList from './componentList.json'

export type CategoryId = keyof typeof componentList
export const catalogPath = APP_PATHS.catalog

export const categories = [
  { id: 'navegacao', label: 'Ações e navegação', icon: Boxes, tone: 'info', description: 'Conecte páginas e organize comandos, menus e atalhos.' },
  { id: 'estrutura', label: 'Estrutura e layout', icon: Layers3, tone: 'primary', description: 'Monte páginas, painéis e grades que se adaptam ao espaço disponível.' },
  { id: 'formularios', label: 'Formulários', icon: ClipboardList, tone: 'success', description: 'Combine campos, filtros, validação e envio de dados.' },
  { id: 'feedback', label: 'Feedback e sobreposições', icon: LifeBuoy, tone: 'warning', description: 'Comunique o estado de uma tarefa e apresente detalhes sob demanda.' },
  { id: 'dados', label: 'Dados e visualização', icon: ChartNoAxesCombined, tone: 'accent', description: 'Explore registros, indicadores, gráficos e séries temporais.' },
  { id: 'tema', label: 'Tema e aparência', icon: Palette, tone: 'secondary', description: 'Experimente paletas, densidade e temas em áreas isoladas.' },
] as const

function slugFor(name: string) {
  return name.slice(2).replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

const collator = new Intl.Collator('pt-BR')

export const catalog = categories.flatMap(category =>
  componentList[category.id].map(entry => {
    const [name, label, description] = entry as [string, string, string]
    const slug = slugFor(name)
    const categoryPath = `${catalogPath}/${category.id}`
    return {
      name, label, description, slug, category, categoryPath,
      path: `${categoryPath}/${slug}`,
      docs: name === 'CmAuthLayout' ? undefined : `https://miltonjunior.dev.br/cosmemilton-ui/v4/components/${slug}`,
      reference: name === 'CmAlert' || name === 'CmAlertDialog',
    }
  }).sort((a, b) => collator.compare(a.label, b.label)),
)

export type CatalogItem = (typeof catalog)[number]
export const catalogByPath = new Map(catalog.map(item => [item.path, item]))
