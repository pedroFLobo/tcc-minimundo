import { useState } from 'react';
import { especialidadesApi } from '../../api';
import { BotaoEnviar } from '../../components/BotaoEnviar';
import { Campo } from '../../components/Campo';
import { Mensagem } from '../../components/Mensagem';
import { LinhasEsqueleto } from '../../components/Vazio';
import { useCarregar } from '../../hooks/useCarregar';
import { useMensagem } from '../../hooks/useMensagem';
import { formatarMoeda } from '../../utils/formatadores';

export function EspecialidadesPage() {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { mensagem, sucesso, erro, limpar } = useMensagem();
  const { dados: especialidades, recarregar } = useCarregar(() => especialidadesApi.listar());

  async function cadastrar(evento) {
    evento.preventDefault();
    limpar();
    setEnviando(true);
    try {
      const nova = await especialidadesApi.criar({ nome, precoCentavos: Math.round(Number(preco) * 100) });
      setNome('');
      setPreco('');
      sucesso(`${nova.nome} disponível por ${formatarMoeda(nova.precoCentavos)}.`, 'Especialidade cadastrada');
      recarregar();
    } catch (e) {
      erro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="cartao">
      <h2>Especialidades</h2>
      <p className="descricao">O preço base vale para todos os médicos da especialidade. Pacientes com 60+ têm 10% de desconto.</p>
      <form id="form-especialidade" className="linha" onSubmit={cadastrar} noValidate>
        <Campo id="especialidade-nome" rotulo="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
        <Campo id="especialidade-preco" rotulo="Preço (R$)" type="number" inputMode="decimal" min="0" step="0.01" placeholder="150,00" value={preco} onChange={(e) => setPreco(e.target.value)} />
        <div className="campo"><BotaoEnviar id="especialidade-cadastrar" className="marca" enviando={enviando}>Cadastrar</BotaoEnviar></div>
      </form>
      <Mensagem id="especialidade-mensagem" mensagem={mensagem} />
      <div className="tabela-container">
        <table id="tabela-especialidades" className="responsiva">
          <thead><tr><th scope="col">Nome</th><th scope="col">Preço base</th></tr></thead>
          <tbody>
            {!especialidades && <LinhasEsqueleto colunas={2} />}
            {especialidades?.map((e) => (
              <tr key={e.id}><td data-label="Nome"><strong>{e.nome}</strong></td><td data-label="Preço base">{formatarMoeda(e.precoCentavos)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
