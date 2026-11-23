const express = require('express');

function consultasRoutes({ consultasService }) {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.json(consultasService.listar(req.usuario, req.query));
  });

  router.post('/', (req, res) => {
    res.status(201).json(consultasService.agendar(req.usuario, req.body));
  });

  router.get('/:id', (req, res) => {
    res.json(consultasService.obter(req.usuario, req.params.id));
  });

  router.post('/:id/confirmar', (req, res) => {
    res.json(consultasService.confirmar(req.usuario, req.params.id));
  });

  router.post('/:id/cancelar', (req, res) => {
    res.json(consultasService.cancelar(req.usuario, req.params.id, req.body));
  });

  router.post('/:id/remarcar', (req, res) => {
    res.json(consultasService.remarcar(req.usuario, req.params.id, req.body));
  });

  router.post('/:id/realizar', (req, res) => {
    res.json(consultasService.registrarRealizada(req.usuario, req.params.id, req.body));
  });

  router.post('/:id/falta', (req, res) => {
    res.json(consultasService.registrarFalta(req.usuario, req.params.id));
  });

  return router;
}

module.exports = { consultasRoutes };
