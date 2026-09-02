# Editor de texto rico para tópicos do laudo — Design

**Goal:** Permitir que o conteúdo de um tópico do laudo (`LaudoTopico.conteudo`) seja formatado com negrito, itálico, sublinhado, marcadores, lista numerada, títulos (H2/H3) e imagens ilustrativas embutidas no meio do texto — no editor, no preview e no PDF final.

**Non-goals:** Não altera os tópicos automáticos (`REGISTRO_FOTOGRAFICO`, `ITENS_CRITICOS`), que continuam sendo renderizados de forma especial e não usam o campo `conteudo`. Não reaproveita ou altera o sistema de fotos de "Áreas de Inspeção" (upload, anotação de pontos, vínculo com NRs) — as imagens deste editor são um recurso independente e puramente ilustrativo dentro do texto.

## Contexto atual

- `LaudoTopico.conteudo` (e `ModeloTopico.conteudo`) é uma coluna `TEXT` armazenando texto puro.
- Editor atual: um `<Textarea>` simples em `frontend/src/app/(app)/laudos/[id]/page.tsx`.
- Preview atual: `<p style={{whiteSpace: 'pre-wrap'}}>{t.conteudo}</p>` em `frontend/src/app/(app)/laudos/[id]/preview/page.tsx`.
- PDF atual: `PdfGeneratorService.addTopicos()` — para tópicos do tipo `TEXTO`, adiciona `new Paragraph(t.getConteudo())` direto no `Document` do iText.

## Arquitetura

### 1. Editor (frontend)

- Biblioteca: **Tiptap** (`@tiptap/react` + `@tiptap/starter-kit` + `@tiptap/extension-underline` + `@tiptap/extension-image`). StarterKit já cobre negrito, itálico, parágrafo, heading (H1–H6, vamos expor só H2/H3 na toolbar), lista com marcadores e lista numerada.
- Barra de ferramentas customizada, construída com os componentes de UI já existentes no projeto (`Button`, `Separator`, ícones do `lucide-react`), sem usar a UI pronta de nenhuma lib de editor — mantém consistência visual com o resto do app.
- Novo componente: `frontend/src/components/laudos/topico-rich-editor.tsx`, substituindo o `<Textarea>` atual na edição de tópicos (só para tópicos do tipo `TEXTO`; os tópicos especiais continuam sem esse campo).
- Armazenamento: o conteúdo é serializado como **HTML** (`editor.getHTML()`) e salvo exatamente no mesmo campo `conteudo` (mesmo tipo de coluna, sem migração de schema). Texto puro já existente é HTML válido por si só, então nada quebra até a migração de dados (seção abaixo) rodar.

### 2. Upload de imagem (frontend + backend)

- Botão "Inserir imagem" na toolbar abre o seletor de arquivos do sistema.
- Novo endpoint: `POST /api/v1/laudos/{laudoId}/topicos/imagens` (multipart `file`), protegido pela mesma checagem de acesso (`assertAcesso`) e de editabilidade (`assertEditavel`) já usada pelos outros uploads do laudo. Reaproveita `FileStorageService.upload(file, "laudos/{id}/topicos")`. Retorna `{ "url": "..." }`.
- Ao subir com sucesso, o editor insere `<img src="{url}">` na posição do cursor via a extensão `Image` do Tiptap.
- Sem limite de tamanho de imagem além do já existente globalmente (20MB/arquivo, Spring `multipart`).

### 3. Preview (frontend)

- Troca `<p style={{whiteSpace:'pre-wrap'}}>{t.conteudo}</p>` por um `<div dangerouslySetInnerHTML={{__html: t.conteudo}} className="laudo-rich-content" />`.
- CSS próprio (sem nova dependência) para `.laudo-rich-content` cobrindo `p`, `strong`, `em`, `u`, `ul`, `ol`, `li`, `h2`, `h3`, `img` — fontes e espaçamento combinando com o resto do documento (Times New Roman, tamanho 12pt, como o restante do preview).

### 4. PDF (backend)

- Nova dependência Maven: `com.itextpdf:html2pdf:5.0.5` (extensão oficial "pdfHTML" do próprio iText para converter HTML+CSS em elementos de PDF). Essa versão depende dos módulos `itext-core` na versão `8.0.5` — vamos alinhar a property `itext.version` do `pom.xml` de `8.0.4` para `8.0.5` para evitar conflito de versões entre módulos.
- Em `PdfGeneratorService.addTopicos()`, para tópicos `TEXTO`: no lugar de `new Paragraph(t.getConteudo())`, usar `HtmlConverter.convertToElements(html, converterProperties)` (retorna `List<IElement>`) e adicionar cada elemento ao `Document` existente, mantendo o restante do fluxo (título da seção, JUSTIFIED, etc.) como está.
- O HTML do tópico é envolvido num pequeno `<style>` inline (suportado pelo pdfHTML dentro do fragmento convertido) fixando `font-family: Times` e tamanhos de fonte para `p`/`li` (11pt) e `h2`/`h3` (13pt/12pt em negrito), para o resultado combinar visualmente com o resto do laudo gerado manualmente.
- Imagens: como as URLs do R2/MinIO são públicas (sem autenticação), o `DefaultResourceRetriever` padrão do pdfHTML consegue baixá-las diretamente pela URL absoluta — sem necessidade de um retriever customizado.

### 5. Migração de dados existentes

Nova migration Flyway convertendo texto puro em HTML equivalente, tanto em `laudo_topico` quanto em `modelo_topico` (um modelo alimenta o conteúdo de laudos novos, então precisa do mesmo tratamento):

```sql
UPDATE laudo_topico
SET conteudo = '<p>' || replace(replace(replace(replace(conteudo, '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), E'\n', '</p><p>') || '</p>'
WHERE tipo = 'TEXTO' AND conteudo IS NOT NULL AND conteudo <> '';

UPDATE modelo_topico
SET conteudo = '<p>' || replace(replace(replace(replace(conteudo, '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), E'\n', '</p><p>') || '</p>'
WHERE conteudo IS NOT NULL AND conteudo <> '';
```

(Escapa `&` primeiro, antes de introduzir `&lt;`/`&gt;`, para não escapar em dobro.)

## Testes

- Validação manual: criar um tópico usando todos os recursos (negrito, itálico, sublinhado, marcador, lista numerada, título, imagem), conferir no preview e gerar o PDF, comparando visualmente o resultado.
- Conferir que um tópico com texto legado (já existente antes da migration) continua aparecendo corretamente no preview e no PDF após a migração.
- Conferir que os tópicos automáticos (`REGISTRO_FOTOGRAFICO`, `ITENS_CRITICOS`) continuam funcionando sem alteração.

## Fora de escopo (YAGNI)

- Reaproveitar fotos de Áreas de Inspeção dentro do editor.
- Formatos além de negrito/itálico/sublinhado/marcadores/lista numerada/H2-H3/imagem (cor de texto, alinhamento, links, tabelas).
- Limite de tamanho/dimensão específico para imagens além do limite global já existente.
