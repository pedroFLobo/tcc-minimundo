function mapear(row) {
  if (!row) return null;
  return { id: row.id, nome: row.nome, precoCentavos: row.preco_centavos };
}

function criarEspecialidadesRepository(db) {
  return {
    listar() {
      return db.prepare('SELECT * FROM especialidades ORDER BY nome').all().map(mapear);
    },
    buscarPorId(id) {
      return mapear(db.prepare('SELECT * FROM especialidades WHERE id = ?').get(id));
    },
    buscarPorNome(nome) {
      return mapear(db.prepare('SELECT * FROM especialidades WHERE nome = ?').get(nome));
    },
    inserir({ nome, precoCentavos }) {
      const r = db.prepare('INSERT INTO especialidades (nome, preco_centavos) VALUES (?, ?)').run(nome, precoCentavos);
      return Number(r.lastInsertRowid);
    },
  };
}

module.exports = { criarEspecialidadesRepository };
