const express = require('express');

function authRoutes({ authService, cadastroService }, autenticar) {
  const router = express.Router();

  router.post('/login', (req, res) => {
    res.json(authService.login(req.body?.email, req.body?.senha));
  });

  router.post('/registro', (req, res) => {
    const paciente = cadastroService.registrarPaciente(req.body);
    res.status(201).json(paciente);
  });

  router.get('/me', autenticar, (req, res) => {
    res.json(req.usuario);
  });

  return router;
}

module.exports = { authRoutes };
