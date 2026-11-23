// Campo de formulário com rótulo associado (acessível por getByLabelText).
export function Campo({ id, rotulo, ajuda, obrigatorio, children, ...props }) {
  return (
    <div className="campo">
      <label htmlFor={id}>
        {rotulo}
        {obrigatorio && <span aria-hidden="true" style={{ color: 'var(--vermelho-700)' }}> *</span>}
      </label>
      {children ?? <input id={id} aria-describedby={ajuda ? `${id}-ajuda` : undefined} {...props} />}
      {ajuda && <p className="ajuda" id={`${id}-ajuda`}>{ajuda}</p>}
    </div>
  );
}
