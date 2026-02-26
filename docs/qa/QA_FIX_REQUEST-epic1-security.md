# QA Fix Request: Epic 1 — Security Hardening (DELETE sem company_id)

**Gerado:** 2026-02-25
**Stories Afetadas:** 1.2, 1.3, 1.4
**Reviewer:** Quinn (@qa — Test Architect)
**Prioridade:** MEDIUM (não bloqueante — mitigado por RLS no banco)

---

## Instruções para @dev

Corrija APENAS os issues listados abaixo. Não adicione features nem refatore código não relacionado.

**Processo:**
1. Ler cada issue com atenção
2. Aplicar o fix exato descrito
3. Verificar usando os passos de verificação
4. Marcar o issue como fixed neste documento
5. Executar `npm run build` e `npm run lint` antes de marcar completo

---

## Resumo

| Severidade | Qtd | Status |
|------------|-----|--------|
| CRITICAL   | 0   | —      |
| MEDIUM     | 3   | Deve corrigir antes do próximo release |
| LOW        | 1   | Melhoria opcional |

**Contexto:** As operações de UPDATE em todos os arquivos afetados incluem corretamente `.eq('company_id', profile.company_id)`. Apenas o DELETE está inconsistente. O risco real é baixo pois o Supabase RLS protege no nível do banco, mas a defesa em profundidade a nível de aplicação está faltando.

---

## Issues a Corrigir

### 1. [MEDIUM] DELETE sem company_id em contracts/[id]/page.tsx

**Issue ID:** FIX-EPIC1-SEC-001

**Location:** `src/app/dashboard/contracts/[id]/page.tsx:138`

**Problema:**
```typescript
const { error } = await supabase
    .from('contracts')
    .delete()
    .eq('id', contractId)
    // ↑ falta .eq('company_id', profile.company_id)
```

**Esperado:**
```typescript
const { error } = await supabase
    .from('contracts')
    .delete()
    .eq('id', contractId)
    .eq('company_id', profile.company_id)
```

**Verificação:**
- [ ] Linha corrigida em `src/app/dashboard/contracts/[id]/page.tsx`
- [ ] Padrão alinhado com o UPDATE do mesmo arquivo (linha 116–117)
- [ ] `npm run build` passa sem erros
- [ ] `npm run lint` passa sem erros

**Status:** [x] Fixed — adicionado `.eq('company_id', profile.company_id)` + guard `if (!profile?.company_id) return`

---

### 2. [MEDIUM] DELETE sem company_id em opportunities/[id]/page.tsx

**Issue ID:** FIX-EPIC1-SEC-002

**Location:** `src/app/dashboard/opportunities/[id]/page.tsx:122`

**Problema:**
```typescript
const { error } = await supabase
    .from('opportunities')
    .delete()
    .eq('id', opportunityId)
    // ↑ falta .eq('company_id', profile.company_id)
```

**Esperado:**
```typescript
const { error } = await supabase
    .from('opportunities')
    .delete()
    .eq('id', opportunityId)
    .eq('company_id', profile.company_id)
```

**Verificação:**
- [ ] Linha corrigida em `src/app/dashboard/opportunities/[id]/page.tsx`
- [ ] Padrão alinhado com o UPDATE do mesmo arquivo (linha 99–100)
- [ ] `npm run build` passa sem erros
- [ ] `npm run lint` passa sem erros

**Status:** [x] Fixed — adicionado `.eq('company_id', profile.company_id)` + guard `if (!profile?.company_id) return`

---

### 3. [MEDIUM] DELETE sem company_id em contacts/[id]/page.tsx

**Issue ID:** FIX-EPIC1-SEC-003

**Location:** `src/app/dashboard/contacts/[id]/page.tsx:103`

**Problema:**
```typescript
const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId)
    // ↑ falta .eq('company_id', profile.company_id)
```

**Esperado:**
```typescript
const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId)
    .eq('company_id', profile.company_id)
```

**Verificação:**
- [ ] Linha corrigida em `src/app/dashboard/contacts/[id]/page.tsx`
- [ ] Padrão alinhado com o UPDATE do mesmo arquivo (linha 83–84)
- [ ] `npm run build` passa sem erros
- [ ] `npm run lint` passa sem erros

**Status:** [x] Fixed — adicionado `.eq('company_id', profile.company_id)` + guard `if (!profile?.company_id) return`

---

### 4. [LOW] copyToClipboard sem error handling em contacts/page.tsx

**Issue ID:** FIX-EPIC1-SEC-004

**Location:** `src/app/dashboard/contacts/page.tsx:54`

**Problema:**
```typescript
const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)  // ← sem try/catch
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
}
```
Se `clipboard.writeText` falhar (permissão negada, contexto não-seguro), o usuário não recebe nenhum feedback.

**Esperado:**
```typescript
const copyToClipboard = async (text: string, field: string) => {
    try {
        await navigator.clipboard.writeText(text)
        setCopied(field)
        setTimeout(() => setCopied(null), 2000)
    } catch {
        // Clipboard API indisponível — silencioso é aceitável em dev
    }
}
```

**Verificação:**
- [ ] try/catch adicionado em `contacts/page.tsx`
- [ ] `npm run lint` passa sem erros (sem variável de erro não usada)

**Status:** [x] Fixed — try/catch adicionado

---

## Constraints

**CRÍTICO: @dev deve seguir estas regras:**

- [ ] Corrigir APENAS os issues listados acima
- [ ] NÃO adicionar novas features
- [ ] NÃO refatorar código não relacionado
- [ ] Executar `npm run build` antes de marcar completo
- [ ] Executar `npm run lint` antes de marcar completo
- [ ] Atualizar a File List nas stories 1.2, 1.3 e 1.4 se houver alterações

---

## Após Corrigir

1. Marcar cada issue como `[x] Fixed` neste documento
2. Atualizar o Change Log nas stories afetadas (1.2, 1.3, 1.4)
3. Retornar para QA: `@qa *review epic1-security`

---

_Gerado por Quinn (Test Architect) — AIOS QA System_
