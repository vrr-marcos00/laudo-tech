-- Simplifica o modelo para uso individual: remove o conceito de Firma e de
-- cadeia Admin/Engenheiro. Cada engenheiro passa a ser dono direto dos seus
-- próprios registros, sem nenhum agrupamento ou hierarquia entre contas.

ALTER TABLE cliente DROP COLUMN firma_id;
ALTER TABLE cliente RENAME COLUMN cadastrado_por_id TO engenheiro_id;

ALTER TABLE nr_catalogo DROP COLUMN firma_id;
ALTER TABLE nr_catalogo RENAME COLUMN cadastrado_por_id TO engenheiro_id;

ALTER TABLE modelo_laudo DROP COLUMN firma_id;
ALTER TABLE modelo_laudo RENAME COLUMN cadastrado_por_id TO engenheiro_id;

ALTER TABLE laudo DROP COLUMN firma_id;
ALTER TABLE laudo DROP COLUMN criado_por_id;

ALTER TABLE engenheiro DROP COLUMN firma_id;
ALTER TABLE engenheiro DROP COLUMN tipo;
ALTER TABLE engenheiro DROP COLUMN criado_por_id;

DROP TABLE firma;
