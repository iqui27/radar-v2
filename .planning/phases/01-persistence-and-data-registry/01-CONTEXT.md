# Phase 1: Persistence and Data Registry - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning
**Source:** PRD Express Path (.planning/phase-01-prd.md)

<domain>
## Phase Boundary

Esta fase entrega a fundacao local-first para persistir configuracoes do score RADAR, snapshots restauraveis e um registry de origens de dados versionadas. O objetivo e trocar o dashboard de um modelo singleton em memoria para um modelo estruturado e persistido, sem ainda implementar toda a UX final de historico nem o fluxo completo de importacao visual.
</domain>

<decisions>
## Implementation Decisions

### Locked Decisions
- A primeira implementacao deve funcionar sem backend.
- Toda configuracao salva deve virar snapshot restauravel.
- O dataset embutido atual precisa virar a origem inicial dentro de um registry versionado.
- O dashboard inteiro deve passar a consumir a origem de dados ativa.
- A base visual atual nao pode sofrer regressao grande durante a migracao.

### the agent's Discretion
- Formato interno dos modelos persistidos.
- Estrategia de store local do dashboard.
- Separacao entre helpers de schema, persistence e selecao de dados.
- Quanto da UI atual precisa mudar nesta fase versus ficar para as fases 2 e 3.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product shell
- `components/dashboard/index.tsx` - shell principal, estado atual de config, periodo, tabs e termo selecionado
- `components/dashboard/config-panel.tsx` - experiencia atual de alteracao e save/reset de configuracoes
- `components/dashboard/search-panel.tsx` - consulta por termo, card analitico e toggle individual/agregado

### Domain and data
- `lib/radar-data.ts` - score RADAR, filtros por periodo, cluster metrics, KPIs e tipagem principal
- `lib/radar-data-source.ts` - dataset local atual que precisa virar origem versionada inicial

### Planning context
- `.planning/codebase/ARCHITECTURE.md` - limites arquiteturais do brownfield
- `.planning/codebase/CONCERNS.md` - riscos relevantes desta fase
- `.planning/PROJECT.md` - escopo ativo e restricoes de produto
- `.planning/REQUIREMENTS.md` - requisitos mapeados para a fase
- `.planning/ROADMAP.md` - contrato da fase e criteria de sucesso
</canonical_refs>

<specifics>
## Specific Ideas

- Historicos e snapshots devem carregar metadata suficiente para comparacao futura por termo.
- O store novo deve abrir caminho para a fase 2 exibir historico de busca e restauracao.
- O registry de origem precisa suportar pelo menos a origem embutida atual e futuras importacoes.
</specifics>

<deferred>
## Deferred Ideas

- UX completa de historico no dashboard.
- Comparacao visual detalhada de metricas no card historico.
- Importacao de planilha com parser e feedback de erro.
</deferred>

---

*Phase: 01-persistence-and-data-registry*
*Context gathered: 2026-03-31 via PRD Express Path*
