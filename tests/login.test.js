import { describe, it, expect, vi, beforeEach } from "vitest";
import { JSDOM } from "jsdom";
import fs from "node:fs";
import path from "node:path";

const web = path.resolve(__dirname, "../web");
const read = (p) => fs.readFileSync(path.join(web, p), "utf8");

// Carrega login.html + config.js + login.js dentro de um DOM simulado
function carregarLogin(fetchMock) {
  const dom = new JSDOM(read("login.html").replace(/<script[^>]*><\/script>/g, ""), {
    runScripts: "outside-only",
    url: "http://localhost/login.html",
  });
  dom.window.fetch = fetchMock;
  dom.window.eval(read("js/config.js") + "\n" + read("js/login.js"));
  dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
  return dom.window;
}

describe("Tela de login", () => {
  let fetchMock;
  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      text: async () => JSON.stringify({ sucesso: false, mensagem: "CPF ou senha inválidos." }),
    });
  });

  it("aplica a máscara de CPF enquanto digita", () => {
    const w = carregarLogin(fetchMock);
    const campo = w.document.getElementById("usuario");
    campo.value = "12345678901";
    campo.dispatchEvent(new w.Event("input"));
    expect(campo.value).toBe("123.456.789-01");
  });

  it("envia CPF sem máscara para a API configurada em API_URL", async () => {
    const w = carregarLogin(fetchMock);
    w.document.getElementById("usuario").value = "123.456.789-01";
    w.document.getElementById("senha").value = "segredo";
    w.document.getElementById("form-login").dispatchEvent(new w.Event("submit", { cancelable: true }));
    await new Promise((r) => setTimeout(r, 0));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:9000/login");
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body)).toEqual({ cpf: "12345678901", senha: "segredo" });
  });

  it("mostra a mensagem de erro quando o login falha", async () => {
    const w = carregarLogin(fetchMock);
    w.document.getElementById("usuario").value = "12345678901";
    w.document.getElementById("senha").value = "errada";
    w.document.getElementById("form-login").dispatchEvent(new w.Event("submit", { cancelable: true }));
    await new Promise((r) => setTimeout(r, 0));

    const erro = w.document.getElementById("login-error");
    expect(erro.classList.contains("hidden")).toBe(false);
    expect(erro.textContent).toContain("CPF ou senha inválidos.");
  });
});
