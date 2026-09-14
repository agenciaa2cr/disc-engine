# DISC 2.0 — motor de assessment e laudo determinístico

Implementação de referência do que a [proposta](../proposta-disc-rh.html) descreve nas
seções 5 e 6 ("DISC 2.0 · Instrumento" e "DISC 2.0 · Laudo"): um assessment
comportamental de escolha forçada com dois gráficos (adaptado/natural), um
motor de escoragem estatístico, e um motor de laudo **100% determinístico
— nenhuma chamada de IA em lugar nenhum do caminho crítico.**

Isto substitui o `disc-server` que hoje roda em `disc.appbuilder.digital`
(porta 4100, mesmo host, mesma rede Docker) e que está quebrado desde
28/08 porque `narrativeEngine.js` depende de uma chamada à API da
Anthropic sem saldo. Este serviço não tem essa dependência — não existe
`ANTHROPIC_API_KEY` em lugar nenhum deste projeto.

## Por que isso importa (resumo do argumento da proposta)

- **Custo zero por laudo, sempre disponível.** Nenhuma chamada de rede no
  caminho de gerar um laudo — o motor roda 100% local.
- **Reprodutível e auditável.** Mesma sessão + mesma versão de biblioteca
  → mesmo laudo, sempre. Cada bloco de texto carrega a regra que o
  disparou (ver `ContentBlock.condition` em `src/types.ts`). É isso que
  torna o produto compatível com o direito a explicação do art. 20 da
  LGPD e do PL 2338/2023.
- **DISC não é teste psicológico validado pelo SATEPSI/CFP** — o laudo
  (`src/reports/render.ts`) imprime essa ressalva em todo documento, e a
  biblioteca de conteúdo não usa linguagem de diagnóstico de
  personalidade.

## Rodando

```bash
npm install
npm run demo          # um candidato sintético, imprime fatos e grava HTML em out/
npm run demo:all      # cinco arquétipos (D/I/S/C-dominante + equilibrado), só o resumo
npm test               # 35 testes, cobrindo escoragem, avaliador de regras e pipeline
npm run typecheck
npm run server          # API HTTP em :4100 — memória se PG_HOST não estiver setado
npm run build && npm start   # build de produção
```

Tudo acima roda **offline**, sem banco, sem chave de API.

## Arquitetura

```
respostas brutas
  → scoreRawPass            (src/scoring/score.ts)       escore ipsativo bruto
  → scoreVectorToPercentiles (src/scoring/norms.ts)       percentil via norma
  → computeTension/Amplitude/Flexibility/classifyPattern  (src/scoring/indices.ts)
  → computeValidity          (src/scoring/validity.ts)    alertas de qualidade
  → computeJobFit             (src/jobfit/fit.ts)          [opcional, se houver vaga-alvo]
  = ProfileFacts               (src/pipeline.ts)           "a verdade" sobre o protocolo
  → evaluateCondition × biblioteca de blocos  (src/content/)
  = Report                     (src/reports/report.ts)     laudo composto, por audiência
  → renderReportHtml / htmlToPdf                            HTML ou PDF
```

Cada seta é uma função pura, testável isoladamente — não há estado
escondido nem efeito colateral entre `computeProfileFacts` e o `Report`
final. `src/index.ts` é a superfície pública do pacote.

### O instrumento

24 blocos tetrádicos (`src/instrument/blocks.ts`, 96 afirmações), cada um
com uma palavra/expressão por dimensão. O **mesmo banco é respondido duas
vezes** com instruções diferentes (`src/instrument/session.ts`):

- **Adaptado** ("no trabalho") → Gráfico I
- **Natural** ("no seu jeito mais natural") → Gráfico II

A ordem dos blocos é embaralhada de forma determinística e independente
por passada (`seededShuffle`, semeada por `sessionId`), para reduzir efeito
de memória entre as duas. Oito itens-âncora normativos (Likert 1–5, dois
por dimensão) fecham o instrumento e alimentam o índice de consistência.

### A escoragem

Ipsativa clássica: cada bloco soma +1 à dimensão escolhida como "mais" e
−1 à escolhida como "menos" (`scoreRawPass`). A soma das quatro dimensões
é sempre zero — é assim que se confere a integridade estrutural de um
protocolo (`isIpsativelyBalanced`, testado). O escore bruto vira percentil
via CDF normal (`rawToPercentile`, aproximação de Abramowitz & Stegun).

### Os quatro índices derivados

| Índice | O que mede | Onde |
|---|---|---|
| Tensão/adaptação | `\|adaptado − natural\|` por dimensão | `computeTension` |
| Amplitude | maior percentil − menor, por passada | `computeAmplitude` |
| Flexibilidade | nº de dimensões na faixa 35–65 | `computeFlexibility` |
| Padrão | duas dimensões mais altas do Gráfico II | `classifyPattern` |

### O avaliador de condições — por que é seguro guardar em banco

`Condition` (`src/types.ts`) é dado estruturado (`{op: "cmp", field, cmp,
value}`), nunca uma string avaliada como código. `evaluateCondition`
(`src/content/evaluator.ts`) resolve o caminho contra `ProfileFacts` e
retorna `true`/`false` — uma condição malformada simplesmente não casa com
nada, nunca executa nada. É o que torna defensável mover a biblioteca de
conteúdo para uma tabela editável em banco (Fase 2): o pior caso de uma
entrada corrompida é "esse bloco nunca aparece", não execução arbitrária.

### A biblioteca de conteúdo

**92 blocos** em `src/content/blocks/*.ts`, cobrindo as dez camadas da
proposta (identidade, dimensão, pares, adaptação, sob pressão, contextos
aplicados, aderência à vaga, roteiro de entrevista, PDI, qualidade do
protocolo). Cada bloco tem `priority` (desempate de deduplicação, não
ordem de leitura — a ordem de leitura é a ordem autoral no arquivo,
`compose.ts`), `dedupeTags` opcional, e uma ou mais `variants` escolhidas
de forma determinística por `hash(sessionId + blockId)` — mesma pessoa,
sempre a mesma variante; pessoas diferentes, variantes diferentes.

Interpolação simples (`src/content/interpolate.ts`) injeta números e
nomes de dimensão no texto (`{{percentile.natural.D}}`,
`{{dim:pattern.primary}}`) — é substituição de string contra
`ProfileFacts`, não geração de texto.

### Quatro audiências, quatro laudos

`AUDIENCE_LAYERS` (`src/content/library.ts`) define quais camadas cada
audiência recebe — candidato não vê aderência à vaga nem roteiro de
entrevista; só recrutador e gestor veem essas duas. `equipe` não usa a
biblioteca de conteúdo condicional: é estatística descritiva agregada
sobre vários `ProfileFacts` (`src/reports/team.ts`), e **nunca** identifica
quem é quem no texto — só contagens e médias.

## Limitações conhecidas (deliberadas, não escondidas)

Isto é o núcleo funcional da arquitetura da Fase 1, não a entrega
completa de 320–420 blocos com múltiplas variantes estimada na proposta
para produção. Especificamente:

1. **Norma teórica, não populacional.** `theoreticalNormTable()`
   (`src/scoring/norms.ts`) usa a distribuição sob resposta aleatória
   (média 0, DP ≈ 3,46), não uma amostra brasileira real — que ainda não
   existe. Com 24 blocos, isso tende a produzir percentis bastante
   extremos (perto de 1 ou 99) para vieses de resposta até moderados —
   ver `npm run demo:all`. `NormTable` existe exatamente para essa
   constante ser substituída assim que houver amostra suficiente (meta da
   proposta: recalibrar a cada 500 protocolos). **Não trate os percentis
   atuais como normativos até essa calibração acontecer.**
2. **92 blocos de conteúdo, não 320–420.** Cobre as dez camadas com
   profundidade suficiente para gerar um laudo coerente e multi-seção,
   mas não o volume final de produção. Expandir é só acrescentar entradas
   em `src/content/blocks/*.ts` — nenhuma mudança de código é necessária
   (ver seção abaixo).
3. **Instrumento não passou por validação psicométrica com respondentes
   reais.** α de Cronbach, ω, teste-reteste — nada disso é calculável sem
   amostra. O código está pronto para receber esses números
   (`NormTable.sampleSize`, `NormTable.version`) quando a amostra existir.
4. **Desejabilidade social é heurística grosseira** (`validity.ts`,
   `socialDesirability`) baseada na literatura geral sobre DISC, não em
   calibração item a item. Serve de alerta, não de medida precisa.
5. **PDF depende de `puppeteer`, que não está instalado por padrão**
   (`src/reports/pdf.ts`) — evita forçar ~300 MB de Chromium em quem só
   quer rodar `npm run demo`. Rode `npm install puppeteer` para habilitar
   o endpoint `/sessions/:id/report/:audience/pdf`.
6. **API HTTP é deliberadamente mínima** (`node:http` puro, sem
   framework, sem autenticação/autorização, sem rate limit). É a casca
   fina que expõe o motor para teste e para a Fase 2 embutir dentro das
   rotas do Next.js — não é pronta para produção exposta à internet como
   está. Autenticação, RBAC e rate limiting ficam para a Fase 2.
7. **`db/schema.sql` não foi executado contra nenhum banco.** É o schema
   proposto, para revisão — aplique manualmente depois de rotacionar a
   senha do Postgres exposta no `.env` do projeto antigo.

## Expandindo a biblioteca de conteúdo

Acrescentar um bloco é só um objeto novo num dos arquivos em
`src/content/blocks/`:

```ts
{
  id: "dim_D_muito_alta",              // único, kebab/snake_case
  layer: "dimension",
  priority: 4,                          // desempate de dedupeTags, não ordem de leitura
  dedupeTags: ["dim_D"],                // opcional — só um bloco por tag sobrevive
  condition: gte("percentile.natural.D", 90),
  variants: [
    "Primeira redação...",
    "Segunda redação, mesmo sentido...",
  ],
}
```

Sem tocar em `compose.ts`, `evaluator.ts` ou qualquer outro código — a
biblioteca é dado. `npm test` confere que o avaliador e o pipeline
continuam corretos; não há teste que valide a qualidade redacional de um
bloco novo, isso continua sendo revisão humana (ver proposta: "precisa
ser feito por quem conhece a metodologia, com revisão de um psicólogo
organizacional").

## Segurança e conformidade — o que este código já faz

- Não existe `ANTHROPIC_API_KEY` nem qualquer chave de API neste projeto.
- `docker-compose.yml` não inclui a variável — comparar com o compose
  antigo em `/root/disc-a2cr/docker-compose.yml` na VPS.
- `db/schema.sql` inclui `disc.report_access_log` (quem viu qual laudo,
  quando, com que finalidade) — a trilha de auditoria que a seção de
  conformidade da proposta pede.
- O laudo nunca é usado como corte eliminatório automático — não existe
  nenhum caminho de código que rejeite um candidato por escore. `jobFit`
  é sempre um sinal para a entrevista, nunca uma decisão.
- Toda seção de laudo carrega a ressalva "não é teste psicológico
  validado" (`render.ts`, `<footer>`).

O que este código **não** faz sozinho: gestão de consentimento LGPD,
política de retenção/expurgo automático, portal de titular de dados. Isso
é produto de UI da Fase 2, não do motor.

## Onde isso entra no roadmap da proposta

Este pacote é a **Fase 1** (seção 8 da proposta). Não inclui:

- Fase 0 completa — rotação de segredos de produção ainda depende de
  aprovação explícita e não foi feita por este código.
- Fase 2 em diante — ATS, desempenho, clima/NR-01, T&D. A arquitetura
  (Next.js + tRPC envolvendo este pacote como dependência) está descrita
  na seção 7 da proposta, não implementada aqui.
