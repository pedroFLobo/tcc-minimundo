// Regras puras do ciclo de vida da consulta (RN16, RN19, RN20, RN22–RN29).
const { minutosEntre, somarDias, somarMinutos } = require('../utils/datas');

const STATUS = Object.freeze({
  AGENDADA: 'AGENDADA',
  CONFIRMADA: 'CONFIRMADA',
  REALIZADA: 'REALIZADA',
  FALTA: 'FALTA',
  CANCELADA: 'CANCELADA',
});

const STATUS_ATIVOS = [STATUS.AGENDADA, STATUS.CONFIRMADA];

const TRANSICOES = Object.freeze({
  AGENDADA: [STATUS.CONFIRMADA, STATUS.CANCELADA, STATUS.REALIZADA, STATUS.FALTA],
  CONFIRMADA: [STATUS.CANCELADA, STATUS.REALIZADA, STATUS.FALTA],
  REALIZADA: [],
  FALTA: [],
  CANCELADA: [],
});

const REGRAS = Object.freeze({
  ANTECEDENCIA_MINIMA_MIN: 120,
  ANTECEDENCIA_MAXIMA_DIAS: 60,
  MAX_CONSULTAS_ATIVAS: 3,
  MAX_ATIVAS_POR_ESPECIALIDADE: 1,
  JANELA_FALTAS_DIAS: 90,
  LIMITE_FALTAS: 3,
  SUSPENSAO_DIAS: 30,
  DESCONTO_IDOSO_IDADE: 60,
  DESCONTO_IDOSO_PERCENTUAL: 10,
  JANELA_RETORNO_DIAS: 30,
  JANELA_CONFIRMACAO_HORAS: 48,
  PRAZO_CANCELAMENTO_PACIENTE_HORAS: 24,
  PRAZO_REMARCACAO_HORAS: 24,
  MAX_REMARCACOES: 2,
  TOLERANCIA_FALTA_MIN: 15,
});

function podeTransitar(de, para) {
  return (TRANSICOES[de] || []).includes(para);
}

function estaAtiva(status) {
  return STATUS_ATIVOS.includes(status);
}

// Retorna a mensagem de erro, ou null se a antecedência for aceitável.
function validarAntecedencia(inicio, agora) {
  const minutos = minutosEntre(agora, inicio);
  if (minutos < REGRAS.ANTECEDENCIA_MINIMA_MIN) {
    return 'A consulta deve ser agendada com no mínimo 2 horas de antecedência.';
  }
  if (inicio > somarDias(agora, REGRAS.ANTECEDENCIA_MAXIMA_DIAS)) {
    return 'A consulta deve ser agendada com no máximo 60 dias de antecedência.';
  }
  return null;
}

// consultasAtivasFuturas: [{ especialidadeId }]. Retorna a mensagem de erro, ou null.
function validarLimitesPaciente(consultasAtivasFuturas, especialidadeId) {
  if (consultasAtivasFuturas.length >= REGRAS.MAX_CONSULTAS_ATIVAS) {
    return `O paciente já possui ${REGRAS.MAX_CONSULTAS_ATIVAS} consultas agendadas, que é o limite.`;
  }
  const mesmaEspecialidade = consultasAtivasFuturas.filter((c) => c.especialidadeId === especialidadeId).length;
  if (mesmaEspecialidade >= REGRAS.MAX_ATIVAS_POR_ESPECIALIDADE) {
    return 'O paciente já possui uma consulta agendada nesta especialidade.';
  }
  return null;
}

// datasFaltas: lista de Date (início das consultas com FALTA). Retorna a data fim da suspensão, ou null.
function calcularSuspensao(datasFaltas, agora) {
  const limiteJanela = somarDias(agora, -REGRAS.JANELA_FALTAS_DIAS);
  const recentes = datasFaltas.filter((d) => d >= limiteJanela && d <= agora);
  if (recentes.length < REGRAS.LIMITE_FALTAS) return null;

  const ultima = recentes.reduce((a, b) => (a > b ? a : b));
  const fim = somarDias(ultima, REGRAS.SUSPENSAO_DIAS);
  return fim > agora ? fim : null;
}

function calcularValor({ precoBaseCentavos, idadePaciente, ehRetorno }) {
  if (ehRetorno) return 0;
  if (idadePaciente >= REGRAS.DESCONTO_IDOSO_IDADE) {
    return Math.round((precoBaseCentavos * (100 - REGRAS.DESCONTO_IDOSO_PERCENTUAL)) / 100);
  }
  return precoBaseCentavos;
}

// realizadas: [{ id, inicio: Date }] com o mesmo médico; idsJaUsados: ids já usados como retorno.
// Retorna o id da consulta que dá direito ao retorno, ou null.
function encontrarConsultaDeRetorno(realizadas, idsJaUsados, novoInicio) {
  const limite = somarDias(novoInicio, -REGRAS.JANELA_RETORNO_DIAS);
  const candidatas = realizadas
    .filter((c) => c.inicio >= limite && c.inicio < novoInicio && !idsJaUsados.includes(c.id))
    .sort((a, b) => b.inicio - a.inicio);
  return candidatas.length ? candidatas[0].id : null;
}

// Cada função abaixo retorna null se a ação for permitida, ou { tipo, mensagem }:
// tipo 'PERMISSAO' quando o ator não pode agir sobre a consulta, 'REGRA' quando a regra de negócio impede.
const proibido = (mensagem) => ({ tipo: 'PERMISSAO', mensagem });
const regra = (mensagem) => ({ tipo: 'REGRA', mensagem });

// ator: { perfil, ehDono } — ehDono indica que o ator é o paciente/médico da consulta.

function verificarConfirmacao(consulta, ator, agora) {
  if (!['PACIENTE', 'RECEPCAO'].includes(ator.perfil) || (ator.perfil === 'PACIENTE' && !ator.ehDono)) {
    return proibido('Somente o paciente da consulta ou a recepção podem confirmar.');
  }
  if (consulta.status !== STATUS.AGENDADA) return regra('Somente consultas agendadas podem ser confirmadas.');
  const minutosAteInicio = minutosEntre(agora, consulta.inicio);
  if (minutosAteInicio <= 0) return regra('A consulta já começou.');
  if (minutosAteInicio > REGRAS.JANELA_CONFIRMACAO_HORAS * 60) {
    return regra('A confirmação só é permitida nas 48 horas anteriores à consulta.');
  }
  return null;
}

function verificarCancelamento(consulta, ator, agora, motivo) {
  if (ator.perfil !== 'RECEPCAO' && !ator.ehDono) {
    return proibido('Você não pode cancelar esta consulta.');
  }
  if (!podeTransitar(consulta.status, STATUS.CANCELADA)) return regra('Esta consulta não pode mais ser cancelada.');
  const minutosAteInicio = minutosEntre(agora, consulta.inicio);
  if (minutosAteInicio <= 0) return regra('A consulta já começou e não pode ser cancelada.');
  if (ator.perfil === 'PACIENTE' && minutosAteInicio < REGRAS.PRAZO_CANCELAMENTO_PACIENTE_HORAS * 60) {
    return regra('O paciente só pode cancelar com no mínimo 24 horas de antecedência. Procure a recepção.');
  }
  if (ator.perfil !== 'PACIENTE' && !(motivo && String(motivo).trim())) {
    return regra('Informe o motivo do cancelamento.');
  }
  return null;
}

function verificarRemarcacao(consulta, ator, agora) {
  if (!['PACIENTE', 'RECEPCAO'].includes(ator.perfil) || (ator.perfil === 'PACIENTE' && !ator.ehDono)) {
    return proibido('Somente o paciente da consulta ou a recepção podem remarcar.');
  }
  if (!estaAtiva(consulta.status)) return regra('Somente consultas agendadas ou confirmadas podem ser remarcadas.');
  if (minutosEntre(agora, consulta.inicio) < REGRAS.PRAZO_REMARCACAO_HORAS * 60) {
    return regra('A remarcação só é permitida até 24 horas antes da consulta.');
  }
  if (consulta.remarcacoes >= REGRAS.MAX_REMARCACOES) return regra('Esta consulta já atingiu o limite de 2 remarcações.');
  return null;
}

function verificarRealizacao(consulta, ator, agora) {
  if (ator.perfil !== 'MEDICO' || !ator.ehDono) {
    return proibido('Somente o médico da consulta pode registrar o atendimento.');
  }
  if (!podeTransitar(consulta.status, STATUS.REALIZADA)) return regra('Esta consulta não pode ser marcada como realizada.');
  if (agora < consulta.inicio) return regra('O atendimento só pode ser registrado a partir do horário da consulta.');
  return null;
}

function verificarFalta(consulta, ator, agora) {
  const autorizado = ator.perfil === 'RECEPCAO' || (ator.perfil === 'MEDICO' && ator.ehDono);
  if (!autorizado) return proibido('Somente o médico da consulta ou a recepção podem registrar falta.');
  if (!podeTransitar(consulta.status, STATUS.FALTA)) return regra('Esta consulta não pode ser marcada como falta.');
  if (agora < somarMinutos(consulta.inicio, REGRAS.TOLERANCIA_FALTA_MIN)) {
    return regra('A falta só pode ser registrada 15 minutos após o início da consulta.');
  }
  return null;
}

module.exports = {
  STATUS,
  STATUS_ATIVOS,
  TRANSICOES,
  REGRAS,
  podeTransitar,
  estaAtiva,
  validarAntecedencia,
  validarLimitesPaciente,
  calcularSuspensao,
  calcularValor,
  encontrarConsultaDeRetorno,
  verificarConfirmacao,
  verificarCancelamento,
  verificarRemarcacao,
  verificarRealizacao,
  verificarFalta,
};
