# Laudo Tech

Sistema web para geração de laudos técnicos de instalações elétricas (NR-10): cadastro de clientes e engenheiros, catálogo de NRs, modelos reutilizáveis, editor de laudos com áreas de inspeção e registro fotográfico anotado, geração de PDF e versionamento de laudos.

Cada engenheiro cadastrado tem sua própria conta independente — não há hierarquia, papéis ou compartilhamento entre contas (veja [docs/REGRAS-DE-ACESSO.md](docs/REGRAS-DE-ACESSO.md) para todas as regras de negócio).

## Ambiente em produção

| Camada | URL |
|---|---|
| Frontend | https://laudo-tech.vercel.app |
| Backend (API) | https://laudo-tech.onrender.com/api/v1 |
| Repositório | https://github.com/vrr-marcos00/laudo-tech |

Infraestrutura (todas em free tier, ver limitações na seção [Hospedagem](#hospedagem-produção)):

| Serviço | Papel | Provedor |
|---|---|---|
| Banco de dados | PostgreSQL | [Neon](https://neon.tech) |
| Armazenamento de arquivos | S3-compatible | [Cloudflare R2](https://developers.cloudflare.com/r2/) |
| Backend | Web Service (Docker) | [Render](https://render.com) |
| Frontend | Deploy Next.js | [Vercel](https://vercel.com) |

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16 (App Router, Turbopack) + React 19 + TypeScript + Tailwind CSS 4 |
| UI / formulários | @base-ui/react, react-hook-form + zod, dnd-kit (drag-and-drop), fabric.js (canvas de anotação) |
| Backend | Java 21 + Spring Boot 3.3 |
| Banco de dados | PostgreSQL + Flyway (migrations) |
| Armazenamento de arquivos | Cliente MinIO SDK (compatível com qualquer storage S3, local ou Cloudflare R2) |
| Geração de PDF | iText 7/8 |
| Autenticação | JWT (stateless, `Authorization: Bearer`) |

## Desenvolvimento local

### Pré-requisitos
- Java 21 + Maven
- Node.js 22 (veja `frontend/.nvmrc`)
- Docker + Docker Compose

### 1. Infraestrutura (PostgreSQL + MinIO)

```bash
docker compose up -d
```

Sobe Postgres (porta `5433`) e MinIO (API `9000`, console `9001` — usuário/senha `minioadmin` / `minioadmin123`).

### 2. Backend

```bash
cd backend
mvn spring-boot:run
```

O Flyway aplica as migrations e o seed automaticamente. Backend em http://localhost:8080. Sem usuário/senha padrão pré-cadastrado — crie sua conta pela tela de cadastro do frontend (endpoint `POST /api/v1/auth/register`, sempre público).

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend em http://localhost:3000.

> O `frontend/.npmrc` força o registro público do npm (`registry.npmjs.org`). Isso é proposital: se sua máquina tiver um `.npmrc` global apontando para um proxy corporativo (comum em ambientes de trabalho), o `package-lock.json` acaba gravado com URLs internas, inacessíveis para qualquer CI/deploy externo (foi exatamente o que quebrou o primeiro build na Vercel deste projeto).

### Variáveis de ambiente (local)

O backend já tem defaults funcionais para desenvolvimento local via `docker-compose.yml` (ver `backend/src/main/resources/application.yml`). Não é necessário configurar nada manualmente para rodar local. O frontend usa `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

## Hospedagem (produção)

### Variáveis de ambiente do backend (Render → Web Service → Environment)

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | `jdbc:postgresql://<host>/<db>?sslmode=require` — **use a conexão direta do Neon, não a `-pooler`** (o Flyway usa advisory locks de sessão, incompatíveis com pooling em modo transação) |
| `DATABASE_USERNAME` / `DATABASE_PASSWORD` | Credenciais do Neon |
| `MINIO_ENDPOINT` | Endpoint da API S3 do R2 (`https://<account_id>.r2.cloudflarestorage.com`) |
| `MINIO_PUBLIC_URL` | Domínio público de leitura do bucket (r2.dev ou domínio customizado) — **diferente do endpoint da API**, já que no R2 a API S3 não serve arquivos publicamente |
| `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | Credenciais do token de API do R2 (permissão Object Read & Write) |
| `MINIO_BUCKET` | Nome do bucket no R2 |
| `JWT_SECRET` | Segredo para assinar os tokens JWT (gerar um valor aleatório forte, nunca usar o default do `application.yml`) |
| `CORS_ALLOWED_ORIGINS` | URL do frontend hospedado (ex: `https://laudo-tech.vercel.app`) |

`PORT` não precisa ser configurada — o Render injeta automaticamente e o `application.yml` já lê `${PORT:8080}`.

### Variável de ambiente do frontend (Vercel)

```
NEXT_PUBLIC_API_URL=https://laudo-tech.onrender.com/api/v1
```

### Limitações do free tier (importante saber)

- **Render**: o serviço "dorme" após ~15 min sem tráfego; a primeira requisição depois disso demora mais (cold start). 750h de instância gratuita por workspace/mês.
- **Neon**: o Postgres free tier não expira por tempo, mas fica sujeito aos limites de compute/storage do plano gratuito.
- **Cloudflare R2**: exige cartão cadastrado para habilitar o serviço mesmo dentro do free tier (10GB armazenamento, 1M operações Classe A e 10M Classe B por mês, sem cobrança de egress). O acesso público via "Public Development URL" (`r2.dev`) é indicado pela própria Cloudflare só para não-produção — para produção "de verdade" o recomendado é conectar um domínio customizado ao bucket.
- **Vercel**: builda o projeto fora da rede de qualquer proxy corporativo — por isso o `frontend/.npmrc` deve sempre apontar para o registro público do npm.

## Funcionalidades

- **Autenticação** — cadastro livre (sem convite/aprovação) e login por e-mail/senha, JWT
- **Clientes** — cadastro com CNPJ, endereço, foto, histórico de laudos
- **Engenheiros** — perfil próprio com CREA, logo e assinatura
- **Catálogo de NRs** — cadastro próprio de normas com prioridade (Crítico/Alto/Médio/Baixo)
- **Modelos de Laudo** — templates reutilizáveis com tópicos reordenáveis (drag-and-drop)
- **Editor de Laudos** — dados gerais, tópicos, áreas de inspeção com fotos
- **Anotação de fotos** — canvas com pontos numerados vinculados a uma ou mais NRs do catálogo
- **Tópicos automáticos** — "Registro Fotográfico" e "Itens Críticos" aparecem sozinhos quando fizerem sentido
- **Geração de PDF** — via iText no backend, com preview inline antes de finalizar
- **Workflow de status** — Rascunho → Finalizado (sem volta), com versionamento (nova versão copia todo o conteúdo do laudo anterior)

Regras completas de cada módulo em [docs/REGRAS-DE-ACESSO.md](docs/REGRAS-DE-ACESSO.md).

## Endpoints da API

Toda rota exige `Authorization: Bearer <token>`, exceto as de `/api/v1/auth/**`.

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/register` | Cadastro de novo engenheiro |
| GET | `/api/v1/clientes?search=` | Listar/buscar clientes |
| GET/POST/PUT/DELETE | `/api/v1/clientes/{id}` | CRUD de cliente |
| POST | `/api/v1/clientes/{id}/foto` | Upload de foto do cliente |
| GET | `/api/v1/clientes/{id}/laudos` | Laudos vinculados ao cliente |
| GET/PUT | `/api/v1/engenheiros/{id}` | Perfil do engenheiro |
| POST | `/api/v1/engenheiros/{id}/logo` | Upload de logo |
| POST | `/api/v1/engenheiros/{id}/assinatura` | Upload de assinatura |
| GET | `/api/v1/nrs?search=&prioridade=` | Listar/buscar catálogo de NRs |
| POST/PUT/DELETE | `/api/v1/nrs/{id}` | CRUD de NR |
| GET/POST/PUT/DELETE | `/api/v1/modelos/{id}` | CRUD de modelo de laudo |
| GET | `/api/v1/laudos?status=&clienteId=` | Listar laudos |
| GET/POST/PUT/DELETE | `/api/v1/laudos/{id}` | CRUD de laudo |
| PATCH | `/api/v1/laudos/{id}/status` | Mudar status (só Rascunho → Finalizado) |
| POST | `/api/v1/laudos/{id}/nova-versao` | Criar nova versão do laudo |
| PUT | `/api/v1/laudos/{id}/topicos` | Salvar tópicos |
| GET/POST | `/api/v1/laudos/{id}/areas` | Áreas de inspeção |
| PUT/DELETE | `/api/v1/laudos/{laudoId}/areas/{areaId}` | Editar/excluir área |
| POST/DELETE | `/api/v1/laudos/{id}/logo-capa` | Logo da capa do laudo |
| GET | `/api/v1/laudos/{id}/pdf` | Download do PDF (exige laudo Finalizado) |
| GET | `/api/v1/laudos/{id}/preview-pdf` | Preview do PDF inline (qualquer status) |
| POST | `/api/v1/areas/{areaId}/fotos` | Upload de foto de área |
| DELETE | `/api/v1/fotos/{fotoId}` | Excluir foto |
| GET/POST | `/api/v1/fotos/{fotoId}/pontos` | Ler/salvar pontos de anotação (salvar substitui todos de uma vez) |

## Estrutura do repositório

```
backend/    Spring Boot (Java 21) — API REST, migrations Flyway, geração de PDF
frontend/   Next.js (React 19) — SPA autenticada
docs/       Documentação de regras de negócio
docker-compose.yml   Postgres + MinIO para desenvolvimento local
```
