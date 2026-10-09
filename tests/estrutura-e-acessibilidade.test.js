import { describe, it, expect } from "vitest";
import { JSDOM } from "jsdom";
import fs from "node:fs";
import path from "node:path";

const web = path.resolve(__dirname, "../web");
const paginas = fs.readdirSync(web).filter((f) => f.endsWith(".html"));
const jsFiles = fs.readdirSync(path.join(web, "js"));

describe("Estrutura do front-end", () => {
  it("nenhum JS aponta direto para localhost (usa API_URL)", () => {
    for (const f of jsFiles.filter((f) => f !== "config.js")) {
      const src = fs.readFileSync(path.join(web, "js", f), "utf8");
      expect(src, f).not.toMatch(/http:\/\/localhost:9000/);
    }
  });

  it("páginas com script carregam config.js antes do script da página", () => {
    for (const p of paginas) {
      const html = fs.readFileSync(path.join(web, p), "utf8");
      if (!/<script src="js\//.test(html)) continue;
      const iConfig = html.indexOf('js/config.js');
      const iPagina = html.search(/<script src="js\/(?!config)/);
      expect(iConfig, p).toBeGreaterThan(-1);
      expect(iConfig, p).toBeLessThan(iPagina);
    }
  });
});

describe("Acessibilidade básica (todas as páginas)", () => {
  for (const p of paginas) {
    const doc = new JSDOM(fs.readFileSync(path.join(web, p), "utf8")).window.document;

    it(`${p}: tem lang, title e viewport`, () => {
      expect(doc.documentElement.getAttribute("lang")).toBeTruthy();
      expect(doc.title.trim()).not.toBe("");
      expect(doc.querySelector('meta[name="viewport"]')).not.toBeNull();
    });

    it(`${p}: imagens têm alt`, () => {
      for (const img of doc.querySelectorAll("img")) {
        expect(img.hasAttribute("alt"), `img ${img.src}`).toBe(true);
      }
    });

    it(`${p}: campos de formulário têm rótulo`, () => {
      const campos = doc.querySelectorAll(
        'input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea'
      );
      for (const c of campos) {
        const temLabel = c.id && doc.querySelector(`label[for="${c.id}"]`);
        const temAria = c.getAttribute("aria-label") || c.getAttribute("aria-labelledby");
        const dentroDeLabel = c.closest("label");
        expect(Boolean(temLabel || temAria || dentroDeLabel), `${p}: campo ${c.id || c.name}`).toBe(true);
      }
    });
  }
});
