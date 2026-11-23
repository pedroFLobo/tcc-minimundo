import { useState } from 'react';
import { consultasApi } from '../../api';
import { Campo } from '../../components/Campo';
import { DialogoTexto } from '../../components/DialogoTexto';
import { Mensagem } from '../../components/Mensagem';
import { StatusBadge } from '../../components/StatusBadge';
import { TabelaConsultas } from '../../components/TabelaConsultas';
import { useCarregar } from '../../hooks/useCarregar';
import { useMensagem } from '../../hooks/useMensagem';
import { STATUS_CONSULTA, hojeISO } from '../../utils/formatadores';

export function AgendaPage() {
  const [data, setData] = useState(hojeISO());
  const [status, setStatus] = useState('');
  const [dialogo, setDialogo] = useState(null);
  const { mensagem, sucesso, erro, limpar } = useMensagem();
  const { dados: consultas, recarregar } = useCarregar(
    () => consultasApi.listar({ dataInicio: data, dataFim: data, status }),
    [data, status],
  );

  async function executar(acao, textoSucesso) {
    limpar();
    setDialogo(null);
    try {
      await acao();
      sucesso(textoSucesso);
      recarregar();
    } catch (e) {
      erro(e.message);
    }
  }

  const contagem = (s) => consultas?.filter((c) => c.status === s).length ?? 0;

  return (
    <div className="cartao">
      <h2>Atendimentos do dia</h2>
      <p className="descricao">Registre o atendimento a partir do horário da consulta, ou a falta após 15 minutos de tolerância.</p>
      <div className="linha">
        <Campo id="agenda-data" rotulo="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
        <Campo id="agenda-status" rotulo="Status">
          <select id="agenda-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            {STATUS_CONSULTA.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
          </select>
        </Campo>
      </div>
      {consultas?.length > 0 && (
        <p className="descricao" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['AGENDADA', 'CONFIRMADA', 'REALIZADA', 'FALTA'].map((s) => contagem(s) > 0 && <span key={s}><StatusBadge status={s} /> {contagem(s)}</span>)}
        </p>
      )}
      <Mensagem id="agenda-mensagem" mensagem={mensagem} />
      <TabelaConsultas
        id="tabela-agenda"
        consultas={consultas}
        colunas={['inicio', 'paciente', 'status', 'observacoes']}
        textoVazio="Nenhuma consulta para os filtros escolhidos."
        acoes={(c) => (
          <>
            <button type="button" className="pequeno" data-acao="realizar" onClick={() => setDialogo({ tipo: 'realizar', consulta: c })}>Atendido</button>
            <button type="button" className="pequeno secundario" data-acao="falta" onClick={() => executar(() => consultasApi.falta(c.id), `Falta registrada para ${c.pacienteNome}.`)}>Falta</button>
            <button type="button" className="pequeno perigo" data-acao="cancelar" onClick={() => setDialogo({ tipo: 'cancelar', consulta: c })}>Cancelar</button>
          </>
        )}
      />
      {dialogo?.tipo === 'realizar' && (
        <DialogoTexto
          titulo="Registrar atendimento"
          descricao={`Paciente: ${dialogo.consulta.pacienteNome}`}
          rotulo="Observações (opcional)"
          textoConfirmar="Registrar atendimento"
          onCancelar={() => setDialogo(null)}
          onConfirmar={(obs) => executar(() => consultasApi.realizar(dialogo.consulta.id, obs), `Atendimento de ${dialogo.consulta.pacienteNome} registrado.`)}
        />
      )}
      {dialogo?.tipo === 'cancelar' && (
        <DialogoTexto
          titulo="Cancelar consulta"
          descricao={`Paciente: ${dialogo.consulta.pacienteNome}. O motivo é obrigatório.`}
          rotulo="Motivo do cancelamento"
          textoConfirmar="Cancelar consulta"
          perigo
          onCancelar={() => setDialogo(null)}
          onConfirmar={(motivo) => executar(() => consultasApi.cancelar(dialogo.consulta.id, motivo), 'Consulta cancelada.')}
        />
      )}
    </div>
  );
}
