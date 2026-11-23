const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const CHAVE_TOKEN = 'clinica.token';

export class ApiError extends Error {
  constructor(status, codigo, mensagem) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
  }
}

export const tokenStorage = {
  obter: () => localStorage.getItem(CHAVE_TOKEN),
  salvar: (token) => localStorage.setItem(CHAVE_TOKEN, token),
  remover: () => localStorage.removeItem(CHAVE_TOKEN),
};

let aoExpirarSessao = () => {};

// Permite ao AuthContext reagir a um 401 (token expirado ou inválido).
export function registrarExpiracaoSessao(callback) {
  aoExpirarSessao = callback;
}

export async function request(caminho, { metodo = 'GET', corpo, params } = {}) {
  const url = new URL(BASE_URL + caminho);
  if (params) {
    Object.entries(params)
      .filter(([, valor]) => valor !== undefined && valor !== null && valor !== '')
      .forEach(([chave, valor]) => url.searchParams.set(chave, valor));
  }

  const headers = {};
  const token = tokenStorage.obter();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (corpo !== undefined) headers['Content-Type'] = 'application/json';

  let resposta;
  try {
    resposta = await fetch(url, { method: metodo, headers, body: corpo === undefined ? undefined : JSON.stringify(corpo) });
  } catch {
    throw new ApiError(0, 'REDE', 'Não foi possível conectar ao servidor.');
  }

  if (resposta.status === 204) return null;
  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    if (resposta.status === 401 && token) aoExpirarSessao();
    throw new ApiError(resposta.status, dados?.erro?.codigo ?? 'DESCONHECIDO', dados?.erro?.mensagem ?? 'Erro inesperado.');
  }
  return dados;
}
