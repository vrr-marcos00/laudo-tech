# Regras de Uso e Acesso — Laudo Tech

Este documento explica, em linguagem simples, o que o sistema permite e não permite fazer hoje. Reflete o comportamento real do código (verificado diretamente no backend), não um roadmap ou intenção futura.

> **Nota histórica:** o banco de dados já teve um sistema de papéis Admin/Engenheiro com "firmas" (migrations `V8` a `V13`), mas ele foi **revertido** pela migration `V14__modelo_individual.sql`, que removeu as colunas `firma_id`, `tipo` e `criado_por_id` e voltou tudo para um modelo individual. Se você encontrar documentação antiga mencionando "Admin", "cadeia" ou "firma", ela está desatualizada — não existe mais no app.

## 1. Modelo de acesso: individual, sem hierarquia

Cada **Engenheiro** cadastrado é uma conta completamente independente:

- Não existe papel de Admin, nem qualquer hierarquia entre contas.
- Cada Engenheiro só enxerga e edita os próprios registros — Clientes, Catálogo de NRs, Modelos de Laudo e Laudos são todos vinculados diretamente a quem os criou (`engenheiro_id`).
- Não há compartilhamento, delegação ou visão cruzada entre contas de engenheiros diferentes.
- Toda tentativa de acessar um registro que não é seu retorna erro (`"Você não tem permissão para acessar este [recurso]."`), com uma única exceção de mensagem: no Catálogo de NRs e em Modelos de Laudo, um registro de outro dono nem aparece como existente — a mensagem é genérica (`"NR não encontrada"` / `"Modelo não encontrado"`), para não revelar que o registro existe.

## 2. Cadastro e login

- Qualquer pessoa pode se cadastrar livremente em `/cadastro` — não é preciso estar autenticado nem ser convidado por ninguém. Basta nome, CREA, e-mail e senha (título profissional e telefone são opcionais).
- Não é possível cadastrar duas contas com o mesmo e-mail.
- Login e cadastro nunca revelam se o problema foi e-mail inexistente ou senha errada — a mensagem é sempre genérica (`"Credenciais inválidas"`).
- Todo o restante da API exige um token JWT (obtido no login/cadastro) enviado como `Authorization: Bearer <token>`.

## 3. Perfil do Engenheiro

- Cada Engenheiro edita os próprios dados (nome, CREA, título profissional, telefone, senha) e envia logo e assinatura pela tela de perfil.
- **Atenção:** o e-mail não pode ser alterado por essa tela hoje — o campo existe no formulário mas o backend ignora a alteração silenciosamente (bug conhecido, não uma regra intencional).

## 4. Clientes

- Todo Cliente pertence a um único Engenheiro (quem cadastrou).
- **Duplicidade:** não é possível cadastrar dois clientes com o mesmo CNPJ para o mesmo engenheiro. Se o CNPJ ficar em branco, a checagem cai para nome duplicado (mesmo nome, mesmo engenheiro) — mas só quando o CNPJ está vazio; dois clientes com CNPJs diferentes podem ter o mesmo nome sem problema.
- **Exclusão bloqueada:** um cliente não pode ser excluído se já existe algum laudo vinculado a ele.
- Reenviar uma foto de cliente substitui a anterior (o arquivo antigo é apagado do storage).

## 5. Catálogo de NRs

- Cada NR cadastrada pertence a um único Engenheiro — não existe uma base compartilhada entre contas.
- Prioridade (`CRITICO`, `ALTO`, `MEDIO`, `BAIXO`) tem `MEDIO` como padrão se não for informada.
- Não há checagem de duplicidade por número de NR.

## 6. Modelos de Laudo

- Cada modelo pertence a um único Engenheiro.
- Ao editar um modelo, todos os tópicos são substituídos por completo pela lista enviada (não é um merge incremental).
- Não há checagem de nome duplicado.

## 7. Laudos

Esta é a área com mais regras de negócio do sistema.

### Status e edição
- Um laudo só tem dois status possíveis: **Rascunho** e **Finalizado**.
- A única transição permitida é **Rascunho → Finalizado**. Não existe voltar um laudo finalizado para rascunho.
- Um laudo **Finalizado não pode ser editado** (nem seus tópicos, áreas, fotos ou pontos de anotação) — a única forma de continuar alterando é criar uma **nova versão**.
- O PDF para **download** só pode ser gerado se o laudo estiver **Finalizado**. O **preview** (visualização inline) funciona em qualquer status, inclusive Rascunho.

### Exclusão
- Só é possível excluir um laudo que esteja em **Rascunho**.
- Um laudo não pode ser excluído se **outro laudo** foi criado como nova versão dele (ele "tem uma versão derivada").
- Ao excluir, fotos e logo de capa só são removidas do storage se nenhum outro laudo/foto ainda referenciar o mesmo arquivo (evita apagar arquivo compartilhado por engano).

### Versionamento
- Criar uma nova versão funciona em qualquer status (Rascunho ou Finalizado).
- A nova versão nasce sempre como **Rascunho**, com o número de versão incrementado (+1), copiando todo o conteúdo do laudo original: tópicos, áreas, fotos, pontos de anotação, NRs vinculadas e configurações de exibição (capa, sumário, assinaturas).
- As fotos não são reenviadas para o storage — a nova versão reaproveita as mesmas URLs das fotos originais.
- **O laudo original não é alterado nem travado** ao criar uma nova versão — ele continua existindo do jeito que estava.

### Tópicos automáticos
O sistema adiciona automaticamente dois tópicos especiais quando fazem sentido, e nunca os remove sozinho mesmo que a condição deixe de ser verdadeira depois:
- **"REGISTRO FOTOGRÁFICO, NÃO CONFORMIDADES E RECOMENDAÇÕES"** — aparece assim que qualquer área do laudo tiver ao menos uma foto.
- **"ITENS CRÍTICOS – NECESSIDADE DE AÇÃO IMEDIATA"** — aparece assim que qualquer ponto de anotação numa foto estiver vinculado a uma NR de prioridade **Crítico**.

### Tópicos manuais
- Tópicos do tipo texto comum precisam ter título **e** conteúdo preenchidos — não é possível salvar um tópico de texto vazio.

## 8. Fotos e pontos de anotação

- Upload, exclusão e edição de pontos de anotação só são permitidos enquanto o laudo estiver em **Rascunho**.
- Salvar os pontos de uma foto substitui **todos** os pontos daquela foto de uma vez (não é possível editar um ponto individualmente por essa rota) — a numeração dos pontos é sempre recalculada em sequência a partir de 1.
- Não há limite de quantidade de fotos por área.

## 9. Upload de arquivos (regras gerais)

- Limite de 20MB por arquivo, 50MB por requisição (aplicado globalmente pelo Spring Boot).
- Não há validação de tipo de arquivo (extensão/MIME) — o sistema aceita qualquer tipo de arquivo enviado nos campos de foto/logo/assinatura.
- Endpoints de upload: foto de cliente, logo e assinatura do engenheiro, logo de capa do laudo, foto de área de inspeção.
