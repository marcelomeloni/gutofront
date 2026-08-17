const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';

export const api = {
  get: async (endpoint: string) => {
    const res = await fetch(`${BASE_URL}${endpoint}`);
    if (!res.ok) throw new Error(`Erro ao buscar: ${res.statusText}`);
    return res.json();
  },
  post: async (endpoint: string, data: any) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Erro ao salvar: ${res.statusText}`);
    }
    return res.json();
  },
  put: async (endpoint: string, data: any) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Erro ao atualizar: ${res.statusText}`);
    return res.json();
  },
  delete: async (endpoint: string) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Erro ao deletar: ${res.statusText}`);
  }
};
