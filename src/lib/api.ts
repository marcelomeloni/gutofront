const API_BASE = 'http://localhost:3333/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    // Token expired or invalid
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Erro ${res.status}`);
  }

  return data as T;
}

// Generic CRUD helpers
function createCrud<T>(resource: string) {
  return {
    getAll: () => request<T[]>(`/${resource}`),
    getById: (id: string) => request<T>(`/${resource}/${id}`),
    create: (payload: Partial<T>) => request<T>(`/${resource}`, { method: 'POST', body: JSON.stringify(payload) }),
    update: (id: string, payload: Partial<T>) => request<T>(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id: string) => request<void>(`/${resource}/${id}`, { method: 'DELETE' }),
  };
}

// API modules
export const api = {
  leads: createCrud<any>('leads'),
  demandas: {
    ...createCrud<any>('demandas'),
    updateStatus: (id: string, status: string) =>
      request<any>(`/demandas/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  },
  bairros: createCrud<any>('bairros'),
  marketing: createCrud<any>('marketing'),
  tarefas: createCrud<any>('tarefas'),
  agenda: createCrud<any>('agenda'),
  financeiro: createCrud<any>('financeiro'),
  arquivos: createCrud<any>('arquivos'),
  usuarios: createCrud<any>('usuarios'),

  // Imprensa — veículos + entrevistas
  imprensa: {
    veiculos: createCrud<any>('imprensa'),
    entrevistas: {
      getAll: () => request<any[]>('/imprensa/entrevistas'),
      create: (payload: any) => request<any>('/imprensa/entrevistas', { method: 'POST', body: JSON.stringify(payload) }),
      update: (id: string, payload: any) => request<any>(`/imprensa/entrevistas/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
      remove: (id: string) => request<void>(`/imprensa/entrevistas/${id}`, { method: 'DELETE' }),
    },
  },

  // Estoque — itens + movimentações
  estoque: {
    ...createCrud<any>('estoque'),
    movimentacoes: {
      getAll: () => request<any[]>('/estoque/movimentacoes'),
    },
    movimentar: (itemId: string, payload: { tipo: string; quantidade: number; observacao?: string }) =>
      request<any>(`/estoque/${itemId}/movimentar`, { method: 'POST', body: JSON.stringify(payload) }),
  },

  // Auth
  auth: {
    login: (email: string, password: string) =>
      request<{ user: any; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (payload: any) =>
      request<any>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  },
};

export default api;
