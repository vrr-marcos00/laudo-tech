-- Papel do usuário: ADMIN (cadastrado à mão) ou ENGENHEIRO (criado por um Admin)
ALTER TABLE engenheiro ADD COLUMN tipo VARCHAR(20) NOT NULL DEFAULT 'ENGENHEIRO' CHECK (tipo IN ('ADMIN', 'ENGENHEIRO'));

-- Aponta para o Admin que cadastrou este engenheiro
ALTER TABLE engenheiro ADD COLUMN criado_por_id BIGINT REFERENCES engenheiro(id);
CREATE INDEX idx_engenheiro_criado_por ON engenheiro(criado_por_id);

-- O engenheiro seed original passa a ser Admin
UPDATE engenheiro SET tipo = 'ADMIN' WHERE email = 'admin@laudotech.com';
