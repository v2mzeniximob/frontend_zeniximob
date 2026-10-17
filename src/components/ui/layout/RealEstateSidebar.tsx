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
  Wrench,
  MessageSquare,
  Building2,
  Share2
} from 'lucide-react';
import { destroyCookie } from 'nookies';

export function RealEstateSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [allowedModules, setAllowedModules] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Busca os módulos permitidos priorizando os módulos atualizados do Plano vinculado
  useEffect(() => {
    async function loadStoreData() {
      try {
        const res = await api.get('/my-store');
        
        // Se a imobiliária tem um Plano vinculado, lê direto dos módulos atuais do Plano;
        // caso contrário, usa os módulos avulsos da loja.
        const rawMods: string[] =
          res.data?.plan?.modules && Array.isArray(res.data.plan.modules) && res.data.plan.modules.length > 0
            ? res.data.plan.modules
            : (res.data?.modules || []);

        const normalizedMods = rawMods.map((m: string) =>
          m.toLowerCase().trim() === 'inocorporadoras' ? 'incorporadoras' : m.toLowerCase().trim()
        );

        setAllowedModules(normalizedMods);
      } catch (error) {
        console.error('Erro ao buscar permissões do plano:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadStoreData();
  }, [pathname]);

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/imobiliaria/dashboard', modules: ['always'] },
    { name: 'Condomínios', icon: Building2, path: '/imobiliaria/condominios', modules: ['condominios'] },
    { name: 'Incorporadoras', icon: Building2, path: '/imobiliaria/incorporadora', modules: ['incorporadoras', 'incorporadora'] },
    { name: 'Imóveis', icon: Home, path: '/imobiliaria/imoveis', modules: ['imoveis'] },
    { name: 'Corretores', icon: Users, path: '/imobiliaria/corretores', modules: ['corretores'] },
    { name: 'Clientes (CRM)', icon: UserCircle, path: '/imobiliaria/clientes', modules: ['crm'] },
    { name: 'Alugueis por Temporada', icon: Home, path: '/imobiliaria/alugueis-temporada', modules: ['temporada'] },
    { name: 'Leads (CRM)', icon: Briefcase, path: '/imobiliaria/leads', modules: ['crm'] },
    { name: 'Esteira de Negócios', icon: Briefcase, path: '/imobiliaria/esteira', modules: ['crm'] },
    { name: 'WhatsApp & Robô IA', icon: MessageSquare, path: '/imobiliaria/whatsapp', modules: ['whatsapp'] },
    { name: 'Controle de Chaves', icon: Key, path: '/imobiliaria/chaves', modules: ['chaves'] },
    { name: 'Propostas e Termos', icon: FileSignature, path: '/imobiliaria/propostas', modules: ['contratos'] },
    { name: 'Visitas', icon: Calendar, path: '/imobiliaria/visitas', modules: ['crm'] },
    { name: 'Avaliador (PTAM)', icon: Camera, path: '/imobiliaria/avaliador', modules: ['avaliador'] },
    { name: 'Proprietários', icon: UserCircle, path: '/imobiliaria/proprietarios', modules: ['imoveis'] },
    { name: 'Inquilinos', icon: Users, path: '/imobiliaria/inquilinos', modules: ['contratos'] },
    { name: 'Contratos', icon: Key, path: '/imobiliaria/contratos', modules: ['contratos'] },
    { name: 'Financeiro', icon: DollarSign, path: '/imobiliaria/financeiro', modules: ['financeiro'] },
    { name: 'Arquivo DIMOB (Fisco)', icon: FileSignature, path: '/imobiliaria/dimob', modules: ['dimob'] },
    { name: 'Fiscal e Contábil', icon: FileSignature, path: '/imobiliaria/fiscal', modules: ['fiscal'] },
    { name: 'Vistorias Mobile-First', icon: Camera, path: '/imobiliaria/vistorias', modules: ['vistorias'] },
    { name: 'Chamados de Manutenção', icon: Wrench, path: '/imobiliaria/manutencao', modules: ['manutencao'] },
    { name: 'Integração Meta (Facebook)', icon: Share2, path: '/imobiliaria/meta', modules: ['meta'] },
    { name: 'Configurações', icon: Settings, path: '/imobiliaria/configuracoes', modules: ['always'] },
  ];

  // Verifica estritamente se a imobiliária tem permissão para ver este item de menu
  const visibleMenuItems = menuItems.filter(item => {
    if (item.modules.includes('always')) return true;
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