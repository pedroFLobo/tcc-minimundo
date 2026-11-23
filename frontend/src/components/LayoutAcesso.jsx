import { Marca } from './Layout';

const DESTAQUES = [
  'Horários reais da agenda de cada médico, sem ligação.',
  'Confirme, remarque ou cancele quando precisar.',
  'Retorno gratuito em até 30 dias após a consulta.',
];

// Tela dividida usada no login e no cadastro: apresentação à esquerda, formulário à direita.
export function LayoutAcesso({ larga, children }) {
  return (
    <div className="acesso">
      <section className="acesso-marca">
        <Marca />
        <div className="acesso-texto">
          <h1>Cuidar da saúde começa <em>pela agenda.</em></h1>
          <ol>
            {DESTAQUES.map((texto) => <li key={texto}>{texto}</li>)}
          </ol>
        </div>
        <p className="rodape">Clínica+ · sistema acadêmico (TCC) · {new Date().getFullYear()}</p>
      </section>
      <section className="acesso-form">
        <div className={`caixa ${larga ? 'larga' : ''}`}>{children}</div>
      </section>
    </div>
  );
}
