# HR Suite — RH estratégico, sem departamento pessoal

Implementação das Fases 2–5 da [proposta](../proposta-disc-rh.html): núcleo
de pessoas e cargos, recrutamento e seleção, desempenho, clima e NR-01, e
T&D com analytics. Convive na mesma VPS que o [disc-engine](../disc-engine/README.md)
(motor DISC 2.0), no mesmo Postgres, em schema separado (`hr` vs. `disc`).

## Rodando

```bash
npm install
npm run demo         # os 6 módulos, ponta a ponta, em memória — sem rede, sem banco
npm test              # 45 testes
npm run typecheck
npm run server         # API HTTP em :4200 — memória se PG_HOST não estiver setado
npm run build && npm start
```

`npm run demo` é o jeito mais rápido de ver a suíte inteira funcionando: cria
cargo e competência, publica uma vaga, leva um candidato do funil até
contratado, gera o checklist de onboarding, cascateia um OKR, faz uma
colocação de 9-box, roda uma pesquisa psicossocial real com aplicação de
anonimato, cria plano de ação e fecha com um número de headcount.

## Arquitetura

```
src/
  store/        armazenamento genérico (entities) + Postgres/memória
  core/         pessoas, organograma, cargos, competências
  ats/          vagas, candidatos, funil (máquina de estados), contratação
  performance/  metas/OKR, 1:1s, feedback, PDI, ciclos de avaliação, 9-box
  climate/      pesquisas, questionário psicossocial (NR-01), eNPS, planos de ação
  training/     catálogo, onboarding 30/60/90, sucessão, offboarding
  analytics/    funções puras sobre as entidades já carregadas
  api/          servidor HTTP + rotas por módulo
```

Cada módulo tem `types.ts` (o formato dos dados) e `service.ts` (a regra
de negócio) e é testável sozinho — `AtsService.hire` é o único ponto onde
um módulo chama outro diretamente (cria uma `Person` no core ao
contratar), e isso é deliberado, não acoplamento acidental.

### Por que uma tabela genérica de entidades

`hr.entities` (`db/schema.sql`) é `(id, org_id, type, data jsonb, ...)` —
uma tabela para pessoa, cargo, vaga, meta, plano de ação, tudo. Não é
preguiça: é a fase certa do produto para essa escolha.

- O formato de cada entidade ainda muda — o roadmap da proposta prevê
  quatro fases inteiras (3 a 5) ainda não desenhadas em detalhe.
- Uma tabela por tipo, com `ALTER TABLE` a cada campo novo, tem custo real
  numa fase de descoberta; uma coluna `jsonb` não.
- A garantia que importa nesta fase — isolamento por organização,
  integridade dos relacionamentos que o código impõe (`ats.hire` só cria
  `Person` se `Candidate` existir), trilha de auditoria — está toda na
  camada de serviço em TypeScript e no schema, não na forma física da
  tabela.
- O caminho de migração para tabelas primeiras-classe (colunas reais,
  chaves estrangeiras, constraints no banco) para as entidades de maior
  volume/consulta — pessoa, aplicação, resposta de pesquisa — é claro e
  incremental quando o modelo estabilizar: os `service.ts` não mudam de
  interface, só o que `EntityStore` faz por baixo.

**Exceção deliberada:** respostas de pesquisa NÃO ficam em `hr.entities` —
ficam em `hr.survey_responses`, tabela própria sem coluna de pessoa. Ver
"Anonimato" abaixo.

### Módulo a módulo

**Core** — `Person`, `JobRole`, `Competency`, vínculo cargo↔competência
com nível-alvo (1–5). `upsertFromDpSync` é o ponto de entrada do
conector-de-DP previsto na proposta: cadastro só-leitura, casado por
`externalId`, nunca escreve de volta no sistema de DP.

**ATS** — a máquina de estados do funil (`ats/pipeline.ts`) é o núcleo:
avança só para o próximo estágio na ordem canônica, "rejected" é
alcançável de qualquer estágio não-terminal a qualquer momento, "hired" e
"rejected" são terminais. `hire()` fecha o funil e cria a `Person`
automaticamente, já com o `roleId` da vaga — o ponto de junção real entre
recrutamento e o resto da suíte.

**Performance** — metas ipsativas... não, OKRs de verdade: `objective` e
`key_result` com cascateamento validado (`createGoal` recusa um KR cujo
`parentId` não aponta para um objective existente na mesma organização).
9-box (`performance/nine-box.ts`) com rótulos em português. Feedback tem
três níveis de visibilidade (`private`/`manager`/`public`) com um filtro
simples — RBAC de verdade fica para a Fase 2 de produto.

**Climate e NR-01** — o módulo mais sensível da suíte, ver seção própria
abaixo.

**Training** — catálogo/matrícula, checklist de onboarding 30/60/90 (template
padrão em `training/types.ts`, customizável por organização), plano de
sucessão com `benchStrength()` respondendo a pergunta real de diretoria
("temos sucessor pronto para esse cargo, ou é um risco?"), entrevista de
desligamento estruturada.

**Analytics** — funções puras (`analytics/queries.ts`), não view SQL:
`headcountOverTime`, `turnoverRate`, `funnelConversion`,
`averageTimeToHireDays`, `costPerHire` (recebe o gasto de fora — este
sistema não tem módulo financeiro, não finge que tem).

## Clima e NR-01 — o módulo com mais peso jurídico

A NR-01 exige, desde 26/05/2026, gestão de riscos psicossociais no PGR de
toda empresa com empregado CLT. `climate/psychosocial-questionnaire.ts`
implementa um questionário curto (23 itens, escala 0–4) organizado nos
mesmos sete domínios de alto nível do **COPSOQ III** (Copenhagen
Psychosocial Questionnaire) — o instrumento para o qual o mercado
brasileiro de SST está convergindo para atender ao Anexo II da norma.

**Isto não é o COPSOQ III completo** (148 itens, 45 dimensões) **nem uma
tradução licenciada dele.** É uma versão curta própria, pensada para caber
num pulso trimestral. Antes de usar para o PGR de uma empresa real: valide
os itens com um profissional de SST/psicologia do trabalho, rode com
amostra piloto, calcule consistência interna por domínio — mesma
exigência de calibração que a norma teórica do DISC 2.0.

### Anonimato — arquitetural, não convencional

- `hr.survey_responses` **não tem coluna de pessoa.** Não é um campo
  deixado em branco por convenção — a tabela não tem onde colocar um
  `person_id` mesmo que alguém tentasse.
- Nenhum agregado sai com menos de `anonymityThreshold` respostas
  (default 5). `climate/aggregate.ts::enforceAnonymity` recusa calcular
  qualquer coisa abaixo do limiar — devolve `undefined`, não um número
  calculado sobre poucas respostas disfarçado de agregado seguro.
- Testado: `test/climate.test.ts` cobre exatamente esse caminho (relatório
  indisponível antes do limiar, disponível depois).

### Comportamentos ofensivos — tratamento à parte

Assédio moral, sexual e violência (`comportamentos_ofensivos`) não seguem
a mesma lógica de "média baixa = risco baixo" dos outros domínios: uma
única exposição relatada (`criticalExposureFlag`) é sinalizada
independente da média do domínio ficar em banda "baixo". Isso é
deliberado — não existe frequência "aceitável" de assédio para diluir numa
média.

### Planos de ação — a evidência que a fiscalização pede

`ActionPlan` (categoria de risco, ação, responsável, prazo, status,
evidências) é o que a proposta chama de "inventário de risco + plano de
ação + trilha de evidências no formato que o auditor fiscal pede" — a
maior lacuna competitiva identificada no benchmarking (seção 3 da
proposta): ninguém no mercado brasileiro entrega isso integrado à pesquisa
de clima hoje.

## Limitações conhecidas (deliberadas, não escondidas)

1. **Cortes de risco psicossocial são provisórios** (tercis ingênuos sobre
   a escala 0–100), não uma norma calibrada — mesmo tratamento da norma
   teórica do DISC 2.0. Não apresente como cientificamente validado numa
   auditoria real sem calibrar antes.
2. **API sem autenticação/autorização.** Nenhuma rota verifica quem está
   chamando. É a casca de teste e o ponto de partida para a Fase 2
   embutir isso nas rotas do Next.js — não é para expor à internet como
   está.
3. **`db/schema.sql` não foi executado** contra nenhum banco real.
4. **Multi-tenant por convenção, não por RLS.** `orgId` é passado em toda
   chamada de serviço e todo filtro de `list()` inclui `org_id`, mas não
   há Row-Level Security no Postgres ainda — um bug de código que esqueça
   de passar `orgId` corretamente teria acesso amplo. RLS de verdade é
   trabalho de Fase 2.
5. **Sem RBAC real.** `listFeedbackFor` recebe `viewerIsManager` como
   parâmetro que quem chama já resolveu — este módulo não sabe navegar
   hierarquia de gestão sozinho.
6. **Sem módulo financeiro.** `costPerHire` pede o gasto total de fora;
   não há nota fiscal, folha ou orçamento integrado.
7. **Analytics roda em memória**, não em SQL agregado — adequado ao volume
   de uma organização nesta fase (centenas a poucos milhares de pessoas),
   não a escala enterprise.

## Integração com o disc-engine

`ApplicationService.linkDiscSession` guarda o `sessionId` de um laudo do
disc-engine numa candidatura; `JobPosting.targetDiscProfile` guarda o
perfil-alvo no mesmo formato que `disc-engine`'s `PercentileVector` — sem
importar o pacote disc-engine aqui (os dois serviços ficam
desacoplados, o formato é o contrato, não uma dependência de build). A
integração de verdade (calcular `jobFit` a partir do laudo automaticamente
quando a candidatura recebe um `discSessionId`) é trabalho de Fase 2, na
camada de API que vai orquestrar os dois serviços.

## Onde isso entra no roadmap da proposta

Este pacote cobre as **Fases 2 a 5** (seção 8 da proposta) na camada de
domínio e API — núcleo funcional testado, não a UI em Next.js descrita na
seção 7 da arquitetura. Não inclui:

- Interface visual — nenhuma tela, nenhum componente React.
- Autenticação, RBAC, Row-Level Security de produção.
- O conector de DP de verdade (só o ponto de entrada `upsertFromDpSync`).
- Integração automática DISC ↔ aderência à vaga (hoje é só o campo que
  guarda a ligação).
