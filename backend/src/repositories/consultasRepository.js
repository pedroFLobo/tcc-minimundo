const SELECT_BASE = `
  SELECT c.*,
         up.nome AS paciente_nome,
         um.nome AS medico_nome,
         m.especialidade_id,
         e.nome AS especialidade_nome
  FROM consultas c
  JOIN pacientes p ON p.id = c.paciente_id
  JOIN usuarios up ON up.id = p.usuario_id
  JOIN medicos m ON m.id = c.medico_id
  JOIN usuarios um ON um.id = m.usuario_id
  JOIN especialidades e ON e.id = m.especialidade_id
`;

const ATIVAS = "('AGENDADA', 'CONFIRMADA')";

function mapear(row) {
  if (!row) return null;
  return {
    id: row.id,
    pacienteId: row.paciente_id,
    pacienteNome: row.paciente_nome,
    medicoId: row.medico_id,
    medicoNome: row.medico_nome,
    especialidadeId: row.especialidade_id,
    especialidadeNome: row.especialidade_nome,
    inicio: row.inicio,
    fim: row.fim,
    status: row.status,
    valorCentavos: row.valor_centavos,
    retornoDe: row.retorno_de,
    remarcacoes: row.remarcacoes,
    motivoCancelamento: row.motivo_cancelamento,
    canceladoPor: row.cancelado_por,
    observacoes: row.observacoes,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  };
}

function criarConsultasRepository(db) {
  return {
    buscarPorId(id) {
      return mapear(db.prepare(`${SELECT_BASE} WHERE c.id = ?`).get(id));
    },

    listar({ pacienteId, medicoId, status, dataInicio, dataFim } = {}) {
      const condicoes = [];
      const params = [];
      if (pacienteId) { condicoes.push('c.paciente_id = ?'); params.push(pacienteId); }
      if (medicoId) { condicoes.push('c.medico_id = ?'); params.push(medicoId); }
      if (status) { condicoes.push('c.status = ?'); params.push(status); }
      if (dataInicio) { condicoes.push('c.inicio >= ?'); params.push(`${dataInicio} 00:00`); }
      if (dataFim) { condicoes.push('c.inicio <= ?'); params.push(`${dataFim} 23:59`); }
      const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
      return db.prepare(`${SELECT_BASE} ${where} ORDER BY c.inicio`).all(...params).map(mapear);
    },

    // Consultas ativas do médico que se sobrepõem ao intervalo [inicio, fim).
    ativasDoMedicoNoIntervalo(medicoId, inicio, fim, ignorarId = 0) {
      return db
        .prepare(`${SELECT_BASE} WHERE c.medico_id = ? AND c.status IN ${ATIVAS} AND c.inicio < ? AND c.fim > ? AND c.id <> ?`)
        .all(medicoId, fim, inicio, ignorarId)
        .map(mapear);
    },

    ativasDoPacienteNoIntervalo(pacienteId, inicio, fim, ignorarId = 0) {
      return db
        .prepare(`${SELECT_BASE} WHERE c.paciente_id = ? AND c.status IN ${ATIVAS} AND c.inicio < ? AND c.fim > ? AND c.id <> ?`)
        .all(pacienteId, fim, inicio, ignorarId)
        .map(mapear);
    },

    ativasFuturasDoPaciente(pacienteId, agora, ignorarId = 0) {
      return db
        .prepare(`${SELECT_BASE} WHERE c.paciente_id = ? AND c.status IN ${ATIVAS} AND c.inicio > ? AND c.id <> ?`)
        .all(pacienteId, agora, ignorarId)
        .map(mapear);
    },

    ativasDoMedicoEntreDatas(medicoId, dataInicio, dataFim) {
      return db
        .prepare(`${SELECT_BASE} WHERE c.medico_id = ? AND c.status IN ${ATIVAS} AND c.inicio >= ? AND c.inicio <= ?`)
        .all(medicoId, `${dataInicio} 00:00`, `${dataFim} 23:59`)
        .map(mapear);
    },

    datasDeFaltaDoPaciente(pacienteId) {
      return db.prepare("SELECT inicio FROM consultas WHERE paciente_id = ? AND status = 'FALTA'").all(pacienteId).map((r) => r.inicio);
    },

    realizadasComMedico(pacienteId, medicoId) {
      return db
        .prepare("SELECT id, inicio FROM consultas WHERE paciente_id = ? AND medico_id = ? AND status = 'REALIZADA'")
        .all(pacienteId, medicoId);
    },

    // Ids de consultas já usadas como origem de retorno por consultas não canceladas.
    retornosJaUsados(pacienteId, ignorarId = 0) {
      return db
        .prepare("SELECT retorno_de FROM consultas WHERE paciente_id = ? AND retorno_de IS NOT NULL AND status <> 'CANCELADA' AND id <> ?")
        .all(pacienteId, ignorarId)
        .map((r) => r.retorno_de);
    },

    inserir(c) {
      const r = db
        .prepare(`INSERT INTO consultas (paciente_id, medico_id, inicio, fim, status, valor_centavos, retorno_de, criado_em, atualizado_em)
                  VALUES (?, ?, ?, ?, 'AGENDADA', ?, ?, ?, ?)`)
        .run(c.pacienteId, c.medicoId, c.inicio, c.fim, c.valorCentavos, c.retornoDe || null, c.agora, c.agora);
      return Number(r.lastInsertRowid);
    },

    atualizarStatus(id, status, agora, extras = {}) {
      db.prepare(`UPDATE consultas
                  SET status = ?, motivo_cancelamento = COALESCE(?, motivo_cancelamento),
                      cancelado_por = COALESCE(?, cancelado_por), observacoes = COALESCE(?, observacoes), atualizado_em = ?
                  WHERE id = ?`)
        .run(status, extras.motivoCancelamento || null, extras.canceladoPor || null, extras.observacoes || null, agora, id);
    },

    remarcar(id, { inicio, fim, valorCentavos, retornoDe, agora }) {
      db.prepare(`UPDATE consultas
                  SET inicio = ?, fim = ?, valor_centavos = ?, retorno_de = ?, status = 'AGENDADA',
                      remarcacoes = remarcacoes + 1, atualizado_em = ?
                  WHERE id = ?`)
        .run(inicio, fim, valorCentavos, retornoDe || null, agora, id);
    },

    resumoPorStatus(dataInicio, dataFim) {
      return db
        .prepare('SELECT status, COUNT(*) AS total FROM consultas WHERE inicio >= ? AND inicio <= ? GROUP BY status')
        .all(`${dataInicio} 00:00`, `${dataFim} 23:59`);
    },

    faltasPorMedico(dataInicio, dataFim) {
      return db
        .prepare(`SELECT c.medico_id, u.nome AS medico_nome,
                         SUM(CASE WHEN c.status = 'FALTA' THEN 1 ELSE 0 END) AS faltas,
                         SUM(CASE WHEN c.status IN ('FALTA', 'REALIZADA') THEN 1 ELSE 0 END) AS encerradas
                  FROM consultas c
                  JOIN medicos m ON m.id = c.medico_id
                  JOIN usuarios u ON u.id = m.usuario_id
                  WHERE c.inicio >= ? AND c.inicio <= ?
                  GROUP BY c.medico_id, u.nome
                  ORDER BY u.nome`)
        .all(`${dataInicio} 00:00`, `${dataFim} 23:59`);
    },

    faturamento(dataInicio, dataFim) {
      return db
        .prepare("SELECT COALESCE(SUM(valor_centavos), 0) AS total FROM consultas WHERE status = 'REALIZADA' AND inicio >= ? AND inicio <= ?")
        .get(`${dataInicio} 00:00`, `${dataFim} 23:59`).total;
    },
  };
}

module.exports = { criarConsultasRepository };
