import axios from 'axios';
import { parseCookies } from 'nookies';

// Fallback explícito para garantir que o frontend nunca aponta para si mesmo em produção
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-zeniximob.onrender.com';

export const api = axios.create({
  baseURL,
});

// Interceptor: Só injeta o token se ele realmente estiver presente nos cookies
api.interceptors.request.use((config) => {
  try {
    const cookies = parseCookies();
    const token = cookies['zeniximob.token'];

    if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    // Ignora erros de contexto do lado do servidor se houver
  }

  return config;
});