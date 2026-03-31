# Requirements: RADAR v2

**Defined:** 2026-03-31
**Core Value:** O cliente precisa tomar decisao sobre termos com contexto confiavel, historico legivel e leitura consistente dos dados.

## v1 Requirements

### History

- [ ] **HIST-01**: Usuario pode ver historico cronologico das buscas e termos selecionados.
- [ ] **HIST-02**: Usuario pode revisar a evolucao das metricas de um termo ao longo do historico salvo.
- [ ] **HIST-03**: Ao selecionar um termo, o card de historico mostra deltas relevantes versus snapshot anterior.

### Configuration

- [ ] **CONF-01**: Alteracoes das variaveis do score RADAR respeitam validacoes e invariantes antes de salvar.
- [ ] **CONF-02**: Salvar configuracao gera snapshot com timestamp e contexto do termo consultado quando houver.
- [ ] **CONF-03**: Usuario pode restaurar um snapshot anterior de configuracao pelo historico.

### Data Sources

- [ ] **DATA-01**: Usuario pode importar planilha com novos termos e metricas.
- [ ] **DATA-02**: Cada importacao cria uma nova versao identificavel da origem de dados.
- [ ] **DATA-03**: Usuario pode escolher a origem de dados ativa por dropdown.
- [ ] **DATA-04**: Ao trocar a origem, todo o dashboard recalcula KPIs, tabela, consulta e graficos.

## v2 Requirements

### Collaboration

- **COLL-01**: Historicos e versoes podem ser compartilhados entre usuarios.
- **COLL-02**: Dataset importado pode ser auditado com autor e comentarios.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend multiusuario | Escopo local-first nesta iteracao |
| Ingestao automatica via API externa | Primeiro precisamos fechar bem o contrato de importacao manual |
| Controle de acesso por perfil | Nao e necessario para a fase atual |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| HIST-01 | Phase 2 | Pending |
| HIST-02 | Phase 2 | Pending |
| HIST-03 | Phase 2 | Pending |
| CONF-01 | Phase 1 | Pending |
| CONF-02 | Phase 1 | Pending |
| CONF-03 | Phase 2 | Pending |
| DATA-01 | Phase 3 | Pending |
| DATA-02 | Phase 1 | Pending |
| DATA-03 | Phase 3 | Pending |
| DATA-04 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0

---
*Requirements defined: 2026-03-31*
*Last updated: 2026-03-31 after initial definition*
