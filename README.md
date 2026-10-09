# AutoCusto — PI

Front-end (HTML/CSS/JS) + API (`ProjetoFaculdade.exe`) + banco de dados, hospedados no Azure,
com controle de versão (Git/GitHub) e testes automatizados (Vitest) rodando no GitHub Actions.

```
web/      front-end estático (config.js guarda a URL da API)
tests/    testes automatizados (lógica de login + estrutura + acessibilidade básica)
infra/    criar-infra.sh (Azure CLI) e Caddyfile (HTTPS na frente da API)
.github/  pipeline: testa a cada push e publica o front na main
```

> O `.exe` e o `config.ini` NÃO vão para o Git (estão no `.gitignore`; o ini tem a senha do banco).
> Guardem o `.exe` em outro lugar do grupo (Drive, por exemplo).

## Rodar os testes
```
npm install
npm test
```

## Arquitetura
```
Navegador ──HTTPS──> Azure Static Web Apps (web/)
    │
    └──HTTPS──> VM Windows (Caddy :443) ──> ProjetoFaculdade.exe :9000 ──> Banco de dados
```

## Passo a passo (ordem sugerida)

1. **GitHub**: criar o repositório, subir esta pasta, todos do grupo trabalham em branches + pull requests.
2. **Infra no Azure**: abrir o Cloud Shell (portal.azure.com, ícone `>_`), editar as variáveis de
   `infra/criar-infra.sh` (DNS, senha) e executar. Anotar o token do Static Web App e o endereço
   `<dns>.brazilsouth.cloudapp.azure.com`.
3. **VM** (conectar por Área de Trabalho Remota com `azureuser`):
   - copiar `ProjetoFaculdade.exe` e um `config.ini` preenchido para, por exemplo, `C:\autocusto\`;
   - banco: instalar o mesmo SGBD que a API espera na própria VM (mais barato) ou usar um banco gerenciado;
   - testar rodando o `.exe` e abrindo `http://localhost:9000` dentro da VM;
   - deixar o `.exe` iniciando sozinho: Agendador de Tarefas → "Ao iniciar o computador" (ou NSSM como serviço).
4. **HTTPS**: instalar o Caddy (`winget install CaddyServer.Caddy`), ajustar `infra/Caddyfile`
   e iniciar. Testar `https://<dns>.brazilsouth.cloudapp.azure.com/` no navegador.
5. **GitHub → Settings → Secrets and variables → Actions**:
   - Secret `AZURE_STATIC_WEB_APPS_API_TOKEN` = token do passo 2
   - Variable `API_URL` = `https://<dns>.brazilsouth.cloudapp.azure.com` (sem barra no final)
6. **Push na `main`**: o pipeline roda os testes e publica o front. Se um teste falhar, não publica.
7. **Custos**: Cost Management → Budgets → alerta em 50% / 80% dos créditos. A VM já desliga às 23h (UTC);
   para ligar/desligar manualmente use *Stop (deallocated)* no portal.
   Ao fim da disciplina, apague tudo: `az group delete -n rg-autocusto`.

## Requisitos do PI × onde estão
| Requisito | Onde |
|---|---|
| Software web com banco de dados | `web/` + API + banco |
| JavaScript | `web/js/` |
| Nuvem | Azure (VM + Static Web Apps) |
| API | `ProjetoFaculdade.exe` (REST/JSON) |
| Acessibilidade | `aria-label`, `lang`, rótulos nos campos (verificados em `tests/`); gerar relatório Lighthouse para a documentação |
| Controle de versão | Git/GitHub |
| Testes | `tests/` + GitHub Actions |
