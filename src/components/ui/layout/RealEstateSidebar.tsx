'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Home, Users, Settings, LogOut } from 'lucide-react';
import { destroyCookie } from 'nookies';

export function RealEstateSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/imobiliaria/dashboard' },
    { name: 'Meus Corretores', icon: Users, path: '/imobiliaria/corretores' },
    { name: 'Meus Imóveis', icon: Home, path: '/imobiliaria/imoveis' },
    { name: 'Leads (CRM)', icon: Users, path: '/imobiliaria/leads' },
    { name: 'Configurações', icon: Settings, path: '/imobiliaria/configuracoes' },
  ];

  function handleLogout() {
    destroyCookie(null, 'zeniximob.token', { path: '/' });
    router.push('/login');
  }

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col hidden md:flex fixed h-full z-10">
      <div className="flex items-center gap-3 px-2 py-4 mb-6 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">
          Z
        </div>
        <div>
          <h2 className="font-bold text-lg leading-tight">Painel da Loja</h2>
          <p className="text-xs text-slate-400">Gestão Imobiliária</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-sm font-medium ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-slate-800 mt-auto">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-sm font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 w-full"
        >
          <LogOut size={18} />
          Terminar Sessão
        </button>
      </div>
    </aside>
  );
}