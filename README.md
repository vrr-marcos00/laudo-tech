# Laudo Tech

Sistema web para geração automatizada de laudos técnicos elétricos (NR-10).

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS + Shadcn/UI |
| Backend | Java 21 + Spring Boot 3.3 + PostgreSQL |
| Armazenamento de arquivos | MinIO (S3-compatible) |
| Geração de PDF | iText7 |
| Autenticação | JWT |

## Pré-requisitos

- Java 21 + Maven
- Node.js 20+
- Docker + Docker Compose

## Setup

### 1. Infraestrutura (PostgreSQL + MinIO)

```bash
cd ~/Projects/Personal/laudo-tech
docker compose up -d
```

MinIO Console: http://localhost:9001 (minioadmin / minioadmin123)

### 2. Backend

```bash
cd backend
mvn spring-boot:run
```

O Flyway aplicará automaticamente as migrations e o seed com dados iniciais.

**Login padrão:** `admin@laudotech.com` / `admin123`

Backend disponível em: http://localhost:8080

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend disponível em: http://localhost:3000

## Funcionalidades

- **Clientes** — Cadastro com CNPJ, endereço, foto, histórico de laudos
- **Engenheiros** — Cadastro com CREA, logo e assinatura digital
- **Catálogo de NRs** — NR-10, NBR-5410 com prioridades (Crítico/Alto/Médio/Baixo)
- **Modelos de Laudos** — Templates reutilizáveis com tópicos drag-and-drop
- **Editor de Laudos** — Abas: Dados Gerais / Tópicos / Áreas + Fotos
- **Anotação de Fotos** — Canvas com pontos numerados vinculados a NRs
- **Geração de PDF** — Layout ABNT, 2 fotos por linha, tabela NR + solução
- **Workflow de Status** — Rascunho → Em Revisão → Assinado → Entregue
- **Preview HTML** — Preview fiel antes de baixar o PDF

## Endpoints principais

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/v1/auth/login | Login |
| GET/POST | /api/v1/clientes | Clientes |
| GET/POST | /api/v1/engenheiros | Engenheiros |
| GET/POST | /api/v1/nrs | Catálogo NRs |
| GET/POST | /api/v1/modelos | Modelos de laudo |
| GET/POST | /api/v1/laudos | Laudos |
| PATCH | /api/v1/laudos/{id}/status | Mudar status |
| POST | /api/v1/areas/{areaId}/fotos | Upload foto |
| POST | /api/v1/fotos/{fotoId}/pontos | Salvar anotações |
| GET | /api/v1/laudos/{id}/pdf | Download PDF |
| GET | /api/v1/laudos/{id}/preview-pdf | Preview PDF inline |
