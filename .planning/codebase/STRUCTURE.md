# Structure

## Top-Level Layout
- `app/` — entrypoints do Next App Router
- `components/dashboard/` — componentes específicos do produto RADAR
- `components/ui/` — design system local baseado em wrappers do Radix
- `lib/` — helpers e lógica de score/dados
- `hooks/` — hooks genéricos compartilháveis
- `public/` — ícones e placeholders
- `styles/` — CSS legado/auxiliar

## Important Product Files
- `app/page.tsx` — monta o dashboard
- `app/layout.tsx` — layout raiz, metadata e analytics
- `components/dashboard/index.tsx` — composição das 3 áreas do produto
- `components/dashboard/header.tsx` — topo e filtro de período
- `components/dashboard/search-panel.tsx` — busca, card analítico e modal de termos
- `components/dashboard/config-panel.tsx` — edição de parâmetros do score
- `components/dashboard/term-cluster.tsx` — visualização interativa dos termos
- `components/dashboard/data-table.tsx` — exploração tabular
- `lib/radar-data.ts` — cálculo, enriquecimento e filtros
- `lib/radar-data-source.ts` — dataset completo embutido

## UI Kit Layout
- primitives de layout:
  - `components/ui/card.tsx`
  - `components/ui/button.tsx`
  - `components/ui/input.tsx`
  - `components/ui/tabs.tsx`
- feedback/overlay:
  - `components/ui/dialog.tsx`
  - `components/ui/toast.tsx`
  - `components/ui/tooltip.tsx`
- form controls:
  - `components/ui/slider.tsx`
  - `components/ui/select.tsx`
  - `components/ui/switch.tsx`

## Naming Patterns
- componentes React em PascalCase exportados por função
- arquivos de produto em kebab-case, por exemplo `search-panel.tsx`
- tipos e helpers exportados de `lib/radar-data.ts`

## Structural Observations
- o projeto é essencialmente uma única página rica
- não há rotas adicionais nem módulos de domínio segmentados por feature
- não há pasta dedicada para persistence, services ou state stores
- não há diretório de testes

## Structure Needed for Upcoming Work
- `lib/data-sources.ts` ou similar para versionamento/origem de dados
- `lib/history.ts` ou store equivalente para snapshots de busca/configuração
- possível `components/dashboard/history-*` para cards/timelines de histórico
- possível `hooks/use-radar-persistence.ts` para centralizar `localStorage`
