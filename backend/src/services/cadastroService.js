const clock = require('../utils/clock');
const { formatarDataHora, parseData, inicioDoDia } = require('../utils/datas');
const v = require('../domain/validacoes');
const erros = require('../utils/errors');

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function criarCadastroService({ db, usuarios, pacientes, medicos, especialidades, authService }) {
  function validarConta({ nome, email, senha }) {
    if (texto(nome).length < 3) throw erros.validacao('Nome deve ter pelo menos 3 caracteres.');
    if (!v.emailValido(email)) throw erros.validacao('E-mail inválido.');
    if (!v.senhaValida(senha)) throw erros.validacao('Senha deve ter no mínimo 8 caracteres, com letras e números.');
    if (usuarios.buscarPorEmail(texto(email))) throw erros.conflito('E-mail já cadastrado.');
  }

  function criarUsuario({ nome, email, senha }, perfil) {
    return usuarios.inserir({
      nome: texto(nome),
      email: texto(email).toLowerCase(),
      senhaHash: authService.gerarHash(senha),
      perfil,
      criadoEm: formatarDataHora(clock.agora()),
    });
  }

  function registrarPaciente(dados = {}) {
    validarConta(dados);

    const cpf = v.normalizarCpf(dados.cpf);
    if (!v.cpfValido(cpf)) throw erros.validacao('CPF inválido.');
    if (pacientes.buscarPorCpf(cpf)) throw erros.conflito('CPF já cadastrado.');

    const hoje = inicioDoDia(clock.agora());
    const erroNascimento = v.validarDataNascimento(dados.dataNascimento, hoje);
    if (erroNascimento) throw erros.validacao(erroNascimento);

    const responsavelNome = texto(dados.responsavelNome);
    if (v.exigeResponsavel(parseData(dados.dataNascimento), hoje) && !responsavelNome) {
      throw erros.validacao('Paciente menor de 18 anos deve informar o nome do responsável.');
    }

    const id = db.transaction(() => {
      const usuarioId = criarUsuario(dados, 'PACIENTE');
      return pacientes.inserir({
        usuarioId,
        cpf,
        dataNascimento: dados.dataNascimento,
        telefone: texto(dados.telefone),
        responsavelNome,
      });
    })();
    return pacientes.buscarPorId(id);
  }

  function criarMedico(dados = {}) {
    validarConta(dados);

    const crm = texto(dados.crm).toUpperCase();
    if (!v.crmValido(crm)) throw erros.validacao('CRM inválido. Use o formato 123456/UF.');
    if (medicos.buscarPorCrm(crm)) throw erros.conflito('CRM já cadastrado.');

    const especialidadeId = Number(dados.especialidadeId);
    if (!especialidades.buscarPorId(especialidadeId)) throw erros.validacao('Especialidade inexistente.');

    const duracao = dados.duracaoConsultaMin === undefined ? 30 : Number(dados.duracaoConsultaMin);
    if (!v.duracaoConsultaValida(duracao)) {
      throw erros.validacao('Duração da consulta deve ser de 15 a 60 minutos, em múltiplos de 15.');
    }

    const id = db.transaction(() => {
      const usuarioId = criarUsuario(dados, 'MEDICO');
      return medicos.inserir({ usuarioId, crm, especialidadeId, duracaoConsultaMin: duracao });
    })();
    return medicos.buscarPorId(id);
  }

  function criarEspecialidade(dados = {}) {
    const nome = texto(dados.nome);
    if (nome.length < 3) throw erros.validacao('Nome da especialidade deve ter pelo menos 3 caracteres.');
    const preco = Number(dados.precoCentavos);
    if (!Number.isInteger(preco) || preco <= 0) throw erros.validacao('Preço deve ser um inteiro em centavos maior que zero.');
    if (especialidades.buscarPorNome(nome)) throw erros.conflito('Especialidade já cadastrada.');
    return especialidades.buscarPorId(especialidades.inserir({ nome, precoCentavos: preco }));
  }

  function definirUsuarioAtivo(usuarioId, ativo) {
    if (typeof ativo !== 'boolean') throw erros.validacao('Informe "ativo" como true ou false.');
    const usuario = usuarios.buscarPorId(usuarioId);
    if (!usuario) throw erros.naoEncontrado('Usuário não encontrado.');
    usuarios.definirAtivo(usuarioId, ativo);
    return { id: usuarioId, ativo };
  }

  return { registrarPaciente, criarMedico, criarEspecialidade, definirUsuarioAtivo };
}

module.exports = { criarCadastroService };
