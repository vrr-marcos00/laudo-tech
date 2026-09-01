'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api, { getErrorMessage } from '@/lib/api'
import { Cliente } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ClienteForm } from '@/components/clientes/cliente-form'
import { toast } from '@/components/ui/toaster'
import { Plus, Search, Building2, Mail, Phone, MapPin, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Pagination, paginate } from '@/components/ui/pagination'

export default function ClientesPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { data: clientes = [] } = useQuery<Cliente[]>({
    queryKey: ['clientes', search],
    queryFn: () => api.get('/clientes', { params: { search: search || undefined } }).then(r => r.data),
  })

  const clientesPagina = paginate(clientes, page)

  const criar = useMutation({
    mutationFn: (data: any) => api.post('/clientes', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clientes'] }); setOpen(false) },
  })

  async function handleCreate(data: any) {
    setLoading(true)
    try {
      await criar.mutateAsync(data)
    } catch (err) {
      toast.add({ title: getErrorMessage(err, 'Erro ao criar cliente'), type: 'error' })
    } finally { setLoading(false) }
  }

  async function confirmarExclusao() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/clientes/${deleteTarget.id}`)
      qc.invalidateQueries({ queryKey: ['clientes'] })
      toast.add({ title: 'Cliente excluído com sucesso', type: 'success' })
      setDeleteTarget(null)
    } catch (err) {
      toast.add({ title: getErrorMessage(err, 'Erro ao excluir cliente'), type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
        <Button className="bg-blue-700 hover:bg-blue-800" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Novo Cliente
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input className="pl-10" placeholder="Buscar por nome ou CNPJ..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientesPagina.map(c => (
          <Link key={c.id} href={`/clientes/${c.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  {c.fotoUrl
                    ? <img src={c.fotoUrl} alt={c.nome} className="w-12 h-12 rounded-lg object-cover" />
                    : <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{c.nome}</p>
                    {c.cnpj && <p className="text-xs text-slate-500">{c.cnpj}</p>}
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 shrink-0"
                    onClick={e => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(c) }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mt-3 space-y-1">
                  {c.email && <div className="flex items-center gap-2 text-xs text-slate-500"><Mail className="w-3 h-3" />{c.email}</div>}
                  {c.telefone && <div className="flex items-center gap-2 text-xs text-slate-500"><Phone className="w-3 h-3" />{c.telefone}</div>}
                  {c.cidade && <div className="flex items-center gap-2 text-xs text-slate-500"><MapPin className="w-3 h-3" />{c.cidade}{c.estado ? `/${c.estado}` : ''}</div>}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {clientes.length === 0 && (
          <div className="col-span-3 text-center py-16 text-slate-400">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum cliente encontrado</p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <Pagination page={page} totalItems={clientes.length} onPageChange={setPage} />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
          <ClienteForm onSubmit={handleCreate} loading={loading} />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Cliente</DialogTitle>
            <DialogDescription>
              O cliente <strong>{deleteTarget?.nome}</strong> será excluído permanentemente. Esta ação não pode ser desfeita. Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarExclusao} disabled={deleting}>
              {deleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
