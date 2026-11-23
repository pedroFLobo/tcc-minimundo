const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const config = require('../config');

// Abre (ou cria) o banco e aplica o schema. Use ':memory:' para um banco descartável.
function abrirBanco(caminho = config.caminhoBanco) {
  if (caminho !== ':memory:') {
    fs.mkdirSync(path.dirname(caminho), { recursive: true });
  }
  const db = new Database(caminho);
  db.pragma('journal_mode = WAL');
  db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  return db;
}

function limparBanco(db) {
  db.exec(`
    DELETE FROM consultas;
    DELETE FROM bloqueios;
    DELETE FROM disponibilidades;
    DELETE FROM medicos;
    DELETE FROM pacientes;
    DELETE FROM especialidades;
    DELETE FROM usuarios;
    DELETE FROM sqlite_sequence;
  `);
}

module.exports = { abrirBanco, limparBanco };
