import { useCallback, useState } from 'react';
import { useToast } from '../contexts/ToastContext';

// Erros ficam junto ao formulário (<Mensagem />); sucessos aparecem como aviso flutuante (toast).
export function useMensagem() {
  const toast = useToast();
  const [mensagem, setMensagem] = useState(null);
  const sucesso = useCallback((texto, titulo) => { setMensagem(null); toast.sucesso(texto, titulo); }, [toast]);
  const erro = useCallback((texto) => setMensagem({ tipo: 'erro', texto }), []);
  const limpar = useCallback(() => setMensagem(null), []);
  return { mensagem, sucesso, erro, limpar };
}
