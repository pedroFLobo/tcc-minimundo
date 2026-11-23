const { AppError } = require('../utils/errors');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ erro: { codigo: err.codigo, mensagem: err.message } });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: { codigo: 'VALIDACAO', mensagem: 'Corpo da requisição não é um JSON válido.' } });
  }
  if (process.env.NODE_ENV !== 'test') console.error(err);
  return res.status(500).json({ erro: { codigo: 'ERRO_INTERNO', mensagem: 'Erro interno do servidor.' } });
}

function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: { codigo: 'NAO_ENCONTRADO', mensagem: 'Rota não encontrada.' } });
}

module.exports = { errorHandler, rotaNaoEncontrada };
