import axios from 'axios';
import { parseCookies } from 'nookies';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Interceptor: Antes de qualquer requisição sair, ele injeta o Token JWT
api.interceptors.request.use((config) => {
  const { 'zeniximob.token': token } = parseCookies();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});