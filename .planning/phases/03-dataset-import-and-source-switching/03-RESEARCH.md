# Phase 03 Research - Dataset Import and Source Switching

## Summary

O projeto ja possui a fundacao de persistence e data source registry introduzida na Fase 1. O trabalho desta fase nao precisa reinventar essa base; precisa transformar um registry interno em um fluxo de produto completo, com parsing de arquivo, versionamento legivel e selecao de origem visivel no header.

## What already exists

### Data source registry

`lib/radar-data-sources.ts` ja oferece:

- bootstrap da origem embarcada
- leitura da origem ativa
- troca da origem ativa
- registro de origem importada

Isso reduz muito o risco estrutural: o foco agora e a borda de entrada do arquivo e a integracao visual.

### Persistence model

`lib/radar-schemas.ts` ja define `RadarDataSourceRecord` com:

- `id`
- `version`
- `label`
- `kind`
- `createdAt`
- `recordCount`
- `isActive`
- `data`
- `meta`

O modelo ja suporta multiplas versoes locais. A fase deve apenas garantir que a importacao preencha esse contrato de modo consistente.

### Dashboard orchestration

`use-radar-dashboard.ts` ja:

- carrega o persistence state
- expone `activeDataSource`
- expone `changeActiveDataSource`
- calcula `rawData` a partir da origem ativa

Ou seja: se o fluxo de importacao registrar corretamente uma nova origem e a UI acionar `changeActiveDataSource`, o dashboard todo ja tem uma boa parte do encanamento pronta.

## Recommended product shape

### 1. Dedicated import layer

Criar uma camada clara, por exemplo `lib/radar-import.ts`, para:

- ler o arquivo escolhido
- detectar/parsear linhas
- normalizar nomes de colunas
- validar contra `rawTermDataSchema`
- montar um resultado com `rows`, `errors`, `summary`

Essa separacao evita enterrar parsing dentro de componentes React ou do hook principal.

### 2. Explicit import UX

O fluxo ideal e:

1. Usuario abre menu/dropdown de origem
2. Clica em `Importar planilha`
3. Seleciona arquivo
4. Ve um resumo curto ou feedback de erro
5. Confirma a importacao
6. A nova origem aparece no dropdown e pode virar ativa

Para manter a fase enxuta, a revisao pode ser compacta, sem montar wizard grande.

### 3. Dropdown as source control surface

O header ja reserva espaco para `Origem ativa`. Em vez de adicionar um novo bloco separado, o melhor e transformar essa area em `trigger` de um dropdown/popover com:

- origem atual em destaque
- lista curta de outras origens
- metadata secundaria
- acao de importar nova planilha

Isso mantem a hierarquia visual limpa.

## Format decision

### Pragmatic assumption

Como o projeto ainda nao possui dependencia dedicada para leitura `.xlsx`, a estrategia mais segura para esta fase e planejar a importacao manual a partir de arquivo tabular exportado da planilha, priorizando CSV UTF-8 e estruturando a camada de parser para extensao futura.

### Why this is defensible

- reduz superficie de falha
- evita dependencia pesada prematura
- cobre o caso real de usuario exportando dados da planilha
- preserva a possibilidade de adicionar `.xlsx` depois sem quebrar o contrato interno

Se, durante a execucao, o time decidir aceitar `.xlsx`, isso pode entrar no plano 03-01 como extensao opcional caso a dependencia seja justificada.

## Validation and normalization concerns

O parser precisa lidar explicitamente com:

- colunas obrigatorias ausentes
- nomes de colunas equivalentes
- numeros com virgula ou ponto
- linhas vazias
- termos duplicados
- CTR fora do intervalo esperado
- posicao invalida

O output ideal da camada de importacao nao e apenas `success/fail`; deve expor lista de erros compreensiveis para a UI.

## State reconciliation concerns

Trocar de origem pode invalidar:

- `selectedTerm`
- comparacoes historicas da consulta
- historico associado a outra origem

O minimo seguro para esta fase:

- resetar `selectedTerm` quando a origem ativa mudar
- manter historicos persistidos, mas sempre associados a `dataSourceId`
- garantir que a UI mostre dados somente da origem ativa

## Verification focus

Ao executar esta fase, os checkpoints principais devem ser:

1. Importar um CSV valido registra uma nova origem
2. Importar um arquivo invalido nao altera a origem ativa
3. Trocar a origem atualiza KPIs, tabela, cluster e consulta
4. O header continua legivel mesmo com multiplas origens locais
