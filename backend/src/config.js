require('dotenv').config();

const path = require('path');

module.exports = {
  porta: Number(process.env.PORT) || 3000,
  caminhoBanco: process.env.CLINICA_DB || path.join(__dirname, '..', 'data', 'clinica.db'),
  jwtSegredo: process.env.JWT_SECRET || 'segredo-de-desenvolvimento-troque-em-producao',
  jwtExpiracao: '8h',
  // Origens do frontend autorizadas a chamar a API (separadas por vírgula).
  corsOrigens: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map((o) => o.trim()),
  bcryptCusto: 10,
};
