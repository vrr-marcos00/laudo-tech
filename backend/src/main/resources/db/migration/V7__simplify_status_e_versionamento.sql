-- Simplifica o modelo de status para RASCUNHO / FINALIZADO
-- Solta a constraint antiga antes de migrar os dados, para permitir o valor intermediário 'FINALIZADO'
ALTER TABLE laudo DROP CONSTRAINT laudo_status_check;

UPDATE laudo SET status = 'RASCUNHO' WHERE status = 'EM_REVISAO';
UPDATE laudo SET status = 'FINALIZADO' WHERE status IN ('ASSINADO', 'ENTREGUE');

UPDATE laudo_historico SET status_anterior = 'RASCUNHO' WHERE status_anterior = 'EM_REVISAO';
UPDATE laudo_historico SET status_anterior = 'FINALIZADO' WHERE status_anterior IN ('ASSINADO', 'ENTREGUE');
UPDATE laudo_historico SET status_novo = 'RASCUNHO' WHERE status_novo = 'EM_REVISAO';
UPDATE laudo_historico SET status_novo = 'FINALIZADO' WHERE status_novo IN ('ASSINADO', 'ENTREGUE');

ALTER TABLE laudo ADD CONSTRAINT laudo_status_check CHECK (status IN ('RASCUNHO', 'FINALIZADO'));

-- Versionamento: aponta para o laudo de origem quando uma nova versão é criada
ALTER TABLE laudo ADD COLUMN laudo_origem_id BIGINT REFERENCES laudo(id);
CREATE INDEX idx_laudo_origem ON laudo(laudo_origem_id);
