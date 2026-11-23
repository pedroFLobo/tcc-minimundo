const SELECT_BASE = `
  SELECT p.*, u.nome, u.email, u.ativo
  FROM pacientes p
  JOIN usuarios u ON u.id = p.usuario_id
`;

function mapear(row) {
  if (!row) return null;
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    nome: row.nome,
    email: row.email,
    ativo: row.ativo === 1,
    cpf: row.cpf,
    dataNascimento: row.data_nascimento,
    telefone: row.telefone,
    responsavelNome: row.responsavel_nome,
  };
}

function criarPacientesRepository(db) {
  return {
    buscarPorId(id) {
      return mapear(db.prepare(`${SELECT_BASE} WHERE p.id = ?`).get(id));
    },
    buscarPorUsuarioId(usuarioId) {
      return mapear(db.prepare(`${SELECT_BASE} WHERE p.usuario_id = ?`).get(usuarioId));
    },
    buscarPorCpf(cpf) {
      return mapear(db.prepare(`${SELECT_BASE} WHERE p.cpf = ?`).get(cpf));
    },
    listar(busca) {
      if (busca) {
        const termo = `%${busca}%`;
        return db
          .prepare(`${SELECT_BASE} WHERE u.nome LIKE ? OR u.email LIKE ? OR p.cpf LIKE ? ORDER BY u.nome`)
          .all(termo, termo, termo)
          .map(mapear);
      }
      return db.prepare(`${SELECT_BASE} ORDER BY u.nome`).all().map(mapear);
    },
    inserir({ usuarioId, cpf, dataNascimento, telefone, responsavelNome }) {
      const r = db
        .prepare('INSERT INTO pacientes (usuario_id, cpf, data_nascimento, telefone, responsavel_nome) VALUES (?, ?, ?, ?, ?)')
        .run(usuarioId, cpf, dataNascimento, telefone || null, responsavelNome || null);
      return Number(r.lastInsertRowid);
    },
  };
}

module.exports = { criarPacientesRepository };
