import axios from 'axios';
import { parseCookies } from 'nookies';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://backend-zeniximob.onrender.com',
});

api.interceptors.request.use((config) => {
  try {
    // ==========================================
    // 1. RESOLVER A BRIGA DOS TOKENS
    // ==========================================
    if (config.url?.startsWith('/portal')) {
      // Se a rota for do Portal (Inquilino/Proprietário)
      if (typeof window !== 'undefined') {
        const portalToken = localStorage.getItem('@ZenixPortal:token');
        if (portalToken && portalToken !== 'undefined' && portalToken !== 'null') {
          config.headers.Authorization = `Bearer ${portalToken}`;
        }
      }
    } else {
      // Se for a rota do CRM (Master/Corretor)
      const cookies = parseCookies();
      const crmToken = cookies['zeniximob.token'];

      if (crmToken && crmToken !== 'undefined' && crmToken !== 'null') {
        config.headers.Authorization = `Bearer ${crmToken}`;
      }
    }

    // ==========================================
    // 2. EXTRAIR O SLUG DA URL (EX: /loja/vivian)
    // ==========================================
    if (typeof window !== 'undefined') {
      const path = window.location.pathname; // Pega o caminho atual
      
      // Usa Regex para caçar o padrão "/loja/QUALQUER_NOME"
      const match = path.match(/\/loja\/([^\/]+)/);
      
      if (match && match[1]) {
        const storeSlug = match[1]; // Aqui ele pegou "vivian"
        // Envia este slug em TODAS as requisições para o Backend
        config.headers['x-store-slug'] = storeSlug;
      }
    }

  } catch (error) {
    // Ignora erros silenciosamente
  }

  return config;
});