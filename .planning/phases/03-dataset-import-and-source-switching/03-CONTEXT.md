# Phase 03 Context - Dataset Import and Source Switching

## Why this phase exists

A Fase 1 criou a fundacao local-first para `dataSources` e `activeDataSourceId`, mas o usuario ainda nao consegue trazer um dataset novo nem trocar explicitamente a origem ativa. Esta fase fecha o circuito de ingestao manual e leitura multi-origem no dashboard.

## Phase boundary

Esta fase cobre:

- parsing e validacao de planilha local
- registro de novas origens/importacoes no persistence state
- selecao da origem ativa na interface
- propagacao consistente da origem ativa para todos os modulos do dashboard

Esta fase nao cobre:

- colaboracao multiusuario
- sync remoto
- importacao automatica por API

## Locked decisions

- Continuar local-first, reaproveitando `radar-persistence.ts` e `radar-data-sources.ts`.
- Reusar o header como ponto canonico para descoberta da origem ativa.
- Tratar importacao como fluxo seguro: validar primeiro, registrar depois, ativar por escolha explicita ou flag controlada.
- Manter visual minimalista; importacao deve parecer uma extensao do dashboard, nao uma tela paralela.

## Canonical references

- `lib/radar-data-sources.ts`
- `lib/radar-persistence.ts`
- `lib/radar-schemas.ts`
- `hooks/use-radar-dashboard.ts`
- `components/dashboard/header.tsx`
- `components/dashboard/index.tsx`
- `.planning/phase-03-prd.md`
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`

## Existing foundation

- `registerImportedRadarDataSource()` ja existe e registra uma origem importada no registry local.
- `changeActiveDataSource()` ja existe no hook principal, mas ainda nao esta conectado a uma UI real.
- `Header` ja recebe `activeSourceLabel`, mas ainda nao expone dropdown de troca de origem.
- O registry atual usa `kind`, `createdAt`, `recordCount`, `meta` e `data`, o que ja cobre boa parte do metadata necessario.

## Main risks

1. O formato do arquivo importado pode divergir do schema esperado e gerar erros confusos.
2. Um dataset invalido pode sobrescrever ou ativar uma origem errada se o fluxo de registro nao for defensivo.
3. A troca de origem precisa resetar ou reconciliar estado derivado, como termo selecionado e historicos contextuais.
4. O dropdown pode crescer demais visualmente se tentar expor metadata demais.

## Definition of done

Esta fase termina quando existe um fluxo coerente de importacao + registry + source switching e o dashboard inteiro reage corretamente a ele, com feedback claro em caso de erro.
