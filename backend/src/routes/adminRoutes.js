const express = require('express');
const { exigirPerfil } = require('../middleware/auth');

function adminRoutes({ cadastroService, relatoriosService }) {
  const router = express.Router();
  router.use(exigirPerfil('RECEPCAO'));

  router.patch('/usuarios/:id/ativo', (req, res) => {
    res.json(cadastroService.definirUsuarioAtivo(Number(req.params.id), req.body?.ativo));
  });

  router.get('/relatorios/resumo', (req, res) => {
    res.json(relatoriosService.resumo(req.query));
  });

  return router;
}

module.exports = { adminRoutes };
