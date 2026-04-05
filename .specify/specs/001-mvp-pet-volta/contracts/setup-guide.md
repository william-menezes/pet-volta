# 🐾 Pet Volta — Setup do Ambiente de Desenvolvimento

> Para configurar Supabase, Vercel, Sentry e demais serviços via dashboard, consulte [services-setup-guide.md](./services-setup-guide.md).

---

## Pré-Requisitos (instalar na máquina)

| Ferramenta | Versão | Verificação | Instalação |
|---|---|---|---|
| **Node.js** | 22 LTS | `node --version` | https://nodejs.org |
| **Git** | 2.30+ | `git --version` | https://git-scm.com |
| **VS Code** | 1.96+ | `code --version` | https://code.visualstudio.com |
| **Angular CLI** | 21.x | `ng version` | `npm install -g @angular/cli` |
| **Docker** | 20+ | `docker --version` | https://docker.com (Supabase local) |
| **Supabase CLI** | Latest | `supabase --version` | `npm install -g supabase` |
| **uv** (Python) | Latest | `uv --version` | https://docs.astral.sh/uv (spec-kit) |

---

## Passo a Passo

### 1. Clone o repositório criado no GitHub
```bash
git clone https://github.com/SEU-USUARIO/pet-volta.git
cd pet-volta
```

### 2. Scaffold Angular 21 com SSR
```bash
ng new pet-volta --directory=. --style=css --ssr --routing --skip-git
ng serve  # Verificar em http://localhost:4200
```

### 3. Instalar Claude Code
```bash
npm install -g @anthropic-ai/claude-code
claude auth login
```
No VS Code: `Ctrl+Shift+X` → pesquise "Claude Code" → instale a extensão da **Anthropic** → clique no ícone ✱ na sidebar → login.

### 4. Inicializar Spec-Kit
```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@v0.4.5
specify init --here --ai claude
mkdir -p .specify/specs/001-mvp-pet-volta
# Copie os 6 arquivos da spec para .specify/specs/001-mvp-pet-volta/
# E o constitution.md para .specify/memory/
```

### 5. Criar CLAUDE.md na raiz do projeto
O conteúdo está definido no **tasks.md (T002)**. É o contexto que o Claude Code lê automaticamente.

### 6. Configurar Environments
Crie `src/environments/environment.ts` (local) e `environment.prod.ts` (produção) com as credenciais do Supabase obtidas no services-setup-guide.md.

### 7. Supabase Local (desenvolvimento)
```bash
supabase init
supabase link --project-ref SEU_PROJECT_REF
supabase start  # Docker precisa estar rodando! Primeiro start: 5-10 min
```

### 8. Primeiro Commit + Deploy
```bash
git add . && git commit -m "chore: scaffold angular 21 + spec-kit"
git push origin main
# Vercel faz deploy automático → verificar em petvolta.vercel.app
```

### 9. Abrir Claude Code e começar
```
Leia o CLAUDE.md e .specify/specs/001-mvp-pet-volta/tasks.md.
Comece pela Fase 0.
```
