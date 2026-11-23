// Relógio injetável: permite fixar "agora" em testes (CLINICA_AGORA='2026-10-20 09:00').
require('../config'); // garante que o .env foi carregado antes de ler CLINICA_AGORA
const { parseDataHora } = require('./datas');

let agoraFixo = null;

function carregarDoAmbiente() {
  const valor = process.env.CLINICA_AGORA;
  agoraFixo = valor ? parseDataHora(valor) : null;
  if (valor && !agoraFixo) {
    throw new Error(`CLINICA_AGORA inválido: "${valor}". Use o formato AAAA-MM-DD HH:mm.`);
  }
}

function agora() {
  return agoraFixo ? new Date(agoraFixo) : new Date();
}

function definirAgora(data) {
  agoraFixo = data ? new Date(data) : null;
}

carregarDoAmbiente();

module.exports = { agora, definirAgora, carregarDoAmbiente };
