'use client'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Laudo, Cliente } from '@/types'
import { FileText, Users, Clock, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/status'

export default function DashboardPage() {
  const { data: laudos = [] } = useQuery<Laudo[]>({ queryKey: ['laudos'], queryFn: () => api.get('/laudos').then(r => r.data) })
  const { data: clientes = [] } = useQuery<Cliente[]>({ queryKey: ['clientes'], queryFn: () => api.get('/clientes').then(r => r.data) })

  const counts = {
    total: laudos.length,
    rascunho: laudos.filter(l => l.status === 'RASCUNHO').length,
    finalizado: laudos.filter(l => l.status === 'FINALIZADO').length,
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total de Laudos', value: counts.total, icon: FileText, color: 'text-blue-600' },
          { label: 'Clientes', value: clientes.length, icon: Users, color: 'text-green-600' },
          { label: 'Rascunhos', value: counts.rascunho, icon: Clock, color: 'text-yellow-600' },
          { label: 'Finalizados', value: counts.finalizado, icon: CheckCircle, color: 'text-emerald-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="text-3xl font-bold mt-1">{value}</p>
                </div>
                <Icon className={`w-8 h-8 ${color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Laudos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {laudos.slice(0, 8).map(laudo => (
              <Link key={laudo.id} href={`/laudos/${laudo.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                <div>
                  <p className="font-medium text-sm">{laudo.clienteNome}</p>
                  <p className="text-xs text-slate-500">{laudo.engenheiroNome} • {laudo.dataVisita ?? 'Sem data'}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[laudo.status]}`}>
                  {STATUS_LABELS[laudo.status]}
                </span>
              </Link>
            ))}
            {laudos.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Nenhum laudo criado ainda.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
