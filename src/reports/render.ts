import { DIMENSIONS } from "../types.js";
import type { Audience, ContentLayer, Dimension, ProfileFacts, Report } from "../types.js";

const LAYER_LABELS: Record<ContentLayer, string> = {
  quality: "Qualidade do protocolo",
  identity: "Perfil geral",
  dimension: "Leitura por dimensão",
  pair: "Combinações relevantes",
  adaptation: "Adaptação e tensão",
  stress: "Sob pressão",
  context: "Aplicado ao dia a dia",
  jobfit: "Aderência à vaga",
  interview: "Roteiro de entrevista",
  development: "Plano de desenvolvimento",
};

const AUDIENCE_LABELS: Record<Audience, string> = {
  candidato: "Versão do candidato",
  recrutador: "Versão do recrutador",
  gestor: "Versão do gestor",
  equipe: "Versão de equipe",
};

const DIM_COLOR: Record<Dimension, string> = { D: "#B84034", I: "#B7822A", S: "#2F7358", C: "#2B5691" };
const DIM_LABEL: Record<Dimension, string> = { D: "Dominância", I: "Influência", S: "Estabilidade", C: "Conformidade" };

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function paragraphHtml(text: string): string {
  // blocos com \n (ex.: roteiro de entrevista) viram <br>, o resto é parágrafo simples
  return `<p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>`;
}

function chartSvg(facts: ProfileFacts): string {
  const barMaxWidth = 420;
  const rowHeight = 46;
  const top = 24;
  const left = 92;
  const rows = DIMENSIONS.map((d, i) => {
    const y = top + i * rowHeight;
    const natW = (facts.percentile.natural[d] / 100) * barMaxWidth;
    const adaptX = left + (facts.percentile.adapted[d] / 100) * barMaxWidth;
    return `
      <text x="${left - 12}" y="${y + 19}" text-anchor="end" font-family="Georgia, serif" font-size="17" fill="${DIM_COLOR[d]}">${d}</text>
      <rect x="${left}" y="${y}" width="${barMaxWidth}" height="26" fill="#EEF1F4" />
      <rect x="${left}" y="${y}" width="${natW}" height="26" fill="${DIM_COLOR[d]}" opacity="0.78" />
      <line x1="${adaptX}" y1="${y - 4}" x2="${adaptX}" y2="${y + 30}" stroke="${DIM_COLOR[d]}" stroke-width="3" />
      <text x="${left + barMaxWidth + 12}" y="${y + 19}" font-family="ui-monospace, monospace" font-size="12" fill="#5E6873">${facts.percentile.natural[d]} → ${facts.percentile.adapted[d]}</text>
    `;
  }).join("");

  return `
    <svg viewBox="0 0 620 ${top + rows.length ? top + DIMENSIONS.length * rowHeight + 10 : 200}" width="100%" role="img" aria-label="Gráfico DISC: percentil natural e adaptado por dimensão">
      ${rows}
      <text x="${left}" y="${top + DIMENSIONS.length * rowHeight + 6}" font-family="ui-monospace, monospace" font-size="10.5" fill="#8B95A1">BARRA = NATURAL · TRAÇO = ADAPTADO · PERCENTIL 1–99</text>
    </svg>`;
}

export function renderReportHtml(report: Report, facts: ProfileFacts, opts: { candidateName?: string } = {}): string {
  const title = `DISC 2.0 — ${AUDIENCE_LABELS[report.audience]}`;
  const name = opts.candidateName ? escapeHtml(opts.candidateName) : "Respondente";

  const validityBanner = !facts.validity.valid
    ? `<div class="alert">Este protocolo tem alertas de validade ativos — ver seção "Qualidade do protocolo" abaixo antes de usar este laudo para decisão.</div>`
    : "";

  const sections = report.sections
    .map(
      (s) => `
      <section>
        <h2>${escapeHtml(LAYER_LABELS[s.layer])}</h2>
        ${s.paragraphs.map(paragraphHtml).join("\n")}
      </section>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  :root{ --ink:#151B22; --ink-2:#39424D; --muted:#5E6873; --rule:#DDE2E8; --accent:#2F5D62; --ground:#FFFFFF; --warn-bg:#FBF0E1; --warn-ink:#9A5B12; }
  *{box-sizing:border-box}
  body{ margin:0; background:var(--ground); color:var(--ink); font-family:Georgia,"Times New Roman",serif; line-height:1.6; }
  .page{ max-width:760px; margin:0 auto; padding:48px 28px 80px; }
  header{ border-bottom:2px solid var(--ink); padding-bottom:20px; margin-bottom:28px; }
  .eyebrow{ font-family:ui-monospace,monospace; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--accent); margin:0 0 10px; }
  h1{ font-size:1.9rem; margin:0 0 6px; font-weight:500; }
  .meta{ font-family:ui-monospace,monospace; font-size:12px; color:var(--muted); }
  .pattern{ font-size:1.05rem; color:var(--ink-2); margin-top:14px; }
  .alert{ background:var(--warn-bg); color:var(--warn-ink); border-left:3px solid var(--warn-ink); padding:12px 16px; font-family:system-ui,sans-serif; font-size:14px; margin-bottom:24px; }
  figure{ margin:24px 0 32px; }
  section{ padding-block:22px; border-bottom:1px solid var(--rule); }
  section:last-of-type{ border-bottom:none; }
  h2{ font-size:1.2rem; font-weight:600; margin:0 0 10px; }
  p{ margin:0 0 12px; font-size:15.5px; color:var(--ink-2); max-width:66ch; }
  footer{ margin-top:40px; font-family:ui-monospace,monospace; font-size:10.5px; color:#8B95A1; }
</style>
</head>
<body>
  <div class="page">
    <header>
      <p class="eyebrow">DISC 2.0 · ${escapeHtml(AUDIENCE_LABELS[report.audience])}</p>
      <h1>${name}</h1>
      <p class="pattern">Padrão: <strong>${escapeHtml(report.pattern.label)}</strong> (${escapeHtml(report.pattern.code)})</p>
      <p class="meta">Gerado em ${escapeHtml(report.generatedAt)} · motor v${escapeHtml(report.engineVersion)} · biblioteca v${escapeHtml(report.contentLibraryVersion)} · sessão ${escapeHtml(report.sessionId)}</p>
    </header>

    ${validityBanner}

    <figure>${chartSvg(facts)}</figure>

    ${sections}

    <footer>
      DISC 2.0 é uma medida de preferências comportamentais observáveis, não um teste psicológico validado pelo SATEPSI/CFP e não deve ser o único critério de decisão sobre uma pessoa.
      Laudo gerado por regra determinística — nenhuma etapa deste documento usou geração por modelo de linguagem.
    </footer>
  </div>
</body>
</html>`;
}
