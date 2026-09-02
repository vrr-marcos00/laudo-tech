UPDATE laudo_topico
SET conteudo = '<p>' || replace(replace(replace(replace(conteudo, '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), E'\n', '</p><p>') || '</p>'
WHERE tipo = 'TEXTO' AND conteudo IS NOT NULL AND conteudo <> '';

UPDATE modelo_topico
SET conteudo = '<p>' || replace(replace(replace(replace(conteudo, '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), E'\n', '</p><p>') || '</p>'
WHERE conteudo IS NOT NULL AND conteudo <> '';
