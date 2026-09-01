'use client'
import type { JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { Laudo, AreaInspecao } from '@/types'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'

const PRIORITY_COLORS: Record<string, string> = {
  CRITICO: '#dc2626', ALTO: '#ea580c', MEDIO: '#ca8a04', BAIXO: '#2563eb'
}

const PRIORITY_ORDER = ['CRITICO', 'ALTO', 'MEDIO', 'BAIXO']

function getPontoBackground(nrs: { prioridade: string }[]): string {
  for (const p of PRIORITY_ORDER) {
    if (nrs?.some(nr => nr.prioridade === p)) return PRIORITY_COLORS[p] + 'e6'
  }
  return '#64748be6'
}

export default function LaudoPreviewPage() {
  const { id } = useParams()

  const { data: laudo, isLoading } = useQuery<Laudo>({
    queryKey: ['laudo', id],
    queryFn: () => api.get(`/laudos/${id}`).then(r => r.data),
    staleTime: 0,
  })

  const { data: areas = [] } = useQuery<AreaInspecao[]>({
    queryKey: ['areas-preview', id],
    queryFn: () => api.get(`/laudos/${id}/areas`).then(r => r.data),
    enabled: !!id,
  })

  async function downloadPdf() {
    if (laudo?.status !== 'FINALIZADO') {
      toast.add({ title: 'O PDF só fica disponível depois que o laudo é finalizado.', type: 'info' })
      return
    }
    const res = await api.get(`/laudos/${id}/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a'); a.href = url; a.download = `laudo-${id}.pdf`; a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading || !laudo) return <div className="p-8 text-slate-500">Carregando preview...</div>

  // Collect all critical items with area, image number (1-based), and point number
  const itensCriticos = areas.flatMap(area =>
    area.fotos.flatMap((foto, fotoIndex) =>
      foto.pontos.flatMap(ponto =>
        ponto.nrs.filter(nr => nr.prioridade === 'CRITICO').map(nr => ({ area, foto, fotoIndex: fotoIndex + 1, ponto, nr }))
      )
    )
  )

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Fixed toolbar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm px-6 py-3 flex items-center justify-between print:hidden">
        <Link href={`/laudos/${id}`} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Editor
        </Link>
        <div className="flex gap-2">
          <Button size="sm" className={`bg-blue-700 hover:bg-blue-800 ${laudo.status !== 'FINALIZADO' ? 'opacity-50' : ''}`}
            onClick={downloadPdf}
            title={laudo.status === 'FINALIZADO' ? undefined : 'Finalize o laudo para poder baixar o PDF'}>
            <Download className="w-4 h-4 mr-2" /> Baixar PDF
          </Button>
        </div>
      </div>

      {/* Document */}
      <div className="pt-16 pb-12 print:pt-0">
        <div className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none print:max-w-none"
          style={{ fontFamily: 'Times New Roman, serif', fontSize: '12pt', lineHeight: 1.5 }}>

          {/* === CAPA === */}
          {laudo.mostrarCapa !== false && (
            <div style={{ minHeight: '100vh', padding: '2cm', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', pageBreakAfter: 'always' }}>
              {(laudo.logoCapaUrl) && (
                <img src={laudo.logoCapaUrl} alt="Logo" style={{ maxHeight: 160, marginBottom: 24 }} crossOrigin="anonymous" />
              )}
              <h1 style={{ fontSize: '20pt', fontWeight: 'bold', color: '#00467f', marginBottom: 8 }}>
                {laudo.tituloCapa || 'LAUDO TÉCNICO DAS INSTALAÇÕES ELÉTRICAS'}
              </h1>
              <h2 style={{ fontSize: '16pt', fontWeight: 'bold', color: '#00467f', marginBottom: 48 }}>
                {laudo.subtituloCapa || 'NR-10'}
              </h2>

              <p style={{ fontSize: '14pt', fontWeight: 'bold', marginBottom: 8 }}>EMPRESA: {laudo.clienteNome}</p>
              {laudo.clienteCnpj && <p style={{ marginBottom: 4 }}>CNPJ: {laudo.clienteCnpj}</p>}

              <div style={{ marginTop: 64 }}>
                <p style={{ fontWeight: 'bold' }}>RESPONSÁVEL TÉCNICO: {laudo.engenheiroNome}</p>
                <p>REGISTRO CREA: {laudo.engenheiroCrea}</p>
                {laudo.dataEmissao && <p style={{ marginTop: 8 }}>{laudo.dataEmissao}</p>}
              </div>
            </div>
          )}

          {/* === SUMÁRIO === */}
          {laudo.mostrarSumario !== false && (
            <div style={{ padding: '2cm', pageBreakAfter: 'always' }}>
              <SectionTitle>SUMÁRIO</SectionTitle>
              {['IDENTIFICAÇÃO DA EMPRESA', ...(laudo.topicos ?? []).map(t => t.titulo.toUpperCase()),
                ...(laudo.mostrarAssinaturaEngenheiro || laudo.mostrarAssinaturaCliente ? ['ASSINATURA'] : [])]
                .map((item, i) => (
                  <p key={i} style={{ marginBottom: 6, marginLeft: 16 }}>{i + 1}. {item}</p>
                ))}
            </div>
          )}

          {/* === IDENTIFICAÇÃO === */}
          <div style={{ padding: '2cm', pageBreakAfter: 'always' }}>
            <SectionTitle>1. IDENTIFICAÇÃO DA EMPRESA</SectionTitle>
            <InfoTable rows={[
              ['NOME DA EMPRESA', laudo.clienteNome],
              laudo.clienteCnpj ? ['CNPJ', laudo.clienteCnpj] : null,
              laudo.dataVisita ? ['DATA DE VISITA', laudo.dataVisita] : null,
              laudo.numeroArt ? ['NÚMERO ART', laudo.numeroArt] : null,
              laudo.quemAcompanhou ? ['ACOMPANHOU A VISITA', laudo.quemAcompanhou] : null,
            ].filter(Boolean) as [string, string][]} />

            <SectionTitle style={{ marginTop: 24 }}>RESPONSÁVEL TÉCNICO</SectionTitle>
            <InfoTable rows={[
              ['NOME', laudo.engenheiroNome],
              ['CREA', laudo.engenheiroCrea],
            ]} />
          </div>

          {/* === TÓPICOS (inclui Registro Fotográfico / Itens Críticos na posição escolhida pelo usuário) === */}
          {(laudo.topicos ?? []).map((t, i) => {
            if (t.tipo === 'REGISTRO_FOTOGRAFICO') {
              return (
                <div key={t.id ?? i} style={{ padding: '2cm' }}>
                  <SectionTitle>{i + 2}. {t.titulo.toUpperCase()}</SectionTitle>
                  {areas.map(area => (
                    <div key={area.id} style={{ marginBottom: 32 }}>
                      <p style={{ fontWeight: 'bold', color: '#00467f', fontSize: '13pt', marginBottom: 8, borderBottom: '1px solid #00467f', paddingBottom: 4 }}>
                        DESCRIÇÃO: {area.nome}
                      </p>
                      {area.descricao && <p style={{ marginBottom: 12 }}>{area.descricao}</p>}

                      {/* Photos in groups of 2 */}
                      {chunkArray(area.fotos, 2).map((pair, pi) => (
                        <div key={pi} style={{ marginBottom: 12 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
                            {pair.map(foto => (
                              <div key={foto.id} style={{ position: 'relative' }}>
                                <img src={foto.url} alt="" style={{ width: '100%', maxHeight: 270, objectFit: 'cover', border: '1px solid #ddd' }} crossOrigin="anonymous" />
                                {/* Annotation points */}
                                {foto.pontos?.map(ponto => (
                                  <div key={ponto.id} style={{
                                    position: 'absolute',
                                    left: `calc(${ponto.xPct * 100}% - 14px)`,
                                    top: `calc(${ponto.yPct * 100}% - 14px)`,
                                    width: 28, height: 28, borderRadius: '50%',
                                    background: getPontoBackground(ponto.nrs ?? []), border: '2px solid white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontWeight: 'bold', fontSize: 12, fontFamily: 'Arial'
                                  }}>
                                    {ponto.numero}
                                  </div>
                                ))}
                              </div>
                            ))}
                            {pair.length < 2 && <div />}
                          </div>

                          {/* NR Table for this pair */}
                          {pair.some(f => f.pontos?.some(p => p.nrs?.length > 0)) && (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt', marginBottom: 12 }}>
                              <thead>
                                <tr style={{ background: '#00467f', color: 'white' }}>
                                  {['Ponto', 'NR', 'Não Conformidade', 'Recomendação'].map(h => (
                                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #00467f' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {pair.flatMap((foto, fi) => {
                                  const globalIndex = pi * 2 + fi
                                  const multiplePhotos = area.fotos.length > 1
                                  const hasRows = foto.pontos?.some(p => p.nrs?.length > 0)
                                  const rows: JSX.Element[] = []
                                  if (multiplePhotos && hasRows) {
                                    rows.push(
                                      <tr key={`img-header-${foto.id}`}>
                                        <td colSpan={4} style={{ padding: '5px 8px', background: '#dce6f2', color: '#00467f', fontWeight: 'bold', border: '1px solid #b0c4de' }}>
                                          Imagem {globalIndex + 1}
                                        </td>
                                      </tr>
                                    )
                                  }
                                  foto.pontos?.forEach(ponto =>
                                    ponto.nrs?.forEach((nr, ni) => {
                                      rows.push(
                                        <tr key={`${foto.id}-${ponto.id}-${ni}`} style={{ background: ni % 2 === 0 ? '#f8f8f8' : 'white' }}>
                                          <td style={{ padding: '5px 8px', border: '1px solid #ddd', fontWeight: 'bold' }}>{ponto.numero}</td>
                                          <td style={{ padding: '5px 8px', border: '1px solid #ddd', color: PRIORITY_COLORS[nr.prioridade], fontWeight: 'bold' }}>
                                            {nr.numeroNr}{nr.artigo ? ` ${nr.artigo}` : ''}
                                          </td>
                                          <td style={{ padding: '5px 8px', border: '1px solid #ddd' }}>{nr.titulo}</td>
                                          <td style={{ padding: '5px 8px', border: '1px solid #ddd' }}>{nr.solucaoEspecifica || nr.solucaoPadrao || ''}</td>
                                        </tr>
                                      )
                                    })
                                  )
                                  return rows
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )
            }

            if (t.tipo === 'ITENS_CRITICOS') {
              return (
                <div key={t.id ?? i} style={{ padding: '2cm', pageBreakBefore: 'always' }}>
                  <SectionTitle>{i + 2}. {t.titulo.toUpperCase()}</SectionTitle>
                  {itensCriticos.length === 0
                    ? <p>Nenhum item crítico identificado nesta inspeção.</p>
                    : itensCriticos.map((item, ci) => (
                      <div key={ci} style={{ marginBottom: 12 }}>
                        <p style={{ fontWeight: 'bold', color: '#dc2626' }}>
                          • [{item.area.nome} — Imagem {item.fotoIndex} — Ponto {item.ponto.numero}] {item.nr.numeroNr}: {item.nr.titulo}
                        </p>
                        <p style={{ marginLeft: 16, fontSize: '10pt' }}>
                          Ação: {item.nr.solucaoEspecifica || item.nr.solucaoPadrao}
                        </p>
                      </div>
                    ))
                  }
                </div>
              )
            }

            return (
              <div key={t.id ?? i} style={{ padding: '2cm', pageBreakAfter: 'always' }}>
                <SectionTitle>{i + 2}. {t.titulo.toUpperCase()}</SectionTitle>
                <p style={{ textAlign: 'justify', whiteSpace: 'pre-wrap' }}>{t.conteudo}</p>
              </div>
            )
          })}

          {/* === ASSINATURA === */}
          {(laudo.mostrarAssinaturaEngenheiro || laudo.mostrarAssinaturaCliente) && (
            <div style={{ padding: '2cm', textAlign: 'center', pageBreakBefore: 'always' }}>
              <SectionTitle>
                {laudo.mostrarAssinaturaEngenheiro && laudo.mostrarAssinaturaCliente
                  ? 'ASSINATURAS'
                  : laudo.mostrarAssinaturaEngenheiro
                    ? 'ASSINATURA DO RESPONSÁVEL TÉCNICO'
                    : 'ASSINATURA DO CLIENTE'}
              </SectionTitle>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginTop: 48 }}>
                {laudo.mostrarAssinaturaEngenheiro && (
                  <div style={{ borderTop: '1px solid black', width: 240, paddingTop: 8 }}>
                    <p style={{ fontWeight: 'bold' }}>{laudo.engenheiroNome}</p>
                    <p>{laudo.engenheiroCrea}</p>
                    {laudo.dataEmissao && <p>{laudo.dataEmissao}</p>}
                  </div>
                )}
                {laudo.mostrarAssinaturaCliente && (
                  <div style={{ borderTop: '1px solid black', width: 240, paddingTop: 8 }}>
                    <p style={{ fontWeight: 'bold' }}>{laudo.clienteNome}</p>
                    {laudo.clienteCnpj && <p>{laudo.clienteCnpj}</p>}
                    {laudo.dataEmissao && <p>{laudo.dataEmissao}</p>}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <h2 style={{ fontSize: '14pt', fontWeight: 'bold', color: '#00467f', borderBottom: '1.5px solid #00467f', paddingBottom: 5, marginBottom: 14, ...style }}>
      {children}
    </h2>
  )
}

function InfoTable({ rows }: { rows: [string, string][] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <td style={{ padding: '6px 10px', background: '#f0f0f0', fontWeight: 'bold', border: '1px solid #ddd', width: '35%', fontSize: '10.5pt' }}>{label}</td>
            <td style={{ padding: '6px 10px', border: '1px solid #ddd', fontSize: '10.5pt' }}>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}
