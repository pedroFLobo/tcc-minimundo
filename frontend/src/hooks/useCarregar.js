import { useCallback, useEffect, useState } from 'react';

// Executa uma função assíncrona ao montar e sempre que as dependências mudarem.
export function useCarregar(funcao, dependencias = []) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setDados(await funcao());
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, dependencias);

  useEffect(() => { recarregar(); }, [recarregar]);

  return { dados, erro, carregando, recarregar };
}
