# Regras de Acesso e Permissões — Laudo Tech

Este documento explica, em linguagem simples, o que cada tipo de usuário pode e não pode fazer dentro do sistema. Serve como referência para qualquer pessoa que use o app — Admin ou Engenheiro.

## 1. Os dois tipos de usuário

O sistema tem dois papéis (perfis) possíveis para cada usuário cadastrado:

| Perfil | O que representa |
|---|---|
| **Admin** | Quem administra a firma. Pode existir mais de um Admin. Cada Admin cria e gerencia sua própria equipe de engenheiros. |
| **Engenheiro** | Um profissional cadastrado por um Admin. Trabalha "dentro" da equipe daquele Admin. |

> **Admins são cadastrados manualmente** (diretamente no banco de dados), não existe uma tela no app para criar um novo Admin. Isso é proposital: a criação de Admins é uma ação administrativa fora do fluxo normal do sistema.

### A "cadeia" de um Admin

Cada Admin forma uma **cadeia**: ele mesmo + todos os engenheiros que ele cadastrou. Um Engenheiro pertence a exatamente uma cadeia (a do Admin que o cadastrou) e nunca enxerga dados de uma cadeia diferente (de outro Admin), mesmo que estejam na mesma firma.

Tudo o que está descrito abaixo — clientes, catálogo de NRs, modelos de laudo, laudos — é sempre filtrado por essa cadeia. Ninguém vê ou mexe em dados de uma cadeia que não é a sua.

---

## 2. Perfil (tela pessoal)

- Todo usuário (Admin ou Engenheiro) tem acesso à própria tela de **Perfil**, sempre a primeira opção do menu lateral.
- Nela, o usuário edita seus próprios dados (nome, CREA, título profissional, e-mail, telefone, senha) e troca sua logo.
- Não existe mais campo de "assinatura" — foi removido do cadastro do engenheiro.
- Um usuário só edita o próprio perfil por essa tela. Para editar dados de outro engenheiro, o Admin usa a tela de **Engenheiros** (item 3).

---

## 3. Engenheiros (gestão de equipe)

| Ação | Admin | Engenheiro |
|---|---|---|
| Ver o menu "Engenheiros" | ✅ | ❌ (menu nem aparece) |
| Cadastrar novo engenheiro | ✅ (vira parte da sua cadeia) | ❌ |
| Ver a lista de engenheiros da equipe | ✅ (todos os que ele cadastrou) | ❌ |
| Editar dados de um engenheiro da equipe | ✅ | — |
| Buscar engenheiro por nome | ✅ | — |

- O próprio Admin **não aparece na lista de Engenheiros** (ele gerencia seus próprios dados pela tela de Perfil, não faz sentido se autogerenciar como se fosse um subordinado).
- Um Engenheiro não vê essa tela — o item de menu simplesmente não é exibido para ele.

---

## 4. Clientes

Esta é a área **mais aberta** do sistema: todo mundo da cadeia enxerga e edita os clientes de todo mundo. Só a exclusão é restrita.

| Ação | Admin | Engenheiro |
|---|---|---|
| Ver clientes cadastrados por qualquer um da cadeia (Admin ou colegas) | ✅ | ✅ |
| Cadastrar novo cliente | ✅ | ✅ |
| Editar dados de qualquer cliente da cadeia | ✅ | ✅ |
| Excluir cliente cadastrado por ele mesmo | ✅ | ✅ |
| Excluir cliente cadastrado por **outro** engenheiro | ✅ (qualquer um da sua cadeia) | ❌ (só os que ele mesmo cadastrou) |
| Filtrar clientes por engenheiro específico | ✅ (seletor "Todos os engenheiros") | — |
| Filtro rápido "Meus Clientes" | ✅ | ✅ |

**Regras adicionais:**
- Não é possível cadastrar um cliente **duplicado** dentro da mesma cadeia (mesmo CNPJ, ou mesmo nome quando não há CNPJ). Duas cadeias diferentes podem ter clientes com o mesmo CNPJ sem problema — são "mundos" separados.
- Um cliente **não pode ser excluído** se já existe algum laudo vinculado a ele (é preciso que o cliente esteja "livre" de laudos antes da exclusão).
- Todo card de cliente mostra "Cadastrado por [nome]", para deixar claro quem é o dono do cadastro.

---

## 5. Catálogo de NRs

Aqui a regra muda: cada Engenheiro só **enxerga e mantém as próprias NRs**, além do catálogo do Admin (que funciona como uma base compartilhada).

| Ação | Admin | Engenheiro |
|---|---|---|
| Ver todas as NRs cadastradas por qualquer engenheiro da cadeia | ✅ | ❌ |
| Ver as NRs que ele mesmo cadastrou | ✅ | ✅ |
| Ver as NRs cadastradas pelo Admin | ✅ | ✅ (somente leitura) |
| Ver NRs cadastradas por **outro** engenheiro (colega) | ✅ | ❌ |
| Cadastrar nova NR | ✅ | ✅ (fica visível só para ele, e para o Admin) |
| Editar/excluir NR cadastrada por ele mesmo | ✅ | ✅ |
| Editar/excluir NR cadastrada por outro (inclusive do Admin) | ✅ (qualquer uma da sua cadeia) | ❌ |
| Filtrar por engenheiro específico | ✅ | — |
| Filtro rápido "Minhas NRs" | ✅ | ✅ |

Na prática: um Engenheiro vê o catálogo "base" que o Admin manteve para a equipe toda, mas só pode alterar as entradas que ele mesmo criou — as do Admin aparecem para ele como referência, sem botão de editar/excluir.

---

## 6. Modelos de Laudo

Segue exatamente a mesma lógica do Catálogo de NRs.

| Ação | Admin | Engenheiro |
|---|---|---|
| Ver todos os modelos da cadeia | ✅ | ❌ |
| Ver os próprios modelos + os do Admin | ✅ | ✅ |
| Ver modelos de outro engenheiro (colega) | ✅ | ❌ |
| Criar modelo | ✅ | ✅ |
| Editar tópicos / excluir modelo próprio | ✅ | ✅ |
| Editar tópicos / excluir modelo de outro (inclusive do Admin) | ✅ | ❌ — só pode **visualizar** os tópicos (tela somente leitura) |
| Filtrar por engenheiro específico | ✅ | — |
| Filtro rápido "Meus Modelos" | ✅ | ✅ |

Quando um Engenheiro abre um modelo que não é dele (por exemplo, o modelo padrão do Admin), a tela de tópicos abre em **modo somente leitura**: dá pra ver o conteúdo, mas os botões de adicionar/editar/remover/salvar tópico ficam ocultos.

---

## 7. Laudos

Aqui a regra é a mais restrita: um Engenheiro só acessa os laudos atribuídos a ele mesmo.

| Ação | Admin | Engenheiro |
|---|---|---|
| Ver laudos de qualquer engenheiro da cadeia | ✅ | ❌ (só os atribuídos a ele) |
| Criar laudo para si mesmo | ✅ | ✅ |
| Criar laudo em nome de um engenheiro da equipe | ✅ | ❌ |
| Editar / mudar status / gerar PDF de um laudo próprio | ✅ | ✅ |
| Editar laudo atribuído a outro engenheiro | ✅ (qualquer um da sua cadeia) | ❌ |
| Excluir laudo (somente se estiver em rascunho) | ✅ | ✅ (se for dele) |
| Filtrar por engenheiro responsável | ✅ | — |
| Filtro rápido "Meus Laudos" | ✅ | — (não existe, pois ele já só vê os dele) |
| Filtro "Criados pelo Admin" | — | ✅ (mostra os laudos que o Admin criou em nome dele) |

**Quem criou vs. quem é o responsável:** quando o Admin cria um laudo em nome de um engenheiro, o sistema guarda os dois dados separadamente — quem é o **engenheiro responsável** (aparece no laudo, no CREA, na assinatura) e quem **de fato criou o registro**. Isso permite que o engenheiro, na sua própria lista de laudos, filtre "Criados pelo Admin" para identificar quais laudos foram lançados por outra pessoa em seu nome.

**Regras de status e versão:**
- Todo laudo novo nasce como **Rascunho**.
- A única transição de status permitida é Rascunho → Finalizado. Não existe "voltar" um laudo finalizado para rascunho.
- Um laudo **Finalizado não pode ser editado diretamente** — para continuar alterando, é preciso criar uma **nova versão** (que copia todo o conteúdo do laudo original e some mais uma na numeração).
- Só é possível **baixar o PDF** de um laudo que já esteja Finalizado.
- Só é possível **excluir** um laudo que esteja em Rascunho **e** que não tenha nenhuma versão mais nova derivada dele.

---

## 8. Resumo rápido — o que cada perfil pode fazer

| Módulo | Admin | Engenheiro |
|---|---|---|
| Perfil próprio | Editar | Editar |
| Engenheiros (equipe) | Cadastrar, ver, editar todos | Sem acesso |
| Clientes | Ver e editar todos • excluir qualquer um | Ver e editar todos • excluir só os próprios |
| Catálogo de NRs | Ver, criar, editar e excluir tudo da cadeia | Ver os próprios + os do Admin • gerenciar só os próprios |
| Modelos de Laudo | Ver, criar, editar e excluir tudo da cadeia | Ver os próprios + os do Admin (leitura) • gerenciar só os próprios |
| Laudos | Ver, criar e editar para qualquer engenheiro da equipe | Ver, criar e editar só os próprios |

## 9. Filtros disponíveis

Nas telas de Clientes, Catálogo de NRs, Modelos de Laudo e Laudos:

- **Admin** tem um seletor "Filtrar por engenheiro" (lista todos os engenheiros da sua cadeia) e também o botão de atalho "Meus [X]".
- **Engenheiro** só tem o botão de atalho ("Meus Clientes", "Minhas NRs", "Meus Modelos"), já que ele não tem acesso à lista completa de nomes da equipe. Na tela de Laudos, esse botão vira "Criados pelo Admin" (ver seção 7).
- Na tela de Engenheiros, o Admin pode buscar por nome.
