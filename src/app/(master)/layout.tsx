
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Sidebar } from 'lucide-react';

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  // Ajuste para compatibilidade com Next.js 15
  const cookieStore = await cookies();
  const token = cookieStore.get('zeniximob.token');

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