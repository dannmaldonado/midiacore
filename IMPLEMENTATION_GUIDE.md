# Guia de Implementação - Resolução de Problemas Estruturais

**Status:** Pronto para implementação
**Complexidade:** Médio-Alto
**Tempo Estimado:** 10-12 horas de desenvolvimento
**Prioridade:** CRÍTICA (bloqueia funcionalidades core)

---

## FASE 1: PROBLEMA 1 - TABELA SHOPPINGS (Prazo: 1-2 dias)

### OPÇÃO A: Implementação Recomendada (Normalização)

#### Passo 1: Criar Migration SQL

**Arquivo:** `supabase/migrations/20260330_create_shoppings_table.sql`

```sql
-- Migration: Create shoppings table (normalização de dados)
-- Date: 2026-03-30
-- Story: Fix shopping dropdown in opportunities form

-- ==========================================
-- 1. CREATE TABLE public.shoppings
-- ==========================================

CREATE TABLE IF NOT EXISTS public.shoppings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, name)  -- Um shopping por nome por empresa
);

-- Enable RLS
ALTER TABLE public.shoppings ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. RLS POLICY
-- ==========================================

CREATE POLICY "Company dynamic access for shoppings"
ON public.shoppings FOR ALL
USING (company_id = public.get_my_company_id())
WITH CHECK (company_id = public.get_my_company_id());

-- ==========================================
-- 3. INDEXES (performance)
-- ==========================================

CREATE INDEX idx_shoppings_company_id ON public.shoppings(company_id);
CREATE INDEX idx_shoppings_name ON public.shoppings(name);

-- ==========================================
-- 4. BACKFILL EXISTING DATA
-- ==========================================

-- Extrair shoppings de contracts
INSERT INTO public.shoppings (company_id, name)
SELECT DISTINCT company_id, shopping_name
FROM public.contracts
WHERE shopping_name IS NOT NULL
  AND shopping_name != ''
ON CONFLICT (company_id, name) DO NOTHING;

-- Extrair shoppings de opportunities
INSERT INTO public.shoppings (company_id, name)
SELECT DISTINCT company_id, shopping_name
FROM public.opportunities
WHERE shopping_name IS NOT NULL
  AND shopping_name != ''
ON CONFLICT (company_id, name) DO NOTHING;

-- ==========================================
-- 5. ADICIONAR FOREIGN KEYS
-- ==========================================

-- Add shopping_id to contracts
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS shopping_id UUID REFERENCES public.shoppings(id) ON DELETE SET NULL;

-- Add shopping_id to opportunities
ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS shopping_id UUID REFERENCES public.shoppings(id) ON DELETE SET NULL;

-- ==========================================
-- 6. UPDATE FOREIGN KEYS (populate IDs)
-- ==========================================

-- Atualizar contracts.shopping_id
UPDATE public.contracts c
SET shopping_id = (
    SELECT id FROM public.shoppings s
    WHERE s.company_id = c.company_id
    AND s.name = c.shopping_name
    LIMIT 1
)
WHERE c.shopping_name IS NOT NULL;

-- Atualizar opportunities.shopping_id
UPDATE public.opportunities o
SET shopping_id = (
    SELECT id FROM public.shoppings s
    WHERE s.company_id = o.company_id
    AND s.name = o.shopping_name
    LIMIT 1
)
WHERE o.shopping_name IS NOT NULL;

-- ==========================================
-- 7. VERIFICATION QUERIES
-- ==========================================

-- Verificar shoppings criados
-- SELECT COUNT(*) as total_shoppings FROM public.shoppings;

-- Verificar backfill de contracts
-- SELECT COUNT(*) as contracts_com_shopping_id
-- FROM public.contracts WHERE shopping_id IS NOT NULL;

-- Verificar backfill de opportunities
-- SELECT COUNT(*) as opportunities_com_shopping_id
-- FROM public.opportunities WHERE shopping_id IS NOT NULL;
```

#### Passo 2: Aplicar Migration

```bash
# No diretório do projeto:
supabase migration up

# OU manualmente no console Supabase:
# 1. Copiar conteúdo do arquivo SQL
# 2. Ir para: SQL Editor → New Query
# 3. Colar e executar
# 4. Verificar se não há erros
```

#### Passo 3: Atualizar Frontend (opportunities/new/page.tsx)

**Arquivo:** `src/app/dashboard/opportunities/new/page.tsx`

Substituir seção de loading de shoppings (linhas 47-67):

```typescript
// ANTES:
useEffect(() => {
    const loadShoppings = async () => {
        try {
            const { data, error } = await supabase
                .from('shoppings')
                .select('id, name')
                .order('name')

            if (error) throw error
            setShoppings(data || [])
        } catch (err) {
            console.error('Erro ao carregar shoppings:', err)
            setError('Erro ao carregar lista de shoppings')
        } finally {
            setLoadingShoppings(false)
        }
    }

    loadShoppings()
}, [supabase])

// DEPOIS:
useEffect(() => {
    const loadShoppings = async () => {
        try {
            if (!profile?.company_id) {
                setShoppings([])
                return
            }

            const { data, error } = await supabase
                .from('shoppings')
                .select('id, name')
                .eq('company_id', profile.company_id)
                .order('name')

            if (error) throw error
            setShoppings(data || [])
        } catch (err) {
            console.error('Erro ao carregar shoppings:', err)
            setError('Erro ao carregar lista de shoppings')
        } finally {
            setLoadingShoppings(false)
        }
    }

    loadShoppings()
}, [supabase, profile?.company_id])
```

**Também atualizar o payload de envio (linhas 87-97):**

```typescript
// ANTES:
const payload = {
    company_id: profile.company_id,
    shopping_id: formData.shopping_id,  // ← Já esperado!
    frequency: formData.frequency || null,
    // ...
}

// APÓS: (sem alteração necessária - já estava correto!)
// O código já usa formData.shopping_id
// Apenas o carregamento needed updating
```

#### Passo 4: Testar em Local/Staging

```bash
# 1. Iniciar dev server
npm run dev

# 2. Ir para: http://localhost:3000/dashboard/opportunities/new

# 3. Verificar:
# - Dropdown "Shopping / Mídia" carrega com lista
# - Consegue selecionar um shopping
# - Ao submeter, cria oportunidade com shopping_id válido

# 4. Verificar no Supabase console:
# SELECT * FROM opportunities ORDER BY created_at DESC LIMIT 1;
# Deve ter shopping_id preenchido
```

#### Passo 5: Validação Final

```sql
-- Query para verificar integridade:
SELECT
    o.id,
    o.shopping_name,
    o.shopping_id,
    s.name as shopping_name_from_fk
FROM public.opportunities o
LEFT JOIN public.shoppings s ON o.shopping_id = s.id
WHERE o.shopping_id IS NOT NULL
LIMIT 10;

-- Esperado: Todas linhas com shopping_id preenchido
--          shopping_name == shopping_name_from_fk (ou ~similar)
```

---

### OPÇÃO B: Implementação Rápida (Sem Tabela)

Se decisão for por Opção B (solução temporária), usar este código:

**Arquivo:** `src/app/dashboard/opportunities/new/page.tsx`

```typescript
// SUBSTITUIR linhas 47-67:

const loadShoppings = async () => {
    try {
        if (!profile?.company_id) {
            setShoppings([])
            return
        }

        // Carregar shoppings já usados em contracts
        const { data: fromContracts } = await supabase
            .from('contracts')
            .select('shopping_name')
            .eq('company_id', profile.company_id)
            .not('shopping_name', 'is', null)

        // Carregar shoppings já usados em opportunities
        const { data: fromOpportunities } = await supabase
            .from('opportunities')
            .select('shopping_name')
            .eq('company_id', profile.company_id)
            .not('shopping_name', 'is', null)

        // Deduplicate
        const names = new Set([
            ...(fromContracts?.map(c => c.shopping_name) || []),
            ...(fromOpportunities?.map(o => o.shopping_name) || [])
        ])

        // Converter para array com IDs gerados
        const uniqueShoppings = Array.from(names)
            .filter(Boolean)
            .sort()
            .map((name, idx) => ({
                id: `shopping-${idx}-${name}`,  // Fake UUID
                name
            }))

        setShoppings(uniqueShoppings)
    } catch (err) {
        console.error('Erro ao carregar shoppings:', err)
        setError('Erro ao carregar lista de shoppings')
    } finally {
        setLoadingShoppings(false)
    }
}
```

**⚠️ NOTA IMPORTANTE:** Com Opção B, o payload enviado será texto simples em vez de UUID. Isso funcionará, mas:
- Não há validação de integridade referencial
- Difícil adicionar metadados de shoppings futuramente
- Performance pior em queries

**Recomendação:** Use Opção B apenas como PATCH TEMPORÁRIO. Migre para Opção A na próxima sprint.

---

## FASE 2: PROBLEMA 2 - SESSÃO DESAPARECE (Prazo: 1-2 dias)

### SOLUÇÃO 1: Quick Fix (30 minutos)

#### Passo 1: Refactor useAuth com maybeSingle()

**Arquivo:** `src/hooks/use-auth.tsx`

Alterar linha 50:

```typescript
// ANTES:
const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()  // ❌ Rígido - falha se 0 ou 2+ rows

// DEPOIS:
const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()  // ✅ Tolerante - retorna null se 0 rows
```

**Por que funciona:**
- `.single()` lança erro se nenhuma linha encontrada
- `.maybeSingle()` retorna null se nenhuma linha, sem erro
- Permite que `profile` fique null graciosamente em vez de quebrar

#### Passo 2: Remover Timeout Genérico (opcional)

Alterar linhas 85-90:

```typescript
// ANTES:
timeoutId = setTimeout(() => {
    if (isMounted) {
        console.warn('[Auth] Timeout ao aguardar sessão')
        setLoading(false)  // ❌ Força false mesmo sem dados
    }
}, 8000)

// DEPOIS:
// ❌ REMOVER COMPLETAMENTE
// O onAuthStateChange já vai setar loading=false quando houver resposta
```

#### Passo 3: Adicionar Cache LocalStorage (recomendado)

Adicionar após linha 62:

```typescript
const fetchProfile = async (userId: string) => {
    try {
        // ✅ NOVO: Tentar ler do cache primeiro
        const cacheKey = `profile-${userId}`
        const cachedProfile = localStorage.getItem(cacheKey)

        if (cachedProfile) {
            try {
                const profile = JSON.parse(cachedProfile)
                if (isMounted) setProfile(profile)
                return  // ✅ Return early, skip DB query
            } catch {
                // Cache corrupted, continue to DB
            }
        }

        // Original query
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle()  // ✅ Changed

        if (!error && data && isMounted) {
            // ✅ NOVO: Cache resultado
            localStorage.setItem(cacheKey, JSON.stringify(data))
            setProfile(data)
        } else if (error && isMounted) {
            console.error('[Auth] Falha ao carregar perfil:', error.message)
        }
    } catch (err) {
        if (isMounted) {
            console.error('[Auth] Erro ao buscar perfil:', err)
        }
    }
}
```

#### Passo 4: Limpar Cache ao Logout

Alterar função `signOut` (linhas 99-102):

```typescript
const signOut = useCallback(async () => {
    await supabase.auth.signOut()

    // ✅ NOVO: Limpar cache do perfil
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.id) {
        localStorage.removeItem(`profile-${user.id}`)
    }

    router.push('/login')
}, [supabase, router])
```

#### Passo 5: Testar Quick Fix

```bash
# 1. Reiniciar dev server
npm run dev

# 2. Login em http://localhost:3000/login
# 3. Dashboard carrega com dados ✅

# 4. Pressionar F5 (refresh)
# 5. Aguardar ~2 segundos
# 6. Verificar:
#    - Menu lateral persiste ✅
#    - Dados carregam ✅
#    - Profile carregado ✅

# 7. Testar logout:
# - Clicar em "Encerrar Sessão"
# - Deve ir para /login
# - Verificar cache foi limpo:
#   localStorage.getItem('profile-...')  // undefined
```

---

### SOLUÇÃO 2: Completa com SSR (2-3 horas)

Se decidir implementar SSR middleware (mais robusto):

#### Passo 1: Criar Server Client

**Arquivo:** `src/lib/supabase/server.ts` (NOVO)

```typescript
import { createServerClient, serializeCookieHeader, parseCookieHeader } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Silently fail on server-side (cookies already sent)
                    }
                },
            },
        }
    )
}
```

#### Passo 2: Criar Middleware

**Arquivo:** `src/middleware.ts` (NOVO)

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Verificar sessão do usuário
    const { data: { user }, error } = await supabase.auth.getUser()

    // Redirecionar não autenticados para /login
    if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/login'
        return NextResponse.redirect(loginUrl)
    }

    // Redirecionar autenticados longe de /login
    if (request.nextUrl.pathname === '/login' && user) {
        const dashUrl = request.nextUrl.clone()
        dashUrl.pathname = '/dashboard'
        return NextResponse.redirect(dashUrl)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        // Proteger /dashboard
        '/dashboard/:path*',
        // Proteger /login redirect
        '/login/:path*',
    ],
}
```

#### Passo 3: Refactor useAuth para confiar em SSR

**Arquivo:** `src/hooks/use-auth.tsx` (REFACTOR)

```typescript
'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { type Session, type User } from '@supabase/supabase-js'
import { Profile } from '@/types'

interface AuthContextType {
    user: User | null
    profile: Profile | null
    loading: boolean
    isAdmin: boolean
    isEditor: boolean
    isViewer: boolean
    canEdit: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    isAdmin: false,
    isEditor: false,
    isViewer: false,
    canEdit: false,
    signOut: async () => {},
})

// ✅ Singleton pattern para client Supabase
let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
    if (!supabaseClient) {
        supabaseClient = createClient()
    }
    return supabaseClient
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        let isMounted = true
        const supabase = getSupabaseClient()

        // Inicializar autenticação
        const initAuth = async () => {
            try {
                // ✅ getSession é mais eficiente que onAuthStateChange para init
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()

                if (sessionError) throw sessionError

                if (session?.user && isMounted) {
                    setUser(session.user)

                    // Carregar profile
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .maybeSingle()  // ✅ Tolerante

                    if (!error && data && isMounted) {
                        setProfile(data)
                    } else if (error && isMounted) {
                        console.error('[Auth] Profile load error:', error.message)
                        setProfile(null)
                    }
                } else if (isMounted) {
                    setUser(null)
                    setProfile(null)
                }
            } catch (err) {
                if (isMounted) {
                    console.error('[Auth] Init error:', err)
                    setUser(null)
                    setProfile(null)
                }
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        initAuth()

        // ✅ Listener para mudanças posteriores (login/logout em outra tab)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!isMounted) return

                setUser(session?.user ?? null)

                if (session?.user) {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .maybeSingle()

                    if (!error && data) {
                        setProfile(data)
                    } else {
                        console.error('[Auth] Profile error:', error?.message)
                        setProfile(null)
                    }
                } else {
                    setProfile(null)
                }

                setLoading(false)
            }
        )

        return () => {
            isMounted = false
            subscription?.unsubscribe()
        }
    }, [])

    const signOut = useCallback(async () => {
        const supabase = getSupabaseClient()
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        router.push('/login')
    }, [router])

    const authValue = useMemo(
        () => ({
            user,
            profile,
            loading,
            isAdmin: profile?.role === 'admin',
            isEditor: profile?.role === 'editor',
            isViewer: profile?.role === 'viewer',
            canEdit: profile?.role === 'admin' || profile?.role === 'editor',
            signOut,
        }),
        [profile, user, signOut]
    )

    return (
        <AuthContext.Provider value={authValue}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de AuthProvider')
    }
    return context
}
```

#### Passo 4: Testar SSR Complete

```bash
# 1. Parar dev server (Ctrl+C)
# 2. Reiniciar: npm run dev

# 3. Teste 1: Acesso não autenticado
# - Ir para http://localhost:3000/dashboard
# - Deve redirecionar para /login ✅ (middleware)

# 4. Teste 2: Login e refresh
# - Login em /login
# - Ir para /dashboard
# - Pressionar F5
# - Middleware valida sessão
# - Dashboard carrega ✅

# 5. Teste 3: Logout
# - Clicar "Encerrar Sessão"
# - Deve ir para /login ✅

# 6. Teste 4: Session em outra aba
# - Abrir nova aba: http://localhost:3000/dashboard
# - Sem fazer login (sessão em outra aba)
# - Middleware redireciona ✅ (ou autoriza se middleware detecta sessão)
```

---

## Checklist Final de Implementação

```
PROBLEMA 1: Tabela Shoppings
─────────────────────────────────────────
Opção A (Recomendada):
□ Criar migration SQL (file: 20260330_create_shoppings_table.sql)
□ Aplicar migration (supabase migration up)
□ Verificar backfill de dados
□ Atualizar frontend: opportunities/new/page.tsx
□ Testar dropdown carrega
□ Testar criar oportunidade com shopping
□ Testar em staging antes de prod
□ Documentar mudanças no README

Opção B (Rápida - temporária):
□ Copiar código alternativo para opportunities/new/page.tsx
□ Testar dropdown carrega
□ Testar criar oportunidade
□ ⚠️ PLANEJAR REFACTOR PARA OPÇÃO A


PROBLEMA 2: Session Desaparece
─────────────────────────────────────────
Solução 1 (Quick Fix - 30 min):
□ Alterar .single() → .maybeSingle() em use-auth.tsx (linha 50)
□ Remover timeout genérico (linhas 85-90)
□ Adicionar cache localStorage (fetchProfile)
□ Limpar cache ao logout (signOut)
□ Testar login → F5 → dados persistem
□ Testar logout → cache limpo

Solução 2 (Completa SSR - 2-3h):
□ Criar /src/lib/supabase/server.ts
□ Criar /src/middleware.ts
□ Refactor /src/hooks/use-auth.tsx
□ Testar middleware: /dashboard sem auth → /login
□ Testar middleware: F5 em /dashboard → mantém session
□ Testar onAuthStateChange em listener de mudanças
□ Testes de cross-tab session sync


TESTES GLOBAIS
─────────────────────────────────────────
□ npm run lint (sem erros)
□ npm run typecheck (sem erros)
□ npm test (se existirem testes)
□ Manual: Login flow completo
□ Manual: Criar oportunidade com shopping
□ Manual: Refresh em vários pontos
□ Manual: Logout e re-login
□ Staging deployment
□ Production deployment


DOCUMENTAÇÃO
─────────────────────────────────────────
□ Atualizar README.md com nova tabela shoppings
□ Documentar migration em docs/
□ Adicionar comentários no código critical
□ Atualizar schema docs se existente
□ Registrar decisão (Opção A vs B) em ADR ou CHANGELOG
```

---

## FAQ & Troubleshooting

### P: Qual opção escolher, A ou B?
**R:** Opção A (normalização) é recomendada. Opção B é apenas temporária. Se tempo apertado, use B agora e migre para A na próxima sprint.

### P: Por que .maybeSingle() é melhor que .single()?
**R:** `.single()` lança erro se 0 ou 2+ rows. `.maybeSingle()` retorna null se 0 rows, sem erro. Isso permite que o código continue graciosamente mesmo se profile não existir.

### P: Preciso de SSR middleware ou posso usar cache localStorage?
**R:** Cache localStorage é o quick fix. SSR middleware é mais robusto para produção. Usar quick fix agora, migrar para SSR depois se problemas persistirem.

### P: Como validar que migration foi aplicada?
**R:**
```sql
-- No Supabase SQL Editor:
SELECT * FROM public.shoppings LIMIT 1;
-- Deve retornar tabela vazia (sem erros)

SELECT COUNT(*) FROM public.shoppings;
-- Deve retornar número de shoppings backfilled
```

### P: O que acontece com dados históricos?
**R:** Nada. Opção A preserva todos os dados. `shopping_name` continua em contracts/opportunities. `shopping_id` é adicionado como coluna nova. Backfill preenche IDs automaticamente.

### P: Posso reverter a migration?
**R:** Sim. Se algo quebrar:
```bash
supabase migration down
```
Isso reverte para estado anterior. MAS depois que deployar em produção, reverts são complicados. Testar bem em staging!

### P: Devo remover `shopping_name` depois?
**R:** Não imediatamente. Deixe como "legacy" por 1-2 sprints, depois remova. Assim, se algo quebrar, é fácil reverter em código (em vez de migration).

---

## Timeline Realista

```
Assumindo: 1 dev, 8h/dia

OPÇÃO A (Recomendada):
─────────────────────
Dia 1: Morning (2h)
  ├─ Criar migration SQL
  ├─ Revisar script
  └─ Fazer dry-run em staging

Dia 1: Afternoon (3h)
  ├─ Aplicar migration em staging
  ├─ Verificar backfill
  ├─ Testar em staging
  └─ Code review

Dia 2: Morning (2h)
  ├─ Atualizar frontend (opportunities/new)
  ├─ Local testing
  └─ Staging final validation

Dia 2: Afternoon (1h)
  └─ Deploy em produção

Total: 8h (1 dia)


PROBLEMA 2 - QUICK FIX:
─────────────────────
Dia 2: Afternoon (1h)
  ├─ Refactor useAuth (maybeSingle)
  ├─ Local test (login + F5)
  └─ Deploy

Total: 1h (adicional ao P1)


PROBLEMA 2 - SSR COMPLETO:
───────────────────────────
Dia 3: Full day (8h)
  ├─ Criar server.ts
  ├─ Criar middleware.ts
  ├─ Refactor useAuth completo
  ├─ Local testing extensivo
  ├─ Staging testing
  └─ Deploy

Total: 8h (1 dia)


RESUMO:
────────
Quick Fix P1 + P2: 9h (1 dia)
Complete P1 + P2: 16h (2 dias)
```

---

**Preparado por:** Claude Code (PM/Architect Analysis)
**Data:** 30 de março de 2026
**Status:** Pronto para handoff para @dev

