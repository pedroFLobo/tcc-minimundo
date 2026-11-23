import { Link } from 'react-router-dom';

export function NaoEncontradoPage() {
  return (
    <main className="nao-encontrado">
      <div>
        <strong>404</strong>
        <p>Esta página não existe ou foi movida.</p>
        <Link to="/">Voltar ao início</Link>
      </div>
    </main>
  );
}
