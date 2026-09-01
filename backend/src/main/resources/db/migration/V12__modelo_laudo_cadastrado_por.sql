ALTER TABLE modelo_laudo ADD COLUMN cadastrado_por_id BIGINT REFERENCES engenheiro(id);

UPDATE modelo_laudo m
SET cadastrado_por_id = COALESCE(
    (SELECT e.id FROM engenheiro e WHERE e.firma_id = m.firma_id AND e.tipo = 'ADMIN' ORDER BY e.id ASC LIMIT 1),
    (SELECT e.id FROM engenheiro e WHERE e.tipo = 'ADMIN' ORDER BY e.id ASC LIMIT 1)
)
WHERE m.cadastrado_por_id IS NULL;

ALTER TABLE modelo_laudo ALTER COLUMN cadastrado_por_id SET NOT NULL;
