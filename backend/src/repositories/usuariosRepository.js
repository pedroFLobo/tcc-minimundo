function mapear(row) {
  if (!row) return null;
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    senhaHash: row.senha_hash,
    perfil: row.perfil,
    ativo: row.ativo === 1,
    tentativasFalhas: row.tentativas_falhas,
    bloqueadoAte: row.bloqueado_ate,
    criadoEm: row.criado_em,
  };
}

function criarUsuariosRepository(db) {
  return {
    buscarPorId(id) {
      return mapear(db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id));
    },
    buscarPorEmail(email) {
      return mapear(db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email));
    },
    inserir({ nome, email, senhaHash, perfil, criadoEm }) {
      const r = db
        .prepare('INSERT INTO usuarios (nome, email, senha_hash, perfil, criado_em) VALUES (?, ?, ?, ?, ?)')
        .run(nome, email, senhaHash, perfil, criadoEm);
      return Number(r.lastInsertRowid);
    },
    registrarFalhaLogin(id, tentativas, bloqueadoAte) {
      db.prepare('UPDATE usuarios SET tentativas_falhas = ?, bloqueado_ate = ? WHERE id = ?').run(tentativas, bloqueadoAte, id);
    },
    zerarFalhasLogin(id) {
      db.prepare('UPDATE usuarios SET tentativas_falhas = 0, bloqueado_ate = NULL WHERE id = ?').run(id);
    },
    definirAtivo(id, ativo) {
      db.prepare('UPDATE usuarios SET ativo = ? WHERE id = ?').run(ativo ? 1 : 0, id);
    },
  };
}

module.exports = { criarUsuariosRepository };
