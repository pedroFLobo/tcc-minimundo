import { useEffect, useState } from 'react';
import { medicosApi } from '../api';
import { useMensagem } from '../hooks/useMensagem';
import { NOMES_DIAS } from '../utils/formatadores';
import { Icone } from './Icone';
import { Mensagem } from './Mensagem';
import { Vazio } from './Vazio';

let proximaChave = 1;
const comChave = (bloco) => ({ ...bloco, chave: proximaChave++ });

// Edita a grade semanal de um médico (usado pelo médico e pela recepção).
export function EditorGrade({ medicoId }) {
  const [blocos, setBlocos] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const { mensagem, sucesso, erro, limpar } = useMensagem();

  useEffect(() => {
    limpar();
    setBlocos(null);
    if (medicoId) medicosApi.grade(medicoId).then((lista) => setBlocos(lista.map(comChave))).catch((e) => erro(e.message));
  }, [medicoId, limpar, erro]);

  const alterar = (chave, campo, valor) => setBlocos((atuais) => atuais.map((b) => (b.chave === chave ? { ...b, [campo]: valor } : b)));

  async function salvar() {
    limpar();
    setSalvando(true);
    try {
      const salvos = await medicosApi.salvarGrade(
        medicoId,
        blocos.map(({ diaSemana, horaInicio, horaFim }) => ({ diaSemana: Number(diaSemana), horaInicio, horaFim })),
      );
      setBlocos(salvos.map(comChave));
      sucesso(`Grade salva com ${salvos.length} bloco(s) de atendimento.`);
    } catch (e) {
      erro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  if (!medicoId) return null;
  return (
    <>
      <p className="descricao">Horários entre 07:00 e 20:00, em múltiplos de 15 minutos. Salvar substitui a grade inteira.</p>
      <div className="tabela-container">
        <table id="tabela-grade" className="responsiva">
          <thead><tr><th scope="col">Dia</th><th scope="col">Início</th><th scope="col">Fim</th><th scope="col"><span className="sr-only">Ações</span></th></tr></thead>
          <tbody>
            {blocos?.length === 0 && <tr><td colSpan="4" className="vazio"><Vazio icone="relogio">Nenhum horário de atendimento cadastrado.</Vazio></td></tr>}
            {blocos?.map((b) => (
              <tr key={b.chave}>
                <td data-label="Dia">
                  <select className="grade-dia" aria-label="Dia da semana" value={b.diaSemana} onChange={(e) => alterar(b.chave, 'diaSemana', e.target.value)}>
                    {NOMES_DIAS.map((nome, i) => <option key={nome} value={i}>{nome}</option>)}
                  </select>
                </td>
                <td data-label="Início"><input type="time" className="grade-inicio" aria-label="Início" step="900" value={b.horaInicio} onChange={(e) => alterar(b.chave, 'horaInicio', e.target.value)} /></td>
                <td data-label="Fim"><input type="time" className="grade-fim" aria-label="Fim" step="900" value={b.horaFim} onChange={(e) => alterar(b.chave, 'horaFim', e.target.value)} /></td>
                <td className="acoes">
                  <button type="button" className="pequeno perigo grade-remover" aria-label="Remover bloco" onClick={() => setBlocos((atuais) => atuais.filter((x) => x.chave !== b.chave))}>
                    <Icone nome="lixeira" tamanho={15} />Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Mensagem id="grade-mensagem" mensagem={mensagem} />
      <div className="acoes-form" style={{ marginTop: 16 }}>
        <button type="button" className="secundario" id="grade-adicionar" onClick={() => setBlocos((atuais) => [...(atuais ?? []), comChave({ diaSemana: 1, horaInicio: '08:00', horaFim: '12:00' })])}>
          <Icone nome="mais" />Adicionar bloco
        </button>
        <button type="button" id="grade-salvar" disabled={salvando} onClick={salvar}>
          {salvando ? <><span className="girando" aria-hidden="true" />Salvando...</> : 'Salvar grade'}
        </button>
      </div>
    </>
  );
}
