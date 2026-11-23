const { criarUsuariosRepository } = require('../repositories/usuariosRepository');
const { criarPacientesRepository } = require('../repositories/pacientesRepository');
const { criarEspecialidadesRepository } = require('../repositories/especialidadesRepository');
const { criarMedicosRepository } = require('../repositories/medicosRepository');
const { criarConsultasRepository } = require('../repositories/consultasRepository');
const { criarAuthService } = require('./authService');
const { criarCadastroService } = require('./cadastroService');
const { criarAgendaService } = require('./agendaService');
const { criarConsultasService } = require('./consultasService');
const { criarRelatoriosService } = require('./relatoriosService');

// Monta repositórios e serviços sobre uma conexão de banco.
function criarServicos(db) {
  const repos = {
    usuarios: criarUsuariosRepository(db),
    pacientes: criarPacientesRepository(db),
    especialidades: criarEspecialidadesRepository(db),
    medicos: criarMedicosRepository(db),
    consultas: criarConsultasRepository(db),
  };
  const authService = criarAuthService(repos);
  const cadastroService = criarCadastroService({ db, ...repos, authService });
  const agendaService = criarAgendaService(repos);
  const consultasService = criarConsultasService({ db, ...repos, agendaService });
  const relatoriosService = criarRelatoriosService(repos);

  return { repos, authService, cadastroService, agendaService, consultasService, relatoriosService };
}

module.exports = { criarServicos };
