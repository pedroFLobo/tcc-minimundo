import { estaAtiva, formatarDataHora, formatarMoeda } from '../utils/formatadores';
import { StatusBadge } from './StatusBadge';
import { LinhasEsqueleto, Vazio } from './Vazio';

const COLUNAS = {
  inicio: { titulo: 'Data e hora', valor: (c) => <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{formatarDataHora(c.inicio)}</strong> },
  paciente: { titulo: 'Paciente', valor: (c) => c.pacienteNome },
  medico: { titulo: 'Médico', valor: (c) => <>{c.medicoNome}<span className="secundaria">{c.especialidadeNome}</span></> },
  especialidade: { titulo: 'Especialidade', valor: (c) => c.especialidadeNome },
  valor: { titulo: 'Valor', valor: (c) => (c.valorCentavos === 0 ? 'Retorno gratuito' : formatarMoeda(c.valorCentavos)) },
  status: { titulo: 'Status', valor: (c) => <StatusBadge status={c.status} /> },
  observacoes: { titulo: 'Observações', valor: (c) => c.observacoes || c.motivoCancelamento || '—' },
};

// colunas: chaves a exibir; acoes(consulta) devolve os botões da linha (só para consultas ativas).
export function TabelaConsultas({ id, consultas, colunas, acoes, textoVazio = 'Nenhuma consulta encontrada.' }) {
  const totalColunas = colunas.length + (acoes ? 1 : 0);
  return (
    <div className="tabela-container">
      <table id={id} className="responsiva">
        <thead>
          <tr>
            {colunas.map((c) => <th key={c} scope="col">{COLUNAS[c].titulo}</th>)}
            {acoes && <th scope="col"><span className="sr-only">Ações</span></th>}
          </tr>
        </thead>
        <tbody>
          {!consultas && <LinhasEsqueleto colunas={totalColunas} />}
          {consultas?.length === 0 && <tr><td colSpan={totalColunas} className="vazio"><Vazio>{textoVazio}</Vazio></td></tr>}
          {consultas?.map((consulta, i) => (
            <tr key={consulta.id} data-consulta-id={consulta.id} style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
              {colunas.map((c) => <td key={c} data-label={COLUNAS[c].titulo}>{COLUNAS[c].valor(consulta)}</td>)}
              {acoes && <td className="acoes">{estaAtiva(consulta) && acoes(consulta)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
