'use client'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { NrCatalogo, PontoAnotacao, PontoNr } from '@/types'
import { X, Check, Trash2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

interface Props {
  fotoUrl: string
  fotoId: number
  initialPontos?: PontoAnotacao[]
  onSave: (pontos: PontoAnotacao[]) => Promise<void>
  onClose: () => void
}

const PRIORITY_FILL: Record<string, string> = {
  CRITICO: 'rgba(220,38,38,0.85)',
  ALTO: 'rgba(234,88,12,0.85)',
  MEDIO: 'rgba(202,138,4,0.85)',
  BAIXO: 'rgba(37,99,235,0.85)',
}

const PRIORITY_DOT: Record<string, string> = {
  CRITICO: 'bg-red-600', ALTO: 'bg-orange-500', MEDIO: 'bg-yellow-600', BAIXO: 'bg-blue-500',
}

const PRIORITY_TEXT: Record<string, string> = {
  CRITICO: 'text-red-600', ALTO: 'text-orange-500', MEDIO: 'text-yellow-600', BAIXO: 'text-blue-500',
}

function getPriorityFill(nrs: PontoNr[]): string {
  for (const p of ['CRITICO', 'ALTO', 'MEDIO', 'BAIXO']) {
    if (nrs.some(nr => nr.prioridade === p)) return PRIORITY_FILL[p]
  }
  return 'rgba(100,116,139,0.85)'
}

function getHighestPriority(nrs: PontoNr[]): string | null {
  for (const p of ['CRITICO', 'ALTO', 'MEDIO', 'BAIXO']) {
    if (nrs.some(nr => nr.prioridade === p)) return p
  }
  return null
}

export function FotoAnnotator({ fotoUrl, fotoId, initialPontos = [], onSave, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const outerRef = useRef<HTMLDivElement>(null)
  const fabricRef = useRef<any>(null)
  const fabricModuleRef = useRef<any>(null)
  const canvasSizeRef = useRef({ w: 0, h: 0 })
  const circlesRef = useRef<any[]>([])
  const [canvasReady, setCanvasReady] = useState(false)
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number } | null>(null)
  const [pontos, setPontos] = useState<PontoAnotacao[]>(initialPontos.map(p => ({ ...p })))
  const [selectedPonto, setSelectedPonto] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const { data: nrsCatalogo = [] } = useQuery<NrCatalogo[]>({
    queryKey: ['nrs'],
    queryFn: () => api.get('/nrs').then(r => r.data),
  })

  useEffect(() => {
    if (!containerRef.current) return
    let mounted = true
    let fabricCanvas: any = null
    let canvasEl: HTMLCanvasElement | null = null

    const initCanvas = async () => {
      const fabric = await import('fabric')
      if (!mounted || !containerRef.current) return
      fabricModuleRef.current = fabric

      const img = new Image()
      img.onload = () => {
        if (!mounted || !containerRef.current) return

        const outerEl = outerRef.current
        const maxW = outerEl && outerEl.clientWidth > 0 ? outerEl.clientWidth : Math.min(1200, Math.max(480, window.innerWidth - 380))
        const maxH = outerEl && outerEl.clientHeight > 0 ? outerEl.clientHeight : Math.min(800, Math.max(400, window.innerHeight - 220))
        const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1)
        const w = Math.round(img.naturalWidth * ratio)
        const h = Math.round(img.naturalHeight * ratio)

        canvasSizeRef.current = { w, h }
        // Inform React so the <img> element renders at the correct size before the canvas overlay.
        setCanvasSize({ w, h })

        // Transparent Fabric canvas for annotation circles only — the photo is
        // rendered by the native <img> element below, so no FabricImage needed.
        canvasEl = document.createElement('canvas')
        canvasEl.width = w
        canvasEl.height = h
        containerRef.current.appendChild(canvasEl)

        fabricCanvas = new fabric.Canvas(canvasEl, { selection: false })
        fabricRef.current = fabricCanvas

        if (!mounted) return
        setCanvasReady(true)

        fabricCanvas.on('mouse:down', (opt: any) => {
          if (opt.target) return
          const pointer = fabricCanvas.getScenePoint(opt.e)
          // getScenePoint returns coordinates in Fabric's scene space; divide by the CSS
          // canvas dimensions (canvasSizeRef) to get a normalised [0,1] fraction that is
          // independent of viewport DPR and zoom level.
          const xPct = pointer.x / w
          const yPct = pointer.y / h
          setPontos(prev => {
            const numero = prev.length + 1
            setSelectedPonto(prev.length)
            return [...prev, { numero, xPct, yPct, nrs: [] }]
          })
        })
      }
      img.src = fotoUrl
    }

    initCanvas()
    return () => {
      mounted = false
      if (fabricRef.current) {
        try { fabricRef.current.dispose() } catch {}
        fabricRef.current = null
        fabricModuleRef.current = null
      }
      if (containerRef.current) containerRef.current.innerHTML = ''
      canvasEl = null
      setCanvasReady(false)
      setCanvasSize(null)
    }
  }, [fotoUrl])

  // Redraw all circles whenever pontos change or the canvas becomes ready.
  useEffect(() => {
    const canvas = fabricRef.current
    const fabric = fabricModuleRef.current
    if (!canvas || !fabric || !canvasReady) return

    const { w, h } = canvasSizeRef.current

    circlesRef.current.forEach(({ circle, text }) => {
      canvas.remove(circle)
      canvas.remove(text)
    })
    circlesRef.current = []

    pontos.forEach(p => {
      const fill = getPriorityFill(p.nrs)
      addCircleToCanvas(canvas, fabric, p.numero, p.xPct * w, p.yPct * h, fill)
    })
  }, [pontos, canvasReady])

  function addCircleToCanvas(canvas: any, fabric: any, numero: number, x: number, y: number, fill: string) {
    const circle = new fabric.Circle({
      originX: 'center', originY: 'center',
      left: x, top: y, radius: 14,
      fill, stroke: 'white', strokeWidth: 2, selectable: false, evented: false
    })
    const text = new fabric.Text(String(numero), {
      originX: 'center', originY: 'center',
      left: x, top: y,
      fontSize: 14, fill: 'white', fontWeight: 'bold', selectable: false, evented: false
    })
    canvas.add(circle)
    canvas.add(text)
    canvas.renderAll()
    circlesRef.current.push({ circle, text })
  }

  function addNrToPonto(nrId: number) {
    if (selectedPonto === null) return
    const nr = nrsCatalogo.find(n => n.id === nrId)
    if (!nr) return
    setPontos(prev => prev.map((p, i) => {
      if (i !== selectedPonto) return p
      if (p.nrs.find(pnr => pnr.nrCatalogoId === nrId)) return p
      const newNr: PontoNr = {
        nrCatalogoId: nr.id, numeroNr: nr.numeroNr, artigo: nr.artigo,
        titulo: nr.titulo, solucaoPadrao: nr.solucaoPadrao,
        solucaoEspecifica: nr.solucaoPadrao, prioridade: nr.prioridade
      }
      return { ...p, nrs: [...p.nrs, newNr] }
    }))
  }

  function removePonto(pontoIdx: number) {
    setPontos(prev => prev
      .filter((_, i) => i !== pontoIdx)
      .map((p, i) => ({ ...p, numero: i + 1 })))
    setSelectedPonto(prev => {
      if (prev === null) return null
      if (prev === pontoIdx) return null
      return prev > pontoIdx ? prev - 1 : prev
    })
  }

  function removeNrFromPonto(pontoIdx: number, nrIdx: number) {
    setPontos(prev => prev.map((p, i) =>
      i === pontoIdx ? { ...p, nrs: p.nrs.filter((_, ni) => ni !== nrIdx) } : p
    ))
  }

  function updateSolucao(pontoIdx: number, nrIdx: number, value: string) {
    setPontos(prev => prev.map((p, i) =>
      i === pontoIdx ? { ...p, nrs: p.nrs.map((nr, ni) => ni === nrIdx ? { ...nr, solucaoEspecifica: value } : nr) } : p
    ))
  }

  async function handleSave() {
    setSaving(true)
    try { await onSave(pontos) } finally { setSaving(false) }
  }

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        <p className="text-xs text-slate-500 mb-2">Clique na foto para adicionar um ponto de anotação</p>
        <div ref={outerRef} className="flex-1 border rounded-lg overflow-auto bg-slate-100 flex">
          {/* m-auto centres the photo; position:relative lets the canvas overlay sit on top */}
          <div className="m-auto relative">
            {canvasSize && (
              <img
                src={fotoUrl}
                width={canvasSize.w}
                height={canvasSize.h}
                draggable={false}
                alt=""
                style={{ display: 'block' }}
              />
            )}
            {/* Transparent Fabric canvas appended here; absolutely overlays the photo */}
            <div
              ref={containerRef}
              style={canvasSize ? { position: 'absolute', top: 0, left: 0 } : undefined}
            />
          </div>
        </div>
      </div>

      <div className="w-72 shrink-0 flex flex-col gap-3 overflow-y-auto">
        <div>
          <p className="text-sm font-semibold mb-2">Pontos ({pontos.length})</p>
          <div className="space-y-1">
            {pontos.map((p, i) => {
              const hp = getHighestPriority(p.nrs)
              const dot = hp ? PRIORITY_DOT[hp] : 'bg-slate-400'
              return (
                <div key={i}
                  className={`w-full flex items-center gap-1 px-3 py-2 rounded-lg text-sm border transition-colors ${selectedPonto === i ? 'bg-orange-50 border-orange-300' : 'hover:bg-slate-50 border-transparent'}`}>
                  <button className="flex-1 text-left flex items-center" onClick={() => setSelectedPonto(i)}>
                    <span className={`w-5 h-5 ${dot} text-white rounded-full text-xs inline-flex items-center justify-center mr-2 font-bold`}>{p.numero}</span>
                    {p.nrs.length} norma(s)
                  </button>
                  <button className="text-red-400 hover:text-red-600 shrink-0" title="Remover ponto"
                    onClick={() => removePonto(i)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
            {pontos.length === 0 && <p className="text-xs text-slate-400 italic">Nenhum ponto adicionado</p>}
          </div>
        </div>

        {selectedPonto !== null && pontos[selectedPonto] && (
          <div className="border rounded-lg p-3">
            <p className="text-sm font-semibold mb-2">Ponto {pontos[selectedPonto].numero} — Normas</p>

            {pontos[selectedPonto].nrs.map((nr, ni) => (
              <div key={ni} className="mb-3 p-2 bg-slate-50 rounded-lg">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <span className="text-xs font-bold text-blue-700">{nr.numeroNr}{nr.artigo ? ` ${nr.artigo}` : ''}</span>
                    <span className={`text-xs ml-2 font-medium ${PRIORITY_TEXT[nr.prioridade]}`}>{nr.prioridade}</span>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{nr.titulo}</p>
                  </div>
                  <button className="text-red-400 hover:text-red-600 ml-2" onClick={() => removeNrFromPonto(selectedPonto, ni)}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <Label className="text-xs">Solução específica</Label>
                <Textarea value={nr.solucaoEspecifica ?? ''} rows={2}
                  onChange={e => updateSolucao(selectedPonto, ni, e.target.value)}
                  className="text-xs mt-1" />
              </div>
            ))}

            <div className="mt-2">
              <Label className="text-xs mb-1 block">Adicionar Norma</Label>
              <select className="w-full text-xs border rounded-md p-2"
                onChange={e => { if (e.target.value) { addNrToPonto(Number(e.target.value)); e.target.value = '' } }}
                defaultValue="">
                <option value="">Selecione uma norma...</option>
                {nrsCatalogo.map(nr => (
                  <option key={nr.id} value={nr.id}>{nr.numeroNr}{nr.artigo ? ` ${nr.artigo}` : ''} — {nr.titulo.slice(0, 40)}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-auto pt-3 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose}><X className="w-4 h-4 mr-1" />Cancelar</Button>
          <Button className="flex-1 bg-blue-700 hover:bg-blue-800" onClick={handleSave} disabled={saving}>
            <Check className="w-4 h-4 mr-1" />{saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
