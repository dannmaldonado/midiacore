# MidiaCore — Product Requirements Document

> **Versão:** 1.0
> **Data:** 2026-02-25
> **Status:** Draft
> **Autor:** Aria (Architect Agent) com base na planilha "Mídias Mall | Lojas Torra"
> **Source:** [Planilha PRD](https://docs.google.com/spreadsheets/d/1SUyxguO5fQjxELBVi8lHFtTHtJETvvHRqCtnrrqLfs4/edit)

---

## 1. Visão do Produto

### Problema

A equipe de Lojas Torra gerencia contratos de mídia em **~22 shopping centers** usando uma planilha Google Sheets. Esse processo é:
- Manual e suscetível a erros
- Sem controle de acesso ou histórico de alterações
- Sem visibilidade de prazos e vencimentos
- Sem workflow de aprovação estruturado
- Sem centralização dos contatos de cada shopping

### Solução

MidiaCore é uma plataforma web profissional que digitaliza e automatiza todo o ciclo de vida dos contratos de mídia da Lojas Torra, com:

- **Dashboard executivo** com KPIs em tempo real
- **Gestão completa de contratos** de mídia física (empenas, totens, placas, etc.)
- **Pipeline de oportunidades** de mídia digital e novas mídias
- **CRM de contatos** segmentado (gerentes internos + MKT de shopping)
- **Workflow de aprovação** com etapas, SLAs e notificações
- **Multi-tenant** para suporte a múltiplas empresas no futuro

---

## 2. Usuários e Personas

### Persona 1: Gestor de Mídia (Lojas Torra)
- **Papel:** Cria e gerencia contratos, oportunidades e contatos
- **Necessidades:** Visão completa de todos os shoppings, alertas de vencimento, acesso a layouts
- **Role no sistema:** `admin` ou `editor`

### Persona 2: Analista de Marketing
- **Papel:** Acompanha oportunidades, atualiza status de social media
- **Necessidades:** Pipeline de oportunidades, contatos dos shoppings
- **Role no sistema:** `editor`

### Persona 3: Diretor/Executivo
- **Papel:** Visão estratégica do portfólio de mídia
- **Necessidades:** Dashboard com KPIs, relatórios executivos
- **Role no sistema:** `viewer`

---

## 3. Requisitos Funcionais

### FR-001: Gestão de Contratos Vigentes

**Descrição:** CRUD completo de contratos de mídia em shopping centers.

**Campos obrigatórios:**
- Shopping (nome do shopping center)
- Vigência (data início + data fim)
- Tipo de negociação (renovação, negociação direta, etc.)
- Propriedades de mídia (lista de mídias: empena, totem, placa, etc.)
- Documentos (URL de contrato/PI/OS)
- Layouts (URL do Google Slides/Drive)
- Status (OK, Pendente de Aprovação, Expirado)
- Orçamentos pendentes
- Comentários/observações

**Critérios de aceite:**
- [ ] Listar contratos com busca por shopping e filtro por status
- [ ] Criar novo contrato com todos os campos
- [ ] Editar contrato existente
- [ ] Visualizar contrato em detalhes (view mode)
- [ ] Alertas visuais para contratos expirando em 30 dias
- [ ] Indicador de contratos com orçamentos pendentes

---

### FR-002: Pipeline de Oportunidades

**Descrição:** Gestão de oportunidades de novas mídias e renovações.

**Campos:**
- Shopping
- Frequência (Semanal, Mensal, Diário)
- Plano de redes sociais (descrição dos conteúdos previstos)
- Novas mídias a contratar
- Programação de eventos
- Status (Em negociação, Aguardando resposta, Mídia Kit pendente, etc.)
- Comentários

**Dados reais da planilha (oportunidades identificadas):**

| Shopping | Frequência | Redes Sociais | Nova Mídia |
|---------|-----------|--------------|-----------|
| Cidade Manoa | Semanal | 1 feed + 3 stories/semana | Aguardando Mídia Kit 2026 |
| Norte Shopping Rio | — | Aguardando reunião | Aguardando Mídia Kit 2026 |
| Várzea Grande Shopping | Semanal | 1-2 stories/semana | Mídia Kit |
| Norte Sul Plaza CG | — | 3 stories/semana | Aguardando Mídia Kit 2026 |
| Pátio Maceió | Mensal | 5 stories mensais | Mídia Kit |
| Cidade Leste Manaus | Diário/Mensal | 1 feed/mês + 3 stories/dia | Aguardando Mídia Kit 2026 |
| Pátio Roraima | Diário | 3 stories/dia + Facebook | Mídia Kit |
| Via Norte Manaus | Semanal | 1 post/semana (em contrato) | Mídia Kit |
| Pátio Belém | Semanal | 1 story/semana | Aguardando Mídia Kit 2026 |
| Pátio Guarulhos | — | Redes sociais sem custo | Aguardando Mídia Kit 2026 |
| Iandê Caucaia | Semanal | Story e feed | Aguardando Mídia Kit 2026 |
| Colombo Parque | — | Aguardando | Mídia Kit |
| Metrópole Ananindeua | — | Aguardando | Mídia Kit |
| Franco da Rocha | Semanal | Redes sociais semanais sem custo | Aguardando Mídia Kit 2026 |

**Critérios de aceite:**
- [ ] Listar oportunidades com filtro por status e shopping
- [ ] Criar/editar oportunidade
- [ ] Indicar oportunidades com "Mídia Kit pendente"
- [ ] Indicar oportunidades com frequência de redes sociais não utilizada

---

### FR-003: CRM de Contatos

**Descrição:** Cadastro centralizado de contatos por shopping, separados por tipo.

**Tipos de contato:**
1. **Gerentes de Loja** (contatos internos da Torra em cada shopping)
2. **MKT Shopping** (contatos de marketing do shopping center)

**Campos:**
- Shopping
- Tipo (Gerente de Loja | MKT Shopping)
- Nome
- Telefone
- Email

**Dados reais (Gerentes de Loja):**

| Shopping | Contato | Telefone | Email |
|---------|---------|---------|-------|
| Via Center Niterói | Raphael De Brito Thome | (11) 91681-8131 | raphael.thome@lojastorra.com.br |
| Colombo Shop | Colombo Park | (41) 3675-5800 | franciele@colomboparkshopping.com.br |
| Franco da Rocha | Paulo Guedes | (11) 4443-0450 | paulo@shoppingfrancodarocha.com.br |
| Assis Shop | Ana - Financeiro | (18) 3323-3325 | financeiro2@assisplazashopping.com.br |
| Maceió Shop | Ingridy Melo | (82) 3311-4444 | ingridy.melo@patioshoppingmaceio.com.br |
| Manaus Shop | Sabrina Ramos | (92) 3042-2027 | ingridy.melo@patioshoppingmaceio.com.br |
| Pátio Roraima | Felipe Ian | (95) 9133-0040 | financeiro2@patiororaimashopping.com.br |
| Pátio Guarulhos | Claudio Fantichele | (11) 99877-2117 | financeiro@shoppingpatioguarulhos.com.br |
| Shop Aricanduva | Cintia Alves | (11) 3444-2061 | cintia.alves@aricanduva.com.br |
| Shop Itaquera | Jessica Florencio | (11) 2040-3648 | jessica.florencio@shoppingitaquera.com.br |
| Shop Ananindeua | Maria | (91) 3346-4904 | financeirosmt@sacavalcante.com.br |
| Via Norte Manaus | Jorge Luis Moraes | (11) 99434-1754 | jorge.moraes@lojastorra.com.br |
| Cidade Leste Manaus | Marcinei Junio Reis | (11) 93216-3264 | marcinei.reis@lojastorra.com.br |
| Manoa Shop | Mariana Seixas | (92) 3638-5472 | contasareceber@shoppingcidadeleste.com.br |
| Norte Shop Rio | Rita De Cassia Oliveira | (11) 97498-7434 | rita.oliveira@lojastorra.com.br |
| Ribeirão Preto | Novo Shopping Ribeirão | (16) 3603-2445 | faturamento@novoshopping.com.br |
| Caucaia Shop | Mikaely Araujo | (85) 3387.1800 | financeiro@iandeshopping.com.br |
| Pavuna Shop | Ruyane De Sousa Rios | (21) 97595-4518 | ruyane.rios@lojastorra.com.br |
| Várzea Grande | Ana Tassia | (65) 3388-0300 | ana.fmartins@safamalls.com.br |
| Pátio Belém | Dayana Cynthia Mangabeira | (11) 97657-7527 | dayana.mangabeira@lojastorra.com.br |
| Norte Sul Plaza CG | Isabel | (18) 99644-0289 | isabel.martins@lojasotorra.com.br |
| D'Avó Mogi 2 | Jailson | (11) 96589-9572 | jaison.oliveira@lojastorra.com.br |

**Critérios de aceite:**
- [ ] Listar contatos com filtro por tipo (Gerente / MKT) e busca por shopping
- [ ] CRUD completo de contatos
- [ ] Exibir contatos agrupados por shopping
- [ ] Link rápido para copiar email/telefone

---

### FR-004: Workflow de Aprovação

**Descrição:** Controle das etapas de aprovação de contratos com SLAs definidos.

**Etapas do Fluxo (baseado na planilha):**

| # | Etapa | SLA | Observação |
|---|-------|-----|-----------|
| 1 | Solicitação da Proposta (Auditoria → MKT Shopping) | 1 dia | — |
| 2 | Proposta MKT Shopping | 7 dias | — |
| 3 | Análise Auditoria | 3 dias | — |
| 4 | Aprovação MKT Torra | 15 dias | — |
| 5 | Jurídico Torra | 30 dias | — |
| 6 | Renovação sem troca de mídia | — | Caminho curto |
| 7 | Renovação com troca de mídia | 15 dias | — |
| 8 | Orçamento produção (c/ retirada 1 ano) | 5 dias | — |
| 9 | Produção e instalação de novas mídias | 10 dias | — |
| 10 | Checking de instalação | — | — |
| 11 | Renovação não autorizada | — | Caminho alternativo |
| 12 | Retirada das mídias | 7 dias | — |

**Critérios de aceite:**
- [ ] Visualizar timeline de aprovação por contrato
- [ ] Avançar/recuar etapas com registro de data/responsável
- [ ] Indicar etapas com SLA vencido
- [ ] Dashboard de aprovações pendentes

---

### FR-005: Dashboard Executivo

**KPIs principais:**
- Total de contratos ativos
- Contratos expirando em 30 dias
- Valor total mensal/anual de mídia gerenciada
- Aprovações pendentes (por etapa)
- Oportunidades em negociação
- Contratos com orçamentos pendentes

**Critérios de aceite:**
- [ ] Cards de KPIs com valores em tempo real
- [ ] Gráfico de distribuição por status de contrato
- [ ] Gráfico de contratos por região/shopping
- [ ] Lista de alertas: vencimentos próximos + aprovações atrasadas

---

## 4. Contratos Vigentes (Dados Reais)

Base de dados inicial a ser importada:

| Shopping | Vigência | Negociação | Propriedades de Mídia | Status |
|---------|---------|-----------|----------------------|--------|
| Norte Sul Plaza Campo Grande MS | 11 meses (01/08/2025–31/07/2026) | Renovação Mídia Inaugural | Portas entradas, panfletagem, balcão cartão, testeira PA, portas elevadores, voicer cancelas | OK |
| Metrópole Ananindeua | 1 ano (01/04/2025–01/04/2026) | Negociação Direta | Empena externa, placa escada rolante, 12 totens digitais | OK |
| Via Center Niterói | 3 anos (01/04/2025–01/04/2028) | 3 anos | 3 Empenas + 1 Topo | OK |
| Via Norte Manaus | 1 ano (10/08/2025–10/08/2026) | 1 ano | Elevador panorâmico, placas estacionamento, placa indicação piso | OK |
| Pátio Guarulhos | 4 anos – Lic. Prefeitura (08/07/2025–08/07/2029) | 4 anos | Lona Outdoor, Placa Estacionamento | OK |
| D'Avó Supermercado Mogi 2 | 1 mês (24/11/2025–23/12/2025) | 1 mês | Escada rolante, adesivo mesa, cancelas, capa alarme, carrinhos, placa entrada | OK |
| Colombo Parque Shopping | Indeterminado | Indeterminado | Aquário, porta, escada rolante | Pendente de Aprovação |

---

## 5. Requisitos Não-Funcionais

| NFR | Requisito |
|-----|----------|
| NFR-01 Performance | Listagens com até 200 registros em < 1s |
| NFR-02 Responsividade | Interface funcional em tablets (1024px+) |
| NFR-03 Segurança | RLS garante isolamento total entre empresas |
| NFR-04 Disponibilidade | SaaS via Vercel/Supabase — 99.9% uptime |
| NFR-05 Auditoria | Timestamps de criação/atualização em todos os registros |

---

## 6. Constraints e Decisões

| CON-01 | Stack permanece Next.js + Supabase |
| CON-02 | Sem app mobile (web responsivo apenas) |
| CON-03 | Auth por email/password (sem OAuth nesta fase) |
| CON-04 | Links de layouts e documentos são URLs externas (Google Drive/Slides) |
| CON-05 | Import de dados da planilha será manual (seed script) |

---

## 7. Roadmap Sugerido

### Fase 1 — Schema + CRUD Core (MVP)
- Schema evolution: campos faltantes em contracts, opportunities, contacts
- CRUD completo de Oportunidades
- CRUD completo de Contatos (com tipos)
- Dashboard KPIs atualizados

### Fase 2 — Workflow + Alertas
- Módulo de Aprovação (timeline de etapas)
- Alertas de vencimento de contratos
- Notificações de SLA de aprovação

### Fase 3 — Import + Polish
- Seed script para importar dados da planilha atual
- Relatórios exportáveis (PDF/Excel)
- Filtros avançados e busca global

---

## Changelog

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 2026-02-25 | 1.0 | PRD inicial baseado na planilha "Mídias Mall | Lojas Torra" | Aria (Architect) |
