'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { Cliente, ModeloLaudo } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, FileText } from 'lucide-react'
import Link from 'next/link'

export default function NovoLaudoPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const params = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    clienteId: params.get('clienteId') ?? '',
    modeloId: '',
    numeroArt: '',
    dataVisita: '',
    dataEmissao: new Date().toISOString().split('T')[0],
    quemAcompanhou: '',
  })

  const { data: clientes = [] } = useQuery<Cliente[]>({ queryKey: ['clientes'], queryFn: () => api.get('/clientes').then(r => r.data) })
  const { data: modelos = [] } = useQuery<ModeloLaudo[]>({ queryKey: ['modelos'], queryFn: () => api.get('/modelos').then(r => r.data) })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.clienteId) return
    setLoading(true)
    try {
      const payload = {
        clienteId: Number(form.clienteId),
        modeloId: form.modeloId ? Number(form.modeloId) : null,
        numeroArt: form.numeroArt || null,
        dataVisita: form.dataVisita || null,
        dataEmissao: form.dataEmissao || null,
        quemAcompanhou: form.quemAcompanhou || null,
      }
      const { data } = await api.post('/laudos', payload)
      qc.invalidateQueries({ queryKey: ['laudos'] })
      qc.invalidateQueries({ queryKey: ['cliente-laudos'] })
      router.push(`/laudos/${data.id}`)
    } finally { setLoading(false) }
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/laudos" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Voltar para Laudos
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Novo Laudo</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <Label>Cliente *</Label>
              <Select value={form.clienteId} onValueChange={v => set('clienteId', v ?? '')}
                items={Object.fromEntries(clientes.map(c => [String(c.id), c.nome]))}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente..." /></SelectTrigger>
                <SelectContent>
                  {clientes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Modelo de Laudo</Label>
              <Select value={form.modeloId} onValueChange={v => set('modeloId', v ?? '')}
                items={Object.fromEntries(modelos.map(m => [String(m.id), m.nome]))}>
                <SelectTrigger><SelectValue placeholder="Selecione um modelo (opcional)..." /></SelectTrigger>
                <SelectContent>
                  {modelos.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">Os tópicos do modelo serão copiados para o laudo.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Data da Visita</Label>
                <Input type="date" value={form.dataVisita} onChange={e => set('dataVisita', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Data de Emissão</Label>
                <Input type="date" value={form.dataEmissao} onChange={e => set('dataEmissao', e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Número ART</Label>
              <Input value={form.numeroArt} onChange={e => set('numeroArt', e.target.value)} placeholder="Ex: 2620262492929" />
            </div>

            <div className="space-y-1">
              <Label>Quem acompanhou a visita</Label>
              <Input value={form.quemAcompanhou} onChange={e => set('quemAcompanhou', e.target.value)}
                placeholder="Ex: João Silva, técnico de manutenção" />
            </div>

            <Button type="submit" className="w-full bg-blue-700 hover:bg-blue-800" disabled={loading || !form.clienteId}>
              {loading ? 'Criando...' : 'Criar Laudo'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
