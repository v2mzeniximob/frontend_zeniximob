'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/src/lib/api'; 
import { 
  LayoutDashboard, 
  Home, 
  Users, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Key,
  UserCircle,
  DollarSign,
  Calendar,
  Camera,
  Briefcase,
  FileSignature,
  Wrench
} from 'lucide-react';
import { destroyCookie } from 'nookies';

export function RealEstateSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [allowedModules, setAllowedModules] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Busca os módulos permitidos e normaliza para minúsculas
  useEffect(() => {
    async function loadStoreData() {
      try {
        const res = await api.get('/my-store');
        const mods = res.data.modules || [];
        // Converte tudo para minúsculas para não haver erro de "FINANCEIRO" vs "financeiro"
        const normalizedMods = mods.map((m: string) => m.toLowerCase());
        setAllowedModules(normalizedMods);
      } catch (error) {
        console.error('Erro ao buscar permissões do plano:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadStoreData();
  }, []);

  // Mapeamento tolerante: aceita tanto os nomes em PT quanto em EN cadastrados no banco
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/imobiliaria/dashboard', modules: ['always'] },
    { name: 'Imóveis', icon: Home, path: '/imobiliaria/imoveis', modules: ['imoveis', 'properties', 'portais'] },
    { name: 'Clientes (CRM)', icon: UserCircle, path: '/imobiliaria/clientes', modules: ['crm'] },
    { name: 'Leads (CRM)', icon: Briefcase, path: '/imobiliaria/leads', modules: ['crm'] },
    { name: 'Esteira de Negócios', icon: Briefcase, path: '/imobiliaria/esteira', modules: ['crm'] },
    { name: 'Controle de Chaves', icon: Key, path: '/imobiliaria/chaves', modules: ['chaves', 'keys'] },
    { name: 'Propostas e Termos', icon: FileSignature, path: '/imobiliaria/propostas', modules: ['contratos', 'contracts'] },
    { name: 'Visitas', icon: Calendar, path: '/imobiliaria/visitas', modules: ['crm'] },
    { name: 'Proprietários', icon: UserCircle, path: '/imobiliaria/proprietarios', modules: ['imoveis', 'properties', 'portais'] },
    { name: 'Inquilinos', icon: Users, path: '/imobiliaria/inquilinos', modules: ['contratos', 'contracts'] },
    { name: 'Contratos', icon: Key, path: '/imobiliaria/contratos', modules: ['contratos', 'contracts'] },
    { name: 'Financeiro', icon: DollarSign, path: '/imobiliaria/financeiro', modules: ['financeiro', 'financial'] },
    { name: 'Arquivo Dimob', icon: FileSignature, path: '/imobiliaria/dimob', modules: ['dimob'] },
    { name: 'Vistorias', icon: Camera, path: '/imobiliaria/vistorias', modules: ['vistorias', 'contratos', 'contracts'] },
    { name: 'Chamados de Manutenção', icon: Wrench, path: '/imobiliaria/manutencao', modules: ['manutencao', 'tickets'] },
    { name: 'Corretores', icon: Users, path: '/imobiliaria/corretores', modules: ['corretores', 'brokers'] },
    { name: 'Configurações', icon: Settings, path: '/imobiliaria/configuracoes', modules: ['always'] },
  ];

  // Verifica se a imobiliária tem permissão para ver este item de menu
  const visibleMenuItems = menuItems.filter(item => {
    if (item.modules.includes('always')) return true;
    // O menu aparece se ALGUM dos módulos exigidos bater com a lista da imobiliária
    return item.modules.some(reqModule => allowedModules.includes(reqModule));
  });

  function handleLogout() {
    destroyCookie(null, 'zeniximob.token', { path: '/' });
    router.push('/login');
  }

  return (
    <aside 
      className={`bg-white border-r border-slate-200 text-slate-800 h-screen flex flex-col hidden md:flex fixed z-20 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20 px-2' : 'w-64 px-4'
      }`}
    >
      <div className={`flex items-center gap-3 py-6 mb-2 border-b border-slate-100 shrink-0 relative ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="w-10 h-10 min-w-[2.5rem] bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-md">
          Z
        </div>
        
        {!isCollapsed && (
          <div className="flex-1 overflow-hidden transition-all duration-300">
            <h2 className="font-bold text-lg text-slate-800 leading-tight whitespace-nowrap">Painel da Loja</h2>
            <p className="text-xs text-slate-500 whitespace-nowrap">Gestão Imobiliária</p>
          </div>
        )}

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-8 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-full p-1.5 shadow-sm transition-colors z-30"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden mb-4 pr-1 
        scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent hover:scrollbar-thumb-slate-300">
        
        {isLoading ? (
           <div className="flex flex-col gap-2 mt-4 px-3">
             <div className="h-8 bg-slate-100 rounded-lg animate-pulse w-full"></div>
             <div className="h-8 bg-slate-100 rounded-lg animate-pulse w-3/4"></div>
             <div className="h-8 bg-slate-100 rounded-lg animate-pulse w-5/6"></div>
           </div>
        ) : (
          visibleMenuItems.map((item) => {
            const isActive = pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center gap-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                  isCollapsed ? 'justify-center py-3 px-0' : 'px-3 py-3'
                } ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/50' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600 border border-transparent'
                }`}
              >
                <item.icon 
                  size={20} 
                  className={`shrink-0 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400'}`} 
                />
                {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
              </Link>
            );
          })
        )}
      </nav>

      <div className={`py-4 border-t border-slate-100 shrink-0 ${isCollapsed ? 'px-0' : 'px-1'}`}>
        <button 
          onClick={handleLogout}
          title={isCollapsed ? 'Terminar Sessão' : undefined}
          className={`flex items-center gap-3 rounded-xl transition-colors text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 w-full ${
            isCollapsed ? 'justify-center py-3 px-0' : 'px-3 py-3'
          }`}
        >
          <LogOut size={20} className="shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">Terminar Sessão</span>}
        </button>
      </div>
    </aside>
  );
}