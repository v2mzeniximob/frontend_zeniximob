'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';// Usaremos Zod daqui a pouco
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { setCookie } from 'nookies';
import { useRouter } from 'next/navigation';
import { Building2, Loader2, Lock, Mail } from 'lucide-react';
import { api } from '../../lib/api';

// Regras de validação com Zod
const loginSchema = z.object({
  email: z.string().email('Digite um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.')
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

 async function handleLogin(data: LoginForm) {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/login', data);
      const { token, user } = response.data;

      // Salva o token nos cookies por 1 dia (seguro e funciona no SSR)
      setCookie(null, 'zeniximob.token', token, {
        maxAge: 60 * 60 * 24, // 24 horas
        path: '/',
      });

      // Redirecionamento inteligente baseado na role (papel) do utilizador
      if (user?.role === 'MASTER' || user?.isMaster) {
        router.push('/dashboard'); // Vai para o Painel do Dono do SaaS
      } else if (user?.role === 'REAL_ESTATE' || user?.role === 'BROKER') {
        router.push('/imobiliaria/dashboard'); // Vai para o Painel isolado da Loja/Corretor
      } else {
        router.push('/dashboard'); // Fallback de segurança
      }
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao conectar no servidor.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        
        {/* Cabeçalho */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <Building2 size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">ZenixImob Master</h1>
          <p className="text-slate-500 text-sm mt-1">Acesse o painel administrativo</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit(handleLogin)} className="space-y-5">
          
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                {...register('email')}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-700"
                placeholder="admin@zeniximob.com"
              />
            </div>
            {errors.email && <span className="text-red-500 text-xs mt-1">{errors.email.message}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                {...register('password')}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-700"
                placeholder="••••••••"
              />
            </div>
            {errors.password && <span className="text-red-500 text-xs mt-1">{errors.password.message}</span>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 transition-all flex items-center justify-center disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Entrar no Sistema'}
          </button>
        </form>

      </div>
    </div>
  );
}