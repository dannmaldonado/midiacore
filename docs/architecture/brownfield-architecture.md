# MidiaCore — Brownfield Architecture Document

> **Status:** Current State Analysis v1.0
> **Data:** 2026-02-25
> **Autor:** Aria (Architect Agent)
> **Escopo:** Análise completa do estado atual + Impact Analysis para evolução da plataforma

---

## Índice

1. [Introdução e Contexto de Negócio](#1-introdução-e-contexto-de-negócio)
2. [Stack Tecnológico Atual](#2-stack-tecnológico-atual)
3. [Estrutura de Diretórios](#3-estrutura-de-diretórios)
4. [Arquitetura de Alto Nível](#4-arquitetura-de-alto-nível)
5. [Módulos e Responsabilidades](#5-módulos-e-responsabilidades)
6. [Modelo de Dados Atual](#6-modelo-de-dados-atual)
7. [Autenticação e Multi-tenancy](#7-autenticação-e-multi-tenancy)
8. [Componentes de UI](#8-componentes-de-ui)
9. [Dívida Técnica e Gaps](#9-dívida-técnica-e-gaps)
10. [Pontos de Integração](#10-pontos-de-integração)
11. [Desenvolvimento Local](#11-desenvolvimento-local)
12. [Impact Analysis — Evolução para Plataforma Pro](#12-impact-analysis--evolução-para-plataforma-pro)

---

## 1. Introdução e Contexto de Negócio

### O que é o MidiaCore

MidiaCore é uma plataforma web SaaS multi-tenant para **Lojas Torra** gerenciar contratos de mídia física e digital em shopping centers de todo o Brasil. O sistema digitaliza e centraliza o fluxo de trabalho hoje operado em planilhas Google Sheets.

### Contexto Operacional (PRD Source)

A planilha "Mídias Mall | Lojas Torra" é o sistema legado atual. Ela contém:

- **~22 shopping centers** com contratos de mídia ativos
- **~14 oportunidades** de novos contratos ou expansões
- **~22 contatos gerentes de loja** (internos Torra)
- **~22 contatos de MKT de shopping** (externos)
- **Fluxo de aprovação** com 12 etapas e SLAs definidos

### Objetivo do Produto

Transformar essa planilha em uma ferramenta web profissional, multi-funcional, com:
- Gestão completa de contratos de mídia física (empenas, totens, placas, etc.)
- Gestão de oportunidades de mídia digital (redes sociais, eventos)
- CRM de contatos (gerentes internos + MKT de shopping)
- Workflow de aprovação com etapas e prazos
- Dashboard executivo com KPIs

---

## 2. Stack Tecnológico Atual

| Categoria | Tecnologia | Versão | Notas |
|-----------|-----------|--------|-------|
| Framework | Next.js | 16.1.6 | App Router, SSR + CSR |
| Runtime | React | 19.2.3 | Concurrent features ativas |
| Linguagem | TypeScript | ^5 | Strict mode habilitado |
| Estilo | Tailwind CSS | ^4 | PostCSS plugin |
| Database | Supabase (PostgreSQL) | ^2.97.0 | SSR-ready client |
| Auth | Supabase Auth | ^0.8.0 (ssr) | Email/password |
| Charts | Recharts | ^3.7.0 | Pie + Bar atualmente |
| Icons | Lucide React | ^0.575.0 | — |
| Utilities | clsx + tailwind-merge | — | cn() helper |
| Package Manager | npm | — | lock file presente |

### Versões Notáveis

- **Next.js 16** → Versão muito recente, App Router maduro
- **React 19** → Experimental features disponíveis (Actions, etc.)
- **Tailwind 4** → Breaking changes vs v3, nova API de configuração
- **Supabase SSR 0.8** → Versão atual recomendada

---

## 3. Estrutura de Diretórios

```
midiacore/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (fontes, globals)
│   │   ├── page.tsx                  # Landing page marketing
│   │   ├── globals.css               # Design tokens + componentes CSS
│   │   ├── dashboard/
│   │   │   ├── layout.tsx            # Auth guard + layout dashboard
│   │   │   ├── page.tsx              # Overview KPIs + charts
│   │   │   └── contracts/
│   │   │       ├── page.tsx          # Lista contratos com filtros
│   │   │       ├── new/page.tsx      # Formulário criar contrato
│   │   │       └── [id]/page.tsx     # Formulário editar/deletar
│   │   └── login/
│   │       └── page.tsx              # Login form
│   ├── components/
│   │   └── dashboard/
│   │       ├── Header.tsx            # Header com search + notificações
│   │       ├── Sidebar.tsx           # Navegação lateral
│   │       ├── StatusDistributionChart.tsx  # Pie chart de status
│   │       └── OccupancyChart.tsx    # Bar chart ocupação
│   ├── hooks/
│   │   └── use-auth.tsx              # AuthContext + useAuth hook
│   ├── lib/
│   │   ├── utils.ts                  # cn(), formatCurrency(), formatDate()
│   │   └── supabase/
│   │       ├── client.ts             # Browser client
│   │       ├── server.ts             # Server client (cookies)
│   │       └── middleware.ts         # Session refresh
│   ├── types/
│   │   └── index.ts                  # TypeScript interfaces
│   └── middleware.ts                 # Next.js middleware (session)
├── supabase/
│   └── migrations/
│       └── 20260222010000_initial_schema.sql
├── public/
├── package.json
├── next.config.ts
├── tsconfig.json
└── eslint.config.mjs
```

---

## 4. Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────┐
│                   Browser                       │
│  Landing Page  │  Login  │  Dashboard (React)   │
└────────────────────────┬────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────┐
│              Next.js 16 (Vercel/Railway)        │
│                                                 │
│  App Router (RSC + Client Components)           │
│  ├── Server Components → Supabase Server Client │
│  ├── Client Components → Supabase Browser Client│
│  └── API Routes (futuro)                        │
│                                                 │
│  Middleware → Session Validation → Cookie Mgmt  │
└────────────────────────┬────────────────────────┘
                         │ Supabase SDK
┌────────────────────────▼────────────────────────┐
│                  Supabase                       │
│                                                 │
│  Auth (email/password)  │  PostgreSQL DB        │
│  RLS Policies           │  Realtime (futuro)    │
│  Storage (futuro)       │                       │
└─────────────────────────────────────────────────┘
```

### Padrão de Renderização

- **Páginas públicas** (landing, login): Server Components
- **Dashboard**: Client Components (usa `use-auth` hook + estado local)
- **Dados**: Fetch direto no client via Supabase JS SDK
- **Sem API Routes** no momento — dados vão diretamente para Supabase

---

## 5. Módulos e Responsabilidades

### Auth (`src/hooks/use-auth.tsx`)

```typescript
// Responsabilidades:
- Mantém estado: user, profile, loading
- Observa mudanças: onAuthStateChange()
- Busca profile do Supabase ao logar
- Provê signOut()

// Consumidores:
- Dashboard Layout (guard)
- Header (exibe email/role)
- Sidebar (logout button)
```

### Contratos (`src/app/dashboard/contracts/`)

```
- Listagem com filtro por status e busca por texto
- CRUD completo: criar, ler, editar, deletar
- Filtros client-side (sem debounce/server-side)
- Delete com confirm nativo do browser
```

**NOTA:** Filtros são executados no client após carregar todos os contratos. Sem paginação.

### Dashboard (`src/app/dashboard/page.tsx`)

```
- 4 KPI cards: Contratos Ativos, Expirando 30d, Volume de Mídia, Performance
- 2 charts: StatusDistribution (Pie) + Occupancy (Bar)
- Dados carregados diretamente do Supabase
```

### Utilitários (`src/lib/utils.ts`)

```typescript
cn()              // clsx + tailwind-merge
formatCurrency()  // BRL pt-BR
formatDate()      // Locale pt-BR
```

---

## 6. Modelo de Dados Atual

### Schema PostgreSQL (migration inicial)

#### `companies`
```sql
id            UUID PK
company_name  TEXT NOT NULL
type          TEXT CHECK ('internal' | 'client')
created_at    TIMESTAMPTZ DEFAULT now()
```

#### `profiles`
```sql
id            UUID PK → auth.users(id)
company_id    UUID FK → companies(id)
role          TEXT CHECK ('admin' | 'editor' | 'viewer')
email         TEXT
created_at    TIMESTAMPTZ DEFAULT now()
```

#### `contracts`
```sql
id                 UUID PK
company_id         UUID FK → companies
shopping_name      TEXT NOT NULL
media_type         TEXT NOT NULL
status             TEXT CHECK ('active' | 'pending' | 'expired')
start_date         DATE
end_date           DATE
contract_value     NUMERIC(15,2)
responsible_person TEXT
notes              TEXT NULL
created_at         TIMESTAMPTZ DEFAULT now()
```

#### `opportunities`
```sql
id                UUID PK
company_id        UUID FK → companies
shopping_name     TEXT NOT NULL
stage             TEXT NOT NULL
forecast_date     DATE
contact_reference TEXT
notes             TEXT
created_at        TIMESTAMPTZ DEFAULT now()
```

#### `contacts`
```sql
id           UUID PK
company_id   UUID FK → companies
name         TEXT NOT NULL
role         TEXT
company_name TEXT
phone        TEXT
email        TEXT
created_at   TIMESTAMPTZ DEFAULT now()
```

### RLS Policy Pattern

```sql
-- Helper function
get_my_company_id() → UUID   -- retorna company_id do profile autenticado

-- Todas as tabelas seguem o padrão:
USING (company_id = get_my_company_id())
```

### Trigger de Autenticação

```sql
on_auth_user_created → handle_new_user()
-- Cria profile automaticamente ao registrar novo usuário
```

---

## 7. Autenticação e Multi-tenancy

### Fluxo de Auth

```
1. User POST /login → Supabase Auth (email/password)
2. Supabase cria sessão → cookies via SSR client
3. Middleware (src/middleware.ts) → updateSession em cada request
4. AuthProvider (use-auth.tsx) → onAuthStateChange listener
5. AuthProvider busca profile → determina company_id e role
6. Dashboard Layout verifica user → redireciona para /login se null
```

### Multi-tenancy

- **Modelo:** Isolamento por `company_id` em todas as tabelas
- **Enforcement:** RLS policies no PostgreSQL (não no app layer)
- **company_id:** Derivado do profile do usuário autenticado
- **Roles:** `admin`, `editor`, `viewer` (sem RBAC implementado ainda)

### Dois Clientes Supabase

```typescript
// Browser (client-side, CSR)
createBrowserClient(url, anonKey)

// Server (SSR, RSC, API routes)
createServerClient(url, anonKey, { cookies })
```

---

## 8. Componentes de UI

### Design Tokens (globals.css)

```css
--brand-blue:   #2563eb
--brand-navy:   #0f172a
--brand-indigo: #4f46e5
--brand-slate:  #64748b
```

### Tipografia

- **Body:** Inter (sans-serif)
- **Headers:** Outfit (sans-serif)

### Classes Customizadas

```css
.executive-card   /* Card com sombra + hover transition */
.glass-effect     /* backdrop-blur glass morphism */
.shimmer          /* loading skeleton animation */
```

### Componentes Existentes

| Componente | Localização | Responsabilidade |
|-----------|-------------|------------------|
| Header | `components/dashboard/Header.tsx` | Search, notificações, user info |
| Sidebar | `components/dashboard/Sidebar.tsx` | Navegação, logout |
| StatusDistributionChart | `components/dashboard/` | Pie chart Recharts |
| OccupancyChart | `components/dashboard/` | Bar chart Recharts |

**NOTA:** Sem biblioteca de componentes (shadcn/ui, Radix, etc.). Todos os componentes são custom com Tailwind.

---

## 9. Dívida Técnica e Gaps

### Gaps Críticos (vs PRD)

| Gap | Impacto | Descrição |
|-----|---------|-----------|
| Schema incompleto | ALTO | Tabela `contracts` não tem campos: `negotiation`, `media_properties`, `layouts_url`, `pending_quotes`, `comments`, `contract_docs` |
| Oportunidades subdesenvolvidas | ALTO | Schema atual não reflete campos da planilha: `frequency`, `social_media`, `new_media`, `events` |
| Contatos sem categorias | ALTO | Não diferencia contatos gerentes (internos Torra) de contatos MKT Shopping (externos) |
| Workflow de aprovação ausente | ALTO | Fluxo de 12 etapas com SLAs não existe |
| Sem CRUD de Oportunidades | MÉDIO | UI de oportunidades não implementada |
| Sem CRUD de Contatos | MÉDIO | UI de contatos não implementada |
| Sem módulo de notificações | MÉDIO | Bell icon existe mas sem funcionalidade |

### Dívida Técnica Existente

| Item | Severidade | Nota |
|------|-----------|------|
| Filtros client-side sem paginação | MÉDIO | Performance degradará com muitos registros |
| TypeScript types desync com schema | MÉDIO | `types/index.ts` não reflete schema atual completamente |
| Sem testes automatizados | MÉDIO | Zero coverage |
| Auth check no client | BAIXO | Dashboard layout usa hook ao invés de middleware |
| Sem error boundaries | BAIXO | Erros de fetch não tratados globalmente |
| Delete sem soft-delete | BAIXO | Registros deletados permanentemente |

### Workarounds e Gotchas

- **RBAC:** Roles existem no schema mas sem enforcement na UI
- **Tipos:** Interface `Profile` em `types/index.ts` tem `full_name` e `avatar_url` mas migration não tem esses campos
- **RLS:** `get_my_company_id()` deve existir no DB antes de qualquer operação autenticada

---

## 10. Pontos de Integração

### Serviços Externos Atuais

| Serviço | Propósito | Integração |
|---------|---------|-----------|
| Supabase | Database + Auth + Storage | SDK oficial |
| Google Drive/Slides | Links de layouts (referência) | URLs externas apenas |

### Integrações Futuras (PRD)

| Serviço | Propósito | Prioridade |
|---------|---------|-----------|
| Google Drive API | Upload/preview de layouts | MÉDIO |
| WhatsApp/Email | Notificações de prazos | BAIXO |

---

## 11. Desenvolvimento Local

### Pré-requisitos

```bash
node >= 18
npm
Supabase CLI (opcional para migrations locais)
```

### Setup

```bash
git clone https://github.com/dannmaldonado/midiacore.git
cd midiacore
npm install

# Criar .env.local:
NEXT_PUBLIC_SUPABASE_URL=<url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

npm run dev  # http://localhost:3000
```

### Scripts Disponíveis

```bash
npm run dev    # Desenvolvimento (Next.js dev server)
npm run build  # Build de produção
npm run start  # Start produção
npm run lint   # ESLint
```

### Aplicar Migrations

```bash
supabase db push  # Requer supabase CLI + project linking
# OU aplicar manualmente no Supabase Studio
```

---

## 12. Impact Analysis — Evolução para Plataforma Pro

### Visão Geral das Mudanças Necessárias

Para transformar o MidiaCore na versão profissional descrita no PRD, as seguintes áreas precisam ser desenvolvidas:

---

### 12.1 Schema Evolution (Alta Prioridade)

**Tabela `contracts` — campos a adicionar:**
```sql
negotiation         TEXT        -- Tipo de negociação (ex: Renovação, Negociação Direta)
media_properties    TEXT[]      -- Array de propriedades (ex: ['Empena', 'Totem Digital'])
contract_docs       TEXT        -- URL do contrato/PI/OS
layouts_url         TEXT        -- Link Google Slides/Drive com layouts
pending_quotes      TEXT        -- Orçamentos pendentes
comments            TEXT        -- Comentários gerais
```

**Tabela `opportunities` — campos a adicionar:**
```sql
frequency           TEXT        -- Semanal, Mensal, Diário
social_media_plan   TEXT        -- Descrição do plano de redes sociais
new_media_target    TEXT        -- Novas mídias à contratar
events_plan         TEXT        -- Programação de eventos
```

**Tabela `contacts` — campo a adicionar:**
```sql
contact_type        TEXT CHECK ('store_manager' | 'shopping_mkt')
shopping_name       TEXT        -- Shopping center associado
```

**Nova tabela `approval_workflows`:**
```sql
id                  UUID PK
contract_id         UUID FK → contracts
current_step        TEXT        -- Etapa atual do fluxo
step_status         TEXT        -- pending | approved | rejected
assigned_to         UUID FK → profiles
deadline            DATE
completed_at        TIMESTAMPTZ NULL
notes               TEXT
created_at          TIMESTAMPTZ DEFAULT now()
```

---

### 12.2 Novos Módulos de UI

| Módulo | Páginas | Status |
|--------|---------|--------|
| Oportunidades CRUD | `/dashboard/opportunities`, `/new`, `/[id]` | Não existe |
| Contatos CRUD | `/dashboard/contacts`, `/new`, `/[id]` | Não existe |
| Workflow de Aprovação | `/dashboard/approvals` | Não existe |
| Relatórios | `/dashboard/reports` | Não existe |

---

### 12.3 Arquivos que Precisam Ser Modificados

| Arquivo | Tipo de Mudança |
|---------|----------------|
| `src/types/index.ts` | Atualizar interfaces Contract, Opportunity, Contact |
| `src/app/dashboard/page.tsx` | Novos KPIs (aprovações pendentes, oportunidades) |
| `src/components/dashboard/Sidebar.tsx` | Adicionar novos itens de menu |
| `supabase/migrations/` | Nova migration com schema evolution |

---

### 12.4 Novos Arquivos Necessários

```
src/app/dashboard/
  opportunities/page.tsx
  opportunities/new/page.tsx
  opportunities/[id]/page.tsx
  contacts/page.tsx
  contacts/new/page.tsx
  contacts/[id]/page.tsx
  approvals/page.tsx

src/components/dashboard/
  ApprovalTimeline.tsx
  ContactCard.tsx
  OpportunityCard.tsx
  StatusBadge.tsx

supabase/migrations/
  20260225000000_schema_evolution.sql
```

---

### 12.5 Fluxo de Aprovação (Workflow)

Baseado na aba "PRAZOS / ETAPAS DE APROVAÇÃO":

| Etapa | SLA | Responsável |
|-------|-----|------------|
| Solicitação da Proposta | 1 dia | Auditoria → MKT Shopping |
| Proposta MKT Shopping | 7 dias | MKT Shopping |
| Análise Auditoria | 3 dias | Auditoria |
| Aprovação MKT Torra | 15 dias | MKT Torra |
| Jurídico Torra | 30 dias | Jurídico |
| Renovação sem troca de mídia | — | — |
| Renovação com troca de mídia | 15 dias | — |
| Orçamento de produção (c/ retirada 1 ano) | 5 dias | Produção |
| Produção e instalação novas mídias | 10 dias | Instalação |
| Checking de instalação | — | — |
| Renovação não autorizada | — | — |
| Retirada das mídias | 7 dias | Instalação |

---

## Changelog

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 2026-02-25 | 1.0 | Análise brownfield inicial + Impact Analysis | Aria (Architect) |
