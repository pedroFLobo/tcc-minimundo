const express = require('express');
const { exigirPerfil } = require('../middleware/auth');

function medicosRoutes({ repos, cadastroService, agendaService }) {
  const router = express.Router();

  router.get('/', (req, res) => {
    const especialidadeId = req.query.especialidadeId ? Number(req.query.especialidadeId) : undefined;
    res.json(repos.medicos.listar({ especialidadeId }));
  });

  router.post('/', exigirPerfil('RECEPCAO'), (req, res) => {
    res.status(201).json(cadastroService.criarMedico(req.body));
  });

  router.get('/:id', (req, res) => {
    res.json(agendaService.obterMedico(req.params.id));
  });

  router.get('/:id/disponibilidades', (req, res) => {
    res.json(agendaService.obterGrade(req.params.id));
  });

  router.put('/:id/disponibilidades', exigirPerfil('MEDICO', 'RECEPCAO'), (req, res) => {
    res.json(agendaService.salvarGrade(req.usuario, req.params.id, req.body?.blocos));
  });

  router.get('/:id/bloqueios', exigirPerfil('MEDICO', 'RECEPCAO'), (req, res) => {
    res.json(agendaService.listarBloqueios(req.usuario, req.params.id));
  });

  router.post('/:id/bloqueios', exigirPerfil('MEDICO', 'RECEPCAO'), (req, res) => {
    res.status(201).json(agendaService.criarBloqueio(req.usuario, req.params.id, req.body));
  });

  router.delete('/:id/bloqueios/:bloqueioId', exigirPerfil('MEDICO', 'RECEPCAO'), (req, res) => {
    agendaService.removerBloqueio(req.usuario, req.params.id, req.params.bloqueioId);
    res.status(204).end();
  });

  router.get('/:id/horarios', (req, res) => {
    res.json({ data: req.query.data, horarios: agendaService.horariosLivres(req.params.id, req.query.data) });
  });

  return router;
}

module.exports = { medicosRoutes };
