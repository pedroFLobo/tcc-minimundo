import { useState } from 'react';
import { medicosApi } from '../api';
import { useCarregar } from '../hooks/useCarregar';
import { useMensagem } from '../hooks/useMensagem';
import { formatarDataHora } from '../utils/formatadores';
import { BotaoEnviar } from './BotaoEnviar';
import { Campo } from './Campo';
import { Icone } from './Icone';
import { Mensagem } from './Mensagem';
import { LinhasEsqueleto, Vazio } from './Vazio';

const VAZIO = { dataInicio: '', dataFim: '', motivo: '' };

export function EditorBloqueios({ medicoId }) {
  const [form, setForm] = useState(VAZIO);
  const [enviando, setEnviando] = useState(false);
  const { mensagem, sucesso, erro, limpar } = useMensagem();
  const { dados: bloqueios, recarregar } = useCarregar(() => (medicoId ? medicosApi.bloqueios(medicoId) : []), [medicoId]);

  async function criar(evento) {
    evento.preventDefault();
    limpar();
    setEnviando(true);
    try {
      await medicosApi.criarBloqueio(medicoId, form);
      sucesso(`Agenda bloqueada de ${formatarDataHora(form.dataInicio)} a ${formatarDataHora(form.dataFim)}.`);
      setForm(VAZIO);
      recarregar();
    } catch (e) {
      erro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  async function remover(id) {
    limpar();
    try {
      await medicosApi.removerBloqueio(medicoId, id);
      sucesso('Bloqueio removido. Os horários voltaram a ficar disponíveis.');
      recarregar();
    } catch (e) {
      erro(e.message);
    }
  }

  if (!medicoId) return null;
  const atualizar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });
  return (
    <>
      <form id="form-bloqueio" className="linha" onSubmit={criar} noValidate>
        <Campo id="bloqueio-inicio" rotulo="De" type="date" value={form.dataInicio} onChange={atualizar('dataInicio')} />
        <Campo id="bloqueio-fim" rotulo="Até" type="date" value={form.dataFim} onChange={atualizar('dataFim')} />
        <Campo id="bloqueio-motivo" rotulo="Motivo" placeholder="Férias, congresso..." value={form.motivo} onChange={atualizar('motivo')} />
        <div className="campo"><BotaoEnviar id="bloqueio-criar" enviando={enviando} textoEnviando="Bloqueando...">Bloquear período</BotaoEnviar></div>
      </form>
      <Mensagem id="bloqueio-mensagem" mensagem={mensagem} />
      <div className="tabela-container">
        <table id="tabela-bloqueios" className="responsiva">
          <thead><tr><th scope="col">De</th><th scope="col">Até</th><th scope="col">Motivo</th><th scope="col"><span className="sr-only">Ações</span></th></tr></thead>
          <tbody>
            {!bloqueios && <LinhasEsqueleto colunas={4} linhas={2} />}
            {bloqueios?.length === 0 && <tr><td colSpan="4" className="vazio"><Vazio icone="bloqueio">Nenhum bloqueio cadastrado.</Vazio></td></tr>}
            {bloqueios?.map((b) => (
              <tr key={b.id} data-bloqueio-id={b.id}>
                <td data-label="De">{formatarDataHora(b.dataInicio)}</td>
                <td data-label="Até">{formatarDataHora(b.dataFim)}</td>
                <td data-label="Motivo">{b.motivo || '—'}</td>
                <td className="acoes"><button type="button" className="pequeno perigo" onClick={() => remover(b.id)}><Icone nome="lixeira" tamanho={15} />Remover</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
