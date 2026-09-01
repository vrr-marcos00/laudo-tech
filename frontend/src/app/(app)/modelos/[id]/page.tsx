'use client'
import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api, { getErrorMessage } from '@/lib/api'
import { ModeloLaudo, ModeloTopico } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from '@/components/ui/toaster'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowLeft, Plus, GripVertical, Trash2, Save } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

function SortableTopico({ topico, index, showErrors, onChange, onRemove }: {
  topico: ModeloTopico & { _key: string }
  index: number
  showErrors: boolean
  onChange: (field: 'titulo' | 'conteudo', value: string) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: topico._key })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const tituloInvalido = showErrors && !topico.titulo.trim()
  const conteudoInvalido = showErrors && !topico.conteudo.trim()

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <button {...attributes} {...listeners} className="mt-2 cursor-grab text-slate-400 hover:text-slate-600">
              <GripVertical className="w-4 h-4" />
            </button>
            <div className="flex-1 space-y-2">
              <div>
                <Input
                  value={topico.titulo}
                  onChange={e => onChange('titulo', e.target.value)}
                  placeholder={`Título do tópico ${index + 1}`}
                  className={`font-medium ${tituloInvalido ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                />
                {tituloInvalido && <p className="text-xs text-red-500 mt-1">Título é obrigatório</p>}
              </div>
              <div>
                <Textarea
                  value={topico.conteudo}
                  onChange={e => onChange('conteudo', e.target.value)}
                  placeholder="Conteúdo do tópico..."
                  rows={4}
                  className={conteudoInvalido ? 'border-red-400 focus-visible:ring-red-400' : ''}
                />
                {conteudoInvalido && <p className="text-xs text-red-500 mt-1">Conteúdo é obrigatório</p>}
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 mt-1" onClick={onRemove}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

type TopicoWithKey = ModeloTopico & { _key: string }

export default function ModeloTopicoEditorPage() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [topicos, setTopicos] = useState<TopicoWithKey[]>([])
  const [saving, setSaving] = useState(false)
  const [topicosLoaded, setTopicosLoaded] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const novoTopicoRef = useRef<HTMLDivElement>(null)
  const scrollToNovoTopico = useRef(false)

  const { data: modelo } = useQuery<ModeloLaudo>({
    queryKey: ['modelo', id],
    queryFn: () => api.get(`/modelos/${id}`).then(r => r.data),
  })

  useEffect(() => {
    if (modelo?.topicos && !topicosLoaded) {
      setTopicos(modelo.topicos.map((t, i) => ({ ...t, _key: `key-${Date.now()}-${i}` })))
      setTopicosLoaded(true)
    }
  }, [modelo, topicosLoaded])

  useEffect(() => {
    if (scrollToNovoTopico.current) {
      scrollToNovoTopico.current = false
      novoTopicoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [topicos.length])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: any) {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIdx = topicos.findIndex(t => t._key === active.id)
      const newIdx = topicos.findIndex(t => t._key === over.id)
      setTopicos(arrayMove(topicos, oldIdx, newIdx))
      setDirty(true)
    }
  }

  function addTopico() {
    setTopicos(prev => [...prev, { _key: `key-${Date.now()}`, titulo: '', conteudo: '', ordem: prev.length }])
    setDirty(true)
    scrollToNovoTopico.current = true
  }

  function updateTopico(key: string, field: 'titulo' | 'conteudo', value: string) {
    setTopicos(prev => prev.map(t => t._key === key ? { ...t, [field]: value } : t))
    setDirty(true)
  }

  function removeTopico(key: string) {
    setTopicos(prev => prev.filter(t => t._key !== key))
    setDirty(true)
  }

  function topicosInvalidos() {
    return topicos.filter(t => !t.titulo.trim() || !t.conteudo.trim())
  }

  async function save() {
    if (topicosInvalidos().length > 0) {
      setShowErrors(true)
      return
    }
    setSaving(true)
    try {
      const payload = {
        nome: modelo!.nome,
        descricao: modelo!.descricao,
        topicos: topicos.map((t, i) => ({ titulo: t.titulo, conteudo: t.conteudo, ordem: i })),
      }
      await api.put(`/modelos/${id}`, payload)
      qc.invalidateQueries({ queryKey: ['modelo', id] })
      setDirty(false)
      setShowErrors(false)
    } catch (err) {
      toast.add({ title: getErrorMessage(err, 'Erro ao salvar modelo'), type: 'error' })
    } finally { setSaving(false) }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/modelos" className="text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{modelo?.nome ?? 'Carregando...'}</h1>
            <p className="text-sm text-slate-500">Editor de Tópicos</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {dirty && !saving && (
            <span className="text-xs text-amber-600 font-medium">Alterações não salvas</span>
          )}
          <Button variant="outline" onClick={addTopico}>
            <Plus className="w-4 h-4 mr-2" /> Adicionar Tópico
          </Button>
          <Button className="bg-blue-700 hover:bg-blue-800" onClick={save} disabled={saving || !dirty}>
            <Save className="w-4 h-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-1">
        Adicionar, editar, remover ou arrastar tópicos só altera o rascunho local — clique em <strong>Salvar</strong> para gravar as mudanças no modelo.
      </p>
      <p className="text-xs text-red-500 mb-4 h-4">
        {showErrors && topicosInvalidos().length > 0 && 'Preencha título e conteúdo de todos os tópicos antes de salvar.'}
      </p>

      {topicos.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl">
          <p className="text-slate-400 mb-3">Nenhum tópico adicionado</p>
          <Button variant="outline" onClick={addTopico}><Plus className="w-4 h-4 mr-2" />Adicionar primeiro tópico</Button>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={topicos.map(t => t._key)} strategy={verticalListSortingStrategy}>
          {topicos.map((t, i) => (
            <div key={t._key} ref={i === topicos.length - 1 ? novoTopicoRef : undefined}>
              <SortableTopico
                topico={t}
                index={i}
                showErrors={showErrors}
                onChange={(field, value) => updateTopico(t._key, field, value)}
                onRemove={() => removeTopico(t._key)}
              />
            </div>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}
