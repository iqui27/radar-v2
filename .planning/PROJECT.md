# RADAR v2

## What This Is

RADAR v2 e um dashboard de analise de termos de busca para orientar decisao entre evitar, avaliar, testar ou investir. O produto cruza posicao, CTR, impressoes, cliques e score RADAR em uma interface visual para leitura operacional e exploratoria. O foco atual e transformar esse brownfield em uma ferramenta com memoria operacional, configuracao versionada e multiplas origens de dados.

## Core Value

O cliente precisa tomar decisao sobre termos com contexto confiavel, historico legivel e leitura consistente dos dados.

## Requirements

### Validated

- ✓ Panorama analitico com KPIs, scatter, distribuicao e tabela interativa.
- ✓ Consulta por termo com card analitico, cluster relacionado e leitura individual/agregada.
- ✓ Ajuste manual dos parametros do score RADAR no painel de configuracao.
- ✓ Filtro global de periodo e navegacao principal do dashboard.

### Active

- [ ] Persistir historico de buscas e selecoes de termo com contexto temporal.
- [ ] Versionar configuracoes do score RADAR com snapshots restauraveis.
- [ ] Exibir variacao historica de metricas quando um termo for consultado.
- [ ] Importar novas planilhas como novas versoes de dataset.
- [ ] Permitir troca explicita da origem de dados em todo o dashboard.

### Out of Scope

- Backend multiusuario com sincronizacao entre maquinas — o escopo atual e local-first no browser.
- Integracao com APIs externas em tempo real — primeiro precisamos estabilizar persistencia e versionamento local.
- Auth e perfis de usuario — nao fazem parte do valor central deste dashboard.

## Context

O projeto ja possui uma base funcional em `Next.js`, `React 19`, `Tailwind` e `Recharts`, com dataset local de 1000 termos em `lib/radar-data-source.ts`. A logica principal de score e enriquecimento esta em `lib/radar-data.ts`. O usuario quer se aproximar do dashboard antigo, especialmente no que diz respeito a historicos de configuracao e leitura comparativa de termos, sem perder a linguagem visual mais refinada ja introduzida no v2.

## Constraints

- **Tech stack**: Manter `Next.js` + `React` + `TypeScript` — e a base ja existente do produto.
- **Persistence**: Primeira versao deve funcionar sem backend — historicos e versoes precisam nascer localmente.
- **Brownfield**: Evoluir sem quebrar o dashboard atual — a leitura existente precisa continuar utilizavel.
- **UX**: Historico e controle de origem precisam ser claros sem poluir a consulta principal.
- **Data integrity**: Mudancas de configuracao e origem precisam refletir corretamente em score, tabela, cluster e KPIs.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Manter a base como dashboard client-side | Permite iteracao rapida sobre UX e dominio antes de backend | ✓ Good |
| Centralizar score e enriquecimento em `lib/radar-data.ts` | Facilita consistencia entre cards, tabela e graficos | ✓ Good |
| Tratar persistencia nova como local-first | Resolve a pendencia atual sem aumentar superficie tecnica cedo demais | — Pending |
| Separar origem de dados em registry/versionamento explicito | Evita acoplamento a um unico dataset importado | — Pending |

---
*Last updated: 2026-03-31 after GSD project initialization*
