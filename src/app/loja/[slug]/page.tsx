'use client';

import { useState, useEffect, use } from 'react';
import { api } from '../../../lib/api';
import { 
  MapPin, Phone, Mail, Home, Loader2, BedDouble, Bath, Car, 
  Search, Heart 
} from 'lucide-react';
import Link from 'next/link';

export default function VitrineLojaPage(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  const slug = params?.slug;

  const [storeData, setStoreData] = useState<any>(null);
  const [propertiesRent, setPropertiesRent] = useState<any[]>([]);
  const [propertiesSale, setPropertiesSale] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros da barra de pesquisa
  const [searchFilter, setSearchFilter] = useState({ transaction: 'Todos', type: 'Todos' });

  useEffect(() => {
    if (!slug) return;

    const fetchVitrine = async () => {
      try {
        const response = await api.get(`/public/stores/${slug}`);
        setStoreData(response.data.realEstate);
        
        const allProperties = response.data.properties || [];
        
        // CORREÇÃO AQUI: Procurar pela palavra exata salva no banco de dados ("Locação")
        setPropertiesRent(allProperties.filter((p: any) => p.transaction === 'Locação' || p.transaction === 'Aluguel' || p.transaction === 'Venda e Locação'));
        setPropertiesSale(allProperties.filter((p: any) => p.transaction === 'Venda' || p.transaction === 'Venda e Locação'));
      } catch (err: any) {
        setError(err.response?.data?.error || 'Erro ao carregar a imobiliária.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVitrine();
  }, [slug]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Componente de Card de Imóvel (Para reutilizar nas duas listas)
  const PropertyCard = ({ prop }: { prop: any }) => (
    <Link href={`/loja/${slug}/imovel/${prop.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 flex flex-col h-full">
        <div className="relative h-48 bg-slate-100 overflow-hidden">
          {prop.imageUrls && prop.imageUrls.length > 0 ? (
            <img src={prop.imageUrls[0]} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300"><Home size={40} /></div>
          )}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-slate-700 shadow-sm">
            {prop.transaction}
          </div>
          <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-white transition-colors shadow-sm">
            <Heart size={16} />
          </button>
        </div>
        
        <div className="p-4 flex flex-col flex-1">
          <p className="text-xs font-bold text-blue-600 mb-1 uppercase tracking-wider">{prop.type}</p>
          <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 mb-2 leading-tight min-h-[2.5rem]">
            {prop.title}
          </h3>
          <p className="text-slate-500 text-xs flex items-start gap-1 mb-4">
            <MapPin size={14} className="shrink-0" /> {prop.neighborhood ? `${prop.neighborhood}, ${prop.city}` : prop.address}
          </p>
          
          <div className="mt-auto border-t border-slate-100 pt-4 flex items-end justify-between">
            <div>
              <p className="text-lg font-extrabold text-slate-900">
                {formatCurrency(prop.price)}
                {/* CORREÇÃO AQUI TAMBÉM */}
                {(prop.transaction === 'Locação' || prop.transaction === 'Aluguel') && <span className="text-xs font-normal text-slate-500"> / mês</span>}
              </p>
            </div>
            
            <div className="flex gap-2 text-slate-400">
              {prop.bedrooms > 0 && <div className="flex items-center gap-1 text-xs" title="Quartos"><BedDouble size={14}/> {prop.bedrooms}</div>}
              {prop.bathrooms > 0 && <div className="flex items-center gap-1 text-xs" title="Banheiros"><Bath size={14}/> {prop.bathrooms}</div>}
              {prop.garage > 0 && <div className="flex items-center gap-1 text-xs" title="Vagas"><Car size={14}/> {prop.garage}</div>}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

  if (isLoading) return <div className="min-h-screen flex flex-col items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600 mb-4" size={40} /><p className="text-slate-500">A preparar o site...</p></div>;
  if (error || !storeData) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><h1 className="text-2xl font-bold text-slate-800">{error || 'Imobiliária não encontrada.'}</h1></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* 1. CABEÇALHO */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link href={`/loja/${slug}`}>
            {storeData.logoUrl ? (
              <img src={storeData.logoUrl} alt={storeData.tradeName} className="h-12 object-contain" />
            ) : (
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{storeData.tradeName}</h1>
            )}
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <Link href={`/loja/${slug}`} className="text-blue-600">Início</Link>
            <a href="#locacao" className="hover:text-blue-600 transition-colors">Locação</a>
            <a href="#venda" className="hover:text-blue-600 transition-colors">Venda</a>
            <Link href={`/loja/${slug}/sobre`} className="hover:text-blue-600 transition-colors">Sobre Nós</Link>
            <Link href={`/loja/${slug}/corretores`} className="hover:text-blue-600 transition-colors">Corretores</Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <div className="flex flex-col text-right">
              <span className="text-xs text-slate-500">Ligue para nós</span>
              <span className="text-sm font-bold text-slate-900">{storeData.phone}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. HERO BANNER & BARRA DE PESQUISA */}
      <section className="relative w-full h-[450px] flex items-center justify-center">
        <div className="absolute inset-0 bg-slate-900 overflow-hidden">
          {storeData.heroImageUrl ? (
            <img src={storeData.heroImageUrl} className="w-full h-full object-cover opacity-60 mix-blend-overlay" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-900 to-slate-900"></div>
          )}
        </div>

        <div className="relative z-10 w-full max-w-5xl px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-8 drop-shadow-md">
            Encontre o imóvel dos seus sonhos
          </h2>
          
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-1/4">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Pretendido</label>
              <select value={searchFilter.transaction} onChange={e => setSearchFilter({...searchFilter, transaction: e.target.value})} className="w-full border-b-2 border-slate-200 pb-2 text-slate-800 font-medium outline-none focus:border-blue-600 bg-transparent">
                <option value="Todos">Comprar ou Alugar</option>
                <option value="Venda">Comprar</option>
                <option value="Locação">Alugar</option>
              </select>
            </div>
            <div className="w-full md:w-1/4">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tipo de Imóvel</label>
              <select value={searchFilter.type} onChange={e => setSearchFilter({...searchFilter, type: e.target.value})} className="w-full border-b-2 border-slate-200 pb-2 text-slate-800 font-medium outline-none focus:border-blue-600 bg-transparent">
                <option value="Todos">Todos os tipos</option>
                <option value="Apartamento">Apartamento</option>
                <option value="Casa">Casa</option>
                <option value="Terreno">Terreno</option>
                <option value="Comercial">Comercial</option>
              </select>
            </div>
            <div className="w-full md:w-2/4">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Localização</label>
              <div className="relative">
                <Search size={18} className="absolute left-0 top-1 text-slate-400" />
                <input type="text" placeholder="Digite cidade ou bairro..." className="w-full pl-7 border-b-2 border-slate-200 pb-2 text-slate-800 font-medium outline-none focus:border-blue-600 bg-transparent" />
              </div>
            </div>
            <button className="w-full md:w-auto bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold px-8 py-3 rounded-xl transition-colors whitespace-nowrap shadow-md">
              BUSCAR IMÓVEIS
            </button>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-16 space-y-20">
        
        {/* 3. SECÇÃO DE LOCAÇÃO */}
        {propertiesRent.length > 0 && (
          <section id="locacao">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-800">Imóveis mais visualizados para Locação</h2>
              <div className="w-24 h-1 bg-blue-600 mx-auto mt-4 rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {propertiesRent.slice(0, 8).map(prop => <PropertyCard key={prop.id} prop={prop} />)}
            </div>
            {propertiesRent.length > 8 && (
              <div className="text-center mt-10">
                <button className="border-2 border-slate-800 text-slate-800 font-bold px-8 py-3 rounded-full hover:bg-slate-800 hover:text-white transition-colors">
                  Ver mais imóveis para alugar
                </button>
              </div>
            )}
          </section>
        )}

        {/* 4. SECÇÃO DE VENDA */}
        {propertiesSale.length > 0 && (
          <section id="venda">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-800">Imóveis mais visualizados para Venda</h2>
              <div className="w-24 h-1 bg-blue-600 mx-auto mt-4 rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {propertiesSale.slice(0, 8).map(prop => <PropertyCard key={prop.id} prop={prop} />)}
            </div>
            {propertiesSale.length > 8 && (
              <div className="text-center mt-10">
                <button className="border-2 border-slate-800 text-slate-800 font-bold px-8 py-3 rounded-full hover:bg-slate-800 hover:text-white transition-colors">
                  Ver mais imóveis à venda
                </button>
              </div>
            )}
          </section>
        )}

      </main>

      {/* Botão Flutuante do WhatsApp */}
      {storeData.whatsappDisplay && (
        <a 
          href={`https://wa.me/55${storeData.whatsappDisplay.replace(/\D/g, '')}?text=Olá! Vim pelo site e gostaria de mais informações.`}
          target="_blank" rel="noopener noreferrer"
          className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 hover:bg-green-600 transition-all z-50 flex items-center justify-center"
        >
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
        </a>
      )}

      {/* 5. RODAPÉ */}
      <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Coluna 1: Sobre */}
          <div>
            {storeData.logoUrl ? (
              <img src={storeData.logoUrl} alt="Logo" className="h-10 object-contain mb-6 brightness-0 invert opacity-90" />
            ) : (
              <h3 className="text-xl font-bold text-white mb-6">{storeData.tradeName}</h3>
            )}
            <p className="text-sm leading-relaxed mb-6">
              {storeData.footerText || 'Especialistas em realizar os seus sonhos. Encontre as melhores opções de compra, venda e locação.'}
            </p>
            <div className="flex gap-4">
              {storeData.instagramUrl && (
                <a href={storeData.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
              )}
              {storeData.facebookUrl && (
                <a href={storeData.facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
              )}
            </div>
          </div>

          {/* Coluna 2: Navegação */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Navegação</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href={`/loja/${slug}`} className="hover:text-white transition-colors">Home</Link></li>
              <li><a href="#locacao" className="hover:text-white transition-colors">Imóveis para Locação</a></li>
              <li><a href="#venda" className="hover:text-white transition-colors">Imóveis à Venda</a></li>
              <li><Link href={`/loja/${slug}/sobre`} className="hover:text-white transition-colors">Quem Somos</Link></li>
              <li><Link href={`/loja/${slug}/corretores`} className="hover:text-white transition-colors">Nossa Equipe</Link></li>
            </ul>
          </div>

          {/* Coluna 3: Matriz / Contato */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Matriz</h4>
            <ul className="space-y-4 text-sm">
              <li><p className="font-semibold text-white">{storeData.tradeName}</p></li>
              <li className="flex items-start gap-3">
                <MapPin size={18} className="shrink-0 mt-0.5 text-slate-500" />
                <span>{storeData.address}, {storeData.cep}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-slate-500" />
                <span>{storeData.phone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-slate-500" />
                <span>{storeData.email}</span>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Outros Links (Opcional) */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Outros Links</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Área do Locador</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Área do Locatário</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Políticas de Privacidade</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
            </ul>
          </div>

        </div>
        
        <div className="max-w-7xl mx-auto px-4 border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs">
          <p>© {new Date().getFullYear()} {storeData.corporateName}. Todos os direitos reservados.</p>
          <p className="mt-2 md:mt-0">Desenvolvido por <span className="font-bold text-white">ZenixImob</span></p>
        </div>
      </footer>
    </div>
  );
}