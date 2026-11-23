# Clínica+ — Spec do projeto

Fonte de contexto para pessoas e agentes de IA que trabalham neste repositório. Diz o que o sistema é, como está organizado, como rodar e como testar. Os requisitos detalhados ficam em [`docs/REQUISITOS.md`](docs/REQUISITOS.md).

## 1. Visão geral

Sistema web de agendamento de consultas médicas. Três perfis:

| Perfil | Quem é | O que faz |
|---|---|---|
| `PACIENTE` | Pessoa atendida | Cadastra-se, agenda, confirma, remarca e cancela as próprias consultas |
| `MEDICO` | Profissional de saúde | Define grade de horários e bloqueios, vê a própria agenda, registra atendimento e falta |
| `RECEPCAO` | Atendente / administrador | Cadastra médicos, especialidades e pacientes, opera a agenda de qualquer paciente, emite relatórios |

Estado atual: o sistema **não possui nenhum teste**.

## 2. Requisitos (base de teste)

- Arquivo: [`docs/REQUISITOS.md`](docs/REQUISITOS.md).
- Identificadores: `RF01`–`RF11` (funcionais, com subitens como `RF08.2`), `RN01`–`RN30` (regras de negócio), `RNF01`–`RNF08` (não funcionais, já mapeados à ISO/IEC 25010). A seção 5 lista os códigos de erro da API.
- Em divergência entre o código e os requisitos, **valem os requisitos**.

## 3. Stack

| Parte | Tecnologia | Módulos |
|---|---|---|
| Backend (`backend/`) | Node 22.12+, Express 4, SQLite (better-sqlite3 12.11.1), JWT (jsonwebtoken), bcryptjs | CommonJS (`require`) |
| Frontend (`frontend/`) | React 18, React Router 7, Vite 7 | ES Modules (`import`) |
| Repositório | npm workspaces (`backend`, `frontend`) | |

JavaScript puro, sem TypeScript.

## 4. Arquitetura

```
clinica-plus/
├── backend/src/
│   ├── domain/        regras de negócio puras, sem banco nem HTTP
│   │   ├── validacoes.js   CPF, e-mail, senha, CRM, idade
│   │   ├── agenda.js       grade semanal, sobreposição, geração de horários
│   │   └── consultas.js    máquina de estados, antecedência, limites, suspensão, preço
│   ├── services/      casos de uso: regras + repositórios (criarServicos(db))
│   ├── repositories/  acesso ao SQLite (SQL parametrizado)
│   ├── routes/        rotas REST em /api/*
│   ├── middleware/    autenticação JWT, perfis, tratamento de erros
│   ├── db/            connection.js (abrirBanco, limparBanco), schema.sql, seed.js (semear)
│   ├── utils/         clock.js (relógio), datas.js, errors.js
│   ├── app.js         criarApp({ db }): cria o app Express sem abrir porta
│   └── server.js      sobe o app na porta 3000
├── frontend/src/
│   ├── api/           cliente HTTP (client.js) e funções por recurso (index.js)
│   ├── contexts/      AuthContext (sessão, token, expiração), ToastContext (avisos)
│   ├── hooks/         useCarregar, useMensagem
│   ├── components/    Layout, RotaProtegida, TabelaConsultas, SeletorHorarios, EditorGrade, EditorBloqueios, diálogos
│   ├── pages/         login, cadastro e telas de paciente, médico e recepção
│   ├── utils/         formatadores.js (moeda, data, status)
│   └── App.jsx        rotas protegidas por perfil
└── docs/REQUISITOS.md
```

Fluxo de uma ação: página → `api/` → `fetch` → rota Express → middleware de autenticação → serviço → regras do `domain/` + repositório → SQLite.

### API

| Método | Rota | Quem |
|---|---|---|
| POST | `/api/auth/login` · `/api/auth/registro` | público |
| GET | `/api/auth/me` | autenticado |
| GET / POST | `/api/especialidades` | todos / recepção |
| GET / POST | `/api/medicos` | todos / recepção |
| GET / PUT | `/api/medicos/:id/disponibilidades` | todos / médico dono ou recepção |
| GET / POST / DELETE | `/api/medicos/:id/bloqueios[/:bloqueioId]` | médico dono ou recepção |
| GET | `/api/medicos/:id/horarios?data=AAAA-MM-DD` | autenticado |
| GET / POST | `/api/pacientes` | recepção |
| GET | `/api/pacientes/:id` | o próprio paciente ou recepção |
| GET / POST | `/api/consultas` | conforme perfil |
| GET | `/api/consultas/:id` | dono ou recepção |
| POST | `/api/consultas/:id/confirmar` · `cancelar` · `remarcar` · `realizar` · `falta` | conforme regra |
| PATCH | `/api/admin/usuarios/:id/ativo` | recepção |
| GET | `/api/admin/relatorios/resumo?dataInicio=&dataFim=` | recepção |
| GET | `/api/saude` | público |

## 5. Convenções

- Código, nomes e mensagens em português.
- Datas e horas locais no formato `AAAA-MM-DD HH:mm`. Valores monetários em centavos (inteiros).
- Erros da API em JSON: `{ "erro": { "codigo": "...", "mensagem": "..." } }`, com os códigos da seção 5 de `docs/REQUISITOS.md`. Nunca expõem stack trace.
- Frontend: sucesso aparece como toast (`.toast[data-tipo="sucesso"]`), erro aparece inline (`role="alert"`). Cancelamento pelo paciente usa o diálogo `#cancelar-confirmar` (não usa `window.confirm`).

## 6. Como rodar

```bash
npm install          # instala backend e frontend
npm run reset-db     # cria backend/data/clinica.db com os dados de exemplo
npm run dev          # API em http://localhost:3000/api e frontend em http://localhost:5173
```

| Variável (backend) | Para que serve |
|---|---|
| `PORT` | Porta da API (padrão 3000) |
| `CLINICA_DB` | Caminho do banco (`:memory:` para um banco descartável) |
| `CLINICA_AGORA` | Fixa o "agora" do servidor, ex.: `2026-10-19 08:00` |
| `JWT_SECRET` | Segredo do token |
| `CORS_ORIGINS` | Origens autorizadas (padrão `http://localhost:5173`) |

No frontend, `VITE_API_URL` define o endereço da API (padrão `http://localhost:3000/api`).

### Dados de exemplo (`semear`)

Senha de todos: `Senha123`.

| Perfil | Nome | E-mail | Detalhes |
|---|---|---|---|
| RECEPCAO | Rita Recepção | recepcao@clinica.com | |
| MEDICO | Dr. Carlos Almeida | carlos@clinica.com | Clínica Geral (R$ 150,00), 30 min, seg–sex 08–12 e 14–18 |
| MEDICO | Dra. Beatriz Souza | beatriz@clinica.com | Cardiologia (R$ 300,00), 45 min, seg/qua/sex 09–15 |
| MEDICO | Dr. Eduardo Lima | eduardo@clinica.com | Dermatologia (R$ 250,00), 30 min, ter/qui 13–19 |
| MEDICO | Dra. Fernanda Rocha | fernanda@clinica.com | Pediatria (R$ 200,00), 15 min, seg–sex 07–11 e sáb 08–12 |
| PACIENTE | Ana Pereira | ana@email.com | nascida em 1990-05-14 |
| PACIENTE | João Santos | joao@email.com | nascido em 1958-02-03 (idoso, desconto da RN23) |
| PACIENTE | Lucas Oliveira | lucas@email.com | 10 anos, responsável Marta Oliveira |

Não há consultas no banco inicial. Os ids seguem a ordem de criação (especialidades 1–4, médicos 1–4, pacientes 1–3), mas prefira obtê-los pelos retornos de `semear`, dos serviços ou da API.

## 7. Testes

### 7.1 Ferramentas

O ambiente de testes já tem estas bibliotecas instaladas e configuradas. Não use outras e não crie arquivos de configuração (`jest.config`, `vitest.config`, `playwright.config`, `package.json`).

| Onde | Biblioteca | Versão | Uso |
|---|---|---|---|
| Backend | `jest` | 30 | `testEnvironment: node`. Globais `describe`, `test`, `expect`, `beforeEach`. CommonJS. |
| Backend | `supertest` | 7 | `const request = require('supertest')` |
| Frontend | `vitest` | 5 | Ambiente `jsdom`. Importe explicitamente: `import { describe, test, expect, vi } from 'vitest'`. |
| Frontend | `@testing-library/react` | 16 | `render`, `screen`, `waitFor`, `within` |
| Frontend | `@testing-library/user-event` | 14 | |
| Frontend | `@testing-library/jest-dom` | 7 | Matchers como `toBeInTheDocument` já registrados |
| E2E | `@playwright/test` | 1.64 | `import { test, expect } from '@playwright/test'`. `baseURL` = `http://localhost:5173`. Chromium. |

Também podem ser usados os módulos nativos do Node e as dependências do próprio projeto (`jsonwebtoken`, `bcryptjs`, `better-sqlite3`, `react`, `react-router-dom`).

### 7.2 Onde gravar

Caminhos a partir da raiz do repositório. Importe o código do sistema com caminhos relativos.

| Nível | Pasta | Extensão | Exemplo de import |
|---|---|---|---|
| unitário (backend) | `backend/__testes__/unitario/` | `.test.js` | `require('../../src/domain/agenda')` |
| integração (backend) | `backend/__testes__/integracao/` | `.test.js` | `require('../../src/db/connection')` |
| API | `backend/__testes__/api/` | `.test.js` | `require('../../src/app')` |
| unitário (frontend) | `frontend/__testes__/unitario/` | `.test.js` ou `.test.jsx` | `import { formatarMoeda } from '../../src/utils/formatadores'` |
| integração (frontend) | `frontend/__testes__/integracao/` | `.test.jsx` | `import { StatusBadge } from '../../src/components/StatusBadge'` |
| E2E | `e2e/` | `.spec.js` | — |

Arquivos por assunto, em minúsculas com hífens (ex.: `backend/__testes__/api/consultas-agendamento.test.js`).

### 7.3 Ganchos de testabilidade

- **Banco:** `abrirBanco(':memory:')` (`backend/src/db/connection.js`) cria um banco novo em memória com o schema. `semear(db)` (`backend/src/db/seed.js`) popula com os dados de exemplo e retorna `{ medicos, pacientes }`. `criarServicos(db)` (`backend/src/services/index.js`) devolve serviços e repositórios ligados ao banco.
- **App sem porta:** `criarApp({ db })` (`backend/src/app.js`) devolve o app Express pronto para o Supertest. `app.locals.servicos` expõe os serviços.
- **Relógio:** o sistema obtém "agora" por `clock.agora()` (`backend/src/utils/clock.js`). Em testes de backend, fixe com `clock.definirAgora(new Date('2026-10-19T08:00:00'))` e restaure com `clock.definirAgora(null)`. Fixe o relógio **antes** de `semear(db)`, que usa a data para calcular a idade do paciente menor.
- **Interface:** campos com `<label>` associado (use `getByLabel`) e `id` estável nos elementos-chave (`#login-email`, `#login-senha`, `#login-entrar`, `#agendar-confirmar`, `tr[data-consulta-id]`, `[data-status]`).

### 7.4 Ambiente de execução

| Item | Valor |
|---|---|
| API (E2E) | http://localhost:3000/api |
| Frontend (E2E) | http://localhost:5173 |
| Banco nos E2E | Recriado com os dados de exemplo antes de cada arquivo `.spec.js`. Os testes de um mesmo arquivo rodam em sequência e compartilham o banco. |
| Relógio nos E2E | `2026-10-19 08:00` (segunda-feira), fixo. Não dá para mudar durante o E2E. |
| Token no frontend | Guardado no `localStorage` (ver `api/client.js` e `AuthContext.jsx`) |

Os testes são executados por um script externo, em uma cópia limpa do repositório.

### 7.5 Restrições para agentes

- Escreva arquivos **somente** nas pastas da seção 7.2. Não altere código, configuração, `docs/`, este `SPEC.md` nem as skills em `.agents/`.
- **Não execute comandos**: não rode testes, não instale pacotes, não suba servidores. As dependências não estão instaladas neste repositório.
- Não use a rede externa.

### 7.6 Atributos de qualidade no Clínica+

| Atributo ISO/IEC 25010 | Onde aparece |
|---|---|
| Adequação funcional | RN01–RN30: regras de agenda, valores, máquina de estados |
| Segurança | RN04, RN30, RNF01–RNF03: hash de senha, JWT, 401/403, injeção |
| Confiabilidade | RNF04: entradas malformadas, erros em JSON sem stack trace, estado consistente após erro |
| Usabilidade | RNF06: mensagens em português, rótulos, botões desabilitados, foco, teclado |
| Eficiência de desempenho | RNF05: tempo de resposta com muitas consultas na base |
| Compatibilidade | Contrato API ↔ frontend, formato JSON, CORS, RNF08 |
| Manutenibilidade | RNF07: regras puras sem banco ou HTTP, relógio injetável |
