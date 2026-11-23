// Regras puras de validação de cadastro (RN01–RN03, RN05–RN09).
const { parseData } = require('../utils/datas');

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

const IDADE_MAXIMA = 130;
const MAIORIDADE = 18;

function emailValido(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function senhaValida(senha) {
  return typeof senha === 'string' && senha.length >= 8 && /[A-Za-z]/.test(senha) && /\d/.test(senha);
}

function normalizarCpf(cpf) {
  return String(cpf || '').replace(/\D/g, '');
}

function cpfValido(cpf) {
  const digitos = normalizarCpf(cpf);
  if (digitos.length !== 11 || /^(\d)\1{10}$/.test(digitos)) return false;

  const calcularDigito = (base) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * (base.length + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const d1 = calcularDigito(digitos.slice(0, 9));
  const d2 = calcularDigito(digitos.slice(0, 10));
  return d1 === Number(digitos[9]) && d2 === Number(digitos[10]);
}

function crmValido(crm) {
  const m = /^(\d{4,6})\/([A-Z]{2})$/.exec(String(crm || ''));
  return Boolean(m) && UFS.includes(m[2]);
}

function calcularIdade(dataNascimento, referencia) {
  let idade = referencia.getFullYear() - dataNascimento.getFullYear();
  const aindaNaoFezAniversario =
    referencia.getMonth() < dataNascimento.getMonth() ||
    (referencia.getMonth() === dataNascimento.getMonth() && referencia.getDate() < dataNascimento.getDate());
  if (aindaNaoFezAniversario) idade--;
  return idade;
}

// Retorna a mensagem de erro, ou null se a data de nascimento for aceitável.
function validarDataNascimento(texto, hoje) {
  const data = parseData(texto);
  if (!data) return 'Data de nascimento inválida. Use o formato AAAA-MM-DD.';
  if (data > hoje) return 'Data de nascimento não pode ser futura.';
  if (calcularIdade(data, hoje) > IDADE_MAXIMA) return `Idade não pode ser superior a ${IDADE_MAXIMA} anos.`;
  return null;
}

function exigeResponsavel(dataNascimento, hoje) {
  return calcularIdade(dataNascimento, hoje) < MAIORIDADE;
}

function duracaoConsultaValida(minutos) {
  return Number.isInteger(minutos) && minutos >= 15 && minutos <= 60 && minutos % 15 === 0;
}

module.exports = {
  UFS,
  emailValido,
  senhaValida,
  normalizarCpf,
  cpfValido,
  crmValido,
  calcularIdade,
  validarDataNascimento,
  exigeResponsavel,
  duracaoConsultaValida,
};
