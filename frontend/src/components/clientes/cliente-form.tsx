'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Cliente } from '@/types'

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  cnpj: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  descricao: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2).optional(),
  cep: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  defaultValues?: Partial<FormData>
  onSubmit: (data: FormData) => Promise<void>
  loading?: boolean
}

export function ClienteForm({ defaultValues, onSubmit, loading }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <Label>Nome da Empresa *</Label>
          <Input {...register('nome')} placeholder="Ex: Dini Têxtil Ltda" />
          {errors.nome && <p className="text-red-500 text-xs">{errors.nome.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>CNPJ</Label>
          <Input {...register('cnpj')} placeholder="00.000.000/0001-00" />
        </div>
        <div className="space-y-1">
          <Label>Email</Label>
          <Input {...register('email')} type="email" placeholder="contato@empresa.com" />
          {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Telefone</Label>
          <Input {...register('telefone')} placeholder="(11) 99999-9999" />
        </div>
        <div className="space-y-1">
          <Label>CEP</Label>
          <Input {...register('cep')} placeholder="00000-000" />
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Endereço</Label>
          <Input {...register('endereco')} placeholder="Rua, número, bairro" />
        </div>
        <div className="space-y-1">
          <Label>Cidade</Label>
          <Input {...register('cidade')} placeholder="São Paulo" />
        </div>
        <div className="space-y-1">
          <Label>Estado</Label>
          <Input {...register('estado')} placeholder="SP" maxLength={2} />
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Descrição da Empresa</Label>
          <Textarea {...register('descricao')} placeholder="Breve descrição das atividades da empresa..." rows={4} />
        </div>
      </div>
      <Button type="submit" className="bg-blue-700 hover:bg-blue-800" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar Cliente'}
      </Button>
    </form>
  )
}
