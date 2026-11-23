// Datas são tratadas como horário local da clínica, no formato 'AAAA-MM-DD HH:mm'.
const RE_DATA = /^(\d{4})-(\d{2})-(\d{2})$/;
const RE_DATA_HORA = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/;
const RE_HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;

function pad(n) {
  return String(n).padStart(2, '0');
}

function dataValida(ano, mes, dia) {
  const d = new Date(ano, mes - 1, dia);
  return d.getFullYear() === ano && d.getMonth() === mes - 1 && d.getDate() === dia;
}

function parseData(texto) {
  const m = RE_DATA.exec(String(texto || ''));
  if (!m) return null;
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (!dataValida(ano, mes, dia)) return null;
  return new Date(ano, mes - 1, dia);
}

function parseDataHora(texto) {
  const m = RE_DATA_HORA.exec(String(texto || ''));
  if (!m) return null;
  const [ano, mes, dia, h, min] = m.slice(1).map(Number);
  if (!dataValida(ano, mes, dia) || h > 23 || min > 59) return null;
  return new Date(ano, mes - 1, dia, h, min);
}

function formatarData(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatarDataHora(d) {
  return `${formatarData(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function horaParaMinutos(hora) {
  const m = RE_HORA.exec(String(hora || ''));
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function minutosParaHora(minutos) {
  return `${pad(Math.floor(minutos / 60))}:${pad(minutos % 60)}`;
}

function somarMinutos(d, minutos) {
  return new Date(d.getTime() + minutos * 60000);
}

function somarDias(d, dias) {
  const r = new Date(d);
  r.setDate(r.getDate() + dias);
  return r;
}

function minutosEntre(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 60000);
}

function inicioDoDia(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

module.exports = {
  parseData,
  parseDataHora,
  formatarData,
  formatarDataHora,
  horaParaMinutos,
  minutosParaHora,
  somarMinutos,
  somarDias,
  minutosEntre,
  inicioDoDia,
};
