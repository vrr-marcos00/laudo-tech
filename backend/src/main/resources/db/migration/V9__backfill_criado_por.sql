-- Engenheiros cadastrados antes da feature de papéis não têm criado_por definido.
-- Vincula-os ao primeiro Admin da mesma firma, preservando o acesso do Admin
-- aos laudos já existentes desses engenheiros.
UPDATE engenheiro e
SET criado_por_id = (
    SELECT a.id FROM engenheiro a
    WHERE a.firma_id = e.firma_id AND a.tipo = 'ADMIN'
    ORDER BY a.id ASC LIMIT 1
)
WHERE e.tipo = 'ENGENHEIRO' AND e.criado_por_id IS NULL;
