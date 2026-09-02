UPDATE cliente SET
    nome = UPPER(nome),
    endereco = UPPER(endereco),
    cidade = UPPER(cidade),
    estado = UPPER(estado),
    cep = UPPER(cep),
    telefone = UPPER(telefone);

UPDATE engenheiro SET
    nome = UPPER(nome),
    crea = UPPER(crea),
    titulo_profissional = UPPER(titulo_profissional),
    telefone = UPPER(telefone);
