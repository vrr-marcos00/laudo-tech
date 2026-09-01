-- Registra qual engenheiro (ou admin) cadastrou cada cliente
ALTER TABLE cliente ADD COLUMN cadastrado_por_id BIGINT REFERENCES engenheiro(id);
CREATE INDEX idx_cliente_cadastrado_por ON cliente(cadastrado_por_id);

-- Backfill: clientes já existentes passam a pertencer ao primeiro Admin da firma
UPDATE cliente c
SET cadastrado_por_id = (
    SELECT a.id FROM engenheiro a
    WHERE a.firma_id = c.firma_id AND a.tipo = 'ADMIN'
    ORDER BY a.id ASC LIMIT 1
)
WHERE c.cadastrado_por_id IS NULL;

ALTER TABLE cliente ALTER COLUMN cadastrado_por_id SET NOT NULL;
