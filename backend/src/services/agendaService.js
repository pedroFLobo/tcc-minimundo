const clock = require('../utils/clock');
const { parseData, parseDataHora, formatarData, formatarDataHora, somarMinutos, inicioDoDia } = require('../utils/datas');
const { validarGrade, gerarSlots, dataEmBloqueio } = require('../domain/agenda');
const { validarAntecedencia } = require('../domain/consultas');
const erros = require('../utils/errors');

function criarAgendaService({ medicos, consultas }) {
  function obterMedico(medicoId) {
    const medico = medicos.buscarPorId(Number(medicoId));
    if (!medico) throw erros.naoEncontrado('Médico não encontrado.');
    return medico;
  }

  // Recepção gerencia qualquer agenda; o médico, somente a própria.
  function garantirGestorDaAgenda(ator, medico) {
    if (ator.perfil === 'RECEPCAO') return;
    if (ator.perfil === 'MEDICO' && ator.medicoId === medico.id) return;
    throw erros.semPermissao('Você só pode gerenciar a sua própria agenda.');
  }

  function obterGrade(medicoId) {
    return medicos.listarDisponibilidades(obterMedico(medicoId).id);
  }

  function salvarGrade(ator, medicoId, blocos) {
    const medico = obterMedico(medicoId);
    garantirGestorDaAgenda(ator, medico);
    const normalizados = Array.isArray(blocos)
      ? blocos.map((b) => ({ diaSemana: Number(b?.diaSemana), horaInicio: b?.horaInicio, horaFim: b?.horaFim }))
      : blocos;
    const erro = validarGrade(normalizados);
    if (erro) throw erros.validacao(erro);
    medicos.substituirDisponibilidades(medico.id, normalizados);
    return medicos.listarDisponibilidades(medico.id);
  }

  function listarBloqueios(ator, medicoId) {
    const medico = obterMedico(medicoId);
    garantirGestorDaAgenda(ator, medico);
    return medicos.listarBloqueios(medico.id);
  }

  function criarBloqueio(ator, medicoId, { dataInicio, dataFim, motivo } = {}) {
    const medico = obterMedico(medicoId);
    garantirGestorDaAgenda(ator, medico);

    const inicio = parseData(dataInicio);
    const fim = parseData(dataFim);
    if (!inicio || !fim) throw erros.validacao('Datas do bloqueio devem estar no formato AAAA-MM-DD.');
    if (fim < inicio) throw erros.validacao('A data final do bloqueio não pode ser anterior à inicial.');
    if (inicio < inicioDoDia(clock.agora())) throw erros.regraNegocio('O bloqueio não pode começar no passado.');

    const afetadas = consultas.ativasDoMedicoEntreDatas(medico.id, dataInicio, dataFim);
    if (afetadas.length) {
      throw erros.regraNegocio(`Existem ${afetadas.length} consulta(s) agendada(s) no período. Cancele ou remarque antes de bloquear.`);
    }

    const id = medicos.inserirBloqueio({ medicoId: medico.id, dataInicio, dataFim, motivo: typeof motivo === 'string' ? motivo.trim() : null });
    return medicos.buscarBloqueio(id);
  }

  function removerBloqueio(ator, medicoId, bloqueioId) {
    const medico = obterMedico(medicoId);
    garantirGestorDaAgenda(ator, medico);
    const bloqueio = medicos.buscarBloqueio(Number(bloqueioId));
    if (!bloqueio || bloqueio.medicoId !== medico.id) throw erros.naoEncontrado('Bloqueio não encontrado.');
    medicos.removerBloqueio(bloqueio.id);
  }

  // Horários livres do médico na data (RN14, RN15). ignorarConsultaId serve à remarcação.
  function horariosLivres(medicoId, dataTexto, { ignorarConsultaId = 0 } = {}) {
    const medico = obterMedico(medicoId);
    const data = parseData(dataTexto);
    if (!data) throw erros.validacao('Data inválida. Use o formato AAAA-MM-DD.');
    if (!medico.ativo) return [];

    const dataFormatada = formatarData(data);
    if (dataEmBloqueio(dataFormatada, medicos.listarBloqueios(medico.id))) return [];

    const blocosDoDia = medicos.listarDisponibilidades(medico.id).filter((b) => b.diaSemana === data.getDay());
    const agora = clock.agora();
    const ocupadas = consultas
      .ativasDoMedicoNoIntervalo(medico.id, `${dataFormatada} 00:00`, `${dataFormatada} 23:59`, ignorarConsultaId)
      .map((c) => ({ inicio: parseDataHora(c.inicio), fim: parseDataHora(c.fim) }));

    return gerarSlots(blocosDoDia, medico.duracaoConsultaMin)
      .map((hora) => parseDataHora(`${dataFormatada} ${hora}`))
      .filter((inicio) => !validarAntecedencia(inicio, agora))
      .filter((inicio) => {
        const fim = somarMinutos(inicio, medico.duracaoConsultaMin);
        return !ocupadas.some((o) => inicio < o.fim && o.inicio < fim);
      })
      .map((inicio) => formatarDataHora(inicio));
  }

  return { obterMedico, obterGrade, salvarGrade, listarBloqueios, criarBloqueio, removerBloqueio, horariosLivres };
}

module.exports = { criarAgendaService };
