# QA Fix Request — Spinner Infinito em Formulários

**Status:** FAIL
**Severity:** HIGH
**Impact:** Forma de criação de propostas/contratos travada em estado de loading indefinido
**Reported by:** Quinn (QA Agent)
**Date:** 2026-03-30

---

## 🔴 Problema

Ao tentar criar uma nova **Proposta** ou **Contrato**, o formulário fica com o spinner girando infinitamente, sem nunca completar o salvamento. O usuário não consegue nem voltar para a lista.

**Sintomas:**
- ✗ Clica em "Criar Oportunidade" / "Salvar Contrato"
- ✗ Spinner começa a girar
- ✗ Spinner nunca para
- ✗ Nenhuma mensagem de erro aparece
- ✗ Sem logs no console do navegador

---

## 🎯 Root Cause

**Validação prematura de `company_id`** ocorre APÓS `setSaving/setLoading = true`, causando retorno antecipado sem resetar o estado de loading.

### Arquivo 1: `src/app/dashboard/opportunities/new/page.tsx`

**Linha 41-46 (BUG):**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)        // ← Estado muda para true
    setError(null)

    if (!profile?.company_id) return  // ← Retorna SEM resetar setSaving!
    // ... resto do código nunca executa
}
```

**Problema:** Se `profile?.company_id` é falsy, a função retorna antes de chegar ao `finally { setSaving(false) }` na linha 71.

---

### Arquivo 2: `src/app/dashboard/contracts/new/page.tsx`

**Linha 49-55 (MESMO BUG):**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.company_id) return  // ← Retorna antes de setLoading(true)

    setLoading(true)      // ← Nunca reseta se company_id vazio
    setError(null)
    // ... resto do código
}
```

**Problema:** Enquanto o contratos tem a validação antes, a estrutura de erro é a mesma — se houver erro no try/catch que não seja tratado, o `finally` não executa.

---

## ✅ Solução Implementar

### Fix Pattern 1: Validar ANTES de atualizar estado

**Para: `opportunities/new/page.tsx` (linhas 41-73)**

```typescript
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // ✅ VALIDAÇÃO PRIMEIRO (sem alterar estado)
    if (!profile?.company_id) {
        setError('Erro: Perfil incompleto. Contate o administrador.')
        return
    }

    // ✅ DEPOIS atualiza estado
    setSaving(true)
    setError(null)

    try {
        const { error } = await supabase
            .from('opportunities')
            .insert({
                company_id: profile.company_id,
                // ... resto dos campos
            })

        if (error) throw error

        router.push('/dashboard/opportunities')
        router.refresh()
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao criar oportunidade'
        setError(message)
    } finally {
        setSaving(false)  // ✅ SEMPRE executa
    }
}
```

### Fix Pattern 2: Garantir finally sempre executa

**Para: `contracts/new/page.tsx` (linhas 49-87)**

Mesmo padrão:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // ✅ VALIDAÇÃO PRIMEIRO
    if (!profile?.company_id) {
        setError('Erro: Perfil incompleto. Contate o administrador.')
        return
    }

    // ✅ DEPOIS atualiza estado
    setLoading(true)
    setError(null)

    try {
        const { error } = await supabase
            .from('contracts')
            .insert([{ ... }])

        if (error) throw error

        router.push('/dashboard/contracts')
        router.refresh()
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao salvar contrato'
        setError(message)
    } finally {
        setLoading(false)  // ✅ SEMPRE executa
    }
}
```

---

## 📝 Checklist de Implementação

- [ ] **Opportunities form:** Mover validação `!profile?.company_id` ANTES de `setSaving(true)`
- [ ] **Opportunities form:** Adicionar mensagem de erro descritiva para caso de company_id vazio
- [ ] **Contracts form:** Adicionar try-catch robusto garantindo `finally { setLoading(false) }`
- [ ] **Contracts form:** Testar erro de company_id vazio
- [ ] Rodar `npm run lint` e verificar não há erros
- [ ] Rodar `npm run typecheck` e verificar não há erros
- [ ] Testar ambos formulários manualmente:
  - [ ] Tentar criar oportunidade com usuário válido
  - [ ] Tentar criar contrato com usuário válido
  - [ ] Verificar que spinner desaparece após sucesso
  - [ ] Verificar que spinner desaparece após erro

---

## 🧪 Plano de Testes

**Teste 1: Validação de Profile**
```
DADO: Usuário sem company_id
QUANDO: Clica em "Criar Oportunidade"
ENTÃO: Exibe mensagem de erro "Erro: Perfil incompleto..."
E:    Spinner NÃO aparece
E:    Botão continua clicável
```

**Teste 2: Criação com Sucesso**
```
DADO: Usuário com company_id válido
QUANDO: Preenche todos os campos obrigatórios
E:    Clica em "Criar Oportunidade"
ENTÃO: Spinner aparece
E:    Após 2-3s, redireciona para /dashboard/opportunities
E:    Spinner desaparece
```

**Teste 3: Erro de Banco de Dados**
```
DADO: Usuário com company_id válido
QUANDO: Submete formulário com dados válidos
E:    Supabase retorna erro (ex: RLS violation)
ENTÃO: Spinner desaparece
E:    Mensagem de erro aparece no formulário
E:    Botão continua clicável
```

---

## 📊 QA Gate Decision

**VERDICT:** ❌ **FAIL**

**Reason:** Spinner infinito bloqueia fluxo crítico de criação de registros. Ambos formulários afetados.

**Blocking Issues:** 1 (HIGH)

**Next Step:** @dev implementa fixes, volta para re-review após `npm run typecheck` passar.

---

## 📌 Notas para @dev

- Ambos os arquivos seguem o mesmo padrão — trata-se de validação fora de ordem
- A ordem correta é: **Validar → Atualizar Estado → Executar Operação**
- Use `finally { setSaving(false) }` como safety net para sempre resetar loading
- Adicione mensagens de erro descritivas para cada caso de falha

**Relacionados:**
- [`src/app/dashboard/opportunities/new/page.tsx`](file:///Users/danilomaldonado/Documents/AIOS/midiacore/src/app/dashboard/opportunities/new/page.tsx)
- [`src/app/dashboard/contracts/new/page.tsx`](file:///Users/danilomaldonado/Documents/AIOS/midiacore/src/app/dashboard/contracts/new/page.tsx)

---

*Gerado por: Quinn (QA Agent)*
*Assinado em: 2026-03-30*
