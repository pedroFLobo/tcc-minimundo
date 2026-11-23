const SELECT_BASE = `
  SELECT m.*, u.nome, u.email, u.ativo, e.nome AS especialidade_nome, e.preco_centavos
  FROM medicos m
  JOIN usuarios u ON u.id = m.usuario_id
  JOIN especialidades e ON e.id = m.especialidade_id
`;

function mapear(row) {
  if (!row) return null;
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    nome: row.nome,
    email: row.email,
    ativo: row.ativo === 1,
    crm: row.crm,
    especialidadeId: row.especialidade_id,
    especialidadeNome: row.especialidade_nome,
    precoCentavos: row.preco_centavos,
    duracaoConsultaMin: row.duracao_consulta_min,
  };
}

function mapearBloco(row) {
  return { id: row.id, diaSemana: row.dia_semana, horaInicio: row.hora_inicio, horaFim: row.hora_fim };
}

function mapearBloqueio(row) {
  if (!row) return null;
  return { id: row.id, medicoId: row.medico_id, dataInicio: row.data_inicio, dataFim: row.data_fim, motivo: row.motivo };
}

function criarMedicosRepository(db) {
  return {
    buscarPorId(id) {
      return mapear(db.prepare(`${SELECT_BASE} WHERE m.id = ?`).get(id));
    },
    buscarPorUsuarioId(usuarioId) {
      return mapear(db.prepare(`${SELECT_BASE} WHERE m.usuario_id = ?`).get(usuarioId));
    },
    buscarPorCrm(crm) {
      return mapear(db.prepare(`${SELECT_BASE} WHERE m.crm = ?`).get(crm));
    },
    listar({ especialidadeId } = {}) {
      if (especialidadeId) {
        return db.prepare(`${SELECT_BASE} WHERE m.especialidade_id = ? ORDER BY u.nome`).all(especialidadeId).map(mapear);
      }
      return db.prepare(`${SELECT_BASE} ORDER BY u.nome`).all().map(mapear);
    },
    inserir({ usuarioId, crm, especialidadeId, duracaoConsultaMin }) {
      const r = db
        .prepare('INSERT INTO medicos (usuario_id, crm, especialidade_id, duracao_consulta_min) VALUES (?, ?, ?, ?)')
        .run(usuarioId, crm, especialidadeId, duracaoConsultaMin);
      return Number(r.lastInsertRowid);
    },

    listarDisponibilidades(medicoId) {
      return db
        .prepare('SELECT * FROM disponibilidades WHERE medico_id = ? ORDER BY dia_semana, hora_inicio')
        .all(medicoId)
        .map(mapearBloco);
    },
    substituirDisponibilidades(medicoId, blocos) {
      const remover = db.prepare('DELETE FROM disponibilidades WHERE medico_id = ?');
      const inserir = db.prepare('INSERT INTO disponibilidades (medico_id, dia_semana, hora_inicio, hora_fim) VALUES (?, ?, ?, ?)');
      db.transaction(() => {
        remover.run(medicoId);
        for (const b of blocos) inserir.run(medicoId, b.diaSemana, b.horaInicio, b.horaFim);
      })();
    },

    listarBloqueios(medicoId) {
      return db.prepare('SELECT * FROM bloqueios WHERE medico_id = ? ORDER BY data_inicio').all(medicoId).map(mapearBloqueio);
    },
    buscarBloqueio(id) {
      return mapearBloqueio(db.prepare('SELECT * FROM bloqueios WHERE id = ?').get(id));
    },
    inserirBloqueio({ medicoId, dataInicio, dataFim, motivo }) {
      const r = db
        .prepare('INSERT INTO bloqueios (medico_id, data_inicio, data_fim, motivo) VALUES (?, ?, ?, ?)')
        .run(medicoId, dataInicio, dataFim, motivo || null);
      return Number(r.lastInsertRowid);
    },
    removerBloqueio(id) {
      db.prepare('DELETE FROM bloqueios WHERE id = ?').run(id);
    },
  };
}

module.exports = { criarMedicosRepository };
