ALTER TABLE laudo ADD COLUMN criado_por_id BIGINT REFERENCES engenheiro(id);

UPDATE laudo SET criado_por_id = engenheiro_id WHERE criado_por_id IS NULL;

ALTER TABLE laudo ALTER COLUMN criado_por_id SET NOT NULL;
