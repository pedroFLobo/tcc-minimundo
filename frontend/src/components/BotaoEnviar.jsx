// Botão que mostra um indicador de carregamento enquanto a ação está em andamento.
export function BotaoEnviar({ enviando, children, textoEnviando = 'Salvando...', ...props }) {
  return (
    <button type="submit" disabled={enviando || props.disabled} aria-busy={enviando} {...props}>
      {enviando ? <><span className="girando" aria-hidden="true" />{textoEnviando}</> : children}
    </button>
  );
}
