# Clínica+ — Especificação de Requisitos

Sistema web de agendamento de consultas médicas. Esta especificação é a **base de teste** do experimento: os casos de teste gerados pelos LLMs devem ser derivados dela.

Convenções:
- Datas e horas são locais (fuso da clínica), no formato `AAAA-MM-DD HH:mm`.
- Valores monetários são armazenados em centavos (inteiros).
- "Consulta ativa" = consulta com status `AGENDADA` ou `CONFIRMADA`.
- "Agora" é o relógio do servidor (pode ser fixado pela variável `CLINICA_AGORA` para testes).

## 1. Perfis de usuário

| Perfil | Quem é | O que faz |
|---|---|---|
| `PACIENTE` | Pessoa atendida | Cadastra-se, agenda, confirma, remarca e cancela as **próprias** consultas |
| `MEDICO` | Profissional de saúde | Define sua grade de horários e bloqueios, vê a própria agenda, registra atendimento e falta |
| `RECEPCAO` | Atendente / administrador | Cadastra médicos, especialidades e pacientes, opera a agenda de qualquer paciente, emite relatórios |

## 2. Requisitos funcionais

### RF01 — Autenticação
- RF01.1 O usuário faz login com e-mail e senha e recebe um token JWT válido por **8 horas**.
- RF01.2 Rotas da API (exceto login, cadastro de paciente e saúde) exigem token válido no cabeçalho `Authorization: Bearer <token>`.
- RF01.3 `GET /api/auth/me` retorna os dados do usuário logado.

### RF02 — Cadastro de paciente
- RF02.1 Qualquer pessoa pode se cadastrar como paciente (auto-cadastro).
- RF02.2 A recepção também pode cadastrar pacientes.
- RF02.3 Campos: nome, e-mail, senha, CPF, data de nascimento, telefone, nome do responsável (condicional, ver RN06).

### RF03 — Especialidades
- RF03.1 A recepção cadastra especialidades com nome e preço base da consulta.
- RF03.2 Qualquer usuário autenticado lista as especialidades.

### RF04 — Cadastro de médico
- RF04.1 Somente a recepção cadastra médicos (nome, e-mail, senha, CRM, especialidade, duração da consulta).

### RF05 — Grade de disponibilidade
- RF05.1 O médico (ou a recepção) define a grade semanal: blocos com dia da semana, hora de início e hora de fim.
- RF05.2 Salvar a grade substitui a grade anterior por inteiro.

### RF06 — Bloqueios de agenda
- RF06.1 O médico (ou a recepção) cria bloqueios por período de datas (férias, congresso), com motivo.
- RF06.2 O médico (ou a recepção) remove bloqueios.

### RF07 — Consulta de horários livres
- RF07.1 Dado um médico e uma data, o sistema lista os horários livres para agendamento.

### RF08 — Agendamento
- RF08.1 O paciente agenda para si; a recepção agenda para qualquer paciente.
- RF08.2 O sistema calcula e grava o valor da consulta no momento do agendamento.

### RF09 — Ciclo de vida da consulta
- RF09.1 Confirmar presença.
- RF09.2 Cancelar, com motivo.
- RF09.3 Remarcar para outro horário com o mesmo médico.
- RF09.4 Registrar atendimento realizado, com observações.
- RF09.5 Registrar falta do paciente.

### RF10 — Listagens
- RF10.1 O paciente vê somente as próprias consultas.
- RF10.2 O médico vê somente as consultas da própria agenda.
- RF10.3 A recepção vê todas, com filtros por data, status, médico e paciente.

### RF11 — Relatório
- RF11.1 A recepção obtém, para um período, o total de consultas por status, a taxa de faltas por médico e o faturamento das consultas realizadas.

## 3. Regras de negócio

### Contas e cadastro
- **RN01** E-mail deve ter formato válido e ser único no sistema.
- **RN02** Senha deve ter no mínimo 8 caracteres, com pelo menos uma letra e um número.
- **RN03** CPF deve ser válido (11 dígitos, dígitos verificadores corretos, não pode ter todos os dígitos iguais) e único. Pode ser enviado com ou sem pontuação; é gravado só com dígitos.
- **RN04** Após **5 tentativas de login erradas seguidas**, a conta fica bloqueada por **15 minutos**. Um login correto zera o contador. Durante o bloqueio, até a senha correta é recusada.
- **RN05** Data de nascimento não pode ser futura nem indicar idade acima de 130 anos.
- **RN06** Paciente menor de 18 anos deve informar o nome do responsável.
- **RN07** CRM no formato `NNNN/UF` a `NNNNNN/UF` (4 a 6 dígitos, barra, UF brasileira válida) e único.
- **RN08** Duração da consulta do médico: entre 15 e 60 minutos, múltiplo de 15. Padrão: 30.
- **RN09** Nome de especialidade é único; preço base maior que zero.

### Grade e bloqueios
- **RN10** Blocos de disponibilidade: dia da semana de 0 (domingo) a 6 (sábado); horários entre `07:00` e `20:00`; início antes do fim; minutos múltiplos de 15.
- **RN11** Blocos do mesmo dia não podem se sobrepor (encostar é permitido: 08:00–12:00 e 12:00–14:00).
- **RN12** Bloqueio: data final não pode ser anterior à inicial; não pode começar no passado.
- **RN13** Não é permitido criar bloqueio em período que já tenha consulta ativa do médico.

### Horários livres
- **RN14** Os horários são gerados a partir dos blocos do dia da semana, em passos iguais à duração da consulta do médico, desde que caibam inteiros no bloco.
- **RN15** São excluídos: horários que conflitam com consulta ativa do médico; datas dentro de bloqueio; horários que não respeitam a antecedência mínima (RN16).

### Agendamento
- **RN16** Antecedência mínima de **2 horas** e máxima de **60 dias**.
- **RN17** O horário deve ser exatamente um dos horários livres do médico (RN14 e RN15).
- **RN18** O paciente não pode ter outra consulta ativa que se sobreponha ao mesmo horário (com qualquer médico).
- **RN19** O paciente pode ter no máximo **3 consultas ativas futuras** e no máximo **1 consulta ativa futura por especialidade**.
- **RN20** Suspensão por faltas: paciente com **3 ou mais faltas nos últimos 90 dias** fica impedido de agendar até **30 dias após a última falta**. A regra vale também quando a recepção agenda.
- **RN21** Paciente com conta inativa não pode agendar; médico inativo não recebe agendamentos.

### Valor da consulta
- **RN22** Valor = preço base da especialidade do médico.
- **RN23** Paciente com **60 anos ou mais** na data da consulta tem **10% de desconto** (arredondado para o centavo mais próximo).
- **RN24** **Retorno gratuito**: se o paciente teve consulta `REALIZADA` com o **mesmo médico** nos **30 dias** anteriores ao novo horário, a nova consulta custa zero. Cada consulta realizada dá direito a **um** retorno gratuito (consultas canceladas devolvem o direito). Retorno e desconto de idade não se somam: retorno prevalece.

### Ciclo de vida (máquina de estados)

```
AGENDADA ──► CONFIRMADA ──► REALIZADA
   │  │           │  │
   │  │           │  └────► FALTA
   │  │           └───────► CANCELADA
   │  ├──────────────────► REALIZADA / FALTA
   │  └──────────────────► CANCELADA
```
`REALIZADA`, `FALTA` e `CANCELADA` são estados finais.

- **RN25** Confirmação: só de consulta `AGENDADA`, pelo próprio paciente ou pela recepção, nas **48 horas** anteriores ao início (e antes do início).
- **RN26** Cancelamento pelo paciente: até **24 horas** antes do início. Recepção: até o início. Médico: até o início, apenas consultas da própria agenda. Motivo obrigatório para recepção e médico.
- **RN27** Remarcação: pelo paciente ou recepção, até **24 horas** antes do início atual, no máximo **2 vezes** por consulta. O novo horário segue RN16 a RN19 (desconsiderando a própria consulta) e a consulta volta para `AGENDADA`. O valor é recalculado.
- **RN28** Atendimento realizado: só pelo médico da consulta, a partir do horário de início.
- **RN29** Falta: pelo médico da consulta ou pela recepção, a partir de **15 minutos** após o início.

### Autorização
- **RN30** Paciente só acessa os próprios dados e consultas; médico só a própria agenda, grade e bloqueios. Acesso a recurso de outro usuário retorna `403`; recurso inexistente retorna `404`.

## 4. Requisitos não funcionais (mapeados à ISO/IEC 25010)

| Id | Característica | Requisito |
|---|---|---|
| RNF01 | Segurança — confidencialidade | Senhas armazenadas com hash bcrypt; nunca retornadas pela API. |
| RNF02 | Segurança — autenticidade | Token JWT assinado, expira em 8h; token ausente/inválido → `401`. |
| RNF03 | Segurança — integridade | Consultas SQL parametrizadas; entrada validada no servidor. |
| RNF04 | Confiabilidade — tolerância a falhas | Erros retornam JSON `{ erro: { codigo, mensagem } }`, sem expor stack trace. |
| RNF05 | Eficiência de desempenho | Listagem de horários e agendamento respondem em menos de 500 ms com até 10 mil consultas na base. |
| RNF06 | Usabilidade | Mensagens de erro em português, legíveis pelo usuário final. |
| RNF07 | Manutenibilidade — testabilidade | Regras de negócio puras em `src/domain`, sem dependência de banco ou HTTP; relógio injetável. |
| RNF08 | Compatibilidade | Funciona nas versões atuais de Chrome, Firefox e Edge. |

## 5. Códigos de erro da API

| HTTP | `codigo` | Quando |
|---|---|---|
| 400 | `VALIDACAO` | Dado de entrada inválido |
| 401 | `NAO_AUTENTICADO` | Token ausente, inválido ou expirado; credenciais erradas |
| 403 | `SEM_PERMISSAO` | Perfil ou dono do recurso não autorizado |
| 404 | `NAO_ENCONTRADO` | Recurso inexistente |
| 409 | `CONFLITO` | Duplicidade (e-mail, CPF, CRM) ou conflito de agenda |
| 422 | `REGRA_NEGOCIO` | Violação de regra de negócio (antecedência, limites, transição de status inválida etc.) |
| 423 | `CONTA_BLOQUEADA` | Conta bloqueada por tentativas de login (RN04) |
