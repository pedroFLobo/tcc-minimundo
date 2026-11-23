import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Icone } from '../components/Icone';

const DURACAO_MS = 4500;
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const proximoId = useRef(1);

  const remover = useCallback((id) => setToasts((atuais) => atuais.filter((t) => t.id !== id)), []);

  const mostrar = useCallback((tipo, titulo, texto) => {
    const id = proximoId.current++;
    setToasts((atuais) => [...atuais.slice(-2), { id, tipo, titulo, texto }]);
    setTimeout(() => remover(id), DURACAO_MS);
  }, [remover]);

  const api = useMemo(() => ({
    sucesso: (texto, titulo = 'Tudo certo!') => mostrar('sucesso', titulo, texto),
    erro: (texto, titulo = 'Algo deu errado') => mostrar('erro', titulo, texto),
  }), [mostrar]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tipo}`} data-tipo={t.tipo}>
            <span className="toast-icone"><Icone nome={t.tipo === 'sucesso' ? 'check' : 'alerta'} tamanho={16} /></span>
            <div>
              <strong>{t.titulo}</strong>
              <p className="toast-texto">{t.texto}</p>
            </div>
            <button type="button" aria-label="Fechar aviso" onClick={() => remover(t.id)}><Icone nome="fechar" tamanho={16} /></button>
            <span className="tempo" style={{ animationDuration: `${DURACAO_MS}ms` }} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
