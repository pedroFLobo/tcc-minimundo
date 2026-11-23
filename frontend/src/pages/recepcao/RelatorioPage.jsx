import { useState } from 'react';
import { adminApi } from '../../api';
import { BotaoEnviar } from '../../components/BotaoEnviar';
import { Campo } from '../../components/Campo';
import { Mensagem } from '../../components/Mensagem';
import { StatusBadge } from '../../components/StatusBadge';
import { Vazio } from '../../components/Vazio';
import { useMensagem } from '../../hooks/useMensagem';
import { formatarMoeda } from '../../utils/formatadores';

export function RelatorioPage() {
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [relatorio, setRelatorio] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const { mensagem, erro, limpar } = useMensagem();

  async function gerar(evento) {
    evento.preventDefault();
    limpar();
    setEnviando(true);
    try {
      setRelatorio(await adminApi.resumo(dataInicio, dataFim));
    } catch (e) {
      setRelatorio(null);
      erro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  const total = relatorio ? Object.values(relatorio.porStatus).reduce((a, b) => a + b, 0) : 0;

  return (
    <>
      <form className="cartao" onSubmit={gerar} noValidate>
        <h2>Período</h2>
        <div className="linha">
          <Campo id="relatorio-inicio" rotulo="De" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          <Campo id="relatorio-fim" rotulo="Até" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          <div className="campo"><BotaoEnviar id="relatorio-gerar" enviando={enviando} textoEnviando="Gerando...">Gerar relatório</BotaoEnviar></div>
        </div>
        <Mensagem id="relatorio-mensagem" mensagem={mensagem} />
        {!relatorio && !mensagem && <Vazio icone="grafico">Escolha um período para ver os indicadores.</Vazio>}
      </form>

      {relatorio && (
        <div id="relatorio-resultado">
          <div className="cartao">
            <h2>Consultas por status</h2>
            <div className="indicadores" id="relatorio-status">
              <div className="indicador destaque"><span className="rotulo">Total</span><strong>{total}</strong></div>
              {Object.entries(relatorio.porStatus).map(([s, n], i) => (
                <div key={s} className="indicador" style={{ animationDelay: `${(i + 1) * 60}ms` }}>
                  <span className="rotulo"><StatusBadge status={s} /></span>
                  <strong>{n}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="cartao">
            <h2>Faturamento</h2>
            <p className="descricao">Soma das consultas realizadas no período.</p>
            <p id="relatorio-faturamento" className="valor-destaque">{formatarMoeda(relatorio.faturamentoCentavos)}</p>
          </div>
          <div className="cartao">
            <h2>Faltas por médico</h2>
            <div className="tabela-container">
              <table id="relatorio-faltas" className="responsiva">
                <thead><tr><th scope="col">Médico</th><th scope="col">Faltas</th><th scope="col">Encerradas</th><th scope="col">Taxa de faltas</th></tr></thead>
                <tbody>
                  {relatorio.faltasPorMedico.length === 0 && <tr><td colSpan="4" className="vazio"><Vazio icone="grafico">Sem consultas no período.</Vazio></td></tr>}
                  {relatorio.faltasPorMedico.map((f) => (
                    <tr key={f.medicoId}>
                      <td data-label="Médico"><strong>{f.medicoNome}</strong></td>
                      <td data-label="Faltas">{f.faltas}</td>
                      <td data-label="Encerradas">{f.encerradas}</td>
                      <td data-label="Taxa de faltas">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'inherit' }}>
                          <div className="barra-taxa" aria-hidden="true"><span style={{ width: `${Math.min(f.taxaFaltas, 100)}%` }} /></div>
                          {f.taxaFaltas}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
