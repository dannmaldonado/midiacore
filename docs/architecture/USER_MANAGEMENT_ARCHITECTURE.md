# 🏛️ User Management - Análise Arquitetural

**Data:** 2026-03-04 | **Status:** PRÉ-IMPLEMENTAÇÃO | **Arquiteto:** Aria (Visionary)

---

## EXECUTIVE SUMMARY

**Achado:** User Management está **100% implementado** (CREATE, UPDATE, DELETE) mas **arquiteturalmente MAL POSICIONADO**.

**Problema:**
- ❌ Funcionalidade escondida em "Configurações" (Settings Modal)
- ❌ Baixa discoverabilidade
- ❌ Não segue padrão de navegação principal
- ❌ Conflita com User Profile Modal

**Impacto:** Admin não encontra onde criar/editar usuários → "aparentemente não foi implementado"

---

## CURRENT STATE ANALYSIS

### ✅ O que EXISTE (100% implementado)

#### Backend
```
✅ POST /api/users              → Create user (admin only)
✅ PATCH /api/users             → Update user role (admin only)
✅ DELETE /api/users            → Deactivate user (admin only)
✅ PATCH /api/users/reset-password → Reset password (admin only)
```

#### Frontend
```
✅ UserManagementTable.tsx      → Complete CRUD component
   ├─ Form for creating users (email, full_name, role)
   ├─ Table listing all users
   ├─ Inline role editing
   ├─ Password reset button
   └─ Deactivate button

✅ SettingsModal.tsx            → Contains UserManagementTable
   ├─ Tab: "Meu Perfil"
   └─ Tab: "Usuários" (admin-only, conditional render)

✅ Sidebar.tsx                  → Button "Configurações" opens SettingsModal
```

### ❌ O PROBLEMA ARQUITETURAL

#### Fluxo ATUAL (Confuso):
```
User clicks "Configurações" → Opens Modal
                            ↓
                       SettingsModal
                            ↓
                    Two tabs render
                            ↓
                    Admin-only shows "Usuários"
                            ↓
                    UserManagementTable (finally!)
```

**UX Issue:** 4 clicks/steps to reach User Management
- Click Settings icon
- Wait for modal
- Click "Usuários" tab
- Interact with table

#### Design Issues

| Issue | Severity | Impact |
|-------|----------|--------|
| **Hidden in Modal** | 🔴 HIGH | Users can't find it |
| **Confuses with Profile** | 🟡 MEDIUM | Settings = profile updates, not user admin |
| **Mobile unfriendly** | 🟡 MEDIUM | Modal on small screens is bad UX |
| **No direct navigation** | 🟡 MEDIUM | No sidebar link |
| **Tab pattern wrong** | 🟡 MEDIUM | Settings = user profile, not admin panel |

---

## PROPOSED ARCHITECTURE

### NEW INFORMATION ARCHITECTURE

```
Dashboard (Main Nav)
├── Dashboard
├── Contratos
├── Prazos
├── Oportunidades
├── Contatos
└── [NEW] Usuários ← Direct link for admins
    └── /dashboard/users
        ├── List view (table)
        ├── Create modal
        ├── Edit modal
        └── Reset password modal
```

### Solution: Dedicated User Management Page

#### Option A: Full Page (RECOMMENDED) ✅

```
/dashboard/users (new page)
├── Server-rendered with auth check
├── Admin-only route redirect
├── UserManagementTable as primary content
├── No modal nesting
└── Clear, focused UX
```

**Pros:**
- ✅ Discoverability (visible in nav)
- ✅ Mobile friendly (full width)
- ✅ Deep linking (sharable URL)
- ✅ Follows existing patterns (contracts, opportunities, contacts)
- ✅ Better accessibility

**Cons:**
- Requires new page/route
- Minor refactor of UserManagementTable

#### Option B: Keep Modal + Add Nav Link

```
Sidebar
├── ... existing items ...
└── [NEW] Usuários (admin-only)
    └── Opens SettingsModal with users tab
```

**Pros:**
- ✅ Minimal code changes
- ✅ Reuses modal infrastructure

**Cons:**
- ❌ Modal still not ideal for data management
- ❌ Confuses settings with user admin
- ❌ Mobile UX still poor

---

## ARCHITECTURE DECISION: RECOMMENDATION

### ✅ Implement Option A: Dedicated Page

**Rationale:**

1. **Consistency** - Follows existing pattern:
   - `/dashboard/contracts` → Contracts list
   - `/dashboard/opportunities` → Opportunities list
   - `/dashboard/contacts` → Contacts list
   - `/dashboard/users` → Users list (NEW)

2. **Discoverability** - Sidebar navigation makes it obvious

3. **Scalability** - Can add user details page later:
   - `/dashboard/users/[id]` → User profile/edit

4. **Mobile-first** - Full page better than modal

5. **Accessibility** - Better semantics, routing, bookmarking

---

## IMPLEMENTATION PLAN

### Phase 1: Create User Management Page (1-2 days)

#### 1.1 Create Route
```typescript
// src/app/dashboard/users/page.tsx
'use client'
export default function UsersPage() {
  return <UserManagementPage />  // New component
}
```

#### 1.2 Create Component
```typescript
// src/components/dashboard/UserManagementPage.tsx
'use client'
import { UserManagementTable } from './UserManagementTable'
import { useAuth } from '@/hooks/use-auth'
import { redirect } from 'next/navigation'

export default function UserManagementPage() {
  const { profile } = useAuth()

  // Protect route: admins only
  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-4xl font-black tracking-tight text-slate-900 font-display">
          Usuários
        </h2>
        <p className="text-slate-500 mt-2 font-medium">
          Gerenciar acesso, roles e permissões da equipe.
        </p>
      </div>

      <UserManagementTable />
    </div>
  )
}
```

#### 1.3 Update Sidebar Navigation
```typescript
// src/components/dashboard/Sidebar.tsx
const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: FileText, label: 'Contratos', href: '/dashboard/contracts' },
  { icon: Clock, label: 'Prazos', href: '/dashboard/prazos' },
  { icon: TrendingUp, label: 'Oportunidades', href: '/dashboard/opportunities' },
  { icon: Users, label: 'Contatos', href: '/dashboard/contacts' },
  { icon: Users, label: 'Usuários', href: '/dashboard/users', admin: true }, // NEW
]

// In render:
{menuItems.map((item) => {
  if (item.admin && profile?.role !== 'admin') return null
  // ... render item
})}
```

#### 1.4 Clean Up SettingsModal
```typescript
// src/components/dashboard/SettingsModal.tsx
// Remove "Usuários" tab — keep only "Meu Perfil"
// SettingsModal becomes user profile only (rename? or keep name)
```

### Phase 2: Refactor UserManagementTable (Optional, future)

**Future improvements:**
- Add pagination (if users > 50)
- Add search/filter
- Add bulk actions
- Add user detail modal
- Add audit log

---

## DATA FLOW

### Before (Current)
```
Sidebar
  ↓ click "Configurações"
SettingsModal (isOpen=true)
  ↓ click "Usuários" tab
UserManagementTable
  ↓ click buttons
API calls
```

### After (Proposed)
```
Sidebar (admin-only link)
  ↓ click "Usuários"
UserManagementPage
  ↓ render UserManagementTable
UserManagementTable
  ↓ click buttons
API calls
```

**Improvement:** Direct navigation, no modal nesting, clearer hierarchy.

---

## SECURITY IMPLICATIONS

### Auth Checks (Stay the same)

```typescript
// API routes already have:
✅ auth.getUser() checks
✅ role === 'admin' validation
✅ Self-deactivation prevention
✅ Password validation (8+ chars)
```

### Frontend Route Protection (NEW)

```typescript
// pages/dashboard/users/page.tsx
if (profile?.role !== 'admin') {
  redirect('/dashboard')  // Protect route client-side
}
```

✅ **Defense in depth:** Both API and frontend protect

---

## PERFORMANCE IMPACT

### No negative impact:
- ✅ Same API calls (POST, PATCH, DELETE)
- ✅ Same component rendering
- ✅ No additional database queries
- ✅ UserManagementTable is self-contained

### Potential improvement:
- ✅ Faster load (page vs modal)
- ✅ Better pagination (future)
- ✅ No modal CSS overhead

---

## TESTING STRATEGY

### Unit Tests (UserManagementPage)
```typescript
describe('UserManagementPage', () => {
  it('redirects non-admins to /dashboard', () => {
    // ...
  })

  it('renders UserManagementTable for admins', () => {
    // ...
  })
})
```

### Integration Tests
```typescript
describe('User Management Flow', () => {
  it('admin can create user via /dashboard/users', () => {
    // 1. Navigate to /dashboard/users
    // 2. Fill form
    // 3. Click Create
    // 4. Verify API called
    // 5. Verify table updated
  })

  it('non-admin cannot access /dashboard/users', () => {
    // 1. Login as viewer
    // 2. Try to navigate to /dashboard/users
    // 3. Should redirect to /dashboard
  })
})
```

---

## ROLLOUT PLAN

### Sprint 0 (Immediate - 1 day)
1. Create `/dashboard/users/page.tsx`
2. Create `UserManagementPage.tsx` component
3. Add "Usuários" link to Sidebar (admin-only)
4. Test navigation and auth

### Sprint 1 (Optional - future)
1. Remove "Usuários" tab from SettingsModal
2. Rename SettingsModal → UserProfileModal (semantic clarity)
3. Update tests
4. Deploy

---

## MIGRATION CHECKLIST

- [ ] Create `src/app/dashboard/users/page.tsx`
- [ ] Create `src/components/dashboard/UserManagementPage.tsx`
- [ ] Update `src/components/dashboard/Sidebar.tsx`
- [ ] Add route to `menuItems` with `admin: true` flag
- [ ] Update Sidebar render logic to check admin role
- [ ] Test navigation as admin
- [ ] Test redirect as non-admin
- [ ] Update tests in `/tests/`
- [ ] Remove "Usuários" from SettingsModal (Phase 2)
- [ ] Deploy to production

---

## RISKS & MITIGATION

| Risk | Likelihood | Mitigation |
|------|------------|-----------|
| Users can't find old location | MEDIUM | Keep redirect from Settings for 1 sprint |
| Deep links break | LOW | No one bookmarks Settings modal |
| Mobile UX breaks | LOW | Page layout is responsive |

---

## CONCLUSION

**Status:** ✅ **User Management is fully implemented but poorly positioned**

**Root Cause:** Architectural decision to put admin features in Settings modal instead of dedicated page

**Solution:** Create `/dashboard/users` page following existing pattern

**Effort:** 1-2 days for Phase 1, minimal code changes

**Impact:** High discoverability, better UX, follows conventions

---

**Approved by:** Aria (Architect) 🏗️
**Date:** 2026-03-04
**Next Step:** Create story/task for implementation
