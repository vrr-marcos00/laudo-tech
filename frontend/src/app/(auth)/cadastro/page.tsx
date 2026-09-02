'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api, { getErrorMessage } from '@/lib/api'
import { saveAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginResponse } from '@/types'
import { maskTelefone } from '@/lib/masks'

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  crea: z.string().min(1, 'CREA obrigatório'),
  tituloProfissional: z.string().optional(),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  senha: z.string().min(6, 'Mínimo 6 caracteres'),
})
type FormData = z.infer<typeof schema>

export default function CadastroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError('')
    try {
      const { data: resp } = await api.post<LoginResponse>('/auth/register', data)
      saveAuth(resp)
      document.cookie = `token=${resp.token}; path=/`
      router.push('/dashboard')
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível criar a conta'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-700 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">LT</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-blue-700">Criar Conta</CardTitle>
          <p className="text-slate-500 text-sm">Cadastre-se no Laudo Tech</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" {...register('nome')} placeholder="Marcos Sá" />
              {errors.nome && <p className="text-red-500 text-xs">{errors.nome.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="crea">CREA *</Label>
                <Input id="crea" {...register('crea')} placeholder="CREA-DF 00000" />
                {errors.crea && <p className="text-red-500 text-xs">{errors.crea.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tituloProfissional">Título Profissional</Label>
                <Input id="tituloProfissional" {...register('tituloProfissional')} placeholder="Engenheiro Eletricista" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...register('email')} placeholder="engenheiro@empresa.com" />
              {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" {...register('telefone', { onChange: e => { e.target.value = maskTelefone(e.target.value) } })} placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha *</Label>
              <Input id="senha" type="password" {...register('senha')} placeholder="••••••••" />
              {errors.senha && <p className="text-red-500 text-xs">{errors.senha.message}</p>}
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full bg-blue-700 hover:bg-blue-800" disabled={loading}>
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </Button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-4">
            Já tem conta?{' '}
            <Link href="/login" className="text-blue-700 font-medium hover:underline">Entrar</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
