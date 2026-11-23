import { useState } from 'react';
import { adminApi, especialidadesApi, medicosApi } from '../../api';
import { BotaoEnviar } from '../../components/BotaoEnviar';
import { Campo } from '../../components/Campo';
import { EditorBloqueios } from '../../components/EditorBloqueios';
import { EditorGrade } from '../../components/EditorGrade';
import { Mensagem } from '../../components/Mensagem';
import { LinhasEsqueleto } from '../../components/Vazio';
import { useCarregar } from '../../hooks/useCarregar';
import { useMensagem } from '../../hooks/useMensagem';

const VAZIO = { nome: '', email: '', senha: '', crm: '', especialidadeId: '', duracaoConsultaMin: '30' };

export function MedicosPage() {
  const [form, setForm] = useState(VAZIO);
  const [enviando, setEnviando] = useState(false);
  const [gestaoId, setGestaoId] = useState('');
  const { mensagem, sucesso, erro, limpar } = useMensagem();
  const { dados: medicos, recarregar } = useCarregar(() => medicosApi.listar());
  const { dados: especialidades } = useCarregar(() => especialidadesApi.listar());

  async function cadastrar(evento) {
    evento.preventDefault();
    limpar();
    setEnviando(true);
    try {
      const medico = await medicosApi.criar({ ...form, especialidadeId: Number(form.especialidadeId), duracaoConsultaMin: Number(form.duracaoConsultaMin) });
      setForm(VAZIO);
      sucesso(`${medico.nome} foi adicionado à equipe. Defina a grade de atendimento abaixo.`, 'Médico cadastrado');
      recarregar();
    } catch (e) {
      erro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  async function alternarAtivo(medico) {
    limpar();
    try {
      await adminApi.definirAtivo(medico.usuarioId, !medico.ativo);
      sucesso(`${medico.nome} foi ${medico.ativo ? 'desativado' : 'reativado'}.`);
      recarregar();
    } catch (e) {
      erro(e.message);
    }
  }

  const atualizar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  return (
    <>
      <form className="cartao" id="form-medico" onSubmit={cadastrar} noValidate>
        <h2>Novo médico</h2>
        <p className="descricao">Campos com * são obrigatórios.</p>
        <div className="grade-form">
          <Campo id="medico-nome" rotulo="Nome" obrigatorio value={form.nome} onChange={atualizar('nome')} />
          <Campo id="medico-email" rotulo="E-mail" obrigatorio type="email" value={form.email} onChange={atualizar('email')} />
          <Campo id="medico-senha" rotulo="Senha inicial" obrigatorio type="password" autoComplete="new-password" ajuda="Mínimo de 8 caracteres, com letras e números." value={form.senha} onChange={atualizar('senha')} />
          <Campo id="medico-crm" rotulo="CRM" obrigatorio placeholder="123456/SP" value={form.crm} onChange={atualizar('crm')} />
          <Campo id="medico-especialidade" rotulo="Especialidade *">
            <select id="medico-especialidade" value={form.especialidadeId} onChange={atualizar('especialidadeId')}>
              <option value="">Selecione</option>
              {especialidades?.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </Campo>
          <Campo id="medico-duracao" rotulo="Duração da consulta">
            <select id="medico-duracao" value={form.duracaoConsultaMin} onChange={atualizar('duracaoConsultaMin')}>
              {[15, 30, 45, 60].map((m) => <option key={m} value={m}>{m} minutos</option>)}
            </select>
          </Campo>
        </div>
        <Mensagem id="medico-mensagem" mensagem={mensagem} />
        <BotaoEnviar id="medico-cadastrar" className="marca" enviando={enviando} textoEnviando="Cadastrando...">Cadastrar médico</BotaoEnviar>
      </form>

      <div className="cartao">
        <h2>Equipe médica</h2>
        <p className="descricao">{medicos ? `${medicos.length} médico(s).` : 'Carregando...'}</p>
        <div className="tabela-container">
          <table id="tabela-medicos" className="responsiva">
            <thead><tr><th scope="col">Nome</th><th scope="col">CRM</th><th scope="col">Especialidade</th><th scope="col">Duração</th><th scope="col">Situação</th><th scope="col"><span className="sr-only">Ações</span></th></tr></thead>
            <tbody>
              {!medicos && <LinhasEsqueleto colunas={6} />}
              {medicos?.map((m) => (
                <tr key={m.id} data-usuario-id={m.usuarioId}>
                  <td data-label="Nome"><strong>{m.nome}</strong></td>
                  <td data-label="CRM">{m.crm}</td>
                  <td data-label="Especialidade">{m.especialidadeNome}</td>
                  <td data-label="Duração">{m.duracaoConsultaMin} min</td>
                  <td data-label="Situação"><span className={`status ${m.ativo ? 'status-CONFIRMADA' : 'status-CANCELADA'}`}>{m.ativo ? 'Ativo' : 'Inativo'}</span></td>
                  <td className="acoes">
                    <button type="button" className="pequeno secundario" onClick={() => setGestaoId(String(m.id))}>Agenda</button>
                    <button type="button" className="pequeno secundario" onClick={() => alternarAtivo(m)}>{m.ativo ? 'Desativar' : 'Ativar'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="cartao">
        <h2>Grade e bloqueios</h2>
        <Campo id="gestao-medico" rotulo="Médico">
          <select id="gestao-medico" value={gestaoId} onChange={(e) => setGestaoId(e.target.value)}>
            <option value="">Selecione um médico para editar a agenda</option>
            {medicos?.map((m) => <option key={m.id} value={m.id}>{m.nome} — {m.especialidadeNome}</option>)}
          </select>
        </Campo>
        {gestaoId && (
          <>
            <h3>Grade semanal</h3>
            <EditorGrade medicoId={Number(gestaoId)} />
            <h3>Bloqueios</h3>
            <EditorBloqueios medicoId={Number(gestaoId)} />
          </>
        )}
      </div>
    </>
  );
}
