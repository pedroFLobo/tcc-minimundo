import { useEffect, useState } from 'react';
import { medicosApi } from '../api';

// Lista os horários livres do médico na data; chama onEscolher(inicio) ao clicar.
export function SeletorHorarios({ id, medicoId, data, selecionado, onEscolher, recarregarChave }) {
  const [horarios, setHorarios] = useState([]);
  const [aviso, setAviso] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    setHorarios([]);
    setAviso('');
    if (!medicoId || !data) return undefined;
    let ativo = true;
    setCarregando(true);
    medicosApi.horarios(medicoId, data)
      .then(({ horarios: lista }) => {
        if (!ativo) return;
        setHorarios(lista);
        if (!lista.length) setAviso('Nenhum horário livre nesta data. Tente outro dia.');
      })
      .catch((e) => ativo && setAviso(e.message))
      .finally(() => ativo && setCarregando(false));
    return () => { ativo = false; };
  }, [medicoId, data, recarregarChave]);

  return (
    <div id={id} className="horarios" role="group" aria-label="Horários disponíveis" aria-busy={carregando}>
      {carregando && Array.from({ length: 6 }, (_, i) => <div key={i} className="esqueleto" style={{ height: 40 }} />)}
      {aviso && <p className="vazio">{aviso}</p>}
      {horarios.map((inicio, i) => (
        <button
          key={inicio}
          type="button"
          data-inicio={inicio}
          aria-pressed={inicio === selecionado}
          className={inicio === selecionado ? 'selecionado' : ''}
          style={{ animationDelay: `${Math.min(i, 16) * 20}ms` }}
          onClick={() => onEscolher(inicio)}
        >
          {inicio.split(' ')[1]}
        </button>
      ))}
    </div>
  );
}
