import { RealEstateSidebar } from '@/src/components/ui/layout/RealEstateSidebar';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function ImobiliariaLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('zeniximob.token');

  if (!token) {
    redirect('/login');
  }

  // Aqui no futuro podemos decodificar o token para garantir que quem logou foi uma Imobiliária e não o Master

  return (
    <div className="flex min-h-screen bg-slate-50">
      <RealEstateSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 min-h-[calc(100vh-4rem)] p-6">
          {children}
        </div>
      </main>
    </div>
  );
}