# Phase 1 PRD - Persistence and Data Registry

## Objective

Criar a fundacao persistente do RADAR v2 para que historico de buscas, snapshots de configuracao e versoes de datasets passem a existir como contratos de dominio confiaveis e reutilizaveis por todo o dashboard.

## Scope

- Introduzir persistence local-first para o dashboard.
- Garantir que as alteracoes das variaveis do score sejam validadas e salvem snapshots consistentes.
- Criar um registry de datasets/origens com metadata e versao.
- Preparar o dashboard para ler dados a partir desse registry, sem ainda entregar o fluxo completo de importacao de planilha na UI.

## Functional Requirements

1. O sistema deve ter um modelo persistido para configuracao atual do score RADAR.
2. O sistema deve gerar um snapshot restauravel sempre que o usuario salvar configuracao.
3. O snapshot deve armazenar timestamp e contexto suficiente para auditoria local.
4. O sistema deve validar invariantes das variaveis antes de salvar:
   - thresholds em ordem crescente
   - score bands em ordem crescente
   - CTR esperado por posicao com valores validos
5. O sistema deve ter um modelo persistido para historico de buscas e selecoes de termo, mesmo que a UI principal venha na fase seguinte.
6. O sistema deve ter um registry de origens de dados com:
   - id
   - label
   - tipo/origem
   - createdAt
   - versao
   - recordCount
   - flag de origem ativa
7. O dataset atual embutido deve ser migrado para esse registry como origem inicial.
8. KPIs, consulta, tabela, cluster e graficos devem consumir a origem ativa do registry.

## Non-Goals

- Nao implementar ainda backend multiusuario.
- Nao concluir ainda a experiencia final de historico visivel no dashboard.
- Nao concluir ainda o fluxo visual completo de importacao por planilha.

## UX / Product Notes

- A nova fundacao nao deve piorar a performance percebida do dashboard.
- O comportamento atual do dashboard precisa continuar funcionando durante a migracao.
- A UI de configuracao deve continuar simples, mas com seguranca maior no salvar/restaurar.

## Acceptance Criteria

- Existe uma camada clara de persistence reutilizavel pelo dashboard.
- Salvar configuracao gera snapshot valido e restauravel.
- O dataset embutido aparece como uma data source versionada inicial.
- A app consegue carregar a origem ativa e recalcular o dashboard inteiro a partir dela.
- Typecheck e build continuam verdes.
