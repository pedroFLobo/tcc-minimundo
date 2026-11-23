import { useState } from 'react';
import { consultasApi, medicosApi, pacientesApi } from '../../api';
import { Campo } from '../../components/Campo';
import { DialogoRemarcar } from '../../components/DialogoRemarcar';
import { DialogoTexto } from '../../components/DialogoTexto';
import { Mensagem } from '../../components/Mensagem';
import { TabelaConsultas } from '../../components/TabelaConsultas';
import { useCarregar } from '../../hooks/useCarregar';
import { useMensagem } from '../../hooks/useMensagem';
import { STATUS_CONSULTA, formatarDataHora } from '../../utils/formatadores';

const FILTROS_VAZIOS = { dataInicio: '', dataFim: '', status: '', medicoId: '', pacienteId: '' };

export function ConsultasPage() {
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [aplicados, setAplicados] = useState(FILTROS_VAZIOS);
  const [dialogo, setDialogo] = useState(null);
  const { mensagem, sucesso, erro, limpar } = useMensagem();

  const { dados: medicos } = useCarregar(() => medicosApi.listar());
  const { dados: pacientes } = useCarregar(() => pacientesApi.listar());
  const { dados: consultas, erro: erroLista, recarregar } = useCarregar(() => consultasApi.listar(aplicados), [aplicados]);

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

  const atualizar = (campo) => (e) => setFiltros({ ...filtros, [campo]: e.target.value });
  const filtrosAtivos = Object.values(aplicados).some(Boolean);

  return (
    <div className="cartao">
      <h2>Filtros</h2>
      <p className="descricao">{consultas ? `${consultas.length} consulta(s) encontrada(s).` : 'Carregando...'}</p>
      <form className="linha" onSubmit={(e) => { e.preventDefault(); setAplicados(filtros); }}>
        <Campo id="filtro-inicio" rotulo="De" type="date" value={filtros.dataInicio} onChange={atualizar('dataInicio')} />
        <Campo id="filtro-fim" rotulo="Até" type="date" value={filtros.dataFim} onChange={atualizar('dataFim')} />
        <Campo id="filtro-status" rotulo="Status">
          <select id="filtro-status" value={filtros.status} onChange={atualizar('status')}>
            <option value="">Todos</option>
            {STATUS_CONSULTA.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
          </select>
        </Campo>
        <Campo id="filtro-medico" rotulo="Médico">
          <select id="filtro-medico" value={filtros.medicoId} onChange={atualizar('medicoId')}>
            <option value="">Todos</option>
            {medicos?.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </Campo>
        <Campo id="filtro-paciente" rotulo="Paciente">
          <select id="filtro-paciente" value={filtros.pacienteId} onChange={atualizar('pacienteId')}>
            <option value="">Todos</option>
            {pacientes?.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </Campo>
        <div className="campo acoes-form" style={{ marginTop: 0 }}>
          <button type="submit" id="filtro-aplicar">Filtrar</button>
          {filtrosAtivos && <button type="button" className="secundario" onClick={() => { setFiltros(FILTROS_VAZIOS); setAplicados(FILTROS_VAZIOS); }}>Limpar</button>}
        </div>
      </form>
      <Mensagem id="consultas-mensagem" mensagem={mensagem ?? (erroLista && { tipo: 'erro', texto: erroLista })} />
      <TabelaConsultas
        id="tabela-consultas"
        consultas={consultas}
        colunas={['inicio', 'paciente', 'medico', 'valor', 'status']}
        acoes={(c) => (
          <>
            {c.status === 'AGENDADA' && (
              <button type="button" className="pequeno" data-acao="confirmar" onClick={() => executar(() => consultasApi.confirmar(c.id), `Presença de ${c.pacienteNome} confirmada.`)}>Confirmar</button>
            )}
            <button type="button" className="pequeno secundario" data-acao="remarcar" onClick={() => setDialogo({ tipo: 'remarcar', consulta: c })}>Remarcar</button>
            <button type="button" className="pequeno secundario" data-acao="falta" onClick={() => executar(() => consultasApi.falta(c.id), `Falta registrada para ${c.pacienteNome}.`)}>Falta</button>
            <button type="button" className="pequeno perigo" data-acao="cancelar" onClick={() => setDialogo({ tipo: 'cancelar', consulta: c })}>Cancelar</button>
          </>
        )}
      />
      {dialogo?.tipo === 'remarcar' && (
        <DialogoRemarcar
          consulta={dialogo.consulta}
          onFechar={() => setDialogo(null)}
          onRemarcada={(c) => { setDialogo(null); sucesso(`Nova data: ${formatarDataHora(c.inicio)}.`, 'Consulta remarcada'); recarregar(); }}
        />
      )}
      {dialogo?.tipo === 'cancelar' && (
        <DialogoTexto
          titulo="Cancelar consulta"
          descricao={`${dialogo.consulta.pacienteNome} · ${formatarDataHora(dialogo.consulta.inicio)}. O motivo é obrigatório.`}
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
