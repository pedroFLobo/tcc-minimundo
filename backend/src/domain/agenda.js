// Regras puras de grade de horários e geração de slots (RN10, RN11, RN14, RN15).
const { horaParaMinutos, minutosParaHora } = require('../utils/datas');

const ABERTURA = horaParaMinutos('07:00');
const FECHAMENTO = horaParaMinutos('20:00');

function intervalosSobrepoem(inicioA, fimA, inicioB, fimB) {
  return inicioA < fimB && inicioB < fimA;
}

// Retorna a mensagem de erro do bloco, ou null se for válido.
function validarBloco(bloco) {
  const dia = bloco.diaSemana;
  if (!Number.isInteger(dia) || dia < 0 || dia > 6) return 'Dia da semana deve ser um inteiro de 0 (domingo) a 6 (sábado).';

  const inicio = horaParaMinutos(bloco.horaInicio);
  const fim = horaParaMinutos(bloco.horaFim);
  if (inicio === null || fim === null) return 'Horários devem estar no formato HH:mm.';
  if (inicio % 15 !== 0 || fim % 15 !== 0) return 'Horários devem ser múltiplos de 15 minutos.';
  if (inicio < ABERTURA || fim > FECHAMENTO) return 'Horários devem estar entre 07:00 e 20:00.';
  if (inicio >= fim) return 'Hora de início deve ser anterior à hora de fim.';
  return null;
}

// Retorna a mensagem do primeiro problema encontrado na grade, ou null.
function validarGrade(blocos) {
  if (!Array.isArray(blocos)) return 'A grade deve ser uma lista de blocos.';

  for (const bloco of blocos) {
    const erro = validarBloco(bloco);
    if (erro) return erro;
  }

  for (let i = 0; i < blocos.length; i++) {
    for (let j = i + 1; j < blocos.length; j++) {
      const a = blocos[i];
      const b = blocos[j];
      if (
        a.diaSemana === b.diaSemana &&
        intervalosSobrepoem(
          horaParaMinutos(a.horaInicio), horaParaMinutos(a.horaFim),
          horaParaMinutos(b.horaInicio), horaParaMinutos(b.horaFim),
        )
      ) {
        return `Blocos sobrepostos no dia ${a.diaSemana}: ${a.horaInicio}–${a.horaFim} e ${b.horaInicio}–${b.horaFim}.`;
      }
    }
  }
  return null;
}

// Gera os horários de início ('HH:mm') que cabem inteiros nos blocos do dia.
function gerarSlots(blocosDoDia, duracaoMin) {
  const slots = [];
  const ordenados = [...blocosDoDia].sort((a, b) => horaParaMinutos(a.horaInicio) - horaParaMinutos(b.horaInicio));
  for (const bloco of ordenados) {
    const fim = horaParaMinutos(bloco.horaFim);
    for (let t = horaParaMinutos(bloco.horaInicio); t + duracaoMin <= fim; t += duracaoMin) {
      slots.push(minutosParaHora(t));
    }
  }
  return slots;
}

function dataEmBloqueio(dataTexto, bloqueios) {
  return bloqueios.some((b) => dataTexto >= b.dataInicio && dataTexto <= b.dataFim);
}

module.exports = { ABERTURA, FECHAMENTO, intervalosSobrepoem, validarBloco, validarGrade, gerarSlots, dataEmBloqueio };
