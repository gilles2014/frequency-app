const PLANILHA_URL = 'https://script.google.com/macros/s/AKfycbzSrdV8olN0RuoVMXWTn5_qaSZVfiqg_MAHEJxkmHFwTrhvpj3a9PRGlAt7d7tu4v1xYg/exec';

  export const buscarTurmasDaPlanilha = async (): Promise<Record<string, Record<string, string[]>> | null> => {
    try {
      const response = await fetch(PLANILHA_URL);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao buscar turmas da planilha:', error);
      return null;
    }
  };