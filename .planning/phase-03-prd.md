# Phase 3 PRD - Dataset Import and Source Switching

## Objective

Permitir que o usuario importe uma nova planilha de termos e metricas, gere uma nova versao local de dataset e alterne a origem ativa em todo o dashboard sem perder previsibilidade nem contexto de leitura.

## Scope

- Importar um arquivo manual com termos e metricas do RADAR.
- Validar e normalizar os dados antes de registrar a nova origem.
- Registrar cada importacao como uma nova versao identificavel da origem de dados.
- Exibir um dropdown de origem ativa no header com metadados uteis.
- Recalcular KPIs, consulta, cluster, tabela e graficos ao trocar a origem.

## Functional Requirements

1. O usuario deve conseguir selecionar um arquivo de planilha e iniciar a importacao local.
2. O sistema deve validar cabecalho, tipos numericos e campos obrigatorios antes de registrar a origem.
3. Cada importacao valida deve criar uma nova origem versionada com timestamp, label e metadata do arquivo.
4. O usuario deve conseguir escolher a origem ativa por dropdown sem sair do dashboard.
5. Ao trocar a origem ativa, todos os componentes do dashboard devem refletir imediatamente os novos dados.
6. Falhas de importacao devem mostrar feedback claro e nao podem corromper a origem ativa anterior.
7. A interface deve deixar claro qual origem esta ativa e quantos registros ela possui.

## Non-Goals

- Nao introduzir backend, upload remoto ou sincronizacao entre usuarios.
- Nao implementar auditoria colaborativa de datasets nesta fase.
- Nao alterar o motor de score alem do necessario para consumir outra origem.

## UX / Product Notes

- O dropdown de origem deve viver no header, aproveitando a area hoje dedicada a `Origem ativa`.
- O fluxo de importacao deve ser curto, claro e sem cara de tela administrativa pesada.
- O usuario deve entender rapidamente se esta olhando a base embarcada ou uma base importada.
- Metadata minima esperada na UI: nome da origem, data de criacao e volume de termos.

## Acceptance Criteria

- Existe um fluxo funcional de importacao local de planilha com validacao.
- Cada importacao cria uma nova origem versionada no registry local.
- O header oferece troca da origem ativa por dropdown.
- KPIs, panorama, consulta e configuracao passam a responder corretamente a mudanca de origem.
- `pnpm exec tsc --noEmit` e `pnpm build` continuam verdes.
