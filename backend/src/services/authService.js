const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const clock = require('../utils/clock');
const { formatarDataHora, parseDataHora, somarMinutos } = require('../utils/datas');
const erros = require('../utils/errors');

const MAX_TENTATIVAS = 5;
const BLOQUEIO_MINUTOS = 15;

function criarAuthService({ usuarios, pacientes, medicos }) {
  function perfilPublico(usuario) {
    const publico = { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil };
    if (usuario.perfil === 'PACIENTE') publico.pacienteId = pacientes.buscarPorUsuarioId(usuario.id)?.id ?? null;
    if (usuario.perfil === 'MEDICO') publico.medicoId = medicos.buscarPorUsuarioId(usuario.id)?.id ?? null;
    return publico;
  }

  function login(email, senha) {
    if (!email || !senha) throw erros.validacao('Informe e-mail e senha.');

    const usuario = usuarios.buscarPorEmail(String(email).trim());
    if (!usuario) throw erros.naoAutenticado('E-mail ou senha inválidos.');

    const agora = clock.agora();
    if (usuario.bloqueadoAte && agora < parseDataHora(usuario.bloqueadoAte)) {
      throw erros.contaBloqueada(`Conta bloqueada por excesso de tentativas. Tente novamente após ${usuario.bloqueadoAte}.`);
    }

    if (!bcrypt.compareSync(String(senha), usuario.senhaHash)) {
      const tentativas = usuario.tentativasFalhas + 1;
      if (tentativas >= MAX_TENTATIVAS) {
        const ate = formatarDataHora(somarMinutos(agora, BLOQUEIO_MINUTOS));
        usuarios.registrarFalhaLogin(usuario.id, 0, ate);
        throw erros.contaBloqueada(`Conta bloqueada por excesso de tentativas. Tente novamente após ${ate}.`);
      }
      usuarios.registrarFalhaLogin(usuario.id, tentativas, null);
      throw erros.naoAutenticado('E-mail ou senha inválidos.');
    }

    if (!usuario.ativo) throw erros.semPermissao('Conta inativa. Procure a recepção.');

    usuarios.zerarFalhasLogin(usuario.id);
    const token = jwt.sign({ sub: usuario.id, perfil: usuario.perfil }, config.jwtSegredo, { expiresIn: config.jwtExpiracao });
    return { token, usuario: perfilPublico(usuario) };
  }

  // Devolve o usuário autenticado a partir do token, ou lança 401.
  function autenticar(token) {
    let payload;
    try {
      payload = jwt.verify(token, config.jwtSegredo);
    } catch {
      throw erros.naoAutenticado('Token inválido ou expirado.');
    }
    const usuario = usuarios.buscarPorId(payload.sub);
    if (!usuario || !usuario.ativo) throw erros.naoAutenticado('Usuário inexistente ou inativo.');
    return perfilPublico(usuario);
  }

  function gerarHash(senha) {
    return bcrypt.hashSync(senha, config.bcryptCusto);
  }

  return { login, autenticar, perfilPublico, gerarHash };
}

module.exports = { criarAuthService };
