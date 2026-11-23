import { EditorBloqueios } from '../../components/EditorBloqueios';
import { useAuth } from '../../contexts/AuthContext';

export function BloqueiosPage() {
  const { usuario } = useAuth();
  return (
    <div className="cartao">
      <h2>Períodos bloqueados</h2>
      <p className="descricao">Não é possível bloquear um período que já tenha consultas agendadas.</p>
      <EditorBloqueios medicoId={usuario.medicoId} />
    </div>
  );
}
