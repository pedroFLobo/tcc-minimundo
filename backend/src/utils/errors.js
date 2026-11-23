class AppError extends Error {
  constructor(status, codigo, mensagem) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
  }
}

const validacao = (msg) => new AppError(400, 'VALIDACAO', msg);
const naoAutenticado = (msg = 'Autenticação necessária.') => new AppError(401, 'NAO_AUTENTICADO', msg);
const semPermissao = (msg = 'Você não tem permissão para esta operação.') => new AppError(403, 'SEM_PERMISSAO', msg);
const naoEncontrado = (msg = 'Recurso não encontrado.') => new AppError(404, 'NAO_ENCONTRADO', msg);
const conflito = (msg) => new AppError(409, 'CONFLITO', msg);
const regraNegocio = (msg) => new AppError(422, 'REGRA_NEGOCIO', msg);
const contaBloqueada = (msg) => new AppError(423, 'CONTA_BLOQUEADA', msg);

module.exports = { AppError, validacao, naoAutenticado, semPermissao, naoEncontrado, conflito, regraNegocio, contaBloqueada };
