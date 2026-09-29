import { RealEstateSidebar } from '@/src/components/ui/layout/RealEstateSidebar';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';


export default async function ImobiliariaLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('zeniximob.token');

  // Proteção simples: se não houver token, expulsa para o login
  if (!token) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <RealEstateSidebar />
      <main className="flex-1 md:ml-64 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
          {children}
        </div>
      </main>
    </div>
  );
}