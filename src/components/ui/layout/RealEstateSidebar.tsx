'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  Key, 
  LayoutDashboard, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { destroyCookie } from 'nookies';

export function RealEstateSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const links = [
    { name: 'Visão Geral', href: '/imobiliaria/dashboard', icon: LayoutDashboard },
    { name: 'Meus Corretores', href: '/imobiliaria/corretores', icon: Users },
    { name: 'Imóveis', href: '/imobiliaria/imoveis', icon: Home },
    { name: 'Leads / Contatos', href: '/imobiliaria/leads', icon: MessageSquare },
  ];

  const handleLogout = () => {
    destroyCookie(null, 'zeniximob.token');
    window.location.href = '/login';
  };

  return (
    <aside className={`relative bg-slate-900 text-slate-300 transition-all duration-300 flex flex-col ${isCollapsed ? 'w-20' : 'w-64'} min-h-screen`}>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-slate-800 border border-slate-700 rounded-full p-1 text-slate-400 hover:text-white shadow-sm"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className="h-20 flex items-center justify-center border-b border-slate-800">
        <div className="flex items-center gap-2 text-white">
          <Key size={24} className="text-emerald-500" />
          {!isCollapsed && <h1 className="font-bold text-xl">Minha Loja</h1>}
        </div>
      </div>

      <nav className="flex-1 pt-6 px-3 flex flex-col gap-2">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-emerald-500/10 text-emerald-400 font-medium' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} className="shrink-0" />
              {!isCollapsed && <span>{link.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-400 hover:bg-slate-800 transition-colors mt-1"
        >
          <LogOut size={20} className="shrink-0" />
          {!isCollapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}