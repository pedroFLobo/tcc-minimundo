import { Icone } from './Icone';

export function Mensagem({ mensagem, id }) {
  if (!mensagem) return null;
  return (
    <div id={id} className={`mensagem ${mensagem.tipo}`} role={mensagem.tipo === 'erro' ? 'alert' : 'status'}>
      <Icone nome={mensagem.tipo === 'erro' ? 'alerta' : 'checkCirculo'} />
      <span>{mensagem.texto}</span>
    </div>
  );
}
