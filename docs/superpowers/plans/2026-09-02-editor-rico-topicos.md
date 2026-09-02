# Editor de texto rico para tópicos do laudo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir formatação rica (negrito, itálico, sublinhado, marcadores, lista numerada, títulos H2/H3 e imagens ilustrativas) no campo `conteudo` dos tópicos do laudo, refletida no editor, no preview e no PDF final.

**Architecture:** O conteúdo passa a ser armazenado como HTML na mesma coluna `TEXT` que já existe. O frontend usa Tiptap para editar e `dangerouslySetInnerHTML` para exibir no preview. O backend usa a extensão pdfHTML do próprio iText para converter esse HTML em elementos de PDF, inseridos no `Document` já existente do `PdfGeneratorService`.

**Tech Stack:** Next.js/React (Tiptap: `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-underline`, `@tiptap/extension-image`) + Spring Boot/iText (`com.itextpdf:html2pdf:5.0.5`).

**Spec:** `docs/superpowers/specs/2026-09-02-editor-rico-topicos-design.md`

## Global Constraints

- Não altera os tópicos automáticos (`REGISTRO_FOTOGRAFICO`, `ITENS_CRITICOS`) — eles não usam `conteudo`.
- Não reaproveita nem altera o sistema de fotos de "Áreas de Inspeção".
- Escopo de formatação: negrito, itálico, sublinhado, marcadores, lista numerada, H2/H3, imagem. Nada além disso (sem cor de texto, alinhamento, links, tabelas).
- **Este projeto não tem nenhuma suíte de testes automatizados** (nenhum arquivo em `backend/src/test`, nenhum em `frontend`, nenhum script `test` no `package.json`). Cada tarefa abaixo troca "escreva um teste que falha" por "compile/build + verificação manual", seguindo o padrão já usado neste projeto (build do Docker/`tsc`/`next build` + teste funcional manual via `curl`/navegador). Não introduza um framework de testes novo — isso está fora do escopo desta spec.
- Backend local: sem JDK instalado na máquina de desenvolvimento — toda verificação de compilação do backend é feita via `docker build` na pasta `backend/` (não `mvn` direto).
- Frontend local: `npm install` de pacotes novos só funciona nesta máquina apontando pro proxy interno (`--registry=https://npm.artifacts.furycloud.io/`), nunca pro registro público (bloqueado pela rede corporativa local). O `.npmrc` do repositório continua apontando pro registro público — é assim que a Vercel builda; isso é só uma particularidade desta máquina de desenvolvimento.

---

### Task 1: Backend — Corrigir validação de conteúdo vazio para HTML

**Files:**
- Modify: `backend/src/main/java/com/laudotech/util/TextUtils.java`
- Modify: `backend/src/main/java/com/laudotech/service/LaudoService.java:107`

**Interfaces:**
- Produces: `TextUtils.isHtmlBlank(String html): boolean` — usado pelo Task 6 (frontend não usa isso, mas a mesma lógica precisa existir dos dois lados).

Hoje a validação `t.getConteudo() == null || t.getConteudo().isBlank()` (linha 107 de `LaudoService.java`) rejeita conteúdo vazio. Quando o conteúdo passar a ser HTML gerado pelo Tiptap, um editor "vazio" produz `<p></p>` — que não é `isBlank()` (tem caracteres), então esse tópico passaria a validação mesmo sem nenhum texto real. Precisa checar o texto sem as tags.

- [ ] **Step 1: Adicionar `isHtmlBlank` em `TextUtils`**

Conteúdo atual de `backend/src/main/java/com/laudotech/util/TextUtils.java`:
```java
package com.laudotech.util;

import java.util.Locale;

public final class TextUtils {
    private static final Locale PT_BR = Locale.of("pt", "BR");

    private TextUtils() {}

    public static String upper(String value) {
        return value == null ? null : value.toUpperCase(PT_BR);
    }
}
```

Substituir pelo conteúdo completo abaixo (adiciona o método novo, mantém o que já existe):
```java
package com.laudotech.util;

import java.util.Locale;

public final class TextUtils {
    private static final Locale PT_BR = Locale.of("pt", "BR");

    private TextUtils() {}

    public static String upper(String value) {
        return value == null ? null : value.toUpperCase(PT_BR);
    }

    public static boolean isHtmlBlank(String html) {
        return html == null || html.replaceAll("<[^>]*>", "").isBlank();
    }
}
```

- [ ] **Step 2: Usar `isHtmlBlank` na validação de tópicos**

Em `backend/src/main/java/com/laudotech/service/LaudoService.java`, localizar dentro de `salvarTopicos`:
```java
            boolean tituloVazio = t.getTitulo() == null || t.getTitulo().isBlank();
            boolean conteudoVazio = t.getConteudo() == null || t.getConteudo().isBlank();
```
Substituir por:
```java
            boolean tituloVazio = t.getTitulo() == null || t.getTitulo().isBlank();
            boolean conteudoVazio = TextUtils.isHtmlBlank(t.getConteudo());
```
Adicionar o import estático no topo do arquivo (junto aos outros imports de `TextUtils`):
```java
import static com.laudotech.util.TextUtils.isHtmlBlank;
```
(Se preferir consistência com o `upper` estático já importado, use apenas `TextUtils.isHtmlBlank(...)` sem import estático — o arquivo já tem `import static com.laudotech.util.TextUtils.upper;`, então troque essa linha por `import static com.laudotech.util.TextUtils.*;` e chame só `isHtmlBlank(...)` e `upper(...)` diretamente.)

- [ ] **Step 3: Validar a compilação**

```bash
cd backend && docker build -q -t laudotech-backend .
```
Esperado: build sem erros (mesmo comando usado nas features anteriores desta sessão).

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/laudotech/util/TextUtils.java backend/src/main/java/com/laudotech/service/LaudoService.java
git commit -m "Corrige validacao de conteudo vazio para lidar com HTML do editor rico"
```

---

### Task 2: Backend — Migration de dados legados (texto puro → HTML)

**Files:**
- Create: `backend/src/main/resources/db/migration/V18__html_topicos.sql`

**Interfaces:**
- Consumes: nada de outra task.
- Produces: nada consumido por outra task (é uma migration de dados, independente).

- [ ] **Step 1: Criar a migration**

Conteúdo completo de `backend/src/main/resources/db/migration/V18__html_topicos.sql`:
```sql
UPDATE laudo_topico
SET conteudo = '<p>' || replace(replace(replace(replace(conteudo, '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), E'\n', '</p><p>') || '</p>'
WHERE tipo = 'TEXTO' AND conteudo IS NOT NULL AND conteudo <> '';

UPDATE modelo_topico
SET conteudo = '<p>' || replace(replace(replace(replace(conteudo, '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), E'\n', '</p><p>') || '</p>'
WHERE conteudo IS NOT NULL AND conteudo <> '';
```

- [ ] **Step 2: Rodar localmente e verificar**

Reconstruir e reiniciar o container do backend local apontando pro Postgres/MinIO do `docker-compose` (mesmo padrão usado nas features anteriores desta sessão):
```bash
cd backend && docker build -q -t laudotech-backend .
docker rm -f laudotech-backend-local
docker run -d --name laudotech-backend-local \
  --network laudo-tech_default \
  -p 8080:8080 \
  -e DATABASE_URL="jdbc:postgresql://postgres:5432/laudotech" \
  -e DATABASE_USERNAME="laudotech" \
  -e DATABASE_PASSWORD="laudotech123" \
  -e MINIO_ENDPOINT="http://minio:9000" \
  -e MINIO_PUBLIC_URL="http://localhost:9000/laudotech" \
  -e MINIO_ACCESS_KEY="minioadmin" \
  -e MINIO_SECRET_KEY="minioadmin123" \
  -e MINIO_BUCKET="laudotech" \
  -e CORS_ALLOWED_ORIGINS="http://localhost:3000" \
  laudotech-backend
```
Esperado nos logs (`docker logs laudotech-backend-local`): `Migrating schema "public" to version "18 - html topicos"` seguido de `Successfully applied 1 migration`.

Conferir no banco que um tópico de texto existente virou HTML:
```bash
docker exec laudo-tech-postgres-1 psql -U laudotech -d laudotech -c "SELECT id, conteudo FROM laudo_topico WHERE tipo = 'TEXTO' LIMIT 3;"
```
Esperado: valores começando com `<p>` e terminando com `</p>`.

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/resources/db/migration/V18__html_topicos.sql
git commit -m "Migra conteudo de topicos existentes de texto puro para HTML"
```

---

### Task 3: Backend — Endpoint de upload de imagem para o editor de tópicos

**Files:**
- Modify: `backend/src/main/java/com/laudotech/service/LaudoService.java`
- Modify: `backend/src/main/java/com/laudotech/controller/LaudoController.java`

**Interfaces:**
- Produces: `LaudoService.assertAcessoEEditavel(Long laudoId, Engenheiro authEng): void`. Endpoint `POST /api/v1/laudos/{id}/topicos/imagens` (multipart `file`) retornando `{"url": "<url pública>"}` — consumido pelo Task 6 (frontend).

- [ ] **Step 1: Adicionar `assertAcessoEEditavel` em `LaudoService`**

Logo abaixo do método `assertAcesso(Laudo laudo, Engenheiro authEng)` (por volta da linha 287) em `backend/src/main/java/com/laudotech/service/LaudoService.java`, adicionar:
```java
    public void assertAcessoEEditavel(Long laudoId, Engenheiro authEng) {
        Laudo laudo = laudoRepo.findById(laudoId).orElseThrow(() -> new RuntimeException("Laudo não encontrado"));
        assertAcesso(laudo, authEng);
        assertEditavel(laudo);
    }
```

- [ ] **Step 2: Adicionar o endpoint em `LaudoController`**

Em `backend/src/main/java/com/laudotech/controller/LaudoController.java`, adicionar o import de `java.util.Map` junto aos outros imports:
```java
import java.util.List;
import java.util.Map;
```
Adicionar o endpoint logo após `uploadLogoCapa`/`removerLogoCapa` (antes do `}` final da classe):
```java
    @PostMapping("/{id}/topicos/imagens")
    public ResponseEntity<Map<String, String>> uploadImagemTopico(@PathVariable Long id,
                                                                    @RequestParam("file") MultipartFile file) {
        laudoService.assertAcessoEEditavel(id, auth());
        String url = fileStorageService.upload(file, "laudos/" + id + "/topicos");
        return ResponseEntity.ok(Map.of("url", url));
    }
```

- [ ] **Step 3: Validar a compilação**

```bash
cd backend && docker build -q -t laudotech-backend .
```
Esperado: build sem erros.

- [ ] **Step 4: Verificar manualmente com curl**

Com o container local rodando (Task 2, Step 2) e um token válido (login via `POST /api/v1/auth/login`), enviar uma imagem de teste para um laudo em rascunho:
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"marcosadmin@laudotech.com","senha":"teste1234"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
curl -s -X POST http://localhost:8080/api/v1/laudos/14/topicos/imagens \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/caminho/para/uma/imagem.png"
```
Esperado: `HTTP 200` com corpo `{"url":"http://localhost:9000/laudotech/laudos/14/topicos/<uuid>.png"}` (ajustar o id do laudo/caminho da imagem para o que existir no ambiente local).

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/laudotech/service/LaudoService.java backend/src/main/java/com/laudotech/controller/LaudoController.java
git commit -m "Adiciona endpoint de upload de imagem para o editor de topicos"
```

---

### Task 4: Backend — Renderizar HTML dos tópicos no PDF via pdfHTML

**Files:**
- Modify: `backend/pom.xml`
- Modify: `backend/src/main/java/com/laudotech/service/PdfGeneratorService.java`

**Interfaces:**
- Consumes: nenhuma interface de outra task (usa `LaudoTopico.getConteudo()` que já existe).

- [ ] **Step 1: Adicionar a dependência do pdfHTML no `pom.xml`**

Em `backend/pom.xml`, alterar a property `itext.version` (linha 23) de `8.0.4` para `8.0.5` (para alinhar com a versão que o `html2pdf:5.0.5` exige):
```xml
    <itext.version>8.0.5</itext.version>
```
Adicionar a dependência nova, logo após a dependência `itext-core` existente (linhas 110-115), antes do comentário `<!-- MinIO -->` (linha 117):
```xml
    <dependency>
      <groupId>com.itextpdf</groupId>
      <artifactId>itext-core</artifactId>
      <version>${itext.version}</version>
      <type>pom</type>
    </dependency>
    <dependency>
      <groupId>com.itextpdf</groupId>
      <artifactId>html2pdf</artifactId>
      <version>5.0.5</version>
    </dependency>
```
(Mantenha a dependência `itext-core` exatamente como já está — só adicione o bloco novo do `html2pdf` logo abaixo dela, e ajuste a versão da property `itext.version` como mostrado acima.)

- [ ] **Step 2: Validar que a dependência baixa e compila**

```bash
cd backend && docker build -q -t laudotech-backend .
```
Esperado: build sem erros (o Maven baixa `html2pdf` e as sub-dependências do `itext-core:8.0.5` do Maven Central dentro do container — isso funciona normalmente mesmo nesta máquina, pois o `docker build` não passa pelo proxy corporativo que afeta o `npm install` local).

- [ ] **Step 3: Trocar a renderização de tópicos de texto por conversão HTML**

Em `backend/src/main/java/com/laudotech/service/PdfGeneratorService.java`, adicionar os imports do pdfHTML junto aos demais imports do topo do arquivo:
```java
import com.itextpdf.html2pdf.ConverterProperties;
import com.itextpdf.html2pdf.HtmlConverter;
```

Localizar em `addTopicos`:
```java
                default -> {
                    addSectionTitle(doc, titulo, bold);
                    if (t.getConteudo() != null && !t.getConteudo().isBlank()) {
                        doc.add(new Paragraph(t.getConteudo()).setFont(regular).setFontSize(11)
                                .setTextAlignment(TextAlignment.JUSTIFIED).setMarginBottom(15));
                    }
                }
```
Substituir por:
```java
                default -> {
                    addSectionTitle(doc, titulo, bold);
                    if (t.getConteudo() != null && !com.laudotech.util.TextUtils.isHtmlBlank(t.getConteudo())) {
                        String html = "<style>"
                                + "p, li { font-family: Times-Roman; font-size: 11pt; text-align: justify; }"
                                + "h2 { font-family: Times-Bold; font-size: 13pt; }"
                                + "h3 { font-family: Times-Bold; font-size: 12pt; }"
                                + "img { max-width: 100%; }"
                                + "</style>" + t.getConteudo();
                        for (com.itextpdf.layout.element.IElement element : HtmlConverter.convertToElements(html, new ConverterProperties())) {
                            if (element instanceof com.itextpdf.layout.element.IBlockElement blockElement) {
                                doc.add(blockElement);
                            }
                        }
                        doc.add(new Paragraph("\n"));
                    }
                }
```

Nota: `HtmlConverter.convertToElements` retorna `List<IElement>`; `Document.add(...)` só aceita `IBlockElement` (parágrafos, listas, imagens em bloco, divs) — todo elemento que o pdfHTML gera a partir de `p`, `ul`, `ol`, `li`, `h2`, `h3`, `img` (quando não inline) é um `IBlockElement`, então o filtro do `instanceof` acima não descarta nada relevante para este caso de uso; é só uma proteção de tipo exigida pelo compilador.

- [ ] **Step 4: Validar a compilação**

```bash
cd backend && docker build -q -t laudotech-backend .
```
Esperado: build sem erros.

- [ ] **Step 5: Commit**

```bash
git add backend/pom.xml backend/src/main/java/com/laudotech/service/PdfGeneratorService.java
git commit -m "Renderiza conteudo HTML dos topicos no PDF via pdfHTML"
```

---

### Task 5: Frontend — Instalar Tiptap e criar utilitário de HTML vazio

**Files:**
- Modify: `frontend/package.json` (via `npm install`)
- Create: `frontend/src/lib/html.ts`

**Interfaces:**
- Produces: `isHtmlEmpty(html: string): boolean` — usado pelo Task 6.

- [ ] **Step 1: Instalar as dependências do Tiptap**

```bash
cd frontend
source ~/.nvm/nvm.sh && nvm use 22
npm install --registry=https://npm.artifacts.furycloud.io/ @tiptap/react@^2 @tiptap/pm@^2 @tiptap/starter-kit@^2 @tiptap/extension-underline@^2 @tiptap/extension-image@^2
```
(Rodar em background e aguardar — historicamente esse `npm install` via proxy corporativo local leva entre 5 e 40 minutos nesta máquina, mesmo padrão observado nas features anteriores desta sessão. O `package-lock.json` gerado localmente por esse comando não deve ser commitado — já está no `.gitignore`.)

Esperado ao terminar: `added N packages` sem erro, e `frontend/package.json` com as 5 dependências novas em `dependencies`.

- [ ] **Step 2: Criar o utilitário `isHtmlEmpty`**

Conteúdo completo de `frontend/src/lib/html.ts`:
```ts
export function isHtmlEmpty(html: string): boolean {
  return html.replace(/<[^>]*>/g, '').trim().length === 0
}
```

- [ ] **Step 3: Validar o TypeScript**

```bash
cd frontend && source ~/.nvm/nvm.sh && nvm use 22 && npx tsc --noEmit
```
Esperado: sem output (sem erros).

- [ ] **Step 4: Commit**

```bash
git add frontend/package.json frontend/src/lib/html.ts
git commit -m "Instala Tiptap e adiciona utilitario isHtmlEmpty"
```

---

### Task 6: Frontend — Componente `TopicoRichEditor` e integração na edição do laudo

**Files:**
- Create: `frontend/src/components/laudos/topico-rich-editor.tsx`
- Modify: `frontend/src/app/(app)/laudos/[id]/page.tsx`

**Interfaces:**
- Consumes: `isHtmlEmpty` de `@/lib/html` (Task 5); endpoint `POST /api/v1/laudos/{id}/topicos/imagens` (Task 3).
- Produces: componente `TopicoRichEditor({ value, onChange, laudoId, disabled, invalid }: Props)` — consumido só dentro deste mesmo arquivo modificado (`page.tsx`).

- [ ] **Step 1: Criar o componente `TopicoRichEditor`**

Conteúdo completo de `frontend/src/components/laudos/topico-rich-editor.tsx`:
```tsx
'use client'
import { useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TiptapImage from '@tiptap/extension-image'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { toast } from '@/components/ui/toaster'
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Heading2, Heading3, ImagePlus } from 'lucide-react'

interface Props {
  value: string
  onChange: (html: string) => void
  laudoId: number
  disabled?: boolean
  invalid?: boolean
}

export function TopicoRichEditor({ value, onChange, laudoId, disabled, invalid }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [StarterKit, Underline, TiptapImage],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'laudo-rich-editor-content min-h-[100px] px-3 py-2 text-sm focus:outline-none',
      },
    },
  })

  async function handleImageFile(file: File) {
    const form = new FormData()
    form.append('file', file)
    try {
      const { data } = await api.post(`/laudos/${laudoId}/topicos/imagens`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      editor?.chain().focus().setImage({ src: data.url }).run()
    } catch {
      toast.add({ title: 'Erro ao enviar imagem', type: 'error' })
    }
  }

  if (!editor) return null

  return (
    <div className={cn('rounded-md border border-input', invalid && 'border-red-400 focus-within:ring-red-400')}>
      {!disabled && (
        <div className="flex items-center gap-0.5 border-b border-input p-1 flex-wrap">
          <Button type="button" variant="ghost" size="icon-sm"
            className={cn(editor.isActive('bold') && 'bg-muted')}
            onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm"
            className={cn(editor.isActive('italic') && 'bg-muted')}
            onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm"
            className={cn(editor.isActive('underline') && 'bg-muted')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon className="w-4 h-4" />
          </Button>
          <Separator orientation="vertical" className="h-5 mx-1" />
          <Button type="button" variant="ghost" size="icon-sm"
            className={cn(editor.isActive('heading', { level: 2 }) && 'bg-muted')}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm"
            className={cn(editor.isActive('heading', { level: 3 }) && 'bg-muted')}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 className="w-4 h-4" />
          </Button>
          <Separator orientation="vertical" className="h-5 mx-1" />
          <Button type="button" variant="ghost" size="icon-sm"
            className={cn(editor.isActive('bulletList') && 'bg-muted')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm"
            className={cn(editor.isActive('orderedList') && 'bg-muted')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="w-4 h-4" />
          </Button>
          <Separator orientation="vertical" className="h-5 mx-1" />
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => fileInputRef.current?.click()}>
            <ImagePlus className="w-4 h-4" />
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = '' }} />
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  )
}
```

- [ ] **Step 2: Trocar o `Textarea` pelo `TopicoRichEditor` em `laudos/[id]/page.tsx`**

Adicionar os imports no topo de `frontend/src/app/(app)/laudos/[id]/page.tsx` (junto aos demais):
```tsx
import { TopicoRichEditor } from '@/components/laudos/topico-rich-editor'
import { isHtmlEmpty } from '@/lib/html'
```

Em `SortableLaudoTopico`, trocar a assinatura da função para receber `laudoId`:
```tsx
function SortableLaudoTopico({ topico, index, showErrors, readOnly, laudoId, onChange, onRemove }: {
  topico: TopicoWithKey
  index: number
  showErrors: boolean
  readOnly: boolean
  laudoId: number
  onChange: (field: 'titulo' | 'conteudo', value: string) => void
  onRemove: () => void
}) {
```

Trocar o cálculo de `conteudoInvalido` (que hoje usa `.trim()`):
```tsx
  const conteudoInvalido = showErrors && !isEspecial && isHtmlEmpty(topico.conteudo)
```

Trocar o bloco do `Textarea`:
```tsx
                <div>
                  <Textarea value={topico.conteudo} onChange={e => onChange('conteudo', e.target.value)}
                    placeholder="Conteúdo..." rows={4} disabled={readOnly}
                    className={conteudoInvalido ? 'border-red-400 focus-visible:ring-red-400' : ''} />
                  {conteudoInvalido && <p className="text-xs text-red-500 mt-1">Conteúdo é obrigatório</p>}
                </div>
```
por:
```tsx
                <div>
                  <TopicoRichEditor value={topico.conteudo} onChange={value => onChange('conteudo', value)}
                    laudoId={laudoId} disabled={readOnly} invalid={conteudoInvalido} />
                  {conteudoInvalido && <p className="text-xs text-red-500 mt-1">Conteúdo é obrigatório</p>}
                </div>
```

Remover o import agora não utilizado (verificar se `Textarea` ainda é usado em outro lugar deste arquivo antes de remover; se não for, remover a linha `import { Textarea } from '@/components/ui/textarea'`).

No local de uso de `SortableLaudoTopico` (dentro do `.map` dos tópicos), adicionar a prop nova:
```tsx
                  <SortableLaudoTopico
                    topico={t}
                    index={i}
                    showErrors={topicosShowErrors}
                    readOnly={readOnly}
                    laudoId={Number(id)}
                    onChange={(field, value) => updateTopico(t._key, field, value)}
                    onRemove={() => removeTopico(t._key)}
                  />
```

Também trocar o filtro de tópicos inválidos que hoje usa `.trim()` (por volta da linha 195, dentro da função que verifica se há tópicos incompletos antes de finalizar):
```tsx
    return topicos.filter(t => (t.tipo ?? 'TEXTO') === 'TEXTO' && (!t.titulo.trim() || !t.conteudo.trim()))
```
por:
```tsx
    return topicos.filter(t => (t.tipo ?? 'TEXTO') === 'TEXTO' && (!t.titulo.trim() || isHtmlEmpty(t.conteudo)))
```

- [ ] **Step 3: Validar TypeScript e build**

```bash
cd frontend && source ~/.nvm/nvm.sh && nvm use 22 && npx tsc --noEmit && npm run build
```
Esperado: sem erros de tipo, build completo com sucesso (mesmas checagens usadas nas features anteriores desta sessão).

- [ ] **Step 4: Verificar manualmente no navegador**

Com o backend local (Task 2/3) e o frontend (`npm run dev`) rodando, abrir um laudo em rascunho, ir na aba Tópicos, testar negrito/itálico/sublinhado/lista/lista numerada/título/inserir imagem num tópico de texto, salvar, e confirmar que o conteúdo persiste ao recarregar a página.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/laudos/topico-rich-editor.tsx "frontend/src/app/(app)/laudos/[id]/page.tsx"
git commit -m "Adiciona editor de texto rico (Tiptap) para conteudo dos topicos"
```

---

### Task 7: Frontend — Renderizar o HTML no preview do laudo

**Files:**
- Modify: `frontend/src/app/(app)/laudos/[id]/preview/page.tsx`

**Interfaces:**
- Consumes: `t.conteudo` já como HTML (Task 2 migrou os dados existentes; Task 6 salva os novos já em HTML).

- [ ] **Step 1: Trocar a renderização de texto puro por HTML**

Em `frontend/src/app/(app)/laudos/[id]/preview/page.tsx`, localizar:
```tsx
            return (
              <div key={t.id ?? i} style={{ padding: '2cm', pageBreakAfter: 'always' }}>
                <SectionTitle>{i + 2}. {t.titulo.toUpperCase()}</SectionTitle>
                <p style={{ textAlign: 'justify', whiteSpace: 'pre-wrap' }}>{t.conteudo}</p>
              </div>
            )
```
Substituir por:
```tsx
            return (
              <div key={t.id ?? i} style={{ padding: '2cm', pageBreakAfter: 'always' }}>
                <SectionTitle>{i + 2}. {t.titulo.toUpperCase()}</SectionTitle>
                <div className="laudo-rich-content" style={{ textAlign: 'justify' }}
                  dangerouslySetInnerHTML={{ __html: t.conteudo }} />
              </div>
            )
```

- [ ] **Step 2: Adicionar o CSS de `.laudo-rich-content`**

Em `frontend/src/app/globals.css`, adicionar ao final do arquivo:
```css
.laudo-rich-content p {
  margin-bottom: 0.75em;
}
.laudo-rich-content h2 {
  font-size: 13pt;
  font-weight: bold;
  margin: 1em 0 0.5em;
}
.laudo-rich-content h3 {
  font-size: 12pt;
  font-weight: bold;
  margin: 1em 0 0.5em;
}
.laudo-rich-content ul,
.laudo-rich-content ol {
  margin: 0.5em 0 0.75em 1.5em;
}
.laudo-rich-content img {
  max-width: 100%;
  margin: 0.75em 0;
}
```
(Confirmado: `frontend/src/app/globals.css` existe e é importado em `frontend/src/app/layout.tsx:3`.)

- [ ] **Step 3: Validar TypeScript e build**

```bash
cd frontend && source ~/.nvm/nvm.sh && nvm use 22 && npx tsc --noEmit && npm run build
```
Esperado: sem erros.

- [ ] **Step 4: Verificar manualmente no navegador**

Abrir o preview do mesmo laudo usado no Task 6, Step 4, e confirmar visualmente que a formatação (negrito, itálico, sublinhado, listas, títulos, imagem) aparece corretamente. Baixar o PDF do mesmo laudo (finalizando-o temporariamente se necessário) e conferir que o PDF final também reflete a formatação.

- [ ] **Step 5: Commit**

```bash
git add "frontend/src/app/(app)/laudos/[id]/preview/page.tsx" frontend/src/app/globals.css
git commit -m "Renderiza conteudo rico dos topicos no preview do laudo"
```
