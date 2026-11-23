import { request } from './client';

export const authApi = {
  login: (email, senha) => request('/auth/login', { metodo: 'POST', corpo: { email, senha } }),
  registrar: (dados) => request('/auth/registro', { metodo: 'POST', corpo: dados }),
  me: () => request('/auth/me'),
};

export const especialidadesApi = {
  listar: () => request('/especialidades'),
  criar: (dados) => request('/especialidades', { metodo: 'POST', corpo: dados }),
};

export const medicosApi = {
  listar: (especialidadeId) => request('/medicos', { params: { especialidadeId } }),
  criar: (dados) => request('/medicos', { metodo: 'POST', corpo: dados }),
  horarios: (medicoId, data) => request(`/medicos/${medicoId}/horarios`, { params: { data } }),
  grade: (medicoId) => request(`/medicos/${medicoId}/disponibilidades`),
  salvarGrade: (medicoId, blocos) => request(`/medicos/${medicoId}/disponibilidades`, { metodo: 'PUT', corpo: { blocos } }),
  bloqueios: (medicoId) => request(`/medicos/${medicoId}/bloqueios`),
  criarBloqueio: (medicoId, dados) => request(`/medicos/${medicoId}/bloqueios`, { metodo: 'POST', corpo: dados }),
  removerBloqueio: (medicoId, bloqueioId) => request(`/medicos/${medicoId}/bloqueios/${bloqueioId}`, { metodo: 'DELETE' }),
};

export const pacientesApi = {
  listar: (busca) => request('/pacientes', { params: { busca } }),
  criar: (dados) => request('/pacientes', { metodo: 'POST', corpo: dados }),
};

export const consultasApi = {
  listar: (filtros) => request('/consultas', { params: filtros }),
  agendar: (dados) => request('/consultas', { metodo: 'POST', corpo: dados }),
  confirmar: (id) => request(`/consultas/${id}/confirmar`, { metodo: 'POST' }),
  cancelar: (id, motivo) => request(`/consultas/${id}/cancelar`, { metodo: 'POST', corpo: { motivo } }),
  remarcar: (id, inicio) => request(`/consultas/${id}/remarcar`, { metodo: 'POST', corpo: { inicio } }),
  realizar: (id, observacoes) => request(`/consultas/${id}/realizar`, { metodo: 'POST', corpo: { observacoes } }),
  falta: (id) => request(`/consultas/${id}/falta`, { metodo: 'POST' }),
};

export const adminApi = {
  definirAtivo: (usuarioId, ativo) => request(`/admin/usuarios/${usuarioId}/ativo`, { metodo: 'PATCH', corpo: { ativo } }),
  resumo: (dataInicio, dataFim) => request('/admin/relatorios/resumo', { params: { dataInicio, dataFim } }),
};
