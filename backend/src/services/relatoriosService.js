const { parseData } = require('../utils/datas');
const { STATUS } = require('../domain/consultas');
const erros = require('../utils/errors');

function criarRelatoriosService({ consultas }) {
  function resumo({ dataInicio, dataFim } = {}) {
    const inicio = parseData(dataInicio);
    const fim = parseData(dataFim);
    if (!inicio || !fim) throw erros.validacao('Informe dataInicio e dataFim no formato AAAA-MM-DD.');
    if (fim < inicio) throw erros.validacao('dataFim não pode ser anterior a dataInicio.');

    const porStatus = Object.fromEntries(Object.values(STATUS).map((s) => [s, 0]));
    for (const linha of consultas.resumoPorStatus(dataInicio, dataFim)) porStatus[linha.status] = linha.total;

    const faltasPorMedico = consultas.faltasPorMedico(dataInicio, dataFim).map((l) => ({
      medicoId: l.medico_id,
      medicoNome: l.medico_nome,
      faltas: l.faltas,
      encerradas: l.encerradas,
      taxaFaltas: l.encerradas ? Math.round((l.faltas / l.encerradas) * 1000) / 10 : 0,
    }));

    return {
      periodo: { dataInicio, dataFim },
      porStatus,
      faltasPorMedico,
      faturamentoCentavos: consultas.faturamento(dataInicio, dataFim),
    };
  }

  return { resumo };
}

module.exports = { criarRelatoriosService };
