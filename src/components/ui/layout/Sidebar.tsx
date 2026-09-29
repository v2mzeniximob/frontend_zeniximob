'use client'; // Indica que este componente usa estado (React no navegador)

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Building2, 
  Users, 
  CreditCard, 
  LayoutDashboard, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { destroyCookie } from 'nookies';

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const links = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Imobiliárias', href: '/imobiliarias', icon: Building2 },
    { name: 'Franqueados', href: '/franqueados', icon: Users },
    { name: 'Planos', href: '/planos', icon: CreditCard },
  ];

  const handleLogout = () => {
    destroyCookie(null, 'zeniximob.token');
    window.location.href = '/login';
  };

  return (
    <aside 
      className={`relative bg-white border-r border-slate-200 transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      } min-h-screen`}
    >
      {/* Botão de Retrair */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-white border border-slate-200 rounded-full p-1 text-slate-500 hover:text-blue-600 shadow-sm"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Logo */}
      <div className="h-20 flex items-center justify-center border-b border-slate-100">
        <h1 className={`font-bold text-blue-600 transition-all ${isCollapsed ? 'text-sm' : 'text-2xl'}`}>
          {isCollapsed ? 'Z' : 'ZenixImob'}
        </h1>
      </div>

      {/* Links de Navegação */}
      <nav className="flex-1 pt-6 px-3 flex flex-col gap-2">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const Icon = link.icon;

          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-50 text-blue-600 font-medium' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon size={20} className="shrink-0" />
              {!isCollapsed && <span>{link.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Rodapé do Menu */}
      <div className="p-3 border-t border-slate-100">
        <Link 
          href="/configuracoes"
          className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <Settings size={20} className="shrink-0" />
          {!isCollapsed && <span>Configurações</span>}
        </Link>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-500 hover:bg-red-50 transition-colors mt-1"
        >
          <LogOut size={20} className="shrink-0" />
          {!isCollapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}