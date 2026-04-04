# 🐾 Pet Volta MVP — Research & Análise Técnica (v2)

> **Changelog v2:** Supabase Free tier, IP geolocation providers, TypeUI Colorful, Vercel ISR, recompensa

---

## R1. Supabase Free Tier — Viabilidade para MVP

### Limites Confirmados (Abril 2026)

| Recurso | Limite | Impacto no Pet Volta |
|---|---|---|
| DB Storage | 500 MB | ~2-5M rows típicas. Suficiente para 500 tutores + 700 pets + scans |
| File Storage | 1 GB | ~2,000 fotos a 500KB cada. Monitorar com fotos comprimidas |
| DB Egress | 5 GB/mês | Risco principal. Paginação + cache SWR são críticos |
| MAUs Auth | 50,000 | Target MVP: 500. Margem enorme |
| Edge Fn Invocations | 500,000/mês | Target: < 300,000. Consolidar lógica para reduzir chamadas |
| Projetos ativos | 2 | 1 prod + 1 staging. Suficiente |
| Pausa por inatividade | 7 dias | Mitigar com Vercel Cron Job a cada 5 dias |
| Backups | Nenhum | pg_dump semanal manual ou via GitHub Action |
| Max file size | 50 MB | Suficiente (fotos max 2MB, PDFs max 5MB) |
| Realtime | Limitado (shared resources) | Usar apenas para scan notifications, 1 canal por tutor |

### Estimativa de Uso (3 meses)

```
DB Storage:
  500 profiles × ~0.5KB      =    250 KB
  700 pets × ~1KB             =    700 KB
  300 tags × ~0.2KB           =     60 KB
  5,000 scan_events × ~0.3KB  =  1,500 KB
  2,000 health_records × ~0.5KB = 1,000 KB
  Indexes + overhead (~30%)   =  1,053 KB
  TOTAL ESTIMADO:             ≈    5 MB (1% do limite)
  ✅ SEGURO

File Storage:
  700 pets × 1.5 fotos avg × 500KB = 525 MB
  500 avatares × 200KB              = 100 MB
  100 anexos saúde × 2MB            = 200 MB
  TOTAL ESTIMADO:                   ≈ 825 MB
  ⚠️ PRÓXIMO DO LIMITE — precisa de compressão agressiva

Egress (mensal):
  500 DAUs × 15 API calls × 5KB avg = 37.5 MB/dia = 1.1 GB/mês
  + SSR page loads (Vercel) = 0 (SSR não conta no Supabase)
  ✅ SEGURO se mantiver paginação e cache
```

### Recomendação
Viável para MVP com as mitigações documentadas. **File Storage é o gargalo principal** — compressão client-side de fotos é obrigatória. Planejar upgrade para Supabase Pro ($25/mês) quando atingir ~400 tutores ou 800MB de storage.

---

## R2. IP Geolocation — Provider para Edge Function

### Opções Avaliadas

| Provider | Free Tier | HTTPS | Accuracy | Rate Limit | API Key |
|---|---|---|---|---|---|
| **ip-api.com** | Ilimitado | ❌ (HTTP only) | Cidade (~5-50km) | 45 req/min | Não |
| ipapi.co | 1,000 req/dia | ✅ | Cidade (~5-50km) | ~30 req/min | Não (free) |
| ipinfo.io | 50,000 req/mês | ✅ | Cidade (~5-50km) | — | Sim |
| ip-api (Pro) | — | ✅ | Cidade | Ilimitado | Sim ($13/mês) |

### Decisão: ip-api.com (Free)

**Justificativa:**
- MVP: volume baixo (~10-50 scans/dia) — 45 req/min é mais que suficiente
- Sem custo
- API simples: `GET http://ip-api.com/json/{ip}?fields=status,city,regionName,country,lat,lon`
- Resposta: `{"status":"success","city":"São Paulo","regionName":"São Paulo","country":"Brazil","lat":-23.5475,"lon":-46.6361}`

**Limitação principal:** Sem HTTPS no free. A chamada Edge Function → ip-api.com trafega sem criptografia. Isto é aceitável porque:
1. É server-to-server (Edge Function → ip-api), não client-to-server
2. O dado trafegado é o IP do encontrador, que o Edge Function já tem
3. O dado retornado (cidade/região) não é sensível
4. Pós-MVP: migrar para ipapi.co (HTTPS, 1,000/dia) ou ipinfo.io

**Implementação:**
```typescript
// supabase/functions/_shared/ip-geolocation.ts
interface IpGeoResult {
  city: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
}

export async function getLocationFromIp(ip: string): Promise<IpGeoResult | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout

    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,city,regionName,country,lat,lon`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    const data = await res.json();
    if (data.status !== 'success') return null;

    return {
      city: data.city,
      region: data.regionName,
      country: data.country,
      lat: data.lat,
      lon: data.lon,
    };
  } catch {
    return null; // Falha silenciosa — scan continua sem geoloc
  }
}
```

---

## R3. TypeUI Colorful — Referência Oficial

### Fonte
https://www.typeui.sh/design-skills/colorful

### Resumo dos Tokens

**Paleta:** Blue (#3B82F6) → Violet (#8B5CF6) como eixo principal de gradiente. Success #16A34A, Warning #D97706, Danger #DC2626, Surface #FFFFFF, Text #111827.

**Filosofia Core:**
1. **Cor como informação** — cada cor tem função semântica, não decorativa
2. **Gradiente como ferramenta** — eixo blue→violet para hero, CTAs, progress; cor sólida para forms/texto
3. **Tipografia neutra** — Inter como counterbalance (neutro dá descanso visual)
4. **Grid 8pt** — mais strict que 4px, compensa complexidade visual
5. **Alto contraste** — WCAG AA, cores nunca são o único indicador

**Cobertura de componentes:** 40+ famílias. Inputs/forms, data display, navigation, overlays, feedback, page-level.

**Adaptações para Pet Volta:**
- **Títulos:** Outfit (600-700) substitui Inter para display — mais lúdico para contexto pet
- **Corpo:** Inter mantido conforme TypeUI Colorful
- **Code/IDs:** JetBrains Mono mantido conforme TypeUI Colorful
- **Border radius:** 24px (orgânico/pet-friendly) vs padrão TypeUI (8px rounded)
- **Gradientes de alerta:** red→orange para modo lost (fora do eixo blue→violet padrão)

---

## R4. Vercel — ISR e On-Demand Revalidation para Angular SSR

### Confirmação de Hosting

**Vercel é o hosting confirmado.** Funcionalidades utilizadas:

| Feature | Uso no Pet Volta |
|---|---|
| Angular SSR | Páginas públicas /t/{tagCode} e /p/{publicSlug} |
| ISR (Incremental Static Regeneration) | Cache 60s para páginas públicas com revalidação on-demand |
| On-Demand Revalidation | Chamada da Edge Function toggle-lost para invalidar cache |
| Vercel Cron Jobs | Ping anti-pausa Supabase a cada 5 dias |
| Serverless Functions | API route `/api/keepalive` para cron |
| Analytics | Web Vitals, LCP monitoring |
| Edge Network | CDN global com edge nodes em São Paulo |
| Environment Variables | Supabase URL, keys, Stripe keys, Sentry DSN |

### On-Demand Revalidation (Toggle Lost)

Quando tutor ativa/desativa modo lost, a Edge Function do Supabase chama a API do Vercel:

```typescript
// Dentro da Edge Function toggle-lost
await fetch(`https://api.vercel.com/v1/projects/${VERCEL_PROJECT_ID}/domains/${DOMAIN}/purge`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
  body: JSON.stringify({ paths: [`/t/${tagCode}`, `/p/${publicSlug}`] }),
});
```

**Nota:** O token Vercel e project ID são armazenados como Supabase Secrets.

---

## R5. Feature Recompensa — Análise de Risco

### Riscos Identificados

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Fraude: scan para "cobrar" recompensa sem ter encontrado o pet | Média | Médio | Debounce 5min. Disclaimer. Tutor verifica antes de pagar |
| Inflação de valor: tutor coloca R$ 10.000 por engano | Baixa | Baixo | Confirmação visual do valor. Sem limite (tutores adultos) |
| Expectativa de pagamento via plataforma | Média | Alto | Disclaimer CLARO: "Pet Volta não intermedia pagamentos". Repetido em múltiplos pontos |
| Aspecto legal: recompensa gera obrigação? | Baixa | Médio | Termos de uso: "valor indicativo, acordo entre particulares" |

### Decisões de Produto

1. Pet Volta **NÃO** processa pagamentos de recompensa (apenas exibe)
2. Valor em centavos para evitar problemas com float
3. Recompensa é feature de planos pagos (incentivo para upgrade)
4. Plano Digital não exibe recompensa (não tem tag, portanto não tem scan)

---

## R6. Supabase Edge Functions — Acesso ao IP do Cliente

### Achado
Supabase Edge Functions (Deno Deploy) populam o header `X-Forwarded-For` com o IP do cliente. Isso foi confirmado em uma atualização documentada nas discussions do GitHub do Supabase.

### Implementação
```typescript
// Dentro de qualquer Edge Function
const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
```

### Privacidade
- O IP raw NUNCA é armazenado no banco de dados
- Apenas o hash SHA-256 é armazenado (para debounce)
- Os dados derivados (cidade, região) são armazenados
- Após 90 dias, hash e dados derivados são anonimizados (via cron de cleanup)

---

## R7. Estimativa de Custos — MVP (3 meses)

| Item | Custo Mensal | Notas |
|---|---|---|
| Supabase | R$ 0 | Free tier |
| Vercel | R$ 0 | Free tier (100GB bandwidth, serverless functions) |
| Stripe | 0 + 2.9% + R$ 0,60/txn | Apenas quando houver transações |
| Resend | R$ 0 | Free: 3,000 emails/mês |
| Sentry | R$ 0 | Free: 5,000 events/mês |
| ip-api.com | R$ 0 | Free tier |
| Domínio (.com.br) | ~R$ 40/ano | Registro.br |
| **TOTAL** | **~R$ 3/mês** | Apenas domínio (pró-rata) |

O MVP roda essencialmente a custo zero, exceto pelo domínio.
