'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  Wrench // <-- NOVO ÍCONE IMPORTADO AQUI
} from 'lucide-react';
import { destroyCookie } from 'nookies';

export function RealEstateSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/imobiliaria/dashboard' },
    { name: 'Imóveis', icon: Home, path: '/imobiliaria/imoveis' },
    { name: 'Clientes (CRM)', icon: UserCircle, path: '/imobiliaria/clientes' },
    { name: 'Leads (CRM)', icon: Briefcase, path: '/imobiliaria/leads' },
    { name: 'Propostas e Termos', icon: FileSignature, path: '/imobiliaria/propostas' },
    { name: 'Visitas', icon: Calendar, path: '/imobiliaria/visitas' },
    { name: 'Proprietários', icon: UserCircle, path: '/imobiliaria/proprietarios' },
    { name: 'Inquilinos', icon: Users, path: '/imobiliaria/inquilinos' },
    { name: 'Contratos', icon: Key, path: '/imobiliaria/contratos'},
    { name: 'Financeiro', icon: DollarSign, path: '/imobiliaria/financeiro' },
    { name: 'Vistorias', icon: Camera, path: '/imobiliaria/vistorias' },
    { name: 'Manutenção', icon: Wrench, path: '/imobiliaria/manutencao' }, // <-- NOVO LINK ADICIONADO AQUI
    { name: 'Corretores', icon: Users, path: '/imobiliaria/corretores' },
    { name: 'Configurações', icon: Settings, path: '/imobiliaria/configuracoes' },
  ];

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
        {menuItems.map((item) => {
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
        })}
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