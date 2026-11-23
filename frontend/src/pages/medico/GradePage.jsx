import { EditorGrade } from '../../components/EditorGrade';
import { useAuth } from '../../contexts/AuthContext';

export function GradePage() {
  const { usuario } = useAuth();
  return (
    <div className="cartao">
      <h2>Grade semanal de atendimento</h2>
      <EditorGrade medicoId={usuario.medicoId} />
    </div>
  );
}
