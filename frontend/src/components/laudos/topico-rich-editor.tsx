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
  laudoId?: number
  modeloId?: number
  disabled?: boolean
  invalid?: boolean
}

export function TopicoRichEditor({ value, onChange, laudoId, modeloId, disabled, invalid }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadUrl = laudoId != null ? `/laudos/${laudoId}/topicos/imagens`
    : modeloId != null ? `/modelos/${modeloId}/topicos/imagens`
    : null

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        blockquote: false,
        code: false,
        codeBlock: false,
        strike: false,
        horizontalRule: false,
      }),
      Underline,
      TiptapImage,
    ],
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
    if (uploadUrl == null) return
    const form = new FormData()
    form.append('file', file)
    try {
      const { data } = await api.post(uploadUrl, form, {
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
          {uploadUrl != null && (
            <>
              <Separator orientation="vertical" className="h-5 mx-1" />
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => fileInputRef.current?.click()}>
                <ImagePlus className="w-4 h-4" />
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = '' }} />
            </>
          )}
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  )
}
