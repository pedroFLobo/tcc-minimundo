import { useState } from 'react';
import { Modal } from './Modal';

// Pede um texto (motivo, observações). onConfirmar recebe o texto digitado.
export function DialogoTexto({ titulo, descricao, rotulo, textoConfirmar = 'Confirmar', perigo, onConfirmar, onCancelar }) {
  const [texto, setTexto] = useState('');
  return (
    <Modal titulo={titulo} descricao={descricao} aberto onFechar={onCancelar}>
      <form onSubmit={(e) => { e.preventDefault(); onConfirmar(texto); }}>
        <label htmlFor="texto-campo">{rotulo}</label>
        <textarea id="texto-campo" value={texto} onChange={(e) => setTexto(e.target.value)} />
        <div className="botoes">
          <button type="button" className="secundario" id="texto-cancelar" onClick={onCancelar}>Voltar</button>
          <button type="submit" id="texto-confirmar" className={perigo ? 'marca' : ''}>{textoConfirmar}</button>
        </div>
      </form>
    </Modal>
  );
}
