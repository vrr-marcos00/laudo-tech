ALTER TABLE nr_catalogo ADD COLUMN cadastrado_por_id BIGINT REFERENCES engenheiro(id);

UPDATE nr_catalogo n
SET cadastrado_por_id = COALESCE(
    (SELECT e.id FROM engenheiro e WHERE e.firma_id = n.firma_id AND e.tipo = 'ADMIN' ORDER BY e.id ASC LIMIT 1),
    (SELECT e.id FROM engenheiro e WHERE e.tipo = 'ADMIN' ORDER BY e.id ASC LIMIT 1)
)
WHERE n.cadastrado_por_id IS NULL;

ALTER TABLE nr_catalogo ALTER COLUMN cadastrado_por_id SET NOT NULL;
