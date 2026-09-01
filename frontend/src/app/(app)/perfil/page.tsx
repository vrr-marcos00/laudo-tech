'use client'
import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Engenheiro } from '@/types'
import { getUser, updateUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { HardHat, Mail, Phone, Image as ImageIcon, Edit } from 'lucide-react'

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  crea: z.string().min(1, 'CREA obrigatório'),
  tituloProfissional: z.string().optional(),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  senha: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

export default function PerfilPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)
  const myId = getUser()?.engenheiroId

  const { data: eng } = useQuery<Engenheiro>({
    queryKey: ['meu-perfil', myId],
    queryFn: () => api.get(`/engenheiros/${myId}`).then(r => r.data),
    enabled: !!myId,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function uploadLogo(file: File) {
    if (!myId) return
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post(`/engenheiros/${myId}/logo`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    updateUser({ logoUrl: data.logoUrl })
    qc.invalidateQueries({ queryKey: ['meu-perfil', myId] })
  }

  function openEdit() {
    if (!eng) return
    reset({ nome: eng.nome, crea: eng.crea, tituloProfissional: eng.tituloProfissional, email: eng.email, telefone: eng.telefone ?? '' })
    setOpen(true)
  }

  async function onSubmit(data: FormData) {
    if (!myId) return
    setLoading(true)
    try {
      await api.put(`/engenheiros/${myId}`, data)
      updateUser({ nome: data.nome, crea: data.crea, tituloProfissional: data.tituloProfissional, email: data.email })
      qc.invalidateQueries({ queryKey: ['meu-perfil', myId] })
      setOpen(false)
    } finally { setLoading(false) }
  }

  if (!eng) return <div className="p-8 text-slate-500">Carregando...</div>

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Meu Perfil</h1>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {eng.logoUrl
              ? <img src={eng.logoUrl} alt={eng.nome} className="w-20 h-20 rounded-xl object-contain border" />
              : <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center">
                  <HardHat className="w-10 h-10 text-slate-400" />
                </div>
            }
            <div className="flex-1">
              <h2 className="font-bold text-lg text-slate-800">{eng.nome}</h2>
              <p className="text-sm text-blue-600 font-medium">{eng.crea}</p>
              {eng.tituloProfissional && <p className="text-sm text-slate-500">{eng.tituloProfissional}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={openEdit}>
                <Edit className="w-3 h-3 mr-2" /> Editar Dados
              </Button>
              <input ref={logoRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f); e.target.value = '' }} />
              <Button variant="outline" size="sm" onClick={() => logoRef.current?.click()}>
                <ImageIcon className="w-3 h-3 mr-2" /> {eng.logoUrl ? 'Trocar Logo' : 'Enviar Logo'}
              </Button>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-600"><Mail className="w-4 h-4 text-slate-400" />{eng.email}</div>
            {eng.telefone && <div className="flex items-center gap-2 text-sm text-slate-600"><Phone className="w-4 h-4 text-slate-400" />{eng.telefone}</div>}
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Perfil</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label>Nome *</Label>
                <Input {...register('nome')} />
                {errors.nome && <p className="text-red-500 text-xs">{errors.nome.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>CREA *</Label>
                <Input {...register('crea')} />
                {errors.crea && <p className="text-red-500 text-xs">{errors.crea.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Título Profissional</Label>
                <Input {...register('tituloProfissional')} />
              </div>
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input {...register('email')} type="email" />
                {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Telefone</Label>
                <Input {...register('telefone')} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Nova Senha (deixe em branco para manter)</Label>
                <Input {...register('senha')} type="password" placeholder="••••••••" />
                {errors.senha && <p className="text-red-500 text-xs">{errors.senha.message}</p>}
              </div>
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
