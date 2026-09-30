import axios from 'axios';
import { parseCookies } from 'nookies';

export const api = axios.create({
  baseURL: 'https://backend-zeniximob.onrender.com',
});

api.interceptors.request.use((config) => {
  try {
    const cookies = parseCookies();
    const token = cookies['zeniximob.token'];

    if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    // Ignora
  }

  return config;
});