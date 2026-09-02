export interface LoginResponse {
  token: string
  engenheiroId: number
  nome: string
  email: string
  crea: string
  tituloProfissional: string
  logoUrl: string | null
}

export interface Engenheiro {
  id: number
  nome: string
  crea: string
  tituloProfissional: string
  email: string
  telefone: string | null
  logoUrl: string | null
  assinaturaUrl: string | null
  ativo: boolean
}

export interface Cliente {
  id: number
  cnpj: string | null
  nome: string
  descricao: string | null
  email: string | null
  telefone: string | null
  endereco: string | null
  cidade: string | null
  estado: string | null
  cep: string | null
  fotoUrl: string | null
  createdAt: string
}

export interface NrCatalogo {
  id: number
  numeroNr: string
  artigo: string | null
  titulo: string
  descricao: string | null
  solucaoPadrao: string | null
  prioridade: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAIXO'
}

export interface ModeloTopico {
  id?: number
  titulo: string
  conteudo: string
  ordem: number
}

export interface ModeloLaudo {
  id: number
  nome: string
  descricao: string | null
  createdAt: string
  topicos: ModeloTopico[]
}

export type LaudoTopicoTipo = 'TEXTO' | 'REGISTRO_FOTOGRAFICO' | 'ITENS_CRITICOS'

export interface LaudoTopico {
  id?: number
  titulo: string
  conteudo: string
  ordem: number
  tipo?: LaudoTopicoTipo
}

export interface PontoNr {
  id?: number
  nrCatalogoId: number
  numeroNr: string
  artigo: string | null
  titulo: string
  solucaoPadrao: string | null
  solucaoEspecifica: string | null
  prioridade: string
}

export interface PontoAnotacao {
  id?: number
  numero: number
  xPct: number
  yPct: number
  nrs: PontoNr[]
}

export interface Foto {
  id: number
  url: string
  nomeArquivo: string | null
  ordem: number
  pontos: PontoAnotacao[]
}

export interface AreaInspecao {
  id: number
  nome: string
  descricao: string | null
  ordem: number
  fotos: Foto[]
}

export type LaudoStatus = 'RASCUNHO' | 'FINALIZADO'

export interface Laudo {
  id: number
  engenheiroId: number
  engenheiroNome: string
  engenheiroCrea: string
  clienteId: number
  clienteNome: string
  clienteCnpj: string | null
  clienteFotoUrl: string | null
  clienteDescricao: string | null
  modeloId: number | null
  status: LaudoStatus
  numeroArt: string | null
  dataVisita: string | null
  dataEmissao: string | null
  quemAcompanhou: string | null
  versao: number
  mostrarCapa: boolean
  mostrarSumario: boolean
  mostrarAssinaturaEngenheiro: boolean
  mostrarAssinaturaCliente: boolean
  mostrarCapaEmpresa: boolean
  mostrarDescricaoEmpresa: boolean
  logoCapaUrl: string | null
  tituloCapa: string | null
  subtituloCapa: string | null
  laudoOrigemId: number | null
  laudoOrigemVersao: number | null
  createdAt: string
  updatedAt: string
  topicos?: LaudoTopico[]
  areas?: AreaInspecao[]
}
