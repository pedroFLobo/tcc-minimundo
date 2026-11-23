import { useState } from 'react';
import { consultasApi } from '../api';
import { useMensagem } from '../hooks/useMensagem';
import { formatarDataHora } from '../utils/formatadores';
import { Campo } from './Campo';
import { Mensagem } from './Mensagem';
import { Modal } from './Modal';
import { SeletorHorarios } from './SeletorHorarios';

export function DialogoRemarcar({ consulta, onFechar, onRemarcada }) {
  const [data, setData] = useState('');
  const [inicio, setInicio] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const { mensagem, erro } = useMensagem();

  async function remarcar() {
    setEnviando(true);
    try {
      const atualizada = await consultasApi.remarcar(consulta.id, inicio);
      onRemarcada(atualizada);
    } catch (e) {
      erro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal
      titulo="Remarcar consulta"
      descricao={`${consulta.medicoNome} · horário atual: ${formatarDataHora(consulta.inicio)}`}
      aberto
      onFechar={onFechar}
    >
      <Campo id="remarcar-data" rotulo="Nova data" type="date" value={data} onChange={(e) => { setData(e.target.value); setInicio(null); }} />
      {data && <p className="rotulo">Horários disponíveis</p>}
      <SeletorHorarios id="remarcar-horarios" medicoId={consulta.medicoId} data={data} selecionado={inicio} onEscolher={setInicio} />
      <Mensagem id="remarcar-mensagem" mensagem={mensagem} />
      <div className="botoes">
        <button type="button" className="secundario" id="remarcar-fechar" onClick={onFechar}>Voltar</button>
        <button type="button" className="marca" id="remarcar-confirmar" disabled={!inicio || enviando} onClick={remarcar}>
          {enviando ? <><span className="girando" aria-hidden="true" />Remarcando...</> : 'Confirmar nova data'}
        </button>
      </div>
    </Modal>
  );
}
