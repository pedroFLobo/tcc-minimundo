# Clínica+ — sistema-alvo do TCC 2

Sistema de agendamento de consultas médicas, criado **sem nenhum teste** para servir de base ao experimento de geração de casos de teste por LLMs (ISO/IEC 25010).

Backend e frontend são aplicações separadas, como em produção: o frontend React roda em `localhost:5173` e chama a API Node em `localhost:3000` via HTTP (CORS).

- Especificação (requisitos, 30 regras de negócio, RNFs, códigos de erro): [`docs/REQUISITOS.md`](docs/REQUISITOS.md)

```
clinica-plus/
├── backend/    API REST — Node 22+, Express 4, SQLite (better-sqlite3), JWT
├── frontend/   SPA — React 18, React Router 7, Vite 7
└── docs/       especificação de requisitos (base de teste)
```

## Como rodar

Requer Node.js 22.12 ou superior (22 ou 24 LTS recomendados). O driver SQLite usa binários pré-compilados, sem precisar de Visual Studio.

```bash
npm install          # instala backend e frontend (npm workspaces)
npm run reset-db     # cria o banco com dados de exemplo
npm run dev          # sobe API (3000) e frontend (5173) juntos
```

Abra http://localhost:5173. Para rodar cada parte isolada: `npm run dev -w backend` e `npm run dev -w frontend`.

Usuários de exemplo (senha de todos: `Senha123`):

| Perfil | E-mail |
|---|---|
| Recepção | recepcao@clinica.com |
| Médicos | carlos@clinica.com (Clínica Geral), beatriz@clinica.com (Cardiologia), eduardo@clinica.com (Dermatologia), fernanda@clinica.com (Pediatria) |
| Pacientes | ana@email.com, joao@email.com (61+ anos), lucas@email.com (menor de idade) |

### Configuração

Copie `backend/.env.example` para `backend/.env` e `frontend/.env.example` para `frontend/.env` se quiser mudar algo.

| Variável | Onde | Para que serve |
|---|---|---|
| `PORT` | backend | Porta da API (padrão 3000) |
| `CLINICA_DB` | backend | Caminho do banco (`:memory:` para um banco descartável) |
| `CLINICA_AGORA` | backend | Fixa o "agora" do servidor, ex.: `2026-10-19 08:00`. Essencial para testar regras de horário. |
| `JWT_SECRET` | backend | Segredo do token |
| `CORS_ORIGINS` | backend | Origens autorizadas a chamar a API (padrão `http://localhost:5173`) |
| `VITE_API_URL` | frontend | Endereço da API (padrão `http://localhost:3000/api`) |

## Arquitetura

### Backend (`backend/src`)

```
domain/        regras de negócio puras, sem banco nem HTTP     → testes unitários
  validacoes.js   CPF, e-mail, senha, CRM, idade
  agenda.js       grade semanal, sobreposição, geração de horários
  consultas.js    máquina de estados, antecedência, limites, suspensão, preço
services/      casos de uso: regras + repositórios             → testes de integração
repositories/  acesso ao SQLite (SQL parametrizado)            → testes de integração
routes/        API REST                                        → testes de API / contrato
middleware/    autenticação JWT, perfis, tratamento de erros
utils/         datas, relógio injetável (clock.js), erros
app.js         criarApp({ db }) — aceita banco em memória
```

### Frontend (`frontend/src`)

```
api/           cliente HTTP (client.js) e funções por recurso (index.js)
contexts/      AuthContext — sessão, login, logout, expiração do token
hooks/         useCarregar (busca de dados), useMensagem (feedback)
components/    Layout, RotaProtegida, TabelaConsultas, SeletorHorarios,
               EditorGrade, EditorBloqueios, diálogos, formulários   → testes de componente
pages/         login, cadastro e páginas de paciente, médico e recepção
utils/         formatadores (moeda, data, status)                  → testes unitários
App.jsx        rotas protegidas por perfil
```

Fluxo de uma ação: página → `api/` → `fetch` → rota Express → middleware de autenticação → serviço → regras do `domain/` + repositório → SQLite.

### Ganchos de testabilidade

- `criarApp({ db: abrirBanco(':memory:') })` sobe a API sem tocar no banco real (útil com Supertest).
- `clock.definirAgora(date)` ou `CLINICA_AGORA` controlam o tempo no backend.
- `semear(db)` (`backend/src/db/seed.js`) popula qualquer banco com os dados de exemplo.
- No frontend, campos têm `<label>` associado (consultas por rótulo, como no Testing Library) e elementos-chave têm `id` estável (`#login-email`, `#agendar-confirmar`, `tr[data-consulta-id]`, `[data-status]`).

## API — resumo

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
