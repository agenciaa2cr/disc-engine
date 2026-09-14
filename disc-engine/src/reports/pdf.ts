/**
 * Exportação em PDF — Chromium headless renderizando o mesmo HTML do
 * laudo (ver render.ts), como definido na arquitetura da proposta: uma
 * única fonte de verdade para tela e papel.
 *
 * `puppeteer` é uma dependência OPCIONAL, carregada sob demanda, e não
 * está no package.json deste pacote — instalar Chromium (~300 MB) para
 * todo mundo que só quer rodar `npm run demo` seria um custo de setup
 * desnecessário para o núcleo do motor. Para habilitar o endpoint de PDF:
 *
 *   npm install puppeteer
 *
 * Se o pacote não estiver instalado, htmlToPdf lança um erro claro em vez
 * de falhar silenciosamente.
 */
export async function htmlToPdf(html: string): Promise<Buffer> {
  // O nome do módulo passa por uma variável (em vez de um literal direto em
  // `import("puppeteer")`) de propósito: assim o TypeScript não tenta
  // resolver os tipos do pacote em tempo de checagem, já que ele é opcional
  // e pode legitimamente não estar instalado.
  const moduleName = "puppeteer";
  let puppeteer: any;
  try {
    puppeteer = await import(moduleName);
  } catch {
    throw new Error(
      "Exportação em PDF requer o pacote opcional 'puppeteer'. Rode `npm install puppeteer` e tente de novo.",
    );
  }

  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ format: "A4", printBackground: true, margin: { top: "16mm", bottom: "16mm", left: "14mm", right: "14mm" } });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
