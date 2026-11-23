import { useEffect, useRef } from 'react';

// Diálogo modal acessível: foca o primeiro campo e fecha com Esc.
export function Modal({ titulo, descricao, aberto, onFechar, children }) {
  const ref = useRef(null);
  const fecharRef = useRef(onFechar);
  fecharRef.current = onFechar;

  useEffect(() => {
    if (!aberto) return undefined;
    ref.current?.querySelector('input, textarea, select, button')?.focus();
    const aoTeclar = (e) => { if (e.key === 'Escape') fecharRef.current?.(); };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aberto]);

  if (!aberto) return null;
  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && onFechar?.()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo" ref={ref}>
        <h3 id="modal-titulo">{titulo}</h3>
        {descricao && <p className="ajuda" style={{ marginBottom: 16 }}>{descricao}</p>}
        {children}
      </div>
    </div>
  );
}
