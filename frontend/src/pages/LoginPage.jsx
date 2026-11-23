import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BotaoEnviar } from '../components/BotaoEnviar';
import { Campo } from '../components/Campo';
import { LayoutAcesso } from '../components/LayoutAcesso';
import { Mensagem } from '../components/Mensagem';
import { ROTA_INICIAL, useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useMensagem } from '../hooks/useMensagem';

export function LoginPage() {
  const { usuario, entrar } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { mensagem, erro, limpar } = useMensagem();

  useEffect(() => { document.title = 'Entrar · Clínica+'; }, []);

  if (usuario) return <Navigate to={ROTA_INICIAL[usuario.perfil]} replace />;

  async function enviar(evento) {
    evento.preventDefault();
    limpar();
    setEnviando(true);
    try {
      const logado = await entrar(email, senha);
      toast.sucesso(`Que bom ter você de volta, ${logado.nome.split(' ')[0]}.`, 'Login realizado');
      navigate(ROTA_INICIAL[logado.perfil], { replace: true });
    } catch (e) {
      erro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <LayoutAcesso>
      <h2>Entrar</h2>
      <p className="descricao">Acesse sua conta para gerenciar consultas.</p>
      <form id="form-login" onSubmit={enviar} noValidate>
        <Campo id="login-email" rotulo="E-mail" type="email" autoComplete="username" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Campo id="login-senha" rotulo="Senha" type="password" autoComplete="current-password" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} />
        <Mensagem id="login-mensagem" mensagem={mensagem} />
        <BotaoEnviar id="login-entrar" className="marca bloco" enviando={enviando} textoEnviando="Entrando...">Entrar</BotaoEnviar>
      </form>
      <p className="alternativa">Ainda não tem conta? <Link to="/cadastro" id="link-cadastro">Cadastre-se como paciente</Link></p>
      <div className="contas-demo">
        <strong>Contas de demonstração</strong> (senha <code>Senha123</code>): recepcao@clinica.com · carlos@clinica.com · ana@email.com
      </div>
    </LayoutAcesso>
  );
}
