const clock = require('../utils/clock');
const { parseData, parseDataHora, formatarData, formatarDataHora, somarMinutos } = require('../utils/datas');
const { calcularIdade } = require('../domain/validacoes');
const regras = require('../domain/consultas');
const erros = require('../utils/errors');

const { STATUS } = regras;

function criarConsultasService({ db, consultas, pacientes, agendaService }) {
  function ehDono(ator, consulta) {
    if (ator.perfil === 'PACIENTE') return consulta.pacienteId === ator.pacienteId;
    if (ator.perfil === 'MEDICO') return consulta.medicoId === ator.medicoId;
    return false;
  }

  function obterConsulta(id) {
    const consulta = consultas.buscarPorId(Number(id));
    if (!consulta) throw erros.naoEncontrado('Consulta não encontrada.');
    return consulta;
  }

  function lancarSeNegado(resultado) {
    if (!resultado) return;
    if (resultado.tipo === 'PERMISSAO') throw erros.semPermissao(resultado.mensagem);
    throw erros.regraNegocio(resultado.mensagem);
  }

  // Interpreta a consulta com datas como Date, para as regras puras.
  function comDatas(consulta) {
    return { ...consulta, inicio: parseDataHora(consulta.inicio), fim: parseDataHora(consulta.fim) };
  }

  function calcularPreco(paciente, medico, inicio, ignorarConsultaId = 0) {
    const realizadas = consultas
      .realizadasComMedico(paciente.id, medico.id)
      .map((c) => ({ id: c.id, inicio: parseDataHora(c.inicio) }));
    const retornoDe = regras.encontrarConsultaDeRetorno(realizadas, consultas.retornosJaUsados(paciente.id, ignorarConsultaId), inicio);
    const valorCentavos = regras.calcularValor({
      precoBaseCentavos: medico.precoCentavos,
      idadePaciente: calcularIdade(parseData(paciente.dataNascimento), inicio),
      ehRetorno: retornoDe !== null,
    });
    return { valorCentavos, retornoDe };
  }

  // Valida o novo horário contra RN16–RN19. Retorna { inicio, fim } como texto.
  function validarHorario(paciente, medico, inicioTexto, ignorarConsultaId = 0) {
    const inicio = parseDataHora(inicioTexto);
    if (!inicio) throw erros.validacao('Horário inválido. Use o formato AAAA-MM-DD HH:mm.');

    const agora = clock.agora();
    const erroAntecedencia = regras.validarAntecedencia(inicio, agora);
    if (erroAntecedencia) throw erros.regraNegocio(erroAntecedencia);

    const inicioFormatado = formatarDataHora(inicio);
    const livres = agendaService.horariosLivres(medico.id, formatarData(inicio), { ignorarConsultaId });
    if (!livres.includes(inicioFormatado)) throw erros.conflito('Horário indisponível para este médico.');

    const fimFormatado = formatarDataHora(somarMinutos(inicio, medico.duracaoConsultaMin));
    if (consultas.ativasDoPacienteNoIntervalo(paciente.id, inicioFormatado, fimFormatado, ignorarConsultaId).length) {
      throw erros.conflito('O paciente já possui outra consulta neste horário.');
    }

    const futuras = consultas.ativasFuturasDoPaciente(paciente.id, formatarDataHora(agora), ignorarConsultaId);
    const erroLimite = regras.validarLimitesPaciente(futuras, medico.especialidadeId);
    if (erroLimite) throw erros.regraNegocio(erroLimite);

    return { inicio, inicioFormatado, fimFormatado };
  }

  function resolverPaciente(ator, pacienteIdInformado) {
    if (ator.perfil === 'MEDICO') throw erros.semPermissao('Médicos não agendam consultas. Procure a recepção.');
    let pacienteId = Number(pacienteIdInformado);
    if (ator.perfil === 'PACIENTE') {
      if (pacienteIdInformado !== undefined && pacienteId !== ator.pacienteId) {
        throw erros.semPermissao('Você só pode agendar consultas para si mesmo.');
      }
      pacienteId = ator.pacienteId;
    } else if (!pacienteId) {
      throw erros.validacao('Informe o paciente.');
    }
    const paciente = pacientes.buscarPorId(pacienteId);
    if (!paciente) throw erros.naoEncontrado('Paciente não encontrado.');
    return paciente;
  }

  function agendar(ator, { pacienteId, medicoId, inicio } = {}) {
    return db.transaction(() => {
      const paciente = resolverPaciente(ator, pacienteId);
      if (!paciente.ativo) throw erros.regraNegocio('Paciente inativo não pode agendar consultas.');

      if (!medicoId) throw erros.validacao('Informe o médico.');
      const medico = agendaService.obterMedico(medicoId);
      if (!medico.ativo) throw erros.regraNegocio('Médico inativo não recebe agendamentos.');

      const horario = validarHorario(paciente, medico, inicio);

      const agora = clock.agora();
      const datasFaltas = consultas.datasDeFaltaDoPaciente(paciente.id).map(parseDataHora);
      const suspensoAte = regras.calcularSuspensao(datasFaltas, agora);
      if (suspensoAte) {
        throw erros.regraNegocio(`Paciente suspenso por faltas até ${formatarData(suspensoAte)}.`);
      }

      const preco = calcularPreco(paciente, medico, horario.inicio);
      const id = consultas.inserir({
        pacienteId: paciente.id,
        medicoId: medico.id,
        inicio: horario.inicioFormatado,
        fim: horario.fimFormatado,
        valorCentavos: preco.valorCentavos,
        retornoDe: preco.retornoDe,
        agora: formatarDataHora(agora),
      });
      return consultas.buscarPorId(id);
    })();
  }

  function remarcar(ator, id, { inicio } = {}) {
    return db.transaction(() => {
      const consulta = obterConsulta(id);
      const agora = clock.agora();
      lancarSeNegado(regras.verificarRemarcacao(comDatas(consulta), { perfil: ator.perfil, ehDono: ehDono(ator, consulta) }, agora));

      const paciente = pacientes.buscarPorId(consulta.pacienteId);
      const medico = agendaService.obterMedico(consulta.medicoId);
      const horario = validarHorario(paciente, medico, inicio, consulta.id);
      const preco = calcularPreco(paciente, medico, horario.inicio, consulta.id);

      consultas.remarcar(consulta.id, {
        inicio: horario.inicioFormatado,
        fim: horario.fimFormatado,
        valorCentavos: preco.valorCentavos,
        retornoDe: preco.retornoDe,
        agora: formatarDataHora(agora),
      });
      return consultas.buscarPorId(consulta.id);
    })();
  }

  function confirmar(ator, id) {
    const consulta = obterConsulta(id);
    const agora = clock.agora();
    lancarSeNegado(regras.verificarConfirmacao(comDatas(consulta), { perfil: ator.perfil, ehDono: ehDono(ator, consulta) }, agora));
    consultas.atualizarStatus(consulta.id, STATUS.CONFIRMADA, formatarDataHora(agora));
    return consultas.buscarPorId(consulta.id);
  }

  function cancelar(ator, id, { motivo } = {}) {
    const consulta = obterConsulta(id);
    const agora = clock.agora();
    lancarSeNegado(regras.verificarCancelamento(comDatas(consulta), { perfil: ator.perfil, ehDono: ehDono(ator, consulta) }, agora, motivo));
    consultas.atualizarStatus(consulta.id, STATUS.CANCELADA, formatarDataHora(agora), {
      motivoCancelamento: typeof motivo === 'string' && motivo.trim() ? motivo.trim() : null,
      canceladoPor: ator.perfil,
    });
    return consultas.buscarPorId(consulta.id);
  }

  function registrarRealizada(ator, id, { observacoes } = {}) {
    const consulta = obterConsulta(id);
    const agora = clock.agora();
    lancarSeNegado(regras.verificarRealizacao(comDatas(consulta), { perfil: ator.perfil, ehDono: ehDono(ator, consulta) }, agora));
    consultas.atualizarStatus(consulta.id, STATUS.REALIZADA, formatarDataHora(agora), {
      observacoes: typeof observacoes === 'string' ? observacoes.trim() : null,
    });
    return consultas.buscarPorId(consulta.id);
  }

  function registrarFalta(ator, id) {
    const consulta = obterConsulta(id);
    const agora = clock.agora();
    lancarSeNegado(regras.verificarFalta(comDatas(consulta), { perfil: ator.perfil, ehDono: ehDono(ator, consulta) }, agora));
    consultas.atualizarStatus(consulta.id, STATUS.FALTA, formatarDataHora(agora));
    return consultas.buscarPorId(consulta.id);
  }

  function obter(ator, id) {
    const consulta = obterConsulta(id);
    if (ator.perfil !== 'RECEPCAO' && !ehDono(ator, consulta)) throw erros.semPermissao('Você não tem acesso a esta consulta.');
    return consulta;
  }

  function listar(ator, filtros = {}) {
    const { status, dataInicio, dataFim } = filtros;
    if (status && !Object.values(STATUS).includes(status)) throw erros.validacao('Status inválido.');
    for (const d of [dataInicio, dataFim]) {
      if (d && !parseData(d)) throw erros.validacao('Datas do filtro devem estar no formato AAAA-MM-DD.');
    }

    const consulta = { status, dataInicio, dataFim };
    if (ator.perfil === 'PACIENTE') consulta.pacienteId = ator.pacienteId;
    else if (ator.perfil === 'MEDICO') consulta.medicoId = ator.medicoId;
    else {
      consulta.pacienteId = filtros.pacienteId ? Number(filtros.pacienteId) : undefined;
      consulta.medicoId = filtros.medicoId ? Number(filtros.medicoId) : undefined;
    }
    return consultas.listar(consulta);
  }

  return { agendar, remarcar, confirmar, cancelar, registrarRealizada, registrarFalta, obter, listar };
}

module.exports = { criarConsultasService };
