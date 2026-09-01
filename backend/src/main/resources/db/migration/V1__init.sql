CREATE TABLE firma (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18),
    email VARCHAR(255),
    telefone VARCHAR(20),
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE engenheiro (
    id BIGSERIAL PRIMARY KEY,
    firma_id BIGINT NOT NULL REFERENCES firma(id),
    nome VARCHAR(255) NOT NULL,
    crea VARCHAR(50) NOT NULL,
    titulo_profissional VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    telefone VARCHAR(20),
    logo_url TEXT,
    assinatura_url TEXT,
    senha_hash VARCHAR(255) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cliente (
    id BIGSERIAL PRIMARY KEY,
    firma_id BIGINT NOT NULL REFERENCES firma(id),
    cnpj VARCHAR(18),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    email VARCHAR(255),
    telefone VARCHAR(20),
    endereco VARCHAR(500),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(9),
    foto_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE nr_catalogo (
    id BIGSERIAL PRIMARY KEY,
    firma_id BIGINT REFERENCES firma(id),
    numero_nr VARCHAR(20) NOT NULL,
    artigo VARCHAR(50),
    titulo VARCHAR(500) NOT NULL,
    descricao TEXT,
    solucao_padrao TEXT,
    prioridade VARCHAR(10) NOT NULL DEFAULT 'MEDIO' CHECK (prioridade IN ('CRITICO','ALTO','MEDIO','BAIXO')),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE modelo_laudo (
    id BIGSERIAL PRIMARY KEY,
    firma_id BIGINT NOT NULL REFERENCES firma(id),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE modelo_topico (
    id BIGSERIAL PRIMARY KEY,
    modelo_id BIGINT NOT NULL REFERENCES modelo_laudo(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    conteudo TEXT,
    ordem INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE laudo (
    id BIGSERIAL PRIMARY KEY,
    firma_id BIGINT NOT NULL REFERENCES firma(id),
    engenheiro_id BIGINT NOT NULL REFERENCES engenheiro(id),
    cliente_id BIGINT NOT NULL REFERENCES cliente(id),
    modelo_id BIGINT REFERENCES modelo_laudo(id),
    status VARCHAR(20) NOT NULL DEFAULT 'RASCUNHO'
        CHECK (status IN ('RASCUNHO','EM_REVISAO','ASSINADO','ENTREGUE')),
    numero_art VARCHAR(50),
    data_visita DATE,
    data_emissao DATE,
    quem_acompanhou VARCHAR(500),
    versao INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE laudo_topico (
    id BIGSERIAL PRIMARY KEY,
    laudo_id BIGINT NOT NULL REFERENCES laudo(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    conteudo TEXT,
    ordem INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE area_inspecao (
    id BIGSERIAL PRIMARY KEY,
    laudo_id BIGINT NOT NULL REFERENCES laudo(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    ordem INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE foto (
    id BIGSERIAL PRIMARY KEY,
    area_id BIGINT NOT NULL REFERENCES area_inspecao(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    nome_arquivo VARCHAR(255),
    ordem INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE ponto_anotacao (
    id BIGSERIAL PRIMARY KEY,
    foto_id BIGINT NOT NULL REFERENCES foto(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    x_pct DECIMAL(6,4) NOT NULL,
    y_pct DECIMAL(6,4) NOT NULL
);

CREATE TABLE ponto_nr (
    id BIGSERIAL PRIMARY KEY,
    ponto_id BIGINT NOT NULL REFERENCES ponto_anotacao(id) ON DELETE CASCADE,
    nr_catalogo_id BIGINT NOT NULL REFERENCES nr_catalogo(id),
    solucao_especifica TEXT
);

CREATE TABLE laudo_historico (
    id BIGSERIAL PRIMARY KEY,
    laudo_id BIGINT NOT NULL REFERENCES laudo(id),
    engenheiro_id BIGINT NOT NULL REFERENCES engenheiro(id),
    status_anterior VARCHAR(20),
    status_novo VARCHAR(20) NOT NULL,
    observacao TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_laudo_cliente ON laudo(cliente_id);
CREATE INDEX idx_laudo_engenheiro ON laudo(engenheiro_id);
CREATE INDEX idx_laudo_status ON laudo(status);
CREATE INDEX idx_area_laudo ON area_inspecao(laudo_id);
CREATE INDEX idx_foto_area ON foto(area_id);
CREATE INDEX idx_ponto_foto ON ponto_anotacao(foto_id);
