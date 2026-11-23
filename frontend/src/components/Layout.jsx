import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Icone } from './Icone';

const NOMES_PERFIL = { PACIENTE: 'Paciente', MEDICO: 'Médico', RECEPCAO: 'Recepção' };

function iniciais(nome = '') {
  return nome.replace(/^(Dr\.?|Dra\.?)\s+/i, '').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

const hoje = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date());

export function Marca() {
  return (
    <span className="logotipo" aria-label="Clínica+">
      Clínica<em>+</em>
    </span>
  );
}

export function Layout({ links }) {
  const { usuario, sair } = useAuth();
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
  const atual = [...links].sort((a, b) => b.para.length - a.para.length).find((l) => location.pathname.startsWith(l.para)) ?? links[0];
  const posicao = String(links.indexOf(atual) + 1).padStart(2, '0');

  useEffect(() => { setMenuAberto(false); }, [location.pathname]);
  useEffect(() => { document.title = `${atual.rotulo} · Clínica+`; }, [atual]);

  return (
    <div className={`app ${menuAberto ? 'menu-aberto' : ''}`}>
      <header className="cabecalho">
        <div className="cabecalho-linha">
          <Marca />
          <button type="button" className="icone botao-menu" onClick={() => setMenuAberto((v) => !v)} aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuAberto} aria-controls="menu-principal">
            <Icone nome={menuAberto ? 'fechar' : 'menu'} tamanho={22} />
          </button>
          <div className="gaveta" id="menu-principal">
            <nav className="navegacao" aria-label="Menu principal">
              {links.map((link) => (
                <NavLink key={link.para} to={link.para} end={link.exato} id={link.id}>
                  {link.rotulo}
                </NavLink>
              ))}
            </nav>
            <div className="cartao-usuario">
              <span className="avatar" aria-hidden="true">{iniciais(usuario?.nome)}</span>
              <div className="info">
                <strong id="nome-usuario">{usuario?.nome}</strong>
                <span>{NOMES_PERFIL[usuario?.perfil]}</span>
              </div>
              <button type="button" id="botao-sair" className="sair" onClick={sair}>
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className="cortina" onClick={() => setMenuAberto(false)} aria-hidden="true" />

      <div className="conteudo">
        <div className="faixa" key={`faixa-${location.pathname}`}>
          <p className="faixa-sobre">
            <span>{posicao} / {String(links.length).padStart(2, '0')}</span>
            <span>{NOMES_PERFIL[usuario?.perfil]}</span>
            <span className="faixa-data">{hoje}</span>
          </p>
          <h1>{atual.rotulo}</h1>
          <p className="faixa-descricao">{atual.descricao}</p>
        </div>
        <main className="pagina animar-entrada" key={location.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
