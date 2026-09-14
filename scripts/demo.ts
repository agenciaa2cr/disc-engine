// Demo executável ponta a ponta: respostas sintéticas → fatos → laudo.
// Roda 100% local, sem rede, sem banco, sem chave de API. É o jeito mais
// rápido de ver o motor funcionando e de conferir que a matemática bate.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { computeProfileFacts } from "../src/pipeline.js";
import { buildAllReports } from "../src/reports/report.js";
import { renderReportHtml } from "../src/reports/render.js";
import { generateSyntheticResponses, ARCHETYPES } from "./lib/synthetic.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "out");

function printFacts(label: string, facts: ReturnType<typeof computeProfileFacts>) {
  const { percentile, delta, amplitude, flexibility, pattern, weakest, validity, jobFit } = facts;
  console.log(`\n=== ${label} ===`);
  console.log(
    `natural  D${percentile.natural.D} I${percentile.natural.I} S${percentile.natural.S} C${percentile.natural.C}`,
  );
  console.log(
    `adaptado D${percentile.adapted.D} I${percentile.adapted.I} S${percentile.adapted.S} C${percentile.adapted.C}`,
  );
  console.log(`padrão: ${pattern.label} (${pattern.code}) · mais fraco: ${weakest}`);
  console.log(`tensão geral: ${delta.overall} (${delta.level}) · maior delta: ${delta.maxDim}`);
  console.log(`amplitude: ${amplitude.level} · flexibilidade natural: ${flexibility.natural}/4`);
  console.log(
    `validade: ${validity.valid ? "OK" : "COM ALERTA"} · flags=[${validity.flags.join(", ") || "nenhuma"}] · consistência=${validity.consistencyIndex}`,
  );
  if (jobFit) console.log(`aderência à vaga: ${jobFit.overall}/100 (${jobFit.band})`);
}

function runSingleCandidateDemo() {
  const sessionId = "demo-001";
  const responses = generateSyntheticResponses({
    sessionId,
    // no trabalho: pressão para decidir e ser preciso
    adaptedBias: { D: 0.42, I: 0.16, S: 0.12, C: 0.3 },
    // natural: mais sociável e estável, menos assertivo
    naturalBias: { D: 0.18, I: 0.4, S: 0.32, C: 0.1 },
    fastNoiseRatio: 0.08,
  });

  const facts = computeProfileFacts(responses, {
    jobTarget: { roleName: "Analista de Sucesso do Cliente Sênior", profile: { D: 55, I: 70, S: 45, C: 55 } },
  });

  printFacts("Candidato demo-001", facts);

  const reports = buildAllReports(sessionId, facts);

  mkdirSync(outDir, { recursive: true });
  for (const audience of ["candidato", "recrutador", "gestor"] as const) {
    const html = renderReportHtml(reports[audience], facts, { candidateName: "Candidato Demonstração" });
    const path = join(outDir, `laudo-${audience}.html`);
    writeFileSync(path, html, "utf8");
    console.log(`→ ${path}`);
  }

  console.log("\n--- Amostra de texto (camada 'identity', versão recrutador) ---");
  const identitySection = reports.recrutador.sections.find((s) => s.layer === "identity");
  identitySection?.paragraphs.forEach((p) => console.log("• " + p));
}

function runAllArchetypesDemo() {
  for (const [name, bias] of Object.entries(ARCHETYPES)) {
    const sessionId = `demo-${name}`;
    const responses = generateSyntheticResponses({ sessionId, adaptedBias: bias, naturalBias: bias, fastNoiseRatio: 0 });
    const facts = computeProfileFacts(responses);
    printFacts(name, facts);
  }
}

const args = process.argv.slice(2);
if (args.includes("--all-profiles")) {
  runAllArchetypesDemo();
} else {
  runSingleCandidateDemo();
}
