# Quick Reference Card - MidiaCore Structural Fix

**Print this or bookmark** for quick access during implementation.

---

## 🚨 THE PROBLEMS

### Problem 1: Shopping Dropdown Broken
```
File:     src/app/dashboard/opportunities/new/page.tsx (line 52)
Error:    Table 'shoppings' does not exist
Impact:   Cannot create opportunities ❌
Fix Time: ~1-2 hours
```

### Problem 2: Data Disappears on Page Refresh
```
File:     src/hooks/use-auth.tsx (line 50)
Cause:    .single() too strict, race condition
Impact:   Data vanishes after F5 ⚠️
Fix Time: ~1 hour
```

---

## ✅ SOLUTION DECISION

| Problem | Option | Time | Recommendation |
|---------|--------|------|-----------------|
| P1 | A (Normalize) | 2h | ✅ PREFERRED |
| P1 | B (Quick) | 30m | Temporary |
| P2 | Quick Fix | 1h | ✅ NOW |
| P2 | SSR (Full) | 3h | Later (v2) |

---

## 🔧 PROBLEM 1: QUICK FIX (Option B)

**If urgent, do this first:**

```typescript
// File: src/app/dashboard/opportunities/new/page.tsx
// Lines 49-67

const loadShoppings = async () => {
    try {
        if (!profile?.company_id) {
            setShoppings([])
            return
        }

        const { data: fromContracts } = await supabase
            .from('contracts')
            .select('shopping_name')
            .eq('company_id', profile.company_id)
            .not('shopping_name', 'is', null)

        const { data: fromOpportunities } = await supabase
            .from('opportunities')
            .select('shopping_name')
            .eq('company_id', profile.company_id)
            .not('shopping_name', 'is', null)

        const names = new Set([
            ...(fromContracts?.map(c => c.shopping_name) || []),
            ...(fromOpportunities?.map(o => o.shopping_name) || [])
        ])

        const uniqueShoppings = Array.from(names)
            .filter(Boolean)
            .sort()
            .map((name, idx) => ({
                id: `shopping-${idx}-${name}`,
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

**Time:** 15 minutes
**Note:** This is TEMPORARY. Plan Option A for next sprint.

---

## 🔧 PROBLEM 1: PROPER FIX (Option A)

**Recommended. Do this instead of B:**

```bash
# 1. Create migration file:
supabase/migrations/20260330_create_shoppings_table.sql
```

```sql
-- Create table
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
    UNIQUE(company_id, name)
);

-- Enable RLS
ALTER TABLE public.shoppings ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Company dynamic access for shoppings"
ON public.shoppings FOR ALL
USING (company_id = public.get_my_company_id())
WITH CHECK (company_id = public.get_my_company_id());

-- Indexes
CREATE INDEX idx_shoppings_company_id ON public.shoppings(company_id);
CREATE INDEX idx_shoppings_name ON public.shoppings(name);

-- Backfill data
INSERT INTO public.shoppings (company_id, name)
SELECT DISTINCT company_id, shopping_name
FROM public.contracts
WHERE shopping_name IS NOT NULL AND shopping_name != ''
ON CONFLICT (company_id, name) DO NOTHING;

INSERT INTO public.shoppings (company_id, name)
SELECT DISTINCT company_id, shopping_name
FROM public.opportunities
WHERE shopping_name IS NOT NULL AND shopping_name != ''
ON CONFLICT (company_id, name) DO NOTHING;

-- Add FKs
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS shopping_id UUID REFERENCES public.shoppings(id) ON DELETE SET NULL;

ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS shopping_id UUID REFERENCES public.shoppings(id) ON DELETE SET NULL;

-- Populate FKs
UPDATE public.contracts c
SET shopping_id = (
    SELECT id FROM public.shoppings s
    WHERE s.company_id = c.company_id AND s.name = c.shopping_name LIMIT 1
)
WHERE c.shopping_name IS NOT NULL;

UPDATE public.opportunities o
SET shopping_id = (
    SELECT id FROM public.shoppings s
    WHERE s.company_id = o.company_id AND s.name = o.shopping_name LIMIT 1
)
WHERE o.shopping_name IS NOT NULL;
```

```bash
# 2. Apply migration
supabase migration up
```

```typescript
// 3. Update frontend (opportunities/new/page.tsx, lines 49-67)

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

**Time:** ~1.5 hours
**Quality:** ⭐⭐⭐⭐⭐
**Recommended:** YES ✅

---

## 🔧 PROBLEM 2: QUICK FIX (All You Need)

**File:** `src/hooks/use-auth.tsx`

### Change 1: Line 50
```typescript
// BEFORE:
.single()

// AFTER:
.maybeSingle()
```

### Change 2: Lines 85-90 (REMOVE)
```typescript
// BEFORE:
timeoutId = setTimeout(() => {
    if (isMounted) {
        console.warn('[Auth] Timeout ao aguardar sessão')
        setLoading(false)
    }
}, 8000)

// AFTER:
// Delete this entirely - onAuthStateChange will handle it
```

### Change 3: Add cache (optional, recommended)
```typescript
const fetchProfile = async (userId: string) => {
    try {
        // ADD THIS:
        const cacheKey = `profile-${userId}`
        const cachedProfile = localStorage.getItem(cacheKey)
        if (cachedProfile) {
            try {
                const profile = JSON.parse(cachedProfile)
                if (isMounted) setProfile(profile)
                return
            } catch {
                // Cache corrupted, continue
            }
        }
        // END ADD

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle()

        if (!error && data && isMounted) {
            localStorage.setItem(cacheKey, JSON.stringify(data))  // ADD THIS
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

### Change 4: Clear cache on logout
```typescript
// In signOut function, add:
const { data: { user } } = await supabase.auth.getUser()
if (user?.id) {
    localStorage.removeItem(`profile-${user.id}`)
}
```

**Time:** 30 minutes
**Quality:** ⭐⭐⭐⭐
**Recommended:** YES ✅

---

## ✅ TEST CHECKLIST

### Problem 1 (Shoppings)
```
□ npm run dev
□ Go to http://localhost:3000/dashboard/opportunities/new
□ Dropdown loads with shopping list
□ Can select a shopping
□ Submit creates opportunity with shopping_id
□ Check Supabase: SELECT * FROM opportunities ORDER BY created_at DESC LIMIT 1;
```

### Problem 2 (Session)
```
□ Login: http://localhost:3000/login
□ Dashboard loads with menu
□ Press F5
□ Menu persists
□ Data still visible
□ Wait 2 seconds (should load from cache)
□ Sidebar "Usuários" still visible
```

---

## 📊 TIME ESTIMATE

| Task | Time | Status |
|------|------|--------|
| Read EXEC_SUMMARY.md | 15m | Before dev |
| Decision making | 15m | Before dev |
| Problem 1 (Option A) | 1.5h | Dev |
| Problem 2 (Quick Fix) | 0.5h | Dev |
| Testing local | 0.5h | Dev+QA |
| Testing staging | 0.5h | QA |
| **TOTAL** | **~3.5h** | |
| Plus buffer | 1h | Safety |
| **With buffer** | **4.5h** | |

**Implementation date:** Same day (morning to afternoon)

---

## 🚀 DEPLOYMENT STEPS

```bash
# 1. Finish implementation and local testing
npm run lint
npm run typecheck
npm test

# 2. Test in staging
# (staging deployment process)

# 3. If OK, deploy to production
# (production deployment process)

# 4. Monitor for 1-2 hours
# Check error logs, user feedback

# 5. If issues, rollback (have migration down prepared)
supabase migration down
```

---

## 📞 ESCALATION

**If stuck:**
1. Check IMPLEMENTATION_GUIDE.md → TROUBLESHOOTING section
2. Check STRUCTURAL_ANALYSIS.md for context
3. Ask for code review from @architect
4. Check Supabase logs for permission errors

**If Problem 1 migration fails:**
- Don't panic, it's idempotent (can retry)
- Check Supabase SQL Editor for error message
- Migration should have no `DROP` statements (safe to re-run)

**If Problem 2 session still broken:**
- Implement SSR middleware (see IMPLEMENTATION_GUIDE.md → Fase 2, Solução 2)
- Takes ~3 more hours but more robust

---

## 📝 COMMIT MESSAGE TEMPLATE

```bash
git commit -m "fix: normalize shoppings table and fix session persistence

- Create public.shoppings table with RLS and indexes
- Backfill existing shopping data from contracts/opportunities
- Update opportunities form to load from shoppings
- Change useAuth.single() to .maybeSingle()
- Add localStorage cache for profile to prevent disappearing on refresh
- Solves #ISSUE_NUMBER

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## 🔗 FULL DOCUMENTATION

All detailed info in these files:

1. **ANALYSIS_INDEX.md** - Navigation guide
2. **EXECUTIVE_SUMMARY.md** - 10-minute overview
3. **STRUCTURAL_ANALYSIS.md** - Technical deep dive
4. **IMPLEMENTATION_GUIDE.md** - Step-by-step instructions
5. **TECHNICAL_DIAGRAMS.md** - Visual explanations

---

**Generated:** March 30, 2026
**For:** @dev, @qa, @pm
**Status:** Ready to implement ✅

