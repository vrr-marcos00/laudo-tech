# Laudo Tech — Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** App web para geração automatizada de laudos técnicos elétricos (NR-10), com cadastro de clientes, engenheiros, catálogo de NRs, anotação de fotos e geração de PDF conforme ABNT.

**Architecture:** Backend REST em Spring Boot 3 + PostgreSQL; frontend Next.js 14 (App Router) + TypeScript. PDF gerado no backend com iText7. Fotos armazenadas via MinIO (S3-compatible). Autenticação JWT multi-engenheiro.

**Tech Stack:** Java 21, Spring Boot 3.3, PostgreSQL 16, Flyway, iText7, MinIO SDK, Next.js 14, TypeScript, Tailwind CSS, Shadcn/UI, Fabric.js, TanStack Query v5, React Hook Form + Zod, Docker Compose.

## Global Constraints
- Java 21, Spring Boot 3.3.x, Maven
- Node 20+, Next.js 14 App Router
- PostgreSQL 16 via Docker
- MinIO via Docker (porta 9000)
- Backend porta 8080, Frontend porta 3000
- Todos os endpoints REST prefixados com `/api/v1`
- JWT Bearer token para autenticação
- CORS habilitado para `http://localhost:3000`

---

## Database Schema

```sql
firma (id, nome, cnpj, email, telefone, logo_url, created_at)
engenheiro (id, firma_id, nome, crea, titulo_profissional, email, telefone, logo_url, assinatura_url, senha_hash, ativo, created_at)
cliente (id, firma_id, cnpj, nome, descricao, email, telefone, endereco, cidade, estado, cep, foto_url, created_at)
nr_catalogo (id, numero_nr, artigo, titulo, descricao, solucao_padrao, prioridade[CRITICO/ALTO/MEDIO/BAIXO], created_at)
modelo_laudo (id, firma_id, nome, descricao, created_at)
modelo_topico (id, modelo_id, titulo, conteudo, ordem)
laudo (id, firma_id, engenheiro_id, cliente_id, modelo_id, status[RASCUNHO/EM_REVISAO/ASSINADO/ENTREGUE], numero_art, data_visita, data_emissao, quem_acompanhou, versao, created_at, updated_at)
laudo_topico (id, laudo_id, titulo, conteudo, ordem)
area_inspecao (id, laudo_id, nome, descricao, ordem)
foto (id, area_id, url, nome_arquivo, ordem)
ponto_anotacao (id, foto_id, numero, x_pct DECIMAL, y_pct DECIMAL)
ponto_nr (id, ponto_id, nr_catalogo_id, solucao_especifica TEXT)
laudo_historico (id, laudo_id, engenheiro_id, status_anterior, status_novo, observacao, created_at)
```

---

## Task 1: Infrastructure — Docker Compose + Backend Scaffold

**Files:**
- Create: `docker-compose.yml`
- Create: `backend/pom.xml`
- Create: `backend/src/main/resources/application.yml`
- Create: `backend/src/main/java/com/laudotech/LaudoTechApplication.java`

- [ ] Criar `docker-compose.yml` com PostgreSQL e MinIO
- [ ] Criar projeto Spring Boot com dependências: web, data-jpa, security, flyway, lombok, mapstruct, postgresql driver, iText7, MinIO SDK, jjwt
- [ ] Criar `application.yml` com datasource, flyway, minio, jwt config
- [ ] Verificar que backend sobe: `mvn spring-boot:run`

## Task 2: Frontend Scaffold

**Files:**
- Create: `frontend/` (Next.js 14 + TypeScript + Tailwind + Shadcn)
- Create: `frontend/src/lib/api.ts` — Axios instance com baseURL e interceptor JWT
- Create: `frontend/src/types/index.ts` — todos os tipos TypeScript

- [ ] `npx create-next-app@latest frontend --typescript --tailwind --app`
- [ ] Instalar: `shadcn-ui`, `@tanstack/react-query`, `react-hook-form`, `zod`, `@hookform/resolvers`, `fabric`, `axios`, `lucide-react`
- [ ] Inicializar shadcn: `npx shadcn-ui@latest init`
- [ ] Adicionar componentes shadcn: button, input, form, dialog, table, select, textarea, badge, card, tabs, toast, separator
- [ ] Criar `src/lib/api.ts` com Axios + interceptor de token
- [ ] Criar `src/types/index.ts` com interfaces de todos os domínios

## Task 3: Backend — Migrations + Entities + Repositories

**Files:**
- Create: `backend/src/main/resources/db/migration/V1__init.sql`
- Create: uma entity por tabela em `entity/`
- Create: um repository por entity em `repository/`

- [ ] Criar `V1__init.sql` com todo o schema acima
- [ ] Criar entities JPA com Lombok (@Entity, @Data, @Builder, etc.)
- [ ] Criar repositories (JpaRepository)
- [ ] Verificar que Flyway aplica migration ao subir

## Task 4: Backend — Auth (JWT + Engenheiro login)

**Files:**
- Create: `config/SecurityConfig.java`
- Create: `config/JwtConfig.java`
- Create: `service/AuthService.java`
- Create: `controller/AuthController.java`
- Create: `dto/LoginRequest.java`, `dto/LoginResponse.java`

**Endpoints:**
- `POST /api/v1/auth/login` → `{ email, senha }` → `{ token, engenheiro }`

- [ ] Configurar Spring Security (stateless, JWT filter)
- [ ] Implementar `AuthService.login()` que valida senha e gera JWT
- [ ] Implementar `AuthController`
- [ ] Testar: `curl -X POST /api/v1/auth/login -d '{"email":"...","senha":"..."}'`

## Task 5: Backend — Firma + Engenheiro CRUD

**Files:**
- Create: `controller/EngenheiroController.java`
- Create: `service/EngenheiroService.java`
- Create: `dto/EngenheiroDto.java`, `dto/EngenheiroRequest.java`

**Endpoints:**
- `GET /api/v1/engenheiros` — lista da firma autenticada
- `POST /api/v1/engenheiros` — cria engenheiro
- `PUT /api/v1/engenheiros/{id}` — atualiza
- `POST /api/v1/engenheiros/{id}/logo` — upload logo (multipart)
- `POST /api/v1/engenheiros/{id}/assinatura` — upload assinatura

- [ ] Implementar service + controller
- [ ] Implementar `FileStorageService` para upload no MinIO
- [ ] Testar endpoints com curl/Postman

## Task 6: Backend — Cliente CRUD

**Files:**
- Create: `controller/ClienteController.java`
- Create: `service/ClienteService.java`
- Create: `dto/ClienteDto.java`, `dto/ClienteRequest.java`

**Endpoints:**
- `GET /api/v1/clientes` (+ `?search=`)
- `GET /api/v1/clientes/{id}`
- `POST /api/v1/clientes`
- `PUT /api/v1/clientes/{id}`
- `POST /api/v1/clientes/{id}/foto`
- `GET /api/v1/clientes/{id}/laudos` — histórico de inspeções

- [ ] Implementar service + controller
- [ ] Validação de CNPJ no DTO (regex)
- [ ] Testar endpoints

## Task 7: Backend — NR Catálogo CRUD

**Files:**
- Create: `controller/NrCatalogoController.java`
- Create: `service/NrCatalogoService.java`
- Create: `dto/NrCatalogoDto.java`

**Endpoints:**
- `GET /api/v1/nrs` (+ `?search=&prioridade=`)
- `POST /api/v1/nrs`
- `PUT /api/v1/nrs/{id}`
- `DELETE /api/v1/nrs/{id}`

- [ ] Implementar CRUD completo
- [ ] Popular dados iniciais com NRs mais comuns (V2 migration seed)

## Task 8: Backend — Modelo de Laudo CRUD

**Files:**
- Create: `controller/ModeloLaudoController.java`
- Create: `service/ModeloLaudoService.java`
- Create: `dto/ModeloLaudoDto.java`

**Endpoints:**
- `GET /api/v1/modelos`
- `POST /api/v1/modelos`
- `PUT /api/v1/modelos/{id}`
- `DELETE /api/v1/modelos/{id}`
- `GET /api/v1/modelos/{id}/topicos`
- `POST /api/v1/modelos/{id}/topicos`

- [ ] CRUD de modelos + tópicos
- [ ] Seed com 1 modelo padrão NR-10

## Task 9: Backend — Laudo CRUD + Áreas + Workflow de Status

**Files:**
- Create: `controller/LaudoController.java`
- Create: `service/LaudoService.java`
- Create: `dto/LaudoDto.java`, `dto/LaudoRequest.java`, `dto/AreaInspecaoDto.java`

**Endpoints:**
- `GET /api/v1/laudos` (+ filtros: cliente, status, data)
- `GET /api/v1/laudos/{id}`
- `POST /api/v1/laudos` — cria laudo (pode partir de modelo)
- `PUT /api/v1/laudos/{id}` — atualiza dados gerais
- `PATCH /api/v1/laudos/{id}/status` — transição de status
- `GET /api/v1/laudos/{id}/areas`
- `POST /api/v1/laudos/{id}/areas`
- `PUT /api/v1/laudos/{id}/areas/{areaId}`
- `DELETE /api/v1/laudos/{id}/areas/{areaId}`
- `GET /api/v1/laudos/{id}/topicos`
- `PUT /api/v1/laudos/{id}/topicos` — salva lista de tópicos

- [ ] Implementar criação de laudo a partir de modelo (copia tópicos)
- [ ] Implementar máquina de estados de status com validação de transições
- [ ] Gravar histórico em `laudo_historico` a cada mudança de status

## Task 10: Backend — Fotos + Anotações

**Files:**
- Create: `controller/FotoController.java`
- Create: `service/FotoService.java`
- Create: `dto/FotoDto.java`, `dto/PontoAnotacaoDto.java`

**Endpoints:**
- `POST /api/v1/laudos/{id}/areas/{areaId}/fotos` — upload foto (multipart)
- `DELETE /api/v1/fotos/{fotoId}`
- `PUT /api/v1/fotos/{fotoId}/ordem`
- `GET /api/v1/fotos/{fotoId}/pontos`
- `POST /api/v1/fotos/{fotoId}/pontos` — salva lista de pontos com NRs

**PontoAnotacaoRequest:** `{ numero, xPct, yPct, nrs: [{ nrCatalogoId, solucaoEspecifica }] }`

- [ ] Upload foto para MinIO, salvar URL no banco
- [ ] CRUD de pontos de anotação
- [ ] Auto-numerar pontos por foto (1, 2, 3...)

## Task 11: Backend — Geração de PDF (iText7)

**Files:**
- Create: `service/PdfGeneratorService.java`
- Create: `controller/PdfController.java`

**Endpoints:**
- `GET /api/v1/laudos/{id}/pdf` — retorna PDF como `application/pdf`
- `GET /api/v1/laudos/{id}/preview-data` — retorna JSON com todos os dados para o preview frontend

**Layout PDF (ABNT):**
- Fonte: Times New Roman 12pt, margens 2cm
- Capa: logo engenheiro/firma, título, engenheiro, CREA, cidade, data
- Sumário automático
- Seções com numeração
- Registro Fotográfico: máx 2 fotos por linha, pontos numerados sobrepostos na imagem, tabela abaixo com NR + solução
- Rodapé: número de página, nome do engenheiro, CREA
- Assinatura na última página

- [ ] Configurar iText7 no POM
- [ ] Implementar `PdfGeneratorService.generate(Long laudoId): byte[]`
- [ ] Gerar capa com logo
- [ ] Gerar sumário
- [ ] Gerar seções de tópicos
- [ ] Gerar seção fotográfica (2 por linha, tabela NR)
- [ ] Gerar seção de itens críticos (prioridade=CRITICO)
- [ ] Gerar página de assinatura
- [ ] Endpoint `/pdf` retorna bytes com header `Content-Disposition: attachment`

## Task 12: Frontend — Layout + Auth

**Files:**
- Create: `src/app/layout.tsx` — root layout com providers
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(app)/layout.tsx` — sidebar layout autenticado
- Create: `src/components/sidebar.tsx`
- Create: `src/lib/auth.ts` — funções de login/logout, token storage

- [ ] Layout raiz com QueryClientProvider + Toaster
- [ ] Página de login com form (email + senha)
- [ ] Sidebar com navegação: Dashboard, Clientes, Engenheiros, NRs, Modelos, Laudos
- [ ] Middleware Next.js para proteger rotas `/app/*`
- [ ] Hook `useAuth()` retornando engenheiro logado

## Task 13: Frontend — Clientes

**Files:**
- Create: `src/app/(app)/clientes/page.tsx` — listagem com busca
- Create: `src/app/(app)/clientes/novo/page.tsx`
- Create: `src/app/(app)/clientes/[id]/page.tsx` — detalhes + histórico laudos
- Create: `src/components/clientes/cliente-form.tsx`
- Create: `src/hooks/use-clientes.ts` — TanStack Query hooks

- [ ] Listagem com busca por nome/CNPJ, card por cliente
- [ ] Formulário com validação Zod: CNPJ, nome, email, endereço, foto
- [ ] Upload de foto com preview
- [ ] Página de detalhes com histórico de laudos do cliente
- [ ] CNPJ com máscara de input

## Task 14: Frontend — Engenheiros

**Files:**
- Create: `src/app/(app)/engenheiros/page.tsx`
- Create: `src/components/engenheiros/engenheiro-form.tsx`

- [ ] Listagem de engenheiros da firma
- [ ] Formulário com campos: nome, CREA, título, email, telefone
- [ ] Upload de logo e assinatura com preview de imagem

## Task 15: Frontend — Catálogo de NRs

**Files:**
- Create: `src/app/(app)/nrs/page.tsx`
- Create: `src/components/nrs/nr-form.tsx`

- [ ] Listagem com filtro por número NR e prioridade
- [ ] Badge colorido por prioridade (vermelho=crítico, laranja=alto, amarelo=médio, azul=baixo)
- [ ] Modal para criar/editar NR com todos os campos
- [ ] Botão excluir com confirmação

## Task 16: Frontend — Modelos de Laudos

**Files:**
- Create: `src/app/(app)/modelos/page.tsx`
- Create: `src/app/(app)/modelos/[id]/page.tsx` — editor de tópicos do modelo
- Create: `src/components/modelos/topico-editor.tsx` — editor de tópico com textarea rich

- [ ] Listagem de modelos
- [ ] Editor de tópicos com drag-and-drop de ordem (dnd-kit)
- [ ] Cada tópico tem título + textarea de conteúdo

## Task 17: Frontend — Editor de Laudos

**Files:**
- Create: `src/app/(app)/laudos/page.tsx` — listagem de laudos
- Create: `src/app/(app)/laudos/novo/page.tsx` — wizard de criação
- Create: `src/app/(app)/laudos/[id]/page.tsx` — editor principal (tabs)
- Create: `src/components/laudos/laudo-info-tab.tsx` — dados gerais
- Create: `src/components/laudos/topicos-tab.tsx` — editor de tópicos
- Create: `src/components/laudos/areas-tab.tsx` — áreas + fotos
- Create: `src/components/laudos/status-badge.tsx`

- [ ] Listagem com filtros (status, cliente, data)
- [ ] Wizard de criação: selecionar cliente + engenheiro + modelo + preencher dados
- [ ] Editor em abas: "Dados Gerais" | "Tópicos" | "Áreas / Fotos" | "Preview"
- [ ] Aba Dados Gerais: número ART, data visita, data emissão, quem acompanhou
- [ ] Aba Tópicos: editor igual ao modelo mas preenchido, editável
- [ ] Workflow de status com botões de transição: "Enviar para revisão" → "Assinar" → "Entregar"

## Task 18: Frontend — Registro Fotográfico + Anotação (Fabric.js)

**Files:**
- Create: `src/components/laudos/foto-uploader.tsx` — drag-and-drop upload
- Create: `src/components/laudos/foto-annotator.tsx` — canvas Fabric.js
- Create: `src/components/laudos/ponto-nr-editor.tsx` — painel de NRs do ponto

**Fluxo:**
1. Usuário faz upload de foto na área
2. Abre modal com canvas Fabric.js mostrando a foto
3. Clica na foto para adicionar ponto numerado (círculo laranja com número)
4. Painel lateral lista os pontos; para cada ponto, seleciona 1+ NRs do catálogo + solução específica
5. Salva pontos via `POST /fotos/{id}/pontos`

- [ ] Upload de fotos com drag-and-drop (react-dropzone)
- [ ] Canvas Fabric.js: carregar imagem, adicionar círculos numerados ao clicar
- [ ] Pontos arrastáveis para reposicionar
- [ ] Painel: lista pontos, para cada ponto selector de NRs (combobox com busca)
- [ ] Campo de solução específica por ponto (pre-preenchida com solução padrão da NR)
- [ ] Salvar tudo ao fechar o modal

## Task 19: Frontend — Preview + Download PDF

**Files:**
- Create: `src/app/(app)/laudos/[id]/preview/page.tsx`
- Create: `src/components/laudos/laudo-preview.tsx` — renderização HTML do laudo
- Create: `src/components/laudos/foto-preview-grid.tsx` — 2 fotos por linha com tabela NR

- [ ] Buscar dados completos do laudo via `/preview-data`
- [ ] Renderizar laudo em HTML fiel ao PDF (mesma estrutura)
- [ ] Fotos em grid 2 colunas, pontos numerados sobrepostos (CSS position:absolute)
- [ ] Tabela abaixo de cada par de fotos com Ponto | NR | Solução
- [ ] Seção de itens críticos filtrada automaticamente
- [ ] Botão "Baixar PDF" chama `GET /laudos/{id}/pdf` e faz download
- [ ] Botão "Voltar ao Editor"

---

## Execution Order

1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19
