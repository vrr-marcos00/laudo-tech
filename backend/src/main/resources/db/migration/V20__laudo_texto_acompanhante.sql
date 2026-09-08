ALTER TABLE laudo ALTER COLUMN quem_acompanhou TYPE TEXT;
ALTER TABLE laudo RENAME COLUMN quem_acompanhou TO texto_acompanhante;
ALTER TABLE laudo DROP COLUMN funcao_acompanhante;
