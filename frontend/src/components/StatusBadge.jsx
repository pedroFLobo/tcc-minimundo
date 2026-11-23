const ROTULOS = { AGENDADA: 'Agendada', CONFIRMADA: 'Confirmada', REALIZADA: 'Realizada', FALTA: 'Falta', CANCELADA: 'Cancelada' };

export function StatusBadge({ status }) {
  return <span className={`status status-${status}`} data-status={status}>{ROTULOS[status] ?? status}</span>;
}
