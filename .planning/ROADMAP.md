# Roadmap: RADAR v2

## Overview

O proximo milestone do RADAR v2 transforma o dashboard atual em uma ferramenta com memoria operacional e gestao de dados versionados. A sequencia prioriza primeiro a fundacao de persistencia e contratos de dominio, depois a experiencia de historico/configuracao, e por fim a importacao e troca de origem de dados em toda a interface.

## Phases

- [x] **Phase 1: Persistence and Data Registry** - Criar a base confiavel para snapshots de configuracao, historico e versoes de dataset. (completed 2026-03-31)
- [ ] **Phase 2: Search and Config History UX** - Exibir historicos e deltas de metricas na consulta e na configuracao.
- [ ] **Phase 3: Dataset Import and Source Switching** - Importar planilhas, gerar novas versoes e trocar a origem ativa no dashboard.

## Phase Details

### Phase 1: Persistence and Data Registry
**Goal**: Introduzir um modelo persistente e validado para configuracoes, historicos e versoes de dados sem quebrar a leitura atual do dashboard.
**Depends on**: Nothing (first phase)
**Requirements**: CONF-01, CONF-02, DATA-02
**Success Criteria** (what must be TRUE):
  1. Dashboard possui uma camada clara para salvar e carregar configuracoes versionadas.
  2. Cada snapshot de configuracao respeita validacoes e invariantes do score antes de persistir.
  3. Existe um registry local de origens de dados com versao, metadata e origem ativa.
  4. Os dados consumidos por KPIs, consulta, cluster e tabela passam a depender desse registry sem regressao visual.
**Plans**: 3 plans

Plans:
- [x] 01-01: Definir contratos de persistence para config snapshots, search history e data sources.
- [x] 01-02: Extrair a orquestracao do dashboard para um state container local-first.
- [x] 01-03: Integrar o registry persistido ao pipeline de enriquecimento do dashboard.

### Phase 2: Search and Config History UX
**Goal**: Mostrar historico util de buscas, snapshots de configuracao e deltas de metricas no fluxo de consulta.
**Depends on**: Phase 1
**Requirements**: HIST-01, HIST-02, HIST-03, CONF-03
**Success Criteria** (what must be TRUE):
  1. Usuario ve historico recente de buscas e selecoes com timestamp e contexto.
  2. Painel de configuracao mostra snapshots salvos e oferece restauracao segura.
  3. Ao consultar um termo, a interface compara metricas com snapshot/historico anterior de forma legivel.
  4. O desenho da experiencia continua minimalista e nao polui o card principal.
**Plans**: 3 plans

Plans:
- [ ] 02-01: Construir componentes de historico de busca e selecao de termos.
- [ ] 02-02: Construir timeline de snapshots de configuracao com restore.
- [ ] 02-03: Exibir deltas de metricas por termo usando snapshots historicos.

### Phase 3: Dataset Import and Source Switching
**Goal**: Permitir importacao de planilhas como novas versoes de dados e alternar a origem ativa em todo o dashboard.
**Depends on**: Phase 1
**Requirements**: DATA-01, DATA-03, DATA-04
**Success Criteria** (what must be TRUE):
  1. Usuario consegue importar uma planilha valida e ver uma nova versao de dataset registrada.
  2. O header ou area apropriada oferece dropdown de origem de dados ativa.
  3. Trocar a origem recalcula consistentemente KPIs, cards, tabela, cluster e graficos.
  4. Falhas de importacao recebem feedback claro sem corromper a origem atual.
**Plans**: 3 plans

Plans:
- [ ] 03-01: Implementar parser e validacao da planilha importada.
- [ ] 03-02: Registrar novas versoes e metadata da origem de dados.
- [ ] 03-03: Conectar dropdown de origem a todo o dashboard.

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Persistence and Data Registry | 3/3 | Complete | 2026-03-31 |
| 2. Search and Config History UX | 0/3 | Not started | - |
| 3. Dataset Import and Source Switching | 0/3 | Not started | - |
