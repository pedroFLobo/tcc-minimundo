import { useState } from 'react';
import { BotaoEnviar } from './BotaoEnviar';
import { Campo } from './Campo';

const VAZIO = { nome: '', email: '', senha: '', cpf: '', dataNascimento: '', telefone: '', responsavelNome: '' };

// Campos do cadastro de paciente; usado no auto-cadastro e na recepção.
export function FormularioPaciente({ prefixo, textoBotao, onEnviar, children }) {
  const [dados, setDados] = useState(VAZIO);
  const [enviando, setEnviando] = useState(false);
  const atualizar = (campo) => (e) => setDados({ ...dados, [campo]: e.target.value });

  async function enviar(evento) {
    evento.preventDefault();
    setEnviando(true);
    try {
      if (await onEnviar(dados)) setDados(VAZIO);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form id={`form-${prefixo}`} onSubmit={enviar} noValidate>
      <div className="grade-form">
        <Campo id={`${prefixo}-nome`} rotulo="Nome completo" obrigatorio autoComplete="name" value={dados.nome} onChange={atualizar('nome')} />
        <Campo id={`${prefixo}-email`} rotulo="E-mail" obrigatorio type="email" autoComplete="email" placeholder="voce@email.com" value={dados.email} onChange={atualizar('email')} />
        <Campo id={`${prefixo}-senha`} rotulo="Senha" obrigatorio type="password" autoComplete="new-password" ajuda="Mínimo de 8 caracteres, com letras e números." value={dados.senha} onChange={atualizar('senha')} />
        <Campo id={`${prefixo}-cpf`} rotulo="CPF" obrigatorio inputMode="numeric" placeholder="000.000.000-00" value={dados.cpf} onChange={atualizar('cpf')} />
        <Campo id={`${prefixo}-nascimento`} rotulo="Data de nascimento" obrigatorio type="date" value={dados.dataNascimento} onChange={atualizar('dataNascimento')} />
        <Campo id={`${prefixo}-telefone`} rotulo="Telefone" type="tel" autoComplete="tel" placeholder="(00) 00000-0000" value={dados.telefone} onChange={atualizar('telefone')} />
        <Campo id={`${prefixo}-responsavel`} rotulo="Nome do responsável" ajuda="Obrigatório para menores de 18 anos." value={dados.responsavelNome} onChange={atualizar('responsavelNome')} />
      </div>
      {children}
      <div className="acoes-form">
        <BotaoEnviar id={`${prefixo}-enviar`} className="marca" enviando={enviando} textoEnviando="Cadastrando...">{textoBotao}</BotaoEnviar>
      </div>
    </form>
  );
}
