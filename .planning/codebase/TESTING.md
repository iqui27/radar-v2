# Testing

## Current State
- não encontrei diretório `__tests__`, `tests/` ou arquivos `*.test.*` na base mapeada.
- `package.json` não expõe script `test`.
- o fluxo atual de verificação parece ser manual + `pnpm exec tsc --noEmit`.

## What Is Being Validated Today
- tipagem TypeScript
- compilação do Next em ambiente de dev/build quando executado manualmente
- inspeção visual manual do dashboard

## Uncovered Areas
- cálculo de score em `lib/radar-data.ts`
- regras de faixa (`weights`, `posThresholds`, `scoreBands`)
- derivação de cluster e related terms
- persistência de busca/configuração ainda inexistente
- importação/versionamento de datasets ainda inexistente

## High-Value First Tests
- unit tests para:
  - `calcScore`
  - `getExpCTR`
  - `getScoreAction`
  - `filterRadarDataByDateRange`
  - `calculateClusterMetrics`
- component tests para:
  - busca e seleção de termo
  - toggle individual/agregada
  - restore de configuração
  - seleção de origem dos dados

## Integration / E2E Priorities
- importar planilha e ver nova versão aparecer no dropdown
- salvar configuração e restaurar snapshot anterior
- clicar em termo e visualizar deltas históricos corretos
- histórico de buscas refletir seleção/consulta de termos

## Suggested Stack
- `vitest` + `@testing-library/react` para unidade e componente
- Playwright para smoke/E2E do dashboard

## Testing Risks if Left As-Is
- regressões silenciosas no score
- histórico exibindo dados incorretos por snapshot inconsistente
- imports de planilha quebrando parsing sem feedback claro
- toggles e filtros com bugs de estado difíceis de detectar só visualmente
