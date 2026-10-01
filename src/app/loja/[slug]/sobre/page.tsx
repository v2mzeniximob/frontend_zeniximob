'use client';

import { useState, useEffect, use } from 'react';
import { api } from '../../../../lib/api';
import { MapPin, Phone, Mail, Loader2, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function SobrePage(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  const slug = params?.slug;

  const [storeData, setStoreData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const fetchVitrine = async () => {
      try {
        const response = await api.get(`/public/stores/${slug}`);
        setStoreData(response.data.realEstate);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVitrine();
  }, [slug]);

  if (isLoading) return <div className="min-h-screen flex flex-col items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600 mb-4" size={40} /></div>;
  if (!storeData) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><h1 className="text-2xl font-bold text-slate-800">Imobiliária não encontrada.</h1></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* CABEÇALHO */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link href={`/loja/${slug}`}>
            {storeData.logoUrl ? <img src={storeData.logoUrl} alt={storeData.tradeName} className="h-12 object-contain" /> : <h1 className="text-2xl font-black text-slate-900 tracking-tight">{storeData.tradeName}</h1>}
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <Link href={`/loja/${slug}`} className="hover:text-blue-600 transition-colors">Início</Link>
            <Link href={`/loja/${slug}#locacao`} className="hover:text-blue-600 transition-colors">Locação</Link>
            <Link href={`/loja/${slug}#venda`} className="hover:text-blue-600 transition-colors">Venda</Link>
            <Link href={`/loja/${slug}/sobre`} className="text-blue-600">Sobre Nós</Link>
            <Link href={`/loja/${slug}/corretores`} className="hover:text-blue-600 transition-colors">Corretores</Link>
          </nav>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 w-full">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-12">
          <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-8">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
              <Building2 size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Sobre a {storeData.tradeName}</h1>
              <p className="text-slate-500 mt-1">{storeData.corporateName} • CNPJ: {storeData.cnpj}</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-line text-lg">
            {storeData.aboutText || 'A nossa imobiliária está comprometida em oferecer o melhor serviço para o ajudar a encontrar o imóvel dos seus sonhos. Entre em contacto connosco para saber mais.'}
          </div>
        </div>
      </main>

      {/* RODAPÉ SIMPLIFICADO */}
      <footer className="bg-slate-900 text-slate-300 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <p>© {new Date().getFullYear()} {storeData.corporateName}. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6 text-sm">
            <span className="flex items-center gap-2"><Phone size={16}/> {storeData.phone}</span>
            <span className="flex items-center gap-2"><Mail size={16}/> {storeData.email}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}