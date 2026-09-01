'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api, { getErrorMessage } from '@/lib/api'
import { ModeloLaudo } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toaster'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, BookOpen, FileText, Trash2, Edit } from 'lucide-react'
import Link from 'next/link'
import { Pagination, paginate } from '@/components/ui/pagination'

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  descricao: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function ModelosPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editModelo, setEditModelo] = useState<ModeloLaudo | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  const { data: modelos = [] } = useQuery<ModeloLaudo[]>({
    queryKey: ['modelos'],
    queryFn: () => api.get('/modelos').then(r => r.data),
  })

  const modelosPagina = paginate(modelos, page)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      if (editModelo) await api.put(`/modelos/${editModelo.id}`, { ...data, topicos: editModelo.topicos ?? [] })
      else await api.post('/modelos', { ...data, topicos: [] })
      qc.invalidateQueries({ queryKey: ['modelos'] })
      setOpen(false); setEditModelo(null); reset()
    } catch (err) {
      toast.add({ title: getErrorMessage(err, 'Erro ao salvar modelo'), type: 'error' })
    } finally { setLoading(false) }
  }

  async function deletar(id: number) {
    if (!confirm('Excluir este modelo?')) return
    try {
      await api.delete(`/modelos/${id}`)
      qc.invalidateQueries({ queryKey: ['modelos'] })
    } catch (err) {
      toast.add({ title: getErrorMessage(err, 'Erro ao excluir modelo'), type: 'error' })
    }
  }

  function openEdit(m: ModeloLaudo) {
    reset({ nome: m.nome, descricao: m.descricao ?? '' })
    setEditModelo(m)
    setOpen(true)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Modelos de Laudo</h1>
        <Button className="bg-blue-700 hover:bg-blue-800" onClick={() => { reset(); setEditModelo(null); setOpen(true) }}>
          <Plus className="w-4 h-4 mr-2" /> Novo Modelo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modelosPagina.map(m => (
          <Card key={m.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{m.nome}</p>
                  {m.descricao && <p className="text-xs text-slate-500 line-clamp-2 mt-1">{m.descricao}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                <FileText className="w-3 h-3" />
                {(m.topicos ?? []).length} tópico(s)
              </div>
              <div className="flex gap-2">
                <Link href={`/modelos/${m.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">Editar Tópicos</Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => openEdit(m)}><Edit className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deletar(m.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {modelos.length === 0 && (
          <div className="col-span-3 text-center py-16 text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum modelo criado</p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <Pagination page={page} totalItems={modelos.length} onPageChange={setPage} />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editModelo ? 'Editar Modelo' : 'Novo Modelo'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input {...register('nome')} placeholder="Ex: Laudo NR-10 Padrão" />
              {errors.nome && <p className="text-red-500 text-xs">{errors.nome.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Textarea {...register('descricao')} rows={3} />
            </div>
            <Button type="submit" className="w-full bg-blue-700 hover:bg-blue-800" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
