'use client'
import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Laudo, LaudoTopico, AreaInspecao } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toaster'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowLeft, Eye, Download, CheckCircle2, GitBranch, Lock, Plus, GripVertical, Trash2, Save, Upload, ImagePlus, X } from 'lucide-react'
import Link from 'next/link'
import { AreasFotosTab } from '@/components/laudos/areas-fotos-tab'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/status'

type TopicoWithKey = LaudoTopico & { _key: string }

const TIPO_LABELS: Record<string, string> = {
  REGISTRO_FOTOGRAFICO: 'Registro Fotográfico',
  ITENS_CRITICOS: 'Itens Críticos',
}

function SortableLaudoTopico({ topico, index, showErrors, readOnly, onChange, onRemove }: {
  topico: TopicoWithKey
  index: number
  showErrors: boolean
  readOnly: boolean
  onChange: (field: 'titulo' | 'conteudo', value: string) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: topico._key, disabled: readOnly })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const isEspecial = topico.tipo === 'REGISTRO_FOTOGRAFICO' || topico.tipo === 'ITENS_CRITICOS'
  const tituloInvalido = showErrors && !isEspecial && !topico.titulo.trim()
  const conteudoInvalido = showErrors && !isEspecial && !topico.conteudo.trim()

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <Card className={isEspecial ? 'border-blue-200 bg-blue-50/40' : undefined}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <button {...attributes} {...listeners} disabled={readOnly}
              className="mt-2 cursor-grab text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">
              <GripVertical className="w-4 h-4" />
            </button>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input value={topico.titulo} onChange={e => onChange('titulo', e.target.value)}
                    placeholder={`Título do tópico ${index + 1}`} disabled={readOnly}
                    className={`font-medium ${tituloInvalido ? 'border-red-400 focus-visible:ring-red-400' : ''}`} />
                  {tituloInvalido && <p className="text-xs text-red-500 mt-1">Título é obrigatório</p>}
                </div>
                {isEspecial && (
                  <span className="text-xs whitespace-nowrap px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                    {TIPO_LABELS[topico.tipo!]}
                  </span>
                )}
              </div>
              {isEspecial ? (
                <p className="text-xs text-slate-500 italic">
                  Conteúdo gerado automaticamente a partir das áreas, fotos e pontos críticos cadastrados. Arraste para reposicionar no documento.
                </p>
              ) : (
                <div>
                  <Textarea value={topico.conteudo} onChange={e => onChange('conteudo', e.target.value)}
                    placeholder="Conteúdo..." rows={4} disabled={readOnly}
                    className={conteudoInvalido ? 'border-red-400 focus-visible:ring-red-400' : ''} />
                  {conteudoInvalido && <p className="text-xs text-red-500 mt-1">Conteúdo é obrigatório</p>}
                </div>
              )}
            </div>
            {!isEspecial && !readOnly && (
              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 mt-1" onClick={onRemove}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LaudoEditorPage() {
  const { id } = useParams()
  const router = useRouter()
  const qc = useQueryClient()
  const [savingTopicos, setSavingTopicos] = useState(false)
  const [finalizando, setFinalizando] = useState(false)
  const [creatingVersion, setCreatingVersion] = useState(false)
  const [topicos, setTopicos] = useState<TopicoWithKey[]>([])
  const [topicosLoaded, setTopicosLoaded] = useState(false)
  const [topicosDirty, setTopicosDirty] = useState(false)
  const [topicosShowErrors, setTopicosShowErrors] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [savingCapa, setSavingCapa] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const novoTopicoRef = useRef<HTMLDivElement>(null)
  const scrollToNovoTopico = useRef(false)
  const [confirmAction, setConfirmAction] = useState<'finalizar' | 'nova-versao' | 'excluir' | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (scrollToNovoTopico.current) {
      scrollToNovoTopico.current = false
      novoTopicoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [topicos.length])

  const { data: laudo, isLoading } = useQuery<Laudo>({
    queryKey: ['laudo', id],
    queryFn: () => api.get(`/laudos/${id}`).then(r => r.data),
  })

  useEffect(() => {
    if (laudo?.topicos && !topicosLoaded) {
      setTopicos(laudo.topicos.map((t, i) => ({ ...t, _key: t.id ? `id-${t.id}` : `key-${Date.now()}-${i}` })))
      setTopicosLoaded(true)
    }
  }, [laudo, topicosLoaded])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEndTopicos(event: any) {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIdx = topicos.findIndex(t => t._key === active.id)
      const newIdx = topicos.findIndex(t => t._key === over.id)
      setTopicos(arrayMove(topicos, oldIdx, newIdx))
      setTopicosDirty(true)
    }
  }

  async function finalizarLaudo() {
    setFinalizando(true)
    try {
      await api.patch(`/laudos/${id}/status`, { status: 'FINALIZADO' })
      qc.invalidateQueries({ queryKey: ['laudo', id] })
      qc.invalidateQueries({ queryKey: ['laudos'] })
      qc.invalidateQueries({ queryKey: ['cliente-laudos'] })
      toast.add({ title: 'Laudo finalizado com sucesso', type: 'success' })
    } catch {
      toast.add({ title: 'Erro ao finalizar laudo', type: 'error' })
    } finally {
      setFinalizando(false)
      setConfirmAction(null)
    }
  }

  async function criarNovaVersao() {
    setCreatingVersion(true)
    try {
      const { data } = await api.post(`/laudos/${id}/nova-versao`)
      qc.invalidateQueries({ queryKey: ['laudos'] })
      qc.invalidateQueries({ queryKey: ['cliente-laudos'] })
      toast.add({ title: `Versão ${data.versao} criada com sucesso`, type: 'success' })
      router.push(`/laudos/${data.id}`)
    } catch {
      toast.add({ title: 'Erro ao criar nova versão', type: 'error' })
      setCreatingVersion(false)
    } finally {
      setConfirmAction(null)
    }
  }

  async function excluirLaudo() {
    setDeleting(true)
    try {
      await api.delete(`/laudos/${id}`)
      qc.invalidateQueries({ queryKey: ['laudos'] })
      qc.invalidateQueries({ queryKey: ['cliente-laudos'] })
      toast.add({ title: 'Laudo excluído com sucesso', type: 'success' })
      router.push('/laudos')
    } catch {
      toast.add({ title: 'Erro ao excluir laudo', type: 'error' })
      setDeleting(false)
      setConfirmAction(null)
    }
  }

  function topicosInvalidos() {
    return topicos.filter(t => (t.tipo ?? 'TEXTO') === 'TEXTO' && (!t.titulo.trim() || !t.conteudo.trim()))
  }

  async function salvarTopicos() {
    if (topicosInvalidos().length > 0) {
      setTopicosShowErrors(true)
      return
    }
    setSavingTopicos(true)
    try {
      const payload = topicos.map((t, i) => ({ id: t.id, titulo: t.titulo, conteudo: t.conteudo, tipo: t.tipo ?? 'TEXTO', ordem: i }))
      await api.put(`/laudos/${id}/topicos`, payload)
      qc.invalidateQueries({ queryKey: ['laudo', id] })
      setTopicosDirty(false)
      setTopicosShowErrors(false)
    } finally { setSavingTopicos(false) }
  }

  function addTopico() {
    setTopicos(prev => [...prev, { _key: `key-${Date.now()}`, titulo: '', conteudo: '', ordem: prev.length, tipo: 'TEXTO' }])
    setTopicosDirty(true)
    scrollToNovoTopico.current = true
  }
  function updateTopico(key: string, field: 'titulo' | 'conteudo', value: string) {
    setTopicos(prev => prev.map(t => t._key === key ? { ...t, [field]: value } : t))
    setTopicosDirty(true)
  }
  function removeTopico(key: string) {
    setTopicos(prev => prev.filter(t => t._key !== key))
    setTopicosDirty(true)
  }

  async function downloadPdf() {
    if (!readOnly) {
      toast.add({ title: 'O PDF só fica disponível depois que o laudo é finalizado.', type: 'info' })
      return
    }
    const res = await api.get(`/laudos/${id}/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a'); a.href = url; a.download = `laudo-${id}.pdf`; a.click()
    URL.revokeObjectURL(url)
  }

  function laudoBasePayload() {
    return {
      clienteId: laudo!.clienteId,
      numeroArt: laudo!.numeroArt,
      dataVisita: laudo!.dataVisita,
      dataEmissao: laudo!.dataEmissao,
      quemAcompanhou: laudo!.quemAcompanhou,
      mostrarCapa: laudo!.mostrarCapa,
      mostrarSumario: laudo!.mostrarSumario,
      mostrarAssinaturaEngenheiro: laudo!.mostrarAssinaturaEngenheiro,
      mostrarAssinaturaCliente: laudo!.mostrarAssinaturaCliente,
    }
  }

  async function toggleCapa(value: boolean) {
    qc.setQueryData(['laudo', id], (old: Laudo) => ({ ...old, mostrarCapa: value }))
    const { data } = await api.put(`/laudos/${id}`, { ...laudoBasePayload(), mostrarCapa: value })
    qc.setQueryData(['laudo', id], data)
  }

  async function toggleSumario(value: boolean) {
    qc.setQueryData(['laudo', id], (old: Laudo) => ({ ...old, mostrarSumario: value }))
    const { data } = await api.put(`/laudos/${id}`, { ...laudoBasePayload(), mostrarSumario: value })
    qc.setQueryData(['laudo', id], data)
  }

  async function toggleAssinaturaEngenheiro(value: boolean) {
    qc.setQueryData(['laudo', id], (old: Laudo) => ({ ...old, mostrarAssinaturaEngenheiro: value }))
    const { data } = await api.put(`/laudos/${id}`, { ...laudoBasePayload(), mostrarAssinaturaEngenheiro: value })
    qc.setQueryData(['laudo', id], data)
  }

  async function toggleAssinaturaCliente(value: boolean) {
    qc.setQueryData(['laudo', id], (old: Laudo) => ({ ...old, mostrarAssinaturaCliente: value }))
    const { data } = await api.put(`/laudos/${id}`, { ...laudoBasePayload(), mostrarAssinaturaCliente: value })
    qc.setQueryData(['laudo', id], data)
  }

  async function uploadLogoCapa(file: File) {
    setUploadingLogo(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post(`/laudos/${id}/logo-capa`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      qc.setQueryData(['laudo', id], data)
    } finally {
      setUploadingLogo(false)
    }
  }

  async function removerLogoCapa() {
    const { data } = await api.delete(`/laudos/${id}/logo-capa`)
    qc.setQueryData(['laudo', id], data)
  }

  async function salvarTituloCapa(titulo: string, subtitulo: string) {
    setSavingCapa(true)
    try {
      const { data } = await api.put(`/laudos/${id}`, { ...laudoBasePayload(), tituloCapa: titulo, subtituloCapa: subtitulo })
      qc.setQueryData(['laudo', id], data)
    } finally {
      setSavingCapa(false)
    }
  }

  if (isLoading || !laudo) return <div className="p-8 text-slate-500">Carregando...</div>

  const readOnly = laudo.status === 'FINALIZADO'

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/laudos" className="text-slate-500 hover:text-slate-700"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{laudo.clienteNome}</h1>
            <p className="text-sm text-slate-500">{laudo.engenheiroNome} • {laudo.dataVisita ?? 'Sem data de visita'}</p>
          </div>
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLORS[laudo.status]}`}>
            {STATUS_LABELS[laudo.status]}
          </span>
          {laudo.versao > 1 && (
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-purple-100 text-purple-700 whitespace-nowrap">
              Versão {laudo.versao}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {!readOnly && (
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setConfirmAction('finalizar')} disabled={finalizando}>
              <CheckCircle2 className="w-4 h-4 mr-2" />{finalizando ? 'Finalizando...' : 'Finalizar Laudo'}
            </Button>
          )}
          {readOnly && (
            <Button variant="outline" onClick={() => setConfirmAction('nova-versao')} disabled={creatingVersion}>
              <GitBranch className="w-4 h-4 mr-2" />{creatingVersion ? 'Criando...' : 'Criar Nova Versão'}
            </Button>
          )}
          {!readOnly && (
            <Button variant="ghost" className="text-red-400 hover:text-red-600" title="Excluir laudo"
              onClick={() => setConfirmAction('excluir')}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Link href={`/laudos/${id}/preview`}>
            <Button variant="outline"><Eye className="w-4 h-4 mr-2" /> Preview</Button>
          </Link>
          <Button variant="outline" onClick={downloadPdf}
            className={!readOnly ? 'opacity-50' : undefined}
            title={readOnly ? undefined : 'Finalize o laudo para poder baixar o PDF'}>
            <Download className="w-4 h-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      {readOnly && (
        <div className="mb-4 flex items-center gap-2 text-sm bg-slate-100 border border-slate-200 text-slate-600 rounded-lg px-4 py-2">
          <Lock className="w-4 h-4 shrink-0" />
          <span>Este laudo está <strong>finalizado</strong> e não pode mais ser editado. Use "Criar Nova Versão" para continuar a partir dele.</span>
        </div>
      )}

      {laudo.laudoOrigemId && (
        <div className="mb-4 flex items-center gap-2 text-sm bg-purple-50 border border-purple-200 text-purple-800 rounded-lg px-4 py-2">
          <GitBranch className="w-4 h-4 shrink-0" />
          <span>
            Esta é a <strong>versão {laudo.versao}</strong> deste laudo, criada a partir da{' '}
            <Link href={`/laudos/${laudo.laudoOrigemId}`} className="underline font-medium">
              versão {laudo.laudoOrigemVersao} (laudo #{laudo.laudoOrigemId})
            </Link>.
          </span>
        </div>
      )}

      <Tabs defaultValue="info">
        <TabsList className="mb-6">
          <TabsTrigger value="info">Dados Gerais</TabsTrigger>
          <TabsTrigger value="topicos">Tópicos</TabsTrigger>
          <TabsTrigger value="areas">Áreas / Fotos</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Cliente" value={`${laudo.clienteNome} ${laudo.clienteCnpj ? '(' + laudo.clienteCnpj + ')' : ''}`} />
                <InfoRow label="Engenheiro" value={`${laudo.engenheiroNome} — ${laudo.engenheiroCrea}`} />
                <InfoRow label="Número ART" value={laudo.numeroArt ?? '—'} />
                <InfoRow label="Versão" value={String(laudo.versao)} />
                <InfoRow label="Data da Visita" value={laudo.dataVisita ?? '—'} />
                <InfoRow label="Data de Emissão" value={laudo.dataEmissao ?? '—'} />
                <div className="col-span-2">
                  <InfoRow label="Quem acompanhou" value={laudo.quemAcompanhou ?? '—'} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topicos">
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm text-slate-500">{topicos.length} tópico(s)</p>
            {!readOnly && (
              <div className="flex items-center gap-3">
                {topicosDirty && !savingTopicos && (
                  <span className="text-xs text-amber-600 font-medium">Alterações não salvas</span>
                )}
                <Button variant="outline" onClick={addTopico}><Plus className="w-4 h-4 mr-2" />Adicionar</Button>
                <Button className="bg-blue-700 hover:bg-blue-800" onClick={salvarTopicos} disabled={savingTopicos || !topicosDirty}>
                  <Save className="w-4 h-4 mr-2" />{savingTopicos ? 'Salvando...' : 'Salvar Tópicos'}
                </Button>
              </div>
            )}
          </div>
          {!readOnly && (
            <>
              <p className="text-xs text-slate-400 mb-1">
                Adicionar, editar, remover ou arrastar tópicos só altera o rascunho local — clique em <strong>Salvar Tópicos</strong> para gravar as mudanças no laudo.
              </p>
              <p className="text-xs text-red-500 mb-4 h-4">
                {topicosShowErrors && topicosInvalidos().length > 0 && 'Preencha título e conteúdo de todos os tópicos antes de salvar.'}
              </p>
            </>
          )}
          {topicos.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
              <p className="mb-3">Nenhum tópico adicionado</p>
              {!readOnly && (
                <Button variant="outline" onClick={addTopico}><Plus className="w-4 h-4 mr-2" />Adicionar tópico</Button>
              )}
            </div>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndTopicos}>
            <SortableContext items={topicos.map(t => t._key)} strategy={verticalListSortingStrategy}>
              {topicos.map((t, i) => (
                <div key={t._key} ref={i === topicos.length - 1 ? novoTopicoRef : undefined}>
                  <SortableLaudoTopico
                    topico={t}
                    index={i}
                    showErrors={topicosShowErrors}
                    readOnly={readOnly}
                    onChange={(field, value) => updateTopico(t._key, field, value)}
                    onRemove={() => removeTopico(t._key)}
                  />
                </div>
              ))}
            </SortableContext>
          </DndContext>
        </TabsContent>

        <TabsContent value="areas">
          <AreasFotosTab laudoId={Number(id)} readOnly={readOnly} />
        </TabsContent>

        <TabsContent value="config">
          <div className="space-y-6 max-w-xl">
            <Card>
              <CardHeader><CardTitle className="text-base">Seções do documento</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Incluir Capa</p>
                    <p className="text-xs text-slate-500">Página de capa com título, cliente e responsável técnico</p>
                  </div>
                  <Switch checked={laudo.mostrarCapa} onCheckedChange={toggleCapa} disabled={readOnly} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Incluir Sumário</p>
                    <p className="text-xs text-slate-500">Página de sumário com índice das seções</p>
                  </div>
                  <Switch checked={laudo.mostrarSumario} onCheckedChange={toggleSumario} disabled={readOnly} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Assinaturas</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-slate-500 -mt-2">Escolha quais assinaturas devem aparecer ao final do laudo. Se nenhuma for marcada, a seção de assinaturas não é incluída.</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Assinatura do Engenheiro</p>
                    <p className="text-xs text-slate-500">Responsável técnico — usa a assinatura cadastrada no perfil, se houver</p>
                  </div>
                  <Switch checked={laudo.mostrarAssinaturaEngenheiro} onCheckedChange={toggleAssinaturaEngenheiro} disabled={readOnly} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Assinatura do Cliente</p>
                    <p className="text-xs text-slate-500">Espaço para o cliente assinar, com nome e CNPJ</p>
                  </div>
                  <Switch checked={laudo.mostrarAssinaturaCliente} onCheckedChange={toggleAssinaturaCliente} disabled={readOnly} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Título e subtítulo da capa</CardTitle></CardHeader>
              <CardContent>
                <CapaTituloForm
                  tituloCapa={laudo.tituloCapa}
                  subtituloCapa={laudo.subtituloCapa}
                  saving={savingCapa}
                  readOnly={readOnly}
                  onSave={salvarTituloCapa}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Logo da capa</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500 mb-4">Logo exibida na capa do laudo (empresa ou engenheiro responsável). Se não informada, usa a logo do cadastro do engenheiro.</p>
                {laudo.logoCapaUrl ? (
                  <div className="flex items-start gap-4">
                    <img src={laudo.logoCapaUrl} alt="Logo da capa" className="h-28 object-contain border rounded p-2 bg-slate-50" />
                    {!readOnly && (
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                          <Upload className="w-4 h-4 mr-2" />{uploadingLogo ? 'Enviando...' : 'Trocar'}
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700" onClick={removerLogoCapa}>
                          <X className="w-4 h-4 mr-1" /> Remover
                        </Button>
                      </div>
                    )}
                  </div>
                ) : readOnly ? (
                  <p className="text-sm text-slate-400">Nenhuma logo definida.</p>
                ) : (
                  <div
                    className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <ImagePlus className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm text-slate-500">{uploadingLogo ? 'Enviando...' : 'Clique para fazer upload da logo'}</p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG ou WebP</p>
                  </div>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogoCapa(f); e.target.value = '' }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>

      <Dialog open={confirmAction !== null} onOpenChange={open => !open && setConfirmAction(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'finalizar' && 'Finalizar Laudo'}
              {confirmAction === 'nova-versao' && 'Criar Nova Versão'}
              {confirmAction === 'excluir' && 'Excluir Laudo'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === 'finalizar' && 'Depois de finalizado, este laudo não poderá mais ser editado — para alterar, será necessário criar uma nova versão. Deseja continuar?'}
              {confirmAction === 'nova-versao' && 'Uma cópia editável deste laudo será criada em Rascunho, com referência a este laudo original. Deseja continuar?'}
              {confirmAction === 'excluir' && 'Este laudo será excluído permanentemente. Esta ação não pode ser desfeita. Deseja continuar?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancelar</Button>
            {confirmAction === 'excluir' ? (
              <Button variant="destructive" onClick={excluirLaudo} disabled={deleting}>
                {deleting ? 'Excluindo...' : 'Excluir'}
              </Button>
            ) : (
              <Button
                className={confirmAction === 'finalizar' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-700 hover:bg-blue-800 text-white'}
                onClick={confirmAction === 'finalizar' ? finalizarLaudo : criarNovaVersao}
                disabled={finalizando || creatingVersion}
              >
                {confirmAction === 'finalizar'
                  ? (finalizando ? 'Finalizando...' : 'Finalizar')
                  : (creatingVersion ? 'Criando...' : 'Criar Nova Versão')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}

function CapaTituloForm({ tituloCapa, subtituloCapa, saving, readOnly, onSave }: {
  tituloCapa: string | null
  subtituloCapa: string | null
  saving: boolean
  readOnly: boolean
  onSave: (titulo: string, subtitulo: string) => Promise<void>
}) {
  const [titulo, setTitulo] = useState(tituloCapa ?? 'LAUDO TÉCNICO DAS INSTALAÇÕES ELÉTRICAS')
  const [subtitulo, setSubtitulo] = useState(subtituloCapa ?? 'NR-10')

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-slate-500 mb-1 block">Título</Label>
        <Input
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          placeholder="LAUDO TÉCNICO DAS INSTALAÇÕES ELÉTRICAS"
          disabled={readOnly}
        />
      </div>
      <div>
        <Label className="text-xs text-slate-500 mb-1 block">Subtítulo</Label>
        <Input
          value={subtitulo}
          onChange={e => setSubtitulo(e.target.value)}
          placeholder="NR-10"
          disabled={readOnly}
        />
      </div>
      {!readOnly && (
        <Button
          size="sm"
          className="bg-blue-700 hover:bg-blue-800"
          onClick={() => onSave(titulo, subtitulo)}
          disabled={saving}
        >
          <Save className="w-4 h-4 mr-2" />{saving ? 'Salvando...' : 'Salvar'}
        </Button>
      )}
    </div>
  )
}
