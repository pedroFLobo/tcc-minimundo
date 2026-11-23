import { useState } from 'react';
import { consultasApi, medicosApi, pacientesApi } from '../../api';
import { BotaoEnviar } from '../../components/BotaoEnviar';
import { Campo } from '../../components/Campo';
import { Icone } from '../../components/Icone';
import { Mensagem } from '../../components/Mensagem';
import { SeletorHorarios } from '../../components/SeletorHorarios';
import { useCarregar } from '../../hooks/useCarregar';
import { useMensagem } from '../../hooks/useMensagem';
import { formatarDataHora, formatarMoeda } from '../../utils/formatadores';

export function AgendarPage() {
  const [pacienteId, setPacienteId] = useState('');
  const [medicoId, setMedicoId] = useState('');
  const [data, setData] = useState('');
  const [inicio, setInicio] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [versaoHorarios, setVersaoHorarios] = useState(0);
  const { mensagem, sucesso, erro, limpar } = useMensagem();
  const { dados: pacientes } = useCarregar(() => pacientesApi.listar());
  const { dados: medicos } = useCarregar(() => medicosApi.listar());

  async function agendar(evento) {
    evento.preventDefault();
    limpar();
    setEnviando(true);
    try {
      const c = await consultasApi.agendar({ pacienteId: Number(pacienteId) || undefined, medicoId: Number(medicoId), inicio });
      sucesso(`${c.pacienteNome} com ${c.medicoNome} em ${formatarDataHora(c.inicio)} (${formatarMoeda(c.valorCentavos)}).`, 'Consulta agendada');
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
      <h2>Agendar para paciente</h2>
      <p className="descricao">As regras de antecedência, limites e suspensão por faltas também valem para agendamentos da recepção.</p>
      <div className="linha">
        <Campo id="agendar-paciente" rotulo="Paciente">
          <select id="agendar-paciente" value={pacienteId} onChange={(e) => setPacienteId(e.target.value)}>
            <option value="">Selecione</option>
            {pacientes?.map((p) => <option key={p.id} value={p.id}>{p.nome} ({p.cpf})</option>)}
          </select>
        </Campo>
        <Campo id="agendar-medico" rotulo="Médico">
          <select id="agendar-medico" value={medicoId} onChange={(e) => { setMedicoId(e.target.value); setInicio(null); }}>
            <option value="">Selecione</option>
            {medicos?.filter((m) => m.ativo).map((m) => <option key={m.id} value={m.id}>{m.nome} — {m.especialidadeNome}</option>)}
          </select>
        </Campo>
        <Campo id="agendar-data" rotulo="Data" type="date" value={data} onChange={(e) => { setData(e.target.value); setInicio(null); }} />
      </div>
      {medicoId && data && <p className="rotulo">Horários disponíveis</p>}
      <SeletorHorarios id="agendar-horarios" medicoId={medicoId} data={data} selecionado={inicio} onEscolher={setInicio} recarregarChave={versaoHorarios} />
      <Mensagem id="agendar-mensagem" mensagem={mensagem} />
      <BotaoEnviar id="agendar-confirmar" className="marca" disabled={!inicio || !pacienteId} enviando={enviando} textoEnviando="Agendando...">
        <Icone nome="check" />Agendar consulta
      </BotaoEnviar>
    </form>
  );
}
