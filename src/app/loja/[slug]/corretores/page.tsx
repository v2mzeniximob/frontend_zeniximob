'use client';

import { useState, useEffect, use } from 'react';
import { api } from '../../../../lib/api';
import { Phone, Mail, Loader2, UserCircle } from 'lucide-react';
import Link from 'next/link';

export default function CorretoresPublicPage(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  const slug = params?.slug;

  const [storeData, setStoreData] = useState<any>(null);
  const [brokers, setBrokers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const fetchVitrine = async () => {
      try {
        // 1. Puxa os dados da vitrine (Real Estate)
        const responseVitrine = await api.get(`/public/stores/${slug}`);
        const realEstateData = responseVitrine.data.realEstate;
        setStoreData(realEstateData);
        
        // 2. Se a vitrine não mandou os brokers (o que está a acontecer),
        // puxamos TODOS os corretores ativos do sistema usando uma rota alternativa que você já tem!
        if (realEstateData && realEstateData.id) {
            // Chamamos a rota pública base (sem precisar de autenticação para este teste de leitura se for viável)
            // Como a rota /brokers é protegida, usamos os brokers que vêm cravados nos imóveis como "plano B"
            const allProperties = responseVitrine.data.properties || [];
            
            // Extrai todos os corretores únicos que estão ligados a algum imóvel desta vitrine
            const uniqueBrokersMap = new Map();
            allProperties.forEach((prop: any) => {
                if (prop.broker) {
                    uniqueBrokersMap.set(prop.broker.id || prop.broker.name, prop.broker);
                }
            });
            
            // Converte o mapa de volta para um array
            const extractedBrokers = Array.from(uniqueBrokersMap.values());
            
            // Se a vitrine mandou brokers usa-os, senão usa os que extraímos dos imóveis
            const finalBrokers = responseVitrine.data.brokers || extractedBrokers;
            
            setBrokers(finalBrokers);
            console.log("Corretores finais que vão para a tela:", finalBrokers);
        }

      } catch (err) {
        console.error("Erro ao carregar a vitrine:", err);
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
            <Link href={`/loja/${slug}/sobre`} className="hover:text-blue-600 transition-colors">Sobre Nós</Link>
            <Link href={`/loja/${slug}/corretores`} className="text-blue-600">Corretores</Link>
          </nav>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-16 w-full">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">A nossa equipa</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Contamos com profissionais qualificados e dedicados a encontrar o imóvel ideal para si com total transparência e segurança.
          </p>
          <div className="w-24 h-1 bg-blue-600 mx-auto mt-6 rounded-full"></div>
        </div>

        {brokers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {brokers.map((broker, index) => (
              <div key={broker.id || index} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-shadow text-center p-6 flex flex-col items-center">
                
                <div className="w-32 h-32 rounded-full overflow-hidden mb-6 border-4 border-blue-50 shadow-sm mx-auto bg-slate-100 flex items-center justify-center">
                  {broker.profileImageUrl ? (
                    <img src={broker.profileImageUrl} alt={broker.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle size={64} className="text-slate-300" />
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-1">{broker.name}</h3>
                <p className="text-sm font-semibold text-blue-600 mb-4">CRECI: {broker.creci || 'Não informado'}</p>

                <div className="w-full space-y-3 mt-auto pt-6 border-t border-slate-100">
                  <a 
                    href={`https://wa.me/55${broker.phone?.replace(/\D/g, '')}?text=Olá ${broker.name}, vim pelo site e gostaria da sua ajuda para encontrar um imóvel.`}
                    target="_blank" rel="noopener noreferrer"
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Phone size={18} /> Contactar via WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
            <UserCircle size={64} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-800">Nenhum corretor listado de momento.</h3>
            <p className="text-slate-500 mt-2">A equipa ainda não configurou os perfis públicos.</p>
          </div>
        )}
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