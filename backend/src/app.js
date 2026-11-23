const express = require('express');
const cors = require('cors');
const config = require('./config');
const { abrirBanco } = require('./db/connection');
const { criarServicos } = require('./services');
const { autenticar } = require('./middleware/auth');
const { errorHandler, rotaNaoEncontrada } = require('./middleware/errorHandler');
const { authRoutes } = require('./routes/authRoutes');
const { especialidadesRoutes } = require('./routes/especialidadesRoutes');
const { medicosRoutes } = require('./routes/medicosRoutes');
const { pacientesRoutes } = require('./routes/pacientesRoutes');
const { consultasRoutes } = require('./routes/consultasRoutes');
const { adminRoutes } = require('./routes/adminRoutes');

// Cria a aplicação Express. Recebe um banco já aberto (ex.: ':memory:' em testes) ou abre o padrão.
function criarApp({ db = abrirBanco() } = {}) {
  const servicos = criarServicos(db);
  const auth = autenticar(servicos.authService);
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: config.corsOrigens }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/saude', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRoutes(servicos, auth));
  app.use('/api/especialidades', auth, especialidadesRoutes(servicos));
  app.use('/api/medicos', auth, medicosRoutes(servicos));
  app.use('/api/pacientes', auth, pacientesRoutes(servicos));
  app.use('/api/consultas', auth, consultasRoutes(servicos));
  app.use('/api/admin', auth, adminRoutes(servicos));
  app.use(rotaNaoEncontrada);
  app.use(errorHandler);

  app.locals.db = db;
  app.locals.servicos = servicos;
  return app;
}

module.exports = { criarApp };
