# Architecture

## Architectural Style
- arquitetura predominantemente client-side, orientada a composição de componentes React.
- não há separação formal entre domínio, aplicação e infraestrutura.
- a lógica de domínio mais relevante está concentrada em `lib/radar-data.ts`.

## Entry Points
- `app/page.tsx` renderiza diretamente `<Dashboard />`
- `components/dashboard/index.tsx` é o shell principal do produto
- `app/layout.tsx` define metadata, tema dark inicial e analytics

## Main Data Flow
1. `RADAR_DATA` é carregado de `lib/radar-data-source.ts`
2. `filterRadarDataByDateRange` deriva a visão por período
3. `enrichTermData` calcula score, expected CTR e ação
4. `calculateKPIs` agrega KPIs gerais
5. o componente `Dashboard` distribui `enrichedData`, `config`, `selectedTerm` e handlers para as tabs

## State Ownership Today
- `components/dashboard/index.tsx`
  - `theme`
  - `dateRange`
  - `config`
  - `isDirty`
  - `selectedTerm`
  - `activeTab`
  - `panoramaView`
- `components/dashboard/search-panel.tsx`
  - estado da busca
  - sugestões abertas/fechadas
  - alternância individual/agregada
- `components/dashboard/config-panel.tsx`
  - busca do preview
  - seção ativa de configuração

## Domain Computation Layer
- scoring:
  - `getExpCTR`
  - `getWeight`
  - `calcScore`
  - `getScoreAction`
- cluster:
  - `getRelatedTerms`
  - `calculateClusterMetrics`
- KPI:
  - `calculateKPIs`

## UI Composition
- panorama:
  - `KPICards`
  - `RadarScatterChart`
  - `ScoreDistributionChart`
  - `TopTermsChart`
  - `DataTable`
- consulta:
  - `SearchPanel`
  - `TermAnalysisCard`
  - `TermCluster`
- configuração:
  - `ConfigPanel`

## Architectural Strengths
- domínio de score concentrado em um arquivo único
- base visual consistente reaproveitando `components/ui/*`
- evolução rápida de UX porque a maior parte do estado mora no shell do dashboard

## Architectural Weaknesses
- ausência de camada de persistence/store compartilhado
- histórico de busca/configuração/datasets não tem lugar arquitetural explícito
- `Dashboard` já concentra coordenação demais
- falta um modelo de “data source” versionado
- métricas históricas/comparativas ainda não têm abstração de snapshot
