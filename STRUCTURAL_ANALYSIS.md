# Análise Estrutural - MidiaCore
**Data:** 30 de março de 2026
**Projeto:** MidiaCore (Next.js + Supabase)
**Solicitante:** @pm (Product Manager)

---

## RESUMO EXECUTIVO

Identificadas **2 problemas críticos estruturais** no projeto:

1. **Problema 1 (CRÍTICO):** Tabela `shoppings` não existe no banco de dados
2. **Problema 2 (CRÍTICO):** Sessão Supabase não persiste corretamente entre recarregamentos

Ambos bloqueiam funcionalidades core. Recomendações fornecidas para cada um.

---

## PROBLEMA 1: Tabela "SHOPPINGS" Ausente

### Descrição do Problema
- A página `src/app/dashboard/opportunities/new/page.tsx` (linhas 49-67) tenta carregar dados da tabela `shoppings`
- Campo esperado: `shoppings.id` e `shoppings.name`
- **Realidade:** A tabela `shoppings` NÃO existe no banco de dados Supabase

### Localização da Falha
**Arquivo:** `/src/app/dashboard/opportunities/new/page.tsx`
```typescript
// Linhas 49-67 - Carregamento de shoppings
const loadShoppings = async () => {
    try {
        const { data, error } = await supabase
            .from('shoppings')  // ❌ TABELA NÃO EXISTE
            .select('id, name')
            .order('name')
        // ...
    }
}
```

### Mapeamento do Banco de Dados

#### Tabelas Existentes (confirmadas)
1. **`auth.users`** - Usuários do Supabase
2. **`public.companies`** - Empresas cadastradas
   - Campos: `id`, `company_name`, `type`, `created_at`
3. **`public.profiles`** - Perfis estendidos do auth.users
   - Campos: `id`, `company_id`, `role`, `email`, `created_at`
4. **`public.contracts`** - Contratos/mídia
   - Campos: `id`, `company_id`, `shopping_name`, `media_type`, `status`, `start_date`, `end_date`, `contract_value`, `responsible_person`, `notes`, `created_at`
   - Campos adicionados (migration 20260225): `negotiation`, `media_properties`, `contract_docs`, `layouts_url`, `pending_quotes`, `comments`
5. **`public.opportunities`** - Oportunidades de negócio
   - Campos: `id`, `company_id`, `shopping_name`, `stage`, `forecast_date`, `contact_reference`, `notes`, `created_at`
   - Campos adicionados (migration 20260225): `frequency`, `social_media_plan`, `new_media_target`, `events_plan`
6. **`public.contacts`** - Contatos de shoppings
   - Campos: `id`, `company_id`, `name`, `role`, `company_name`, `phone`, `email`, `created_at`
   - Campos adicionados (migration 20260225): `contact_type`, `shopping_name`
7. **`public.approval_workflows`** - Fluxos de aprovação
   - Campos: `id`, `contract_id`, `current_step`, `step_status`, `assigned_to`, `deadline`, `completed_at`, `notes`, `created_at`

#### Tabelas NÃO Existentes (mas esperadas pelo código)
❌ **`public.shoppings`** - AUSENTE!

### Raiz do Problema
O código assume que cada shopping/mídia é uma entidade separada em uma tabela `shoppings`, mas o design atual usa:
- **`shopping_name`** como campo TEXT em `contracts` e `opportunities`
- Sem normalização em tabela separada

### Recomendação 1: Solução (escolha uma)

#### **Opção A - RECOMENDADA: Criar tabela `shoppings` normalizada**
Melhor arquitetura para longo prazo. Manutenção facilitada.

**Migration SQL:**
```sql
-- Criar tabela shoppings
CREATE TABLE public.shoppings (
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

-- RLS Policy
CREATE POLICY "Company dynamic access for shoppings"
ON public.shoppings FOR ALL
USING (company_id = public.get_my_company_id())
WITH CHECK (company_id = public.get_my_company_id());

-- Backfill: Extrair shoppings únicos de contracts/opportunities
INSERT INTO public.shoppings (company_id, name)
SELECT DISTINCT company_id, shopping_name
FROM public.contracts
WHERE shopping_name IS NOT NULL
ON CONFLICT (company_id, name) DO NOTHING;

INSERT INTO public.shoppings (company_id, name)
SELECT DISTINCT company_id, shopping_name
FROM public.opportunities
WHERE shopping_name IS NOT NULL
ON CONFLICT (company_id, name) DO NOTHING;

-- Adicionar FK a contracts
ALTER TABLE public.contracts
ADD COLUMN shopping_id UUID REFERENCES public.shoppings(id) ON DELETE SET NULL;

-- Adicionar FK a opportunities
ALTER TABLE public.opportunities
ADD COLUMN shopping_id UUID REFERENCES public.shoppings(id) ON DELETE SET NULL;
```

**Vantagens:**
- Dados normalizados
- Reutilização de lista de shoppings
- Fácil adicionar metadados (localização, contato)
- Melhor performance em queries

---

#### **Opção B - RÁPIDA: Usar dados existentes em tempo real**
Solução imediata (até criar migration).

**Código alternativo para `new/page.tsx`:**
```typescript
// Carregar shoppings já usados
const loadShoppings = async () => {
    try {
        const { data: fromContracts } = await supabase
            .from('contracts')
            .select('shopping_name')
            .order('shopping_name');

        const { data: fromOpportunities } = await supabase
            .from('opportunities')
            .select('shopping_name')
            .order('shopping_name');

        // Deduplicate
        const names = new Set([
            ...(fromContracts?.map(c => c.shopping_name) || []),
            ...(fromOpportunities?.map(o => o.shopping_name) || [])
        ]);

        const uniqueShoppings = Array.from(names)
            .filter(Boolean)
            .sort()
            .map((name, idx) => ({ id: `shopping-${idx}`, name }));

        setShoppings(uniqueShoppings);
    } catch (err) {
        console.error('Erro ao carregar shoppings:', err);
        setError('Erro ao carregar lista de shoppings');
    }
};
```

**Limitações:**
- Valores como texto simples em vez de IDs
- Sem reutilização de dados
- Solução temporária

---

### Recomendação Implementação
**Passo 1 (Imediato):** Use Opção B (patch rápido)
**Passo 2 (Sprint próximo):** Implemente Opção A (refactor completo)

---

## PROBLEMA 2: Sessão Desaparece ao Atualizar Página (F5)

### Descrição do Problema
- ✅ Usuário faz login → dados carregam corretamente
- ✅ Dashboard funciona normalmente
- ❌ **Ao pressionar F5 (refresh):**
  - Todos os dados desaparecem
  - Menu lateral ("Usuários") some
  - Sessão parece perdida

### Localização da Falha
**Arquivo:** `/src/hooks/use-auth.tsx`

#### Análise do Código
```typescript
// Linhas 39-97 - useEffect do AuthProvider
useEffect(() => {
    let isMounted = true;

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()  // ❌ PROBLEMA AQUI
            // ...
        }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
            const currentUser = session?.user ?? null;
            if (isMounted) {
                setUser(currentUser);
                if (currentUser) {
                    await fetchProfile(currentUser.id);  // ⚠️ Race condition
                } else {
                    setProfile(null);
                }
                setLoading(false);  // ⚠️ Pode ficar prematuramente false
            }
        }
    )

    // Fallback: 8 segundos timeout
    timeoutId = setTimeout(() => {
        if (isMounted) {
            console.warn('[Auth] Timeout ao aguardar sessão');
            setLoading(false);  // ⚠️ Força loading=false mesmo sem dados
        }
    }, 8000);

    return () => {
        isMounted = false;
        clearTimeout(timeoutId);
        subscription.unsubscribe();
    };
}, [supabase]);
```

### Problemas Identificados

#### 1️⃣ **Profile não carrega corretamente em refresh**
- **Linha 50:** `.single()` é MUITO rígido
- Se profile não encontrado → erro genérico
- Em refresh, timing pode fazer profile carregamento falhar

**Problema específico:**
- `onAuthStateChange` dispara ANTES do Supabase ter a sessão armazenada
- Ao refresh, sessão pode estar "stale" por alguns ms
- Profile fetch falha em race condition

#### 2️⃣ **Sidebar desaparece porque `profile === null`**
**Arquivo:** `/src/components/dashboard/Sidebar.tsx`
```typescript
// Linha 45 - Filtra admin items
if (item.admin && profile?.role !== 'admin') {
    return null  // ❌ "Usuários" sumirá se profile=null
}
```

Quando `profile` é `null`, a sidebar inteira ainda renderiza, mas o menu pode parecer quebrado.

#### 3️⃣ **Timeout genérico mascara problemas**
- Linhas 85-90: Se profile não carregar em 8s, força `loading=false`
- Dashboard renderiza com `user=logged, profile=null`
- Aparência de "desconexão"

#### 4️⃣ **Cliente Supabase recriado a cada render**
**Arquivo:** `/src/hooks/use-auth.tsx` linha 37
```typescript
const supabase = useMemo(() => createClient(), [])
```

❌ `useMemo` sem dependências = recria client a cada render
- Cache ineficiente
- Pode perder listeners

---

### Raiz Causa Raiz (RCR)

| Camada | Problema | Efeito |
|--------|----------|--------|
| **Supabase** | Session não persiste corretamente | Refresh perde autenticação |
| **Auth Hook** | `onAuthStateChange` não aguarda profile | Profile fica null |
| **Sidebar** | Renderiza mesmo com profile=null | Menu parece desaparecer |
| **SSR/Next.js** | Client-side auth sem middleware | Refresh força revalidação |

---

### Recomendação 2: Solução Completa

#### **Problema Raiz Real:** Falta de Session Middleware
Next.js 13+ com Supabase SSR precisa de:
1. **Server-side session validation**
2. **Middleware de autenticação**
3. **Client-side hydration segura**

---

#### **Solução Proposta: Implementar Supabase SSR Pattern**

**Passo 1: Criar arquivo de cliente com suporte a SSR**

Arquivo: `/src/lib/supabase/server.ts` (novo)
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
            // Handle errors
          }
        },
      },
    }
  )
}
```

**Passo 2: Criar Middleware de autenticação**

Arquivo: `/src/middleware.ts` (novo)
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

  // Verificar sessão
  const { data: { user } } = await supabase.auth.getUser()

  // Proteger /dashboard
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      return NextResponse.redirect(loginUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
}
```

**Passo 3: Refactor useAuth para confiar em SSR**

Arquivo: `/src/hooks/use-auth.tsx` (refatorado)
```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { type Session } from '@supabase/supabase-js'
import { Profile } from '@/types'

interface AuthContextType {
    user: Session['user'] | null
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

let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
    if (!supabaseClient) {
        supabaseClient = createClient()
    }
    return supabaseClient
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<Session['user'] | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        let isMounted = true
        const supabase = getSupabaseClient()

        // 1. Obter sessão atual
        const initAuth = async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()

                if (sessionError) throw sessionError

                if (session?.user && isMounted) {
                    setUser(session.user)

                    // 2. Carregar profile
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .maybeSingle()  // ✅ Mais tolerante que .single()

                    if (!error && data && isMounted) {
                        setProfile(data)
                    } else if (error && isMounted) {
                        console.error('[Auth] Erro ao carregar profile:', error.message)
                        // Profile fica null, mas user permanece logado
                    }
                } else if (isMounted) {
                    setUser(null)
                    setProfile(null)
                }
            } catch (err) {
                if (isMounted) {
                    console.error('[Auth] Erro ao inicializar:', err)
                    setUser(null)
                }
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        initAuth()

        // 3. Listener para mudanças de sessão
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

    const signOut = async () => {
        const supabase = getSupabaseClient()
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        router.push('/login')
    }

    const value = {
        user,
        profile,
        loading,
        isAdmin: profile?.role === 'admin',
        isEditor: profile?.role === 'editor',
        isViewer: profile?.role === 'viewer',
        canEdit: profile?.role === 'admin' || profile?.role === 'editor',
        signOut,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
```

---

#### **Solução Alternativa (Rápida):** Cache Local com Validação

Se SSR middleware é "muito complexo" agora, implementar cache local:

Arquivo: `/src/hooks/use-auth.tsx` (versão modificada)
```typescript
const fetchProfile = async (userId: string) => {
    try {
        // ✅ Tentar ler do cache primeiro
        const cachedProfile = localStorage.getItem(`profile-${userId}`)
        if (cachedProfile) {
            const profile = JSON.parse(cachedProfile)
            setProfile(profile)
            return profile
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle()  // ✅ Menos rígido que .single()

        if (!error && data && isMounted) {
            localStorage.setItem(`profile-${userId}`, JSON.stringify(data))
            setProfile(data)
        } else if (error) {
            console.error('[Auth] Falha ao carregar perfil:', error.message)
        }
    } catch (err) {
        console.error('[Auth] Erro ao buscar perfil:', err)
    }
}
```

---

### Resumo das Recomendações

| Problema | Solução Rápida | Solução Completa | Esforço |
|----------|---|---|---|
| Profile null em refresh | Cache localStorage | Middleware SSR | Médio |
| Timeout genérico | Remover timeout | Real-time listeners | Baixo |
| Client recriado | Usar singleton | Supabase SSR package | Médio |

---

## IMPACTO NO PROJETO

### Tabela 1: Bloqueadores Funcionais

| Feature | Status | Raiz | Impacto |
|---------|--------|------|--------|
| Criar Oportunidade | ❌ BLOQUEADO | Tabela shoppings ausente | Alto - formulário não carrega |
| Dashboard após F5 | ⚠️ FRÁGIL | Session não persiste | Alto - UX ruim, dados somem |
| Menu Usuários | ⚠️ VISÍVEL | Depends on profile load | Médio - aparece/desaparece |
| Login normal | ✅ OK | — | — |

### Tabela 2: Sequência de Correção

| Ordem | Task | Tempo | Bloqueador |
|-------|------|-------|-----------|
| 1 | Criar migration shoppings | 30min | Problema 1 |
| 2 | Atualizar opportunities/new | 1h | Problema 1 |
| 3 | Refactor useAuth com maybeSingle() | 1h | Problema 2 (rápido) |
| 4 | Implementar SSR middleware | 2-3h | Problema 2 (completo) |
| 5 | Testes de sessão | 1h | Validação |

---

## CHECKLIST DE IMPLEMENTAÇÃO

### Problema 1: Shoppings
- [ ] Criar migration SQL com tabela `public.shoppings`
- [ ] Backfill dados de contracts/opportunities
- [ ] Adicionar FKs em contracts e opportunities
- [ ] Atualizar opportunities/new/page.tsx
- [ ] Teste de carregamento de dropdown
- [ ] Teste de criação com shopping válido

### Problema 2: Session
- [ ] Refactor use-auth.tsx (change .single() → .maybeSingle())
- [ ] Testar refresh na página /dashboard
- [ ] Verificar se menu lateral persiste
- [ ] Verificar profile carrega após refresh
- [ ] (Opcional) Implementar SSR middleware completo
- [ ] Teste de logout e re-login

---

## ARQUIVOS CRÍTICOS MAPEADOS

| Arquivo | Propósito | Status |
|---------|-----------|--------|
| `/supabase/migrations/20260222010000_initial_schema.sql` | Schema inicial | OK |
| `/supabase/migrations/20260225000000_schema_evolution.sql` | Evolução (oportunidades) | OK |
| `/src/hooks/use-auth.tsx` | Auth provider | ⚠️ Bugs |
| `/src/app/dashboard/opportunities/new/page.tsx` | Criar oportunidade | ❌ Bloqueado |
| `/src/components/dashboard/Sidebar.tsx` | Menu lateral | ⚠️ Frágil |
| `/src/lib/supabase/client.ts` | Client Supabase | OK |
| `/src/app/layout.tsx` | Root layout | OK |
| `/src/app/dashboard/layout.tsx` | Dashboard layout | OK |

---

## NOTAS ADICIONAIS

### 1. Segurança
- RLS policies já estão implementadas corretamente
- Migration shoppings deve ter RLS policy (veja recomendação)
- SSR middleware melhora segurança de sessão

### 2. Performance
- Tabela shoppings com UNIQUE(company_id, name) previne duplicatas
- Index recomendado em shopping_id em contracts/opportunities
- Cache localStorage reduz requests ao Supabase em dev

### 3. Dados Existentes
- Não há perda de dados ao implementar Opção A
- Backfill automático de valores de shopping_name
- Dados históricos permanecem intactos

---

## PRÓXIMOS PASSOS

1. **Decisão:** Opção A ou Opção B para shoppings?
2. **Planning:** Agendar implementação das correções
3. **Testes:** Validar em environment de staging antes de produção
4. **Deploy:** Executar migrations na sequência recomendada

---

**Análise preparada por:** Claude Code (Agent PM Analysis)
**Data:** 30 de março de 2026
