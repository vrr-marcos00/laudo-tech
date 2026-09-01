'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Laudo } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toaster'
import { Plus, FileText, Calendar, User, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/status'
import { Pagination, paginate } from '@/components/ui/pagination'

export default function LaudosPage() {
  const qc = useQueryClient()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<Laudo | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { data: laudos = [] } = useQuery<Laudo[]>({
    queryKey: ['laudos', status],
    queryFn: () => api.get('/laudos', { params: { status: status || undefined } }).then(r => r.data),
  })

  const laudosPagina = paginate(laudos, page)

  async function confirmarExclusao() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/laudos/${deleteTarget.id}`)
      qc.invalidateQueries({ queryKey: ['laudos'] })
      qc.invalidateQueries({ queryKey: ['cliente-laudos'] })
      toast.add({ title: 'Laudo excluído com sucesso', type: 'success' })
      setDeleteTarget(null)
    } catch {
      toast.add({ title: 'Erro ao excluir laudo', type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Laudos</h1>
        <Link href="/laudos/novo">
          <Button className="bg-blue-700 hover:bg-blue-800">
            <Plus className="w-4 h-4 mr-2" /> Novo Laudo
          </Button>
        </Link>
      </div>

      <div className="flex gap-3 mb-6">
        <Select value={status} onValueChange={v => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Todos os status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="RASCUNHO">Rascunho</SelectItem>
            <SelectItem value="FINALIZADO">Finalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-3">
        {laudosPagina.map(l => (
          <Link key={l.id} href={`/laudos/${l.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800">{l.clienteNome}</p>
                        {l.versao > 1 && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 whitespace-nowrap">
                            Versão {l.versao}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{l.clienteCnpj}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{l.engenheiroNome}</span>
                        {l.dataVisita && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{l.dataVisita}</span>}
                        {l.numeroArt && <span>ART: {l.numeroArt}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${STATUS_COLORS[l.status]}`}>
                      {STATUS_LABELS[l.status]}
                    </span>
                    {l.status === 'RASCUNHO' && (
                      <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600"
                        onClick={e => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(l) }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {laudos.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum laudo encontrado</p>
          </div>
        )}
      </div>

      <Pagination page={page} totalItems={laudos.length} onPageChange={setPage} />

      <Dialog open={deleteTarget !== null} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Laudo</DialogTitle>
            <DialogDescription>
              O laudo de <strong>{deleteTarget?.clienteNome}</strong> será excluído permanentemente. Esta ação não pode ser desfeita. Deseja continuar?
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
