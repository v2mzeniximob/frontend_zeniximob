'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { MapPin, Phone, Mail, Home, Loader2, BedDouble, Bath, Car } from 'lucide-react';
import Link from 'next/link';

export default function VitrineLojaPage({ params }: { params: { slug: string } }) {
  const [storeData, setStoreData] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVitrine = async () => {
      if (!params?.slug) return;

      try {
        console.log('A carregar loja para o slug:', params.slug);
        const response = await api.get(`/public/stores/${params.slug}`);
        console.log('Resposta da loja recebida:', response.data);
        
        setStoreData(response.data.realEstate);
        setProperties(response.data.properties || []);
      } catch (err: any) {
        console.error('Erro ao carregar vitrine:', err);
        setError(err.response?.data?.error || err.message || 'Erro ao conectar ao servidor.');
      } finally {
        setIsLoading(false); // Garante sempre a saída do loop de loading
      }
    };

    fetchVitrine();
  }, [params?.slug]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-sm text-slate-500 font-medium">A carregar a vitrine da imobiliária...</p>
      </div>
    );
  }

  if (error || !storeData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <Home size={64} className="text-slate-300 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800">Loja não encontrada</h1>
        <p className="text-slate-500 mt-2 max-w-md">{error || 'Imobiliária não encontrada ou indisponível no momento.'}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      <header className="bg-white border-b border-slate-200 py-8 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-slate-900">{storeData.tradeName}</h1>
            <p className="text-slate-500 mt-1">{storeData.corporateName}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Phone size={16} /></div>
              <span>{storeData.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Mail size={16} /></div>
              <span>{storeData.email}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">Imóveis Disponíveis ({properties.length})</h2>
        </div>

        {properties.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-100 shadow-sm">
            <Home size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-700">Nenhum imóvel disponível de momento.</h3>
            <p className="text-slate-500 mt-2">Esta imobiliária ainda não publicou propriedades na sua vitrine.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((prop) => (
              <div key={prop.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-shadow group flex flex-col">
                <div className="relative h-56 bg-slate-100 overflow-hidden">
                  {prop.imageUrls && prop.imageUrls.length > 0 ? (
                    <img src={prop.imageUrls[0]} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300"><Home size={48} /></div>
                  )}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-slate-700 shadow-sm">
                    {prop.transaction}
                  </div>
                  <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                    {prop.category}
                  </div>
                </div>
                
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-slate-800 line-clamp-1 mb-1">{prop.title}</h3>
                  <p className="text-slate-500 text-sm flex items-start gap-1 mb-4 line-clamp-2">
                    <MapPin size={14} className="mt-0.5 shrink-0" /> {prop.neighborhood ? `${prop.neighborhood}, ${prop.city}` : prop.address}
                  </p>
                  
                  <div className="grid grid-cols-3 gap-2 border-y border-slate-50 py-3 mb-4">
                    <div className="flex flex-col items-center justify-center gap-1 text-slate-600"><BedDouble size={18} className="text-slate-400"/> <span className="text-xs font-medium">{prop.bedrooms} Quartos</span></div>
                    <div className="flex flex-col items-center justify-center gap-1 text-slate-600 border-x border-slate-50"><Bath size={18} className="text-slate-400"/> <span className="text-xs font-medium">{prop.bathrooms} Banheiros</span></div>
                    <div className="flex flex-col items-center justify-center gap-1 text-slate-600"><Car size={18} className="text-slate-400"/> <span className="text-xs font-medium">{prop.garage} Vagas</span></div>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Valor do Imóvel</p>
                      <p className="text-xl font-bold text-blue-600">{formatCurrency(prop.price)}</p>
                    </div>
                    <Link 
                      href={`/loja/${params.slug}/imovel/${prop.id}`}
                      className="bg-slate-900 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block text-center"
                    >
                      Ver Detalhes
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}