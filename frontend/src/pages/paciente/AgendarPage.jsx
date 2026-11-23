import { useState } from 'react';
import { consultasApi, especialidadesApi, medicosApi } from '../../api';
import { BotaoEnviar } from '../../components/BotaoEnviar';
import { Campo } from '../../components/Campo';
import { Icone } from '../../components/Icone';
import { Mensagem } from '../../components/Mensagem';
import { SeletorHorarios } from '../../components/SeletorHorarios';
import { useCarregar } from '../../hooks/useCarregar';
import { useMensagem } from '../../hooks/useMensagem';
import { formatarDataHora, formatarMoeda } from '../../utils/formatadores';

export function AgendarPage() {
  const [especialidadeId, setEspecialidadeId] = useState('');
  const [medicoId, setMedicoId] = useState('');
  const [data, setData] = useState('');
  const [inicio, setInicio] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [versaoHorarios, setVersaoHorarios] = useState(0);
  const { mensagem, sucesso, erro, limpar } = useMensagem();

  const { dados: especialidades } = useCarregar(() => especialidadesApi.listar());
  const { dados: medicos } = useCarregar(
    () => (especialidadeId ? medicosApi.listar(especialidadeId).then((l) => l.filter((m) => m.ativo)) : []),
    [especialidadeId],
  );
  const medico = medicos?.find((m) => m.id === Number(medicoId));
  const especialidade = especialidades?.find((e) => e.id === Number(especialidadeId));

  async function agendar(evento) {
    evento.preventDefault();
    limpar();
    setEnviando(true);
    try {
      const consulta = await consultasApi.agendar({ medicoId: Number(medicoId), inicio });
      const valor = consulta.valorCentavos === 0 ? 'retorno gratuito' : formatarMoeda(consulta.valorCentavos);
      sucesso(`${consulta.medicoNome} em ${formatarDataHora(consulta.inicio)} (${valor}).`, 'Consulta agendada');
      setInicio(null);
      setVersaoHorarios((v) => v + 1);
    } catch (e) {
      erro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="cartao" onSubmit={agendar} noValidate>
      <h2>Nova consulta</h2>
      <p className="descricao">Siga os passos abaixo. Os horários mostrados já respeitam a agenda do médico.</p>
      <ol className="passos" aria-label="Etapas do agendamento">
        <li className={especialidadeId ? 'feito' : ''}>Especialidade</li>
        <li className={medicoId ? 'feito' : ''}>Médico</li>
        <li className={data ? 'feito' : ''}>Data</li>
        <li className={inicio ? 'feito' : ''}>Horário</li>
      </ol>
      <div className="linha">
        <Campo id="agendar-especialidade" rotulo="Especialidade">
          <select id="agendar-especialidade" value={especialidadeId} onChange={(e) => { setEspecialidadeId(e.target.value); setMedicoId(''); setInicio(null); }}>
            <option value="">Selecione</option>
            {especialidades?.map((e) => <option key={e.id} value={e.id}>{e.nome} — {formatarMoeda(e.precoCentavos)}</option>)}
          </select>
        </Campo>
        <Campo id="agendar-medico" rotulo="Médico">
          <select id="agendar-medico" value={medicoId} disabled={!especialidadeId} onChange={(e) => { setMedicoId(e.target.value); setInicio(null); }}>
            <option value="">{especialidadeId ? 'Selecione' : 'Escolha a especialidade'}</option>
            {medicos?.map((m) => <option key={m.id} value={m.id}>{m.nome} ({m.duracaoConsultaMin} min)</option>)}
          </select>
        </Campo>
        <Campo id="agendar-data" rotulo="Data" type="date" disabled={!medicoId} value={data} onChange={(e) => { setData(e.target.value); setInicio(null); }} />
      </div>
      {medicoId && data && <p className="rotulo">Horários disponíveis</p>}
      <SeletorHorarios id="agendar-horarios" medicoId={medicoId} data={data} selecionado={inicio} onEscolher={setInicio} recarregarChave={versaoHorarios} />
      {inicio && medico && (
        <div className="resumo-agendamento" id="agendar-resumo">
          <Icone nome="calendario" tamanho={22} />
          <div>
            <strong>{medico.nome}</strong> · {especialidade?.nome}
            <span className="secundaria">{formatarDataHora(inicio)} · {medico.duracaoConsultaMin} minutos</span>
          </div>
        </div>
      )}
      <Mensagem id="agendar-mensagem" mensagem={mensagem} />
      <BotaoEnviar id="agendar-confirmar" className="marca" disabled={!inicio} enviando={enviando} textoEnviando="Agendando...">
        <Icone nome="check" />Confirmar agendamento
      </BotaoEnviar>
    </form>
  );
}
