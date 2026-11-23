import { useState } from 'react';
import { adminApi, pacientesApi } from '../../api';
import { Campo } from '../../components/Campo';
import { FormularioPaciente } from '../../components/FormularioPaciente';
import { Mensagem } from '../../components/Mensagem';
import { LinhasEsqueleto, Vazio } from '../../components/Vazio';
import { useCarregar } from '../../hooks/useCarregar';
import { useMensagem } from '../../hooks/useMensagem';
import { formatarDataHora } from '../../utils/formatadores';

export function PacientesPage() {
  const [busca, setBusca] = useState('');
  const { mensagem, sucesso, erro, limpar } = useMensagem();
  const { dados: pacientes, recarregar } = useCarregar(() => pacientesApi.listar(busca.trim()), [busca]);

  async function cadastrar(dados) {
    limpar();
    try {
      const paciente = await pacientesApi.criar(dados);
      sucesso(`${paciente.nome} já pode agendar consultas.`, 'Paciente cadastrado');
      recarregar();
      return true;
    } catch (e) {
      erro(e.message);
      return false;
    }
  }

  async function alternarAtivo(paciente) {
    limpar();
    try {
      await adminApi.definirAtivo(paciente.usuarioId, !paciente.ativo);
      sucesso(`${paciente.nome} foi ${paciente.ativo ? 'desativado' : 'reativado'}.`);
      recarregar();
    } catch (e) {
      erro(e.message);
    }
  }

  return (
    <>
      <div className="cartao">
        <h2>Novo paciente</h2>
        <p className="descricao">Campos com * são obrigatórios. O paciente usará o e-mail e a senha para entrar.</p>
        <FormularioPaciente prefixo="paciente" textoBotao="Cadastrar paciente" onEnviar={cadastrar}>
          <Mensagem id="paciente-mensagem" mensagem={mensagem} />
        </FormularioPaciente>
      </div>
      <div className="cartao">
        <h2>Pacientes cadastrados</h2>
        <p className="descricao">{pacientes ? `${pacientes.length} paciente(s).` : 'Carregando...'}</p>
        <Campo id="paciente-busca" rotulo="Buscar" type="search" placeholder="Nome, e-mail ou CPF" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <div className="tabela-container">
          <table id="tabela-pacientes" className="responsiva">
            <thead><tr><th scope="col">Nome</th><th scope="col">E-mail</th><th scope="col">CPF</th><th scope="col">Nascimento</th><th scope="col">Situação</th><th scope="col"><span className="sr-only">Ações</span></th></tr></thead>
            <tbody>
              {!pacientes && <LinhasEsqueleto colunas={6} />}
              {pacientes?.length === 0 && <tr><td colSpan="6" className="vazio"><Vazio icone="usuarios">Nenhum paciente encontrado.</Vazio></td></tr>}
              {pacientes?.map((p) => (
                <tr key={p.id} data-usuario-id={p.usuarioId}>
                  <td data-label="Nome"><strong>{p.nome}</strong></td>
                  <td data-label="E-mail">{p.email}</td>
                  <td data-label="CPF">{p.cpf}</td>
                  <td data-label="Nascimento">{formatarDataHora(p.dataNascimento)}</td>
                  <td data-label="Situação"><span className={`status ${p.ativo ? 'status-CONFIRMADA' : 'status-CANCELADA'}`}>{p.ativo ? 'Ativo' : 'Inativo'}</span></td>
                  <td className="acoes"><button type="button" className="pequeno secundario" onClick={() => alternarAtivo(p)}>{p.ativo ? 'Desativar' : 'Ativar'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
