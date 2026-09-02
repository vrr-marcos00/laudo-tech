'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import api, { getErrorMessage } from '@/lib/api'
import { Cliente, Laudo } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ClienteForm } from '@/components/clientes/cliente-form'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, Edit, Upload, FileText, Building2, Mail, Phone, MapPin, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useRef } from 'react'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/status'
import { Pagination, paginate } from '@/components/ui/pagination'
import { formatDate } from '@/lib/date'

export default function ClienteDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const qc = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: cliente } = useQuery<Cliente>({
    queryKey: ['cliente', id],
    queryFn: () => api.get(`/clientes/${id}`).then(r => r.data),
  })
  const { data: laudos = [] } = useQuery<Laudo[]>({
    queryKey: ['cliente-laudos', id],
    queryFn: () => api.get(`/clientes/${id}/laudos`).then(r => r.data),
  })

  const laudosPagina = paginate(laudos, page)

  const atualizar = useMutation({
    mutationFn: (data: any) => api.put(`/clientes/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cliente', id] }); setEditOpen(false) },
  })

  async function handleEdit(data: any) {
    setLoading(true)
    try {
      await atualizar.mutateAsync(data)
    } catch (err) {
      toast.add({ title: getErrorMessage(err, 'Erro ao salvar cliente'), type: 'error' })
    } finally { setLoading(false) }
  }

  async function excluirCliente() {
    setDeleting(true)
    try {
      await api.delete(`/clientes/${id}`)
      qc.invalidateQueries({ queryKey: ['clientes'] })
      toast.add({ title: 'Cliente excluído com sucesso', type: 'success' })
      router.push('/clientes')
    } catch (err) {
      toast.add({ title: getErrorMessage(err, 'Erro ao excluir cliente'), type: 'error' })
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    await api.post(`/clientes/${id}/foto`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    qc.invalidateQueries({ queryKey: ['cliente', id] })
  }

  if (!cliente) return <div className="p-8 text-slate-500">Carregando...</div>

  return (
    <div className="p-8">
      <Link href="/clientes" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Voltar para Clientes
      </Link>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="relative inline-block mb-4">
                {cliente.fotoUrl
                  ? <img src={cliente.fotoUrl} alt={cliente.nome} className="w-24 h-24 rounded-xl object-cover mx-auto" />
                  : <div className="w-24 h-24 bg-blue-100 rounded-xl flex items-center justify-center mx-auto">
                      <Building2 className="w-12 h-12 text-blue-600" />
                    </div>
                }
              </div>
              <h2 className="font-bold text-lg text-slate-800">{cliente.nome}</h2>
              {cliente.cnpj && <p className="text-sm text-slate-500">{cliente.cnpj}</p>}
              <div className="mt-4 space-y-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFotoUpload} />
                <Button variant="outline" size="sm" className="w-full" onClick={() => fileRef.current?.click()}>
                  <Upload className="w-3 h-3 mr-2" /> Alterar Foto
                </Button>
                <Button variant="outline" size="sm" className="w-full" onClick={() => setEditOpen(true)}>
                  <Edit className="w-3 h-3 mr-2" /> Editar Dados
                </Button>
                <Button variant="outline" size="sm" className="w-full text-red-500 hover:text-red-700"
                  onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="w-3 h-3 mr-2" /> Excluir Cliente
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-3">
              {cliente.email && <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-slate-400" />{cliente.email}</div>}
              {cliente.telefone && <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-slate-400" />{cliente.telefone}</div>}
              {cliente.cidade && <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-slate-400" />{cliente.endereco}<br/>{cliente.cidade}/{cliente.estado} - {cliente.cep}</div>}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-2 space-y-4">
          {cliente.descricao && (
            <Card>
              <CardHeader><CardTitle className="text-base">Sobre a Empresa</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-slate-600 leading-relaxed">{cliente.descricao}</p></CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Histórico de Laudos</CardTitle>
              <Link href={`/laudos/novo?clienteId=${id}`}>
                <Button size="sm" className="bg-blue-700 hover:bg-blue-800">
                  <FileText className="w-3 h-3 mr-2" /> Novo Laudo
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {laudos.length === 0
                ? <p className="text-slate-400 text-sm text-center py-6">Nenhum laudo para este cliente</p>
                : <>
                    <div className="flex flex-col gap-2">
                      {laudosPagina.map(l => (
                        <Link key={l.id} href={`/laudos/${l.id}`}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                          <div>
                            <p className="text-sm font-medium">{l.engenheiroNome}</p>
                            <p className="text-xs text-slate-500">{l.dataVisita ? formatDate(l.dataVisita) : 'Sem data'} • ART: {l.numeroArt ?? 'N/A'}</p>
                          </div>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[l.status]}`}>{STATUS_LABELS[l.status]}</span>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-2">
                      <Pagination page={page} totalItems={laudos.length} onPageChange={setPage} />
                    </div>
                  </>
              }
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Editar Cliente</DialogTitle></DialogHeader>
          <ClienteForm
            defaultValues={{
              nome: cliente.nome,
              cnpj: cliente.cnpj ?? undefined,
              email: cliente.email ?? undefined,
              telefone: cliente.telefone ?? undefined,
              descricao: cliente.descricao ?? undefined,
              endereco: cliente.endereco ?? undefined,
              cidade: cliente.cidade ?? undefined,
              estado: cliente.estado ?? undefined,
              cep: cliente.cep ?? undefined,
            }}
            onSubmit={handleEdit}
            loading={loading}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Cliente</DialogTitle>
            <DialogDescription>
              O cliente <strong>{cliente.nome}</strong> será excluído permanentemente. Esta ação não pode ser desfeita. Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={excluirCliente} disabled={deleting}>
              {deleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
