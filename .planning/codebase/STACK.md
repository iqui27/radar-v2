# Stack

## Overview
- Application type: dashboard web app em `Next.js` com App Router.
- Main language: `TypeScript`.
- UI runtime: `React 19`.
- Styling: `Tailwind CSS v4` + classes utilitárias customizadas em `app/globals.css`.
- Charts: `recharts`.
- Component primitives: `Radix UI`.

## Core Runtime
- `next@16.2.0` em `package.json`
- `react@19.2.4` e `react-dom@19.2.4`
- entrypoint da aplicação em `app/page.tsx`
- root layout em `app/layout.tsx`

## Main Feature Modules
- dashboard shell em `components/dashboard/index.tsx`
- search / term analysis em `components/dashboard/search-panel.tsx`
- cluster visualization em `components/dashboard/term-cluster.tsx`
- configuration editor em `components/dashboard/config-panel.tsx`
- charts e tables em `components/dashboard/*.tsx`
- scoring/data layer em `lib/radar-data.ts`
- local dataset em `lib/radar-data-source.ts`

## Styling and Design System
- global theme tokens em `app/globals.css`
- utility merge helper em `lib/utils.ts`
- reusable UI kit em `components/ui/*`
- cards, dialog, input, tabs, slider, select e toast já existem no kit

## Forms and Validation
- `react-hook-form`, `zod` e `@hookform/resolvers` estão instalados
- hoje o dashboard principal quase não usa esse stack; a configuração atual é state-driven sem schema validation formal

## Date / Utility Libraries
- `date-fns` para períodos e labels de data
- `clsx`, `class-variance-authority`, `tailwind-merge` para composição de classes

## Analytics / Observability
- `@vercel/analytics` está ligado em `app/layout.tsx`
- não há camada de telemetry própria, logger de domínio ou tracing

## Build / Tooling
- `typescript@5.7.3`
- `next dev`, `next build`, `next start`
- `eslint` está configurado por script, mas ainda sem inspeção profunda da base nesta sessão
- `pnpm-lock.yaml` indica `pnpm` como gerenciador esperado

## Data Model Shape
- tipo cru em `lib/radar-data.ts`: `RawTermData`
- enriquecimento calculado em `EnrichedTermData`
- dataset atual carregado localmente de `lib/radar-data-source.ts`
- filtro de período é sintético, derivado da base de 90 dias em `filterRadarDataByDateRange`

## Operational Notes
- não há backend, banco ou API server nesta base
- o produto hoje opera como dashboard client-side com dataset local embutido
- persistência de configurações, histórico de busca e versões de dados ainda não existem
