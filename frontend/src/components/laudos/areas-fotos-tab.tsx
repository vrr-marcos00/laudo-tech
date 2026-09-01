'use client'
import { useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { AreaInspecao, PontoAnotacao } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { FotoAnnotator } from './foto-annotator'
import { Plus, Upload, Trash2, ZoomIn } from 'lucide-react'

interface Props {
  laudoId: number
  readOnly?: boolean
}

type DeleteTarget = { type: 'area'; id: number; label: string } | { type: 'foto'; id: number; label: string }

export function AreasFotosTab({ laudoId, readOnly = false }: Props) {
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadAreaRef = useRef<number | null>(null)
  const [newAreaName, setNewAreaName] = useState('')
  const [addingArea, setAddingArea] = useState(false)
  const [uploadingTo, setUploadingTo] = useState<number | null>(null)
  const [annotating, setAnnotating] = useState<{ fotoId: number; fotoUrl: string; pontos: PontoAnotacao[] } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  const { data: areas = [] } = useQuery<AreaInspecao[]>({
    queryKey: ['areas', laudoId],
    queryFn: () => api.get(`/laudos/${laudoId}/areas`).then(r => r.data),
  })

  async function criarArea() {
    if (!newAreaName.trim()) return
    await api.post(`/laudos/${laudoId}/areas`, { nome: newAreaName })
    qc.invalidateQueries({ queryKey: ['areas', laudoId] })
    setNewAreaName('')
    setAddingArea(false)
  }

  async function confirmarDelete() {
    if (!deleteTarget) return
    if (deleteTarget.type === 'area') {
      await api.delete(`/laudos/${laudoId}/areas/${deleteTarget.id}`)
    } else {
      await api.delete(`/fotos/${deleteTarget.id}`)
    }
    qc.invalidateQueries({ queryKey: ['areas', laudoId] })
    setDeleteTarget(null)
  }

  async function uploadFoto(areaId: number, file: File) {
    setUploadingTo(areaId)
    try {
      const form = new FormData()
      form.append('file', file)
      await api.post(`/areas/${areaId}/fotos`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      qc.invalidateQueries({ queryKey: ['areas', laudoId] })
    } finally { setUploadingTo(null) }
  }

  async function salvarPontos(fotoId: number, pontos: PontoAnotacao[]) {
    await api.post(`/fotos/${fotoId}/pontos`, pontos)
    qc.invalidateQueries({ queryKey: ['areas', laudoId] })
    setAnnotating(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{areas.length} área(s) de inspeção</p>
        {!readOnly && (
          <Button variant="outline" onClick={() => setAddingArea(true)}>
            <Plus className="w-4 h-4 mr-2" /> Nova Área
          </Button>
        )}
      </div>

      {!readOnly && addingArea && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <Label className="mb-1 block">Nome da área</Label>
            <div className="flex gap-2">
              <Input value={newAreaName} onChange={e => setNewAreaName(e.target.value)}
                placeholder="Ex: Cabine Primária, Painel Elétrico..." onKeyDown={e => e.key === 'Enter' && criarArea()} />
              <Button className="bg-blue-700 hover:bg-blue-800" onClick={criarArea}>Criar</Button>
              <Button variant="ghost" onClick={() => setAddingArea(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {areas.map(area => (
        <Card key={area.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-blue-700">{area.nome}</CardTitle>
              {!readOnly && (
                <div className="flex gap-2">
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef}
                    onChange={async e => {
                      const file = e.target.files?.[0]
                      if (file && uploadAreaRef.current !== null) await uploadFoto(uploadAreaRef.current, file)
                      e.target.value = ''
                    }} />
                  <Button variant="outline" size="sm" disabled={uploadingTo === area.id}
                    onClick={() => { uploadAreaRef.current = area.id; fileInputRef.current?.click() }}>
                    <Upload className="w-3 h-3 mr-1" />
                    {uploadingTo === area.id ? 'Enviando...' : 'Adicionar Foto'}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600"
                    onClick={() => setDeleteTarget({ type: 'area', id: area.id, label: area.nome })}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {area.fotos.length === 0
              ? <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center text-slate-400">
                  <Upload className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhuma foto. Clique em "Adicionar Foto".</p>
                </div>
              : <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {area.fotos.map(foto => (
                    <div key={foto.id} className="relative group rounded-lg overflow-hidden border bg-slate-100">
                      <img src={foto.url} alt={foto.nomeArquivo ?? ''} className="w-full h-36 object-cover" />
                      {foto.pontos && foto.pontos.length > 0 && (
                        <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {foto.pontos.length} ponto(s)
                        </div>
                      )}
                      {!readOnly && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button size="sm" variant="secondary"
                            onClick={() => setAnnotating({ fotoId: foto.id, fotoUrl: foto.url, pontos: foto.pontos ?? [] })}>
                            <ZoomIn className="w-3 h-3 mr-1" /> Anotar
                          </Button>
                          <Button size="sm" variant="destructive"
                            onClick={() => setDeleteTarget({ type: 'foto', id: foto.id, label: foto.nomeArquivo ?? 'foto' })}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
            }
          </CardContent>
        </Card>
      ))}

      {areas.length === 0 && !addingArea && (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
          <p className="mb-3">Nenhuma área criada ainda</p>
          <Button variant="outline" onClick={() => setAddingArea(true)}>
            <Plus className="w-4 h-4 mr-2" />Criar primeira área
          </Button>
        </div>
      )}

      {/* Annotation Modal */}
      <Dialog open={!!annotating} onOpenChange={open => !open && setAnnotating(null)}>
        <DialogContent className="max-w-[98vw] sm:max-w-[98vw] w-full h-[94vh] flex flex-col p-4 gap-2">
          <DialogHeader className="shrink-0">
            <DialogTitle>Anotação de Foto</DialogTitle>
          </DialogHeader>
          {annotating && (
            <div className="flex-1 min-h-0">
              <FotoAnnotator
                fotoUrl={annotating.fotoUrl}
                fotoId={annotating.fotoId}
                initialPontos={annotating.pontos}
                onSave={pontos => salvarPontos(annotating.fotoId, pontos)}
                onClose={() => setAnnotating(null)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteTarget !== null} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{deleteTarget?.type === 'area' ? 'Excluir Área' : 'Excluir Foto'}</DialogTitle>
            <DialogDescription>
              {deleteTarget?.type === 'area'
                ? `Excluirá a área "${deleteTarget.label}" e todas as suas fotos. Esta ação não pode ser desfeita.`
                : 'Esta foto será excluída permanentemente. Deseja continuar?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
