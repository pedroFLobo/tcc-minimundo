export function formatarMoeda(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// 'AAAA-MM-DD' ou 'AAAA-MM-DD HH:mm' → 'DD/MM/AAAA[ HH:mm]'
export function formatarDataHora(texto) {
  if (!texto) return '';
  const [data, hora] = texto.split(' ');
  const [ano, mes, dia] = data.split('-');
  return hora ? `${dia}/${mes}/${ano} ${hora}` : `${dia}/${mes}/${ano}`;
}

export function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const NOMES_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const STATUS_CONSULTA = ['AGENDADA', 'CONFIRMADA', 'REALIZADA', 'FALTA', 'CANCELADA'];

export const estaAtiva = (consulta) => ['AGENDADA', 'CONFIRMADA'].includes(consulta.status);
