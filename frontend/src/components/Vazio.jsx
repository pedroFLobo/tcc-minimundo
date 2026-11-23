import { Icone } from './Icone';

export function Vazio({ icone = 'calendario', children }) {
  return (
    <div className="vazio">
      <Icone nome={icone} tamanho={36} />
      {children}
    </div>
  );
}

// Linhas de carregamento para tabelas.
export function LinhasEsqueleto({ colunas, linhas = 3 }) {
  return Array.from({ length: linhas }, (_, i) => (
    <tr key={i} aria-hidden="true">
      {Array.from({ length: colunas }, (__, j) => <td key={j}><div className="esqueleto" style={{ width: `${60 + ((i + j) % 3) * 15}%` }} /></td>)}
    </tr>
  ));
}
