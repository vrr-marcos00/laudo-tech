-- Firma padrão
INSERT INTO firma (nome, cnpj, email) VALUES ('Engenharia Padrão Ltda', '00.000.000/0001-00', 'contato@engenharia.com');

-- Engenheiro admin (senha: admin123 bcrypt)
INSERT INTO engenheiro (firma_id, nome, crea, titulo_profissional, email, senha_hash)
VALUES (1, 'Administrador', 'CREA-SP 000000', 'Engenheiro Eletricista',
        'admin@laudotech.com',
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewsI3HBYXfHQKTCu');

-- NRs mais comuns NR-10
INSERT INTO nr_catalogo (firma_id, numero_nr, artigo, titulo, descricao, solucao_padrao, prioridade) VALUES
(1, 'NR-10', '10.2.1', 'Partes vivas expostas', 'Existência de partes vivas expostas acessíveis, possibilitando contato acidental.',
 'Instalar barreiras, anteparos, tampas ou invólucros apropriados para impedir o contato acidental com partes energizadas.', 'CRITICO'),
(1, 'NR-10', '10.2.3', 'Sinalização de segurança ausente', 'Ausência de placas de sinalização contendo tensão de operação, advertência de choque elétrico e acesso restrito.',
 'Instalar placas de identificação e advertência indicando tensão de trabalho, risco de choque elétrico e restrição de acesso conforme NR-10.', 'ALTO'),
(1, 'NR-10', '10.2.4', 'Aterramento inadequado', 'Ausência ou inadequação do sistema de aterramento das massas metálicas.',
 'Realizar a interligação das partes metálicas ao sistema de aterramento, garantindo equipotencialização e continuidade elétrica.', 'CRITICO'),
(1, 'NR-10', '10.2.7', 'Identificação de circuitos ausente', 'Disjuntores e circuitos sem identificação legível e permanente.',
 'Identificar todos os disjuntores e circuitos de forma legível, permanente e padronizada.', 'MEDIO'),
(1, 'NBR-5410', '6.1', 'Condutor fora da padronização de cores', 'Utilização de condutor na cor azul-claro como condutor de fase, em desacordo com ABNT NBR 5410.',
 'Adequar a identificação dos condutores conforme ABNT NBR 5410, utilizando azul exclusivamente para neutro.', 'ALTO'),
(1, 'NBR-5410', '6.2', 'Condutor subdimensionado', 'Condutores com seção nominal inferior ao dimensionamento requerido para os respectivos circuitos.',
 'Substituir condutores subdimensionados por cabos com seção nominal compatível conforme ABNT NBR 5410.', 'CRITICO'),
(1, 'NR-10', '10.3.1', 'Acesso à cabine obstruído', 'Presença de material obstruindo o acesso à cabine elétrica, dificultando operação e evacuação.',
 'Remover imediatamente qualquer material que obstrua o acesso à cabine, mantendo área permanentemente desobstruída e sinalizada.', 'ALTO'),
(1, 'NR-10', '10.2.9', 'Iluminação inadequada', 'Sistema de iluminação em condições inadequadas, comprometendo a segurança durante atividades de operação.',
 'Adequar o sistema de iluminação, substituindo luminárias danificadas e garantindo níveis adequados conforme norma.', 'MEDIO');

-- Modelo padrão NR-10
INSERT INTO modelo_laudo (firma_id, nome, descricao) VALUES
(1, 'Laudo NR-10 Padrão', 'Modelo padrão para laudos de instalações elétricas conforme NR-10 e NBR-5410');

INSERT INTO modelo_topico (modelo_id, titulo, conteudo, ordem) VALUES
(1, 'OBJETIVO', 'O presente laudo tem como objetivo avaliar as condições elétricas das instalações, verificando sua conformidade com as normas técnicas vigentes, em especial a NBR 5410 (Instalações Elétricas de Baixa Tensão) e a NR 10 (Segurança em instalações e Serviços em eletricidade).

A inspeção contempla análise visual das instalações, verificação dos quadros elétricos, dispositivos de proteção, sistemas de aterramento, identificação de circuitos, condições de operação e manutenção, além da avaliação de possíveis riscos elétricos.', 1),
(1, 'REFERÊNCIAS NORMATIVAS', '• NBR 5410:2005 – Instalações Elétricas de Baixa Tensão
• NR-10:2005 – Segurança em Instalações e Serviços em Eletricidade
• ABNT NBR 5419-1:2015 – Proteção contra Descargas Atmosféricas', 2),
(1, 'DESCRIÇÃO DAS ATIVIDADES', 'RECEBIMENTO DE ENERGIA: BT - 440V / 380V / 220V-127V / 3F+N

Conforme NBR 5410, a instalação classifica-se dentro do padrão de Baixa Tensão (BT), que abrange tensões de até 1.000 volts em corrente alternada (CA).', 3),
(1, 'TIPO DE ATERRAMENTO', 'O sistema de aterramento adotado é o TN-C-S (Terra-Neutro Combinado e Separado), no qual o fornecimento inicial ocorre por meio de condutor PEN (neutro e proteção combinados), sendo posteriormente realizada a separação em condutor neutro (N) e condutor de proteção (PE) no quadro geral de distribuição.

Tal configuração atende aos princípios de segurança previstos na NR 10 e às disposições da ABNT NBR 5410.', 4),
(1, 'CONCLUSÃO TÉCNICA', 'Com base nas observações realizadas durante a vistoria técnica, constatou-se que as instalações elétricas apresentam não conformidades em relação às normas NBR 5410 e NR-10, conforme detalhado no registro fotográfico.

Recomenda-se a adoção imediata das medidas corretivas indicadas, priorizando os itens classificados como críticos, visando garantir a segurança dos trabalhadores e a conformidade legal da instalação.', 5);
