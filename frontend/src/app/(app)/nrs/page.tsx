'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api, { getErrorMessage } from '@/lib/api'
import { NrCatalogo } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/toaster'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Shield, Search, Trash2, Edit } from 'lucide-react'
import { Pagination, paginate } from '@/components/ui/pagination'

const PRIORITY_COLORS: Record<string, string> = {
  CRITICO: 'bg-red-100 text-red-700 border-red-200',
  ALTO: 'bg-orange-100 text-orange-700 border-orange-200',
  MEDIO: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  BAIXO: 'bg-blue-100 text-blue-700 border-blue-200',
}

const schema = z.object({
  numeroNr: z.string().min(1),
  artigo: z.string().optional(),
  titulo: z.string().min(1),
  descricao: z.string().optional(),
  solucaoPadrao: z.string().optional(),
  prioridade: z.enum(['CRITICO', 'ALTO', 'MEDIO', 'BAIXO']),
})
type FormData = z.infer<typeof schema>

export default function NrsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [prioridade, setPrioridade] = useState<string>('')
  const [open, setOpen] = useState(false)
  const [editNr, setEditNr] = useState<NrCatalogo | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  const { data: nrs = [] } = useQuery<NrCatalogo[]>({
    queryKey: ['nrs', search, prioridade],
    queryFn: () => api.get('/nrs', { params: { search: search || undefined, prioridade: prioridade || undefined } }).then(r => r.data),
  })

  const nrsPagina = paginate(nrs, page)

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { prioridade: 'MEDIO' },
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      if (editNr) await api.put(`/nrs/${editNr.id}`, data)
      else await api.post('/nrs', data)
      qc.invalidateQueries({ queryKey: ['nrs'] })
      setOpen(false); setEditNr(null); reset()
    } catch (err) {
      toast.add({ title: getErrorMessage(err, 'Erro ao salvar norma'), type: 'error' })
    } finally { setLoading(false) }
  }

  async function confirmarDelete() {
    if (!deleteId) return
    try {
      await api.delete(`/nrs/${deleteId}`)
      qc.invalidateQueries({ queryKey: ['nrs'] })
      setDeleteId(null)
    } catch (err) {
      toast.add({ title: getErrorMessage(err, 'Erro ao excluir norma'), type: 'error' })
    }
  }

  function openEdit(nr: NrCatalogo) {
    reset({ numeroNr: nr.numeroNr, artigo: nr.artigo ?? '', titulo: nr.titulo, descricao: nr.descricao ?? '', solucaoPadrao: nr.solucaoPadrao ?? '', prioridade: nr.prioridade })
    setEditNr(nr); setOpen(true)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Catálogo de Normas</h1>
        <Button className="bg-blue-700 hover:bg-blue-800" onClick={() => { reset({ prioridade: 'MEDIO' }); setEditNr(null); setOpen(true) }}>
          <Plus className="w-4 h-4 mr-2" /> Nova Norma
        </Button>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input className="pl-10" placeholder="Buscar por número ou título..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <Select value={prioridade} onValueChange={v => { setPrioridade(v ?? ''); setPage(1) }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            <SelectItem value="CRITICO">Crítico</SelectItem>
            <SelectItem value="ALTO">Alto</SelectItem>
            <SelectItem value="MEDIO">Médio</SelectItem>
            <SelectItem value="BAIXO">Baixo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-3">
        {nrsPagina.map(nr => (
          <Card key={nr.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-blue-700 text-sm">{nr.numeroNr}{nr.artigo ? ` – ${nr.artigo}` : ''}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[nr.prioridade]}`}>{nr.prioridade}</span>
                  </div>
                  <p className="font-medium text-sm text-slate-800 mb-1">{nr.titulo}</p>
                  {nr.solucaoPadrao && <p className="text-xs text-slate-500 line-clamp-2">Solução: {nr.solucaoPadrao}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(nr)}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => setDeleteId(nr.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {nrs.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma norma encontrada</p>
          </div>
        )}
      </div>

      <Pagination page={page} totalItems={nrs.length} onPageChange={setPage} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editNr ? 'Editar Norma' : 'Nova Norma'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Número da Norma *</Label>
                <Input {...register('numeroNr')} placeholder="NR-10 ou NBR-5410" />
                {errors.numeroNr && <p className="text-red-500 text-xs">{errors.numeroNr.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Artigo</Label>
                <Input {...register('artigo')} placeholder="10.2.1" />
              </div>
              <div className="space-y-1">
                <Label>Prioridade *</Label>
                <Controller control={control} name="prioridade" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CRITICO">Crítico</SelectItem>
                      <SelectItem value="ALTO">Alto</SelectItem>
                      <SelectItem value="MEDIO">Médio</SelectItem>
                      <SelectItem value="BAIXO">Baixo</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="col-span-3 space-y-1">
                <Label>Título / Não Conformidade *</Label>
                <Input {...register('titulo')} placeholder="Partes vivas expostas" />
                {errors.titulo && <p className="text-red-500 text-xs">{errors.titulo.message}</p>}
              </div>
              <div className="col-span-3 space-y-1">
                <Label>Descrição</Label>
                <Textarea {...register('descricao')} rows={2} />
              </div>
              <div className="col-span-3 space-y-1">
                <Label>Solução Padrão (Plano de Ação)</Label>
                <Textarea {...register('solucaoPadrao')} rows={3} placeholder="Descreva a solução recomendada..." />
              </div>
            </div>
            <Button type="submit" className="w-full bg-blue-700 hover:bg-blue-800" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Norma'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Norma</DialogTitle>
            <DialogDescription>Esta ação não pode ser desfeita. Deseja continuar?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
