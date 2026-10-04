'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation'; 
import { 
  Key, User, Home, Loader2, ArrowRight, ShieldCheck, AlertCircle
} from 'lucide-react';
import { maskCpf, maskCnpj } from '@/src/utils/mask';
import { api } from '@/src/lib/api';

export default function PortalLoginPage() {
  const router = useRouter();
  const params = useParams(); 
  const slug = params.slug as string; // <-- Pega o 'vivian' direto da URL!
  
  const [role, setRole] = useState<'CLIENT' | 'OWNER'>('CLIENT');
  const [documentVal, setDocumentVal] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length <= 11) {
      setDocumentVal(maskCpf(val));
    } else {
      setDocumentVal(maskCnpj(val));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/portal/login', {
        document: documentVal,
        password,
        role
      });

      localStorage.setItem('@ZenixPortal:token', response.data.token);
      localStorage.setItem('@ZenixPortal:user', JSON.stringify(response.data.user));
      api.defaults.headers.authorization = `Bearer ${response.data.token}`;

      // Redireciona para o dashboard correto DAQUELA loja!
      router.push(`/loja/${slug}/portal-cliente/dashboard`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao realizar login. Verifique os seus dados.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans selection:bg-blue-200">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/20">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-800">Portal do Cliente</h1>
          <p className="text-slate-500 text-sm mt-2">Acesse seus contratos, boletos e manutenções.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 text-center">
                Qual é o seu perfil?
              </label>
              <div className="flex gap-3 bg-slate-100 p-1.5 rounded-2xl">
                <button type="button" onClick={() => setRole('CLIENT')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${role === 'CLIENT' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  <User size={16}/> Inquilino
                </button>
                <button type="button" onClick={() => setRole('OWNER')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${role === 'OWNER' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  <Home size={16}/> Proprietário
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm flex items-start gap-3 border border-red-100 animate-in zoom-in-95">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p className="font-semibold">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">CPF ou CNPJ</label>
                <input type="text" required value={documentVal} onChange={handleDocumentChange} placeholder="Digite seu documento..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-slate-700 font-medium" />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 flex justify-between items-center">Senha</label>
                <div className="relative">
                  <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Sua senha de acesso" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-slate-700 font-medium" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className={`w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${role === 'CLIENT' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'}`}>
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <><ArrowRight size={18} /> Entrar no Meu Painel</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}