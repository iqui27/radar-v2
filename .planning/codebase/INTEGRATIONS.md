# Integrations

## Current External Dependencies in Use
- `@vercel/analytics/next` em `app/layout.tsx`
- `next/font/google` para `Geist` e `Geist_Mono` em `app/layout.tsx`
- `Radix UI` primitives via `components/ui/*`
- `recharts` via `components/dashboard/scatter-chart.tsx` e `components/dashboard/distribution-chart.tsx`

## Data Sources
- primary source atual: arquivo local `lib/radar-data-source.ts`
- source original mencionado pelo usuário: `/Users/hrocha/Projetos/Monumenta/radar/data.js`
- não existe integração ativa com upload de planilha, storage ou versionamento de datasets

## Browser / Client APIs
- `document.documentElement.classList` para tema em `components/dashboard/index.tsx`
- eventos DOM (`mousedown`) para fechar dropdown de busca em `components/dashboard/search-panel.tsx`
- animações e drag do cluster dependem do runtime do navegador em `components/dashboard/term-cluster.tsx`

## UI Infrastructure
- `@radix-ui/react-dialog` encapsulado em `components/ui/dialog.tsx`
- `@radix-ui/react-slider` encapsulado em `components/ui/slider.tsx`
- `@radix-ui/react-tabs` encapsulado em `components/ui/tabs.tsx`
- outros wrappers prontos: select, popover, tooltip, dropdown, toast, alert-dialog

## Missing Integrations for Requested Work
- persistência local (`localStorage`, IndexedDB) ainda não é usada
- API para histórico/versionamento ainda não existe
- parser de planilha (`xlsx`, `papaparse`, CSV import) não está instalado
- nenhuma camada de armazenamento remoto para múltiplas origens de dados

## Likely Future Integration Points
- importação de planilha:
  - parsing client-side com `xlsx`
  - persistência de versões em `localStorage` para protótipo ou backend posterior
- histórico de busca:
  - persistência local por usuário no navegador
- histórico de configuração:
  - snapshots versionados localmente com timestamp e restore
- origem dos dados:
  - registry de datasets ativos + metadata de importação

## Constraints
- como a app hoje é 100% client-side, qualquer “histórico” e “versão” precisará nascer primeiro no browser state/local persistence
- sem backend, não há multiusuário, auditoria central ou garantia de consistência entre máquinas
