// Popula o banco com dados de exemplo. Uso: npm run seed (acrescenta) | npm run reset-db (apaga e recria).
const clock = require('../utils/clock');
const { formatarData, formatarDataHora, somarDias } = require('../utils/datas');
const { abrirBanco, limparBanco } = require('./connection');
const { criarServicos } = require('../services');

const SENHA_PADRAO = 'Senha123';

function semear(db) {
  const { cadastroService, agendaService, authService, repos } = criarServicos(db);
  const recepcaoAtor = { perfil: 'RECEPCAO' };

  // Recepção
  repos.usuarios.inserir({
    nome: 'Rita Recepção',
    email: 'recepcao@clinica.com',
    senhaHash: authService.gerarHash(SENHA_PADRAO),
    perfil: 'RECEPCAO',
    criadoEm: formatarDataHora(clock.agora()),
  });

  // Especialidades
  const clinica = cadastroService.criarEspecialidade({ nome: 'Clínica Geral', precoCentavos: 15000 });
  const cardio = cadastroService.criarEspecialidade({ nome: 'Cardiologia', precoCentavos: 30000 });
  const derma = cadastroService.criarEspecialidade({ nome: 'Dermatologia', precoCentavos: 25000 });
  const pediatria = cadastroService.criarEspecialidade({ nome: 'Pediatria', precoCentavos: 20000 });

  // Médicos e grades
  const medicos = [
    { nome: 'Dr. Carlos Almeida', email: 'carlos@clinica.com', crm: '123456/SP', especialidadeId: clinica.id, duracaoConsultaMin: 30 },
    { nome: 'Dra. Beatriz Souza', email: 'beatriz@clinica.com', crm: '654321/RJ', especialidadeId: cardio.id, duracaoConsultaMin: 45 },
    { nome: 'Dr. Eduardo Lima', email: 'eduardo@clinica.com', crm: '11223/MG', especialidadeId: derma.id, duracaoConsultaMin: 30 },
    { nome: 'Dra. Fernanda Rocha', email: 'fernanda@clinica.com', crm: '9876/PR', especialidadeId: pediatria.id, duracaoConsultaMin: 15 },
  ].map((m) => cadastroService.criarMedico({ ...m, senha: SENHA_PADRAO }));

  const diasUteis = [1, 2, 3, 4, 5];
  agendaService.salvarGrade(recepcaoAtor, medicos[0].id, diasUteis.flatMap((d) => [
    { diaSemana: d, horaInicio: '08:00', horaFim: '12:00' },
    { diaSemana: d, horaInicio: '14:00', horaFim: '18:00' },
  ]));
  agendaService.salvarGrade(recepcaoAtor, medicos[1].id, [1, 3, 5].map((d) => ({ diaSemana: d, horaInicio: '09:00', horaFim: '15:00' })));
  agendaService.salvarGrade(recepcaoAtor, medicos[2].id, [2, 4].map((d) => ({ diaSemana: d, horaInicio: '13:00', horaFim: '19:00' })));
  agendaService.salvarGrade(recepcaoAtor, medicos[3].id, [
    ...diasUteis.map((d) => ({ diaSemana: d, horaInicio: '07:00', horaFim: '11:00' })),
    { diaSemana: 6, horaInicio: '08:00', horaFim: '12:00' },
  ]);

  // Pacientes
  const pacientes = [
    { nome: 'Ana Pereira', email: 'ana@email.com', cpf: '529.982.247-25', dataNascimento: '1990-05-14', telefone: '(11) 98888-1111' },
    { nome: 'João Santos', email: 'joao@email.com', cpf: '111.444.777-35', dataNascimento: '1958-02-03', telefone: '(21) 97777-2222' },
    { nome: 'Lucas Oliveira', email: 'lucas@email.com', cpf: '390.533.447-05', dataNascimento: formatarData(somarDias(clock.agora(), -365 * 10)), telefone: '(31) 96666-3333', responsavelNome: 'Marta Oliveira' },
  ].map((p) => cadastroService.registrarPaciente({ ...p, senha: SENHA_PADRAO }));

  return { medicos, pacientes };
}

if (require.main === module) {
  const db = abrirBanco();
  const jaPopulado = db.prepare('SELECT COUNT(*) AS n FROM usuarios').get().n > 0;
  if (process.argv.includes('--reset')) {
    limparBanco(db);
  } else if (jaPopulado) {
    console.log('Banco já possui dados. Use "npm run reset-db" para recriar.');
    process.exit(0);
  }
  semear(db);
  console.log(`Banco populado. Senha de todos os usuários: ${SENHA_PADRAO}`);
  console.log('Recepção: recepcao@clinica.com | Médico: carlos@clinica.com | Paciente: ana@email.com');
}

module.exports = { semear, SENHA_PADRAO };
