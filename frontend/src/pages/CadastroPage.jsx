import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { FormularioPaciente } from '../components/FormularioPaciente';
import { LayoutAcesso } from '../components/LayoutAcesso';
import { Mensagem } from '../components/Mensagem';
import { ROTA_INICIAL, useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useMensagem } from '../hooks/useMensagem';

export function CadastroPage() {
  const { entrar } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { mensagem, erro, limpar } = useMensagem();

  useEffect(() => { document.title = 'Criar conta · Clínica+'; }, []);

  async function cadastrar(dados) {
    limpar();
    try {
      await authApi.registrar(dados);
      const usuario = await entrar(dados.email, dados.senha);
      toast.sucesso('Sua conta foi criada. Agora é só agendar sua primeira consulta.', 'Cadastro concluído');
      navigate(ROTA_INICIAL[usuario.perfil], { replace: true });
      return true;
    } catch (e) {
      erro(e.message);
      return false;
    }
  }

  return (
    <LayoutAcesso larga>
      <h2>Criar conta</h2>
      <p className="descricao">Preencha seus dados para agendar consultas. Campos com * são obrigatórios.</p>
      <FormularioPaciente prefixo="cadastro" textoBotao="Criar conta" onEnviar={cadastrar}>
        <Mensagem id="cadastro-mensagem" mensagem={mensagem} />
      </FormularioPaciente>
      <p className="alternativa">Já tem conta? <Link to="/login">Entrar</Link></p>
    </LayoutAcesso>
  );
}
