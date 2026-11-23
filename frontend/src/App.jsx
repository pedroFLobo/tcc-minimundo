import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RotaProtegida } from './components/RotaProtegida';
import { CadastroPage } from './pages/CadastroPage';
import { LoginPage } from './pages/LoginPage';
import { NaoEncontradoPage } from './pages/NaoEncontradoPage';
import { AgendaPage } from './pages/medico/AgendaPage';
import { BloqueiosPage } from './pages/medico/BloqueiosPage';
import { GradePage } from './pages/medico/GradePage';
import { AgendarPage as PacienteAgendarPage } from './pages/paciente/AgendarPage';
import { MinhasConsultasPage } from './pages/paciente/MinhasConsultasPage';
import { AgendarPage as RecepcaoAgendarPage } from './pages/recepcao/AgendarPage';
import { ConsultasPage } from './pages/recepcao/ConsultasPage';
import { EspecialidadesPage } from './pages/recepcao/EspecialidadesPage';
import { MedicosPage } from './pages/recepcao/MedicosPage';
import { PacientesPage } from './pages/recepcao/PacientesPage';
import { RelatorioPage } from './pages/recepcao/RelatorioPage';

const LINKS = {
  PACIENTE: [
    { para: '/paciente', rotulo: 'Minhas consultas', descricao: 'Acompanhe, confirme e gerencie seus atendimentos.', icone: 'lista', exato: true, id: 'menu-consultas' },
    { para: '/paciente/agendar', rotulo: 'Agendar consulta', descricao: 'Escolha a especialidade, o médico e o melhor horário.', icone: 'calendarioMais', id: 'menu-agendar' },
  ],
  MEDICO: [
    { para: '/medico', rotulo: 'Agenda', descricao: 'Seus atendimentos do dia e registro de presença.', icone: 'calendario', exato: true, id: 'menu-agenda' },
    { para: '/medico/grade', rotulo: 'Minha grade', descricao: 'Defina os dias e horários em que você atende.', icone: 'relogio', id: 'menu-grade' },
    { para: '/medico/bloqueios', rotulo: 'Bloqueios', descricao: 'Reserve períodos de férias, congressos e folgas.', icone: 'bloqueio', id: 'menu-bloqueios' },
  ],
  RECEPCAO: [
    { para: '/recepcao', rotulo: 'Consultas', descricao: 'Todas as consultas da clínica, com filtros e ações.', icone: 'lista', exato: true, id: 'menu-consultas' },
    { para: '/recepcao/agendar', rotulo: 'Agendar', descricao: 'Marque consultas em nome dos pacientes.', icone: 'calendarioMais', id: 'menu-agendar' },
    { para: '/recepcao/pacientes', rotulo: 'Pacientes', descricao: 'Cadastre pacientes e gerencie o acesso deles.', icone: 'usuarios', id: 'menu-pacientes' },
    { para: '/recepcao/medicos', rotulo: 'Médicos', descricao: 'Equipe médica, grades de atendimento e bloqueios.', icone: 'estetoscopio', id: 'menu-medicos' },
    { para: '/recepcao/especialidades', rotulo: 'Especialidades', descricao: 'Especialidades atendidas e preço base da consulta.', icone: 'etiqueta', id: 'menu-especialidades' },
    { para: '/recepcao/relatorio', rotulo: 'Relatório', descricao: 'Indicadores de consultas, faltas e faturamento.', icone: 'grafico', id: 'menu-relatorio' },
  ],
};

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />

      <Route element={<RotaProtegida perfil="PACIENTE" />}>
        <Route path="/paciente" element={<Layout links={LINKS.PACIENTE} />}>
          <Route index element={<MinhasConsultasPage />} />
          <Route path="agendar" element={<PacienteAgendarPage />} />
        </Route>
      </Route>

      <Route element={<RotaProtegida perfil="MEDICO" />}>
        <Route path="/medico" element={<Layout links={LINKS.MEDICO} />}>
          <Route index element={<AgendaPage />} />
          <Route path="grade" element={<GradePage />} />
          <Route path="bloqueios" element={<BloqueiosPage />} />
        </Route>
      </Route>

      <Route element={<RotaProtegida perfil="RECEPCAO" />}>
        <Route path="/recepcao" element={<Layout links={LINKS.RECEPCAO} />}>
          <Route index element={<ConsultasPage />} />
          <Route path="agendar" element={<RecepcaoAgendarPage />} />
          <Route path="pacientes" element={<PacientesPage />} />
          <Route path="medicos" element={<MedicosPage />} />
          <Route path="especialidades" element={<EspecialidadesPage />} />
          <Route path="relatorio" element={<RelatorioPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NaoEncontradoPage />} />
    </Routes>
  );
}
