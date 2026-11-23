const express = require('express');
const { exigirPerfil } = require('../middleware/auth');

function especialidadesRoutes({ repos, cadastroService }) {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.json(repos.especialidades.listar());
  });

  router.post('/', exigirPerfil('RECEPCAO'), (req, res) => {
    res.status(201).json(cadastroService.criarEspecialidade(req.body));
  });

  return router;
}

module.exports = { especialidadesRoutes };
