const erros = require('../utils/errors');

function autenticar(authService) {
  return (req, res, next) => {
    const cabecalho = req.headers.authorization || '';
    const [tipo, token] = cabecalho.split(' ');
    if (tipo !== 'Bearer' || !token) return next(erros.naoAutenticado());
    try {
      req.usuario = authService.autenticar(token);
      return next();
    } catch (e) {
      return next(e);
    }
  };
}

function exigirPerfil(...perfis) {
  return (req, res, next) => {
    if (!perfis.includes(req.usuario?.perfil)) return next(erros.semPermissao());
    return next();
  };
}

module.exports = { autenticar, exigirPerfil };
