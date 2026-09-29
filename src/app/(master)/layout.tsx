import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

function Sidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white p-6">
      <div className="text-lg font-semibold text-slate-800">Zenix Imob</div>
    </aside>
  );
}

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  // Proteção de rota básica (SSR)
  const cookieStore = cookies();
  const token = (await cookieStore).get('zeniximob.token');

  if (!token) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 min-h-[calc(100vh-4rem)] p-6">
          {children}
        </div>
      </main>
    </div>
  );
}