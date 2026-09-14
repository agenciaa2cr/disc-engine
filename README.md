# disc-engine — monorepo

Este repositório reúne os dois serviços da proposta de RH, que convivem na
mesma VPS e no mesmo Postgres (schemas separados: `disc` e `hr`):

- [`disc-engine/`](disc-engine/README.md) — DISC 2.0: instrumento, motor de
  escoragem e motor de laudo determinístico (sem IA).
- [`hr-suite/`](hr-suite/README.md) — Suíte de RH estratégico: core, R&S,
  desempenho, clima/NR-01, T&D e analytics.

Cada projeto é independente: tem seu próprio `package.json`, testes,
`Dockerfile` e `docker-compose.yml`. Veja o README de cada um para rodar,
testar e subir a respectiva API.
