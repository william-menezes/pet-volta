# E2E (Playwright)

Este projeto tem um esqueleto de testes E2E em `e2e/` usando Playwright.

## InstalaÃ§Ã£o

```bash
npm i -D @playwright/test
npx playwright install --with-deps
```

## Rodando

1) Suba o app:

```bash
npm start
```

2) Em outro terminal, rode os testes:

```bash
BASE_URL=http://localhost:4200 E2E_EMAIL=seu@email.com E2E_PASSWORD=sua_senha npx playwright test
```

## ObservaÃ§Ãµes

- Os testes atuais sÃ£o focados em smoke / fluxos principais e pulam automaticamente se `E2E_EMAIL`/`E2E_PASSWORD` nÃ£o estiverem definidos.
- Para fluxos que dependem de Supabase/Email/Stripe, ajuste os env vars locais antes de rodar.

