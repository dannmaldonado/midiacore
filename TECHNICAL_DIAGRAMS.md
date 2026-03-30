# Diagramas Técnicos - Análise Estrutural

## Diagrama 1: Estado Atual vs Estado Esperado (Shoppings)

### ATUAL (Problema):
```
opportunities.new/page.tsx
           ↓
    .from('shoppings')  ← ❌ TABELA NÃO EXISTE
           ↓
        ERROR → setError("Erro ao carregar...")
           ↓
   Dropdown fica vazio/desabilitado
           ↓
   Usuário não consegue criar oportunidade
```

### ESPERADO (Solução A):
```
opportunities.new/page.tsx
           ↓
    .from('shoppings')  ← ✅ TABELA EXISTE
           ↓
   Query: SELECT id, name FROM shoppings
           ↓
   [{ id: uuid1, name: "Shopping A" }, ...]
           ↓
   Dropdown carregado com opções
           ↓
   Usuário seleciona e cria oportunidade
           ↓
   INSERT em opportunities com shopping_id (FK)
```

---

## Diagrama 2: Fluxo de Autenticação (Atual - Problema)

### Cenário: Usuário faz Login → F5 (Refresh)

```
┌─────────────────────────────────────────────────────┐
│ 1. PRIMEIRA VISITA (funciona)                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Browser: GET /dashboard                           │
│       ↓                                             │
│  AuthProvider monta                                │
│       ↓                                             │
│  onAuthStateChange dispara                         │
│       ↓                                             │
│  Session encontrada (localStorage Supabase)        │
│       ↓                                             │
│  currentUser = session.user ✅                      │
│       ↓                                             │
│  fetchProfile(currentUser.id)                      │
│       ↓                                             │
│  SELECT * FROM profiles WHERE id = $1              │
│       ↓                                             │
│  profile = { id, company_id, role... } ✅           │
│       ↓                                             │
│  Sidebar renderiza com menu                        │
│       ↓                                             │
│  Dashboard mostra dados ✅                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────┐
│ 2. APÓS F5 (Refresh) - PROBLEMA                     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Browser: F5 → GET /dashboard                       │
│       ↓                                              │
│  AuthProvider re-monta (reset state)                │
│       ↓                                              │
│  [user=null, profile=null, loading=true]            │
│       ↓                                              │
│  onAuthStateChange dispara                          │
│       ↓                                              │
│  ⚠️ RACE CONDITION:                                  │
│    - Session ainda "stale" em localStorage          │
│    - Supabase.auth.getSession() demora 100-200ms    │
│    - Callback pode não disparar imediatamente       │
│       ↓                                              │
│  [8 segundo timeout começa]                         │
│       ↓                                              │
│  Se profile fetch falhar:                           │
│    → profile = null (erro ignorado)                 │
│       ↓                                              │
│  [Timeout de 8s expira]                             │
│       ↓                                              │
│  setLoading(false) mesmo com profile=null           │
│       ↓                                              │
│  Dashboard renderiza com:                           │
│    - user = logged ✅                               │
│    - profile = null ❌                              │
│       ↓                                              │
│  Sidebar tenta renderizar                           │
│    if (item.admin && profile?.role !== 'admin')     │
│    → profile é null, então...                       │
│    → Menu visível MAS dados vazios                  │
│       ↓                                              │
│  Usuário vê: "Menu desapareceu" ❌                   │
│  (na verdade: ficou sem dados)                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Diagrama 3: Race Condition Detalhada

```
Timeline (em ms):

T=0ms:
  Browser: F5 key pressed
  → AuthProvider state reset: [user=null, profile=null, loading=true]
  → Render: <Loader2> "Iniciando ambiente seguro..."

T=10ms:
  AuthProvider useEffect dispara
  → supabase.auth.onAuthStateChange() registra listener
  → [listener aguardando...]

T=50ms:
  Timeout de 8000ms iniciado
  → [setTimeout callback agendado para T=8050ms]

T=100ms:
  Supabase detecta sessão (localStorage)
  → onAuthStateChange callback dispara
  → session.user = { id: 'user-123', email: '...' }
  → setUser(currentUser) → render

T=120ms:
  fetchProfile('user-123') chamado
  → SQL query: SELECT * FROM profiles WHERE id = 'user-123'
  ❌ PROBLEMA: RLS policy checka `get_my_company_id()`
     que acessa profiles novamente → deadlock temporal

T=200ms:
  Query ainda pendente (esperando RLS)
  → render atual: [user=user-123, profile=null, loading=true]

T=300ms:
  Query retorna erro ou timeout
  → catch (error) → console.error (erro ignorado)
  → setProfile não é chamado
  → profile continua null

T=400ms:
  setLoading(false) é chamado ⚠️
  → render: [user=user-123, profile=null, loading=false]
  → Dashboard renderiza Sidebar

T=420ms:
  Sidebar renderiza:
  → profile?.role está undefined (profile=null)
  → item.admin checks: profile?.role !== 'admin'
    → (null)?.role = undefined
    → undefined !== 'admin' = true ✅ (logicamente correto)
    → MAS visualmente: menu item desaparece

T=8050ms:
  Timeout callback dispara
  → setLoading(false) chamado NOVAMENTE (redundante)
  → Estado já estava loading=false
  → Sem mudança visível

RESULTADO: Usuário vê menu "desaparecer" porque profile=null
```

---

## Diagrama 4: Estrutura de Banco de Dados Atual

```
auth.users (Supabase Auth)
    ↓ (FK: id)
    ↓
public.profiles
    ├─ id (FK → auth.users)
    ├─ company_id (FK → companies)
    ├─ role
    └─ email

public.companies
    ├─ id
    ├─ company_name
    └─ type

public.contracts
    ├─ id
    ├─ company_id (FK → companies)
    ├─ shopping_name (TEXT) ❌ DENORMALIZADO
    ├─ media_type
    └─ ... mais campos

public.opportunities
    ├─ id
    ├─ company_id (FK → companies)
    ├─ shopping_name (TEXT) ❌ DENORMALIZADO
    ├─ stage
    └─ ... mais campos

❌ FALTANDO:
public.shoppings
    ├─ id
    ├─ company_id (FK → companies)
    ├─ name
    └─ ... metadata
```

---

## Diagrama 5: Estrutura Após Solução A

```
public.shoppings (NOVA TABELA)
    ├─ id (PK)
    ├─ company_id (FK → companies) ✅
    ├─ name (TEXT)
    ├─ location (TEXT)
    ├─ contact_person (TEXT)
    └─ created_at

public.contracts
    ├─ id
    ├─ company_id (FK → companies)
    ├─ shopping_id (FK → shoppings) ✅ NOVO
    ├─ shopping_name (TEXT) [LEGACY - pode ser removido depois]
    └─ ... mais campos

public.opportunities
    ├─ id
    ├─ company_id (FK → companies)
    ├─ shopping_id (FK → shoppings) ✅ NOVO
    ├─ shopping_name (TEXT) [LEGACY - pode ser removido depois]
    └─ ... mais campos

RESULTADO:
✅ Dados normalizados
✅ Reutilização de lista shoppings
✅ FKs garantem integridade
✅ Fácil adicionar metadados
```

---

## Diagrama 6: Fluxo de Solução SSR (Problema 2)

### ANTES (Atual - Client-Side Only):

```
┌─────────────────────────────────────────┐
│ Browser                                 │
│  ↓                                      │
│  GET /dashboard                         │
│  ↓                                      │
│  ❌ Sem validação de sessão no servidor │
│  ↓                                      │
│  Page renderiza (SSR)                   │
│  ↓                                      │
│  JavaScript hidrata                     │
│  ↓                                      │
│  useEffect → AuthProvider               │
│  ↓                                      │
│  Race condition (descrito acima)        │
│  ↓                                      │
│  Dados podem desaparecer                │
└─────────────────────────────────────────┘
```

### DEPOIS (Com SSR Middleware):

```
┌──────────────────────────────────────────────┐
│ Browser                                      │
│  ↓                                           │
│  GET /dashboard                              │
│  ↓                                           │
│  Middleware verifica sessão                  │
│  ├─ Se não autenticado → redirect /login     │
│  └─ Se autenticado → continua                │
│  ↓                                           │
│  Page renderiza (SSR) com dados já validados │
│  ↓                                           │
│  Dados passados como props                   │
│  ↓                                           │
│  JavaScript hidrata (sem race condition)     │
│  ↓                                           │
│  useAuth lê dados já validados               │
│  ↓                                           │
│  Refresh (F5) revalida no middleware         │
│  ↓                                           │
│  Dados NUNCA desaparecem                     │
└──────────────────────────────────────────────┘
```

---

## Diagrama 7: Sequência de Requisições (useAuth atual)

```
Timeline:

T=0:   useEffect() dispara
       ├─ onAuthStateChange() registrado
       └─ setTimeout(8000) agendado

T=100: Supabase notifica: "session found"
       ├─ callback: (event, session)
       ├─ setUser(session.user)
       ├─ fetchProfile(session.user.id)
       │   └─ SELECT * FROM profiles WHERE id = $1
       │       ├─ Aguarda RLS validation
       │       ├─ [PROBLEMA: RLS talvez não esteja cachado]
       │       └─ [PROBLEMA: .single() é rígido, falha se 0 rows]
       └─ (neste ponto: profile ainda está carregando)

T=300: Profile retorna erro
       ├─ catch (err) → console.error() [silenciosamente ignorado]
       ├─ setProfile NÃO é chamado
       └─ profile permanece null

T=350: Render dispara com [user=logged, profile=null, loading=true]

T=400: setLoading(false) é chamado
       └─ Render final: [user=logged, profile=null, loading=false]

T=8050: setTimeout callback dispara
        └─ setLoading(false) [redundante]

RESULTADO: Sidebar renderiza sem profile, menu some
```

---

## Diagrama 8: Ciclo de Vida (useAuth Refatorado)

```
┌────────────────────────────────────────────┐
│ AuthProvider Mount                          │
├────────────────────────────────────────────┤
│                                            │
│  1. getSession() chamado                   │
│     ├─ Se session existe                   │
│     │  ├─ setUser(session.user)            │
│     │  ├─ fetchProfile() com maybeSingle() │
│     │  └─ profile carregado                │
│     └─ Else                                │
│        └─ setUser(null), setProfile(null)  │
│                                            │
│  2. listener: onAuthStateChange() registro │
│                                            │
│  3. Render: [user, profile, loading=false] │
│                                            │
├────────────────────────────────────────────┤
│ User Action: Logout                        │
├────────────────────────────────────────────┤
│                                            │
│  onAuthStateChange callback:               │
│    (event='SIGNED_OUT', session=null)      │
│    ├─ setUser(null)                        │
│    ├─ setProfile(null)                     │
│    └─ Redirect /login                      │
│                                            │
├────────────────────────────────────────────┤
│ User Refresh (F5) no Dashboard             │
├────────────────────────────────────────────┤
│                                            │
│  1. Page remonta (SSR com middleware)      │
│  2. Middleware já validou sessão           │
│  3. useEffect dispara getSession()         │
│     ├─ Session ainda válido                │
│     ├─ fetchProfile() sucede               │
│     └─ Render: [user, profile, loading=f]  │
│                                            │
│  ✅ DADOS NÃO DESAPARECEM                  │
│                                            │
└────────────────────────────────────────────┘
```

---

## Diagrama 9: RLS Policy Validation Flow

```
Query: SELECT * FROM profiles WHERE id = 'user-123'

┌────────────────────────────────────────────┐
│ RLS Policy Check                           │
├────────────────────────────────────────────┤
│                                            │
│  CREATE POLICY "Users can view..."         │
│  USING (company_id = get_my_company_id())  │
│                                            │
│  get_my_company_id() executa:              │
│    SELECT company_id                       │
│    FROM profiles                           │
│    WHERE id = auth.uid()  ← [NESTED QUERY] │
│                                            │
│  ⚠️ PROBLEMA:                              │
│  - Nested query pode ser lenta             │
│  - Se profile row não existe ainda → null  │
│  - Cache de sessão pode estar stale       │
│                                            │
│  ✅ SOLUÇÃO:                               │
│  - Adicionar índice em profiles(id)        │
│  - Usar cache em memory (redis) futura     │
│  - Validar session antes via middleware    │
│                                            │
└────────────────────────────────────────────┘
```

---

## Diagrama 10: Checklist de Implementação Visual

```
PROBLEMA 1: Tabela Shoppings
┌─────────────────────────────────┐
│ [x] Identificar tabela ausente  │
│ [x] Mapear dados existentes     │
│ [ ] Decidir Opção A ou B        │
│ [ ] Criar migration SQL         │
│ [ ] Testar backfill de dados    │
│ [ ] Atualizar frontend code     │
│ [ ] Testar dropdown em form     │
│ [ ] Deploy em staging           │
│ [ ] Deploy em produção          │
└─────────────────────────────────┘

PROBLEMA 2: Session Desaparece
┌─────────────────────────────────┐
│ [x] Identificar race condition  │
│ [x] Analisar useAuth hook       │
│ [ ] Refactor maybeSingle()      │
│ [ ] Testar refresh no dashboard │
│ [ ] Validar menu persiste       │
│ [ ] (Opcional) SSR middleware   │
│ [ ] Testes automatizados        │
│ [ ] Deploy em staging           │
│ [ ] Deploy em produção          │
└─────────────────────────────────┘
```

---

## Diagrama 11: Matriz de Decisão (Shoppings)

```
                    │ Opção A (SQL) │ Opção B (Code)
─────────────────────┼───────────────┼────────────────
Tempo Implementação  │ ~45 min       │ ~15 min
Performance         │ ⭐⭐⭐⭐⭐      │ ⭐⭐⭐
Escalabilidade      │ ⭐⭐⭐⭐⭐      │ ⭐⭐
Dados Normalizados  │ ✅            │ ❌
Metadados Futuro    │ ✅ Fácil      │ ❌ Difícil
Tech Debt           │ Mínimo        │ Alto
Recomendação        │ ✅ PREFERIDA  │ Temporária
```

---

## Diagrama 12: Timeline de Deployment

```
SEMANA 1:
├─ Dia 1-2: Code review desta análise
├─ Dia 3: Decisão Opção A vs B
├─ Dia 4-5: Implementar Problema 1
└─ Dia 6: Testes P1 em staging

SEMANA 2:
├─ Dia 1-2: Implementar Problema 2
├─ Dia 3-4: Testes P2 em staging
├─ Dia 5: Testes integrados
└─ Fim: Deploy em produção

TOTAL: ~10-12 dias de desenvolvimento
```

---

**Gerado por:** Claude Code (PM Agent)
**Data:** 30 de março de 2026
