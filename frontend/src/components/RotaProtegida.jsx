import { Navigate, Outlet } from 'react-router-dom';
import { ROTA_INICIAL, useAuth } from '../contexts/AuthContext';

// Só renderiza as rotas filhas para o perfil informado.
export function RotaProtegida({ perfil }) {
  const { usuario, carregando } = useAuth();
  if (carregando) return <div className="carregando-tela"><span className="girando" aria-label="Carregando" /></div>;
  if (!usuario) return <Navigate to="/login" replace />;
  if (usuario.perfil !== perfil) return <Navigate to={ROTA_INICIAL[usuario.perfil]} replace />;
  return <Outlet />;
}
