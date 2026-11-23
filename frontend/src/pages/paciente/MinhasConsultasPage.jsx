import { useState } from 'react';
import { Link } from 'react-router-dom';
import { consultasApi } from '../../api';
import { DialogoRemarcar } from '../../components/DialogoRemarcar';
import { Icone } from '../../components/Icone';
import { Mensagem } from '../../components/Mensagem';
import { Modal } from '../../components/Modal';
import { TabelaConsultas } from '../../components/TabelaConsultas';
import { useCarregar } from '../../hooks/useCarregar';
import { useMensagem } from '../../hooks/useMensagem';
import { estaAtiva, formatarDataHora } from '../../utils/formatadores';

export function MinhasConsultasPage() {
  const { dados: consultas, recarregar } = useCarregar(
    () => consultasApi.listar().then((lista) => lista.sort((a, b) => b.inicio.localeCompare(a.inicio))),
  );
  const [dialogo, setDialogo] = useState(null);
  const { mensagem, sucesso, erro, limpar } = useMensagem();
  const proximas = consultas?.filter(estaAtiva).length ?? 0;

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

  return (
    <div className="cartao">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2>Histórico de consultas</h2>
          <p className="descricao">{consultas ? `${proximas} consulta(s) ativa(s) de ${consultas.length} no total.` : 'Carregando...'}</p>
        </div>
        <Link to="/paciente/agendar" className="botao-link marca"><Icone nome="mais" />Nova consulta</Link>
      </div>
      <Mensagem id="consultas-mensagem" mensagem={mensagem} />
      <TabelaConsultas
        id="tabela-consultas"
        consultas={consultas}
        colunas={['inicio', 'medico', 'valor', 'status']}
        textoVazio="Você ainda não tem consultas. Que tal agendar a primeira?"
        acoes={(c) => (
          <>
            {c.status === 'AGENDADA' && (
              <button type="button" className="pequeno" data-acao="confirmar" onClick={() => executar(() => consultasApi.confirmar(c.id), `Presença confirmada para ${formatarDataHora(c.inicio)}.`)}>Confirmar</button>
            )}
            <button type="button" className="pequeno secundario" data-acao="remarcar" onClick={() => setDialogo({ tipo: 'remarcar', consulta: c })}>Remarcar</button>
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
        <Modal titulo="Cancelar consulta?" descricao={`${dialogo.consulta.medicoNome} · ${formatarDataHora(dialogo.consulta.inicio)}. Esta ação não pode ser desfeita.`} aberto onFechar={() => setDialogo(null)}>
          <div className="botoes">
            <button type="button" className="secundario" id="cancelar-voltar" onClick={() => setDialogo(null)}>Manter consulta</button>
            <button type="button" className="marca" id="cancelar-confirmar" onClick={() => executar(() => consultasApi.cancelar(dialogo.consulta.id, 'Cancelado pelo paciente'), 'Sua consulta foi cancelada.')}>Sim, cancelar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
