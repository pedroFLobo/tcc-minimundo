const express = require('express');
const { exigirPerfil } = require('../middleware/auth');
const erros = require('../utils/errors');

function pacientesRoutes({ repos, cadastroService }) {
  const router = express.Router();

  router.get('/', exigirPerfil('RECEPCAO'), (req, res) => {
    res.json(repos.pacientes.listar(req.query.busca));
  });

  router.post('/', exigirPerfil('RECEPCAO'), (req, res) => {
    res.status(201).json(cadastroService.registrarPaciente(req.body));
  });

  router.get('/:id', (req, res) => {
    const paciente = repos.pacientes.buscarPorId(Number(req.params.id));
    if (!paciente) throw erros.naoEncontrado('Paciente não encontrado.');
    const ehProprio = req.usuario.perfil === 'PACIENTE' && req.usuario.pacienteId === paciente.id;
    if (req.usuario.perfil !== 'RECEPCAO' && !ehProprio) throw erros.semPermissao('Você não tem acesso a este paciente.');
    res.json(paciente);
  });

  return router;
}

module.exports = { pacientesRoutes };
