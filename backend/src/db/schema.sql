PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuarios (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  nome              TEXT    NOT NULL,
  email             TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  senha_hash        TEXT    NOT NULL,
  perfil            TEXT    NOT NULL CHECK (perfil IN ('PACIENTE', 'MEDICO', 'RECEPCAO')),
  ativo             INTEGER NOT NULL DEFAULT 1,
  tentativas_falhas INTEGER NOT NULL DEFAULT 0,
  bloqueado_ate     TEXT,
  criado_em         TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS pacientes (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id       INTEGER NOT NULL UNIQUE REFERENCES usuarios(id),
  cpf              TEXT    NOT NULL UNIQUE,
  data_nascimento  TEXT    NOT NULL,
  telefone         TEXT,
  responsavel_nome TEXT
);

CREATE TABLE IF NOT EXISTS especialidades (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nome            TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  preco_centavos  INTEGER NOT NULL CHECK (preco_centavos > 0)
);

CREATE TABLE IF NOT EXISTS medicos (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id           INTEGER NOT NULL UNIQUE REFERENCES usuarios(id),
  crm                  TEXT    NOT NULL UNIQUE,
  especialidade_id     INTEGER NOT NULL REFERENCES especialidades(id),
  duracao_consulta_min INTEGER NOT NULL DEFAULT 30
);

CREATE TABLE IF NOT EXISTS disponibilidades (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  medico_id   INTEGER NOT NULL REFERENCES medicos(id),
  dia_semana  INTEGER NOT NULL,
  hora_inicio TEXT    NOT NULL,
  hora_fim    TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS bloqueios (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  medico_id   INTEGER NOT NULL REFERENCES medicos(id),
  data_inicio TEXT    NOT NULL,
  data_fim    TEXT    NOT NULL,
  motivo      TEXT
);

CREATE TABLE IF NOT EXISTS consultas (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_id         INTEGER NOT NULL REFERENCES pacientes(id),
  medico_id           INTEGER NOT NULL REFERENCES medicos(id),
  inicio              TEXT    NOT NULL,
  fim                 TEXT    NOT NULL,
  status              TEXT    NOT NULL CHECK (status IN ('AGENDADA', 'CONFIRMADA', 'REALIZADA', 'FALTA', 'CANCELADA')),
  valor_centavos      INTEGER NOT NULL,
  retorno_de          INTEGER REFERENCES consultas(id),
  remarcacoes         INTEGER NOT NULL DEFAULT 0,
  motivo_cancelamento TEXT,
  cancelado_por       TEXT,
  observacoes         TEXT,
  criado_em           TEXT    NOT NULL,
  atualizado_em       TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_consultas_medico_inicio ON consultas (medico_id, inicio);
CREATE INDEX IF NOT EXISTS idx_consultas_paciente_inicio ON consultas (paciente_id, inicio);
