'use client';

import { useState, useEffect, use } from 'react';
import { api } from '../../../../../lib/api';
import { 
  MapPin, Phone, Mail, Home, Loader2, BedDouble, Bath, Car, 
  CheckCircle2, Ruler, Calendar, Send, ChevronLeft, ChevronRight, 
  X, Building2, Image as ImageIcon 
} from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    slug: string;
    propertyId: string;
  }>;
}

export default function DetalheImovelPage(props: PageProps) {
  const params = use(props.params);
  const slug = params?.slug;
  const propertyId = params?.propertyId;

  const [storeData, setStoreData] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
  const [similarProperties, setSimilarProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados do formulário de Lead
  const [leadForm, setLeadForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [isSendingLead, setIsSendingLead] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);

  // Estados da Galeria Ampliada (Lightbox)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!slug || !propertyId) return;

    const fetchPropertyDetails = async () => {
      try {
        // 1. Busca os detalhes do imóvel atual
        const response = await api.get(`/public/stores/${slug}/properties/${propertyId}`);
        setStoreData(response.data.realEstate);
        setProperty(response.data.property);

        // 2. Busca todos os imóveis da loja para as sugestões (Imóveis Semelhantes)
        const storeResponse = await api.get(`/public/stores/${slug}`);
        const allProperties = storeResponse.data.properties || [];
        
        // Filtra para remover o imóvel atual e priorizar o mesmo tipo/transação
        const filtered = allProperties.filter((p: any) => p.id !== propertyId);
        setSimilarProperties(filtered.slice(0, 3)); // Pega até 3 sugestões

      } catch (err: any) {
        console.error('Erro ao buscar detalhes:', err);
        setError(err.response?.data?.error || 'Imóvel não encontrado ou indisponível.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPropertyDetails();
  }, [slug, propertyId]);

  const handleSendLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingLead(true);
    try {
      await api.post('/public/leads', {
        name: leadForm.name,
        phone: leadForm.phone,
        email: leadForm.email,
        notes: leadForm.message,
        propertyId: property.id,
        brokerId: property.broker?.id || null,
        realEstateId: storeData.id,
        interest: 'Tenho interesse neste imóvel'
      });
      setLeadSuccess(true);
      setLeadForm({ name: '', phone: '', email: '', message: '' });
    } catch (err) {
      alert('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setIsSendingLead(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Funções da Galeria Lightbox
  const images: string[] = property?.imageUrls && Array.isArray(property.imageUrls) ? property.imageUrls : [];
  const mainImage = images[0] || null;
  const secondaryImages = images.slice(1, 5);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  
  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % images.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-sm text-slate-500 font-medium">A carregar detalhes do imóvel...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <Home size={64} className="text-slate-300 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800">Imóvel não encontrado</h1>
        <p className="text-slate-500 mt-2">{error}</p>
        <Link href={`/loja/${slug}`} className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors">
          Voltar para a vitrine
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      
      {/* HEADER DA LOJA */}
      <header className="bg-white border-b border-slate-200 py-4 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <Link href={`/loja/${slug}`} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium text-sm">
            <ChevronLeft size={18} /> Voltar para Imóveis
          </Link>
          <div className="text-right">
            <h2 className="font-bold text-slate-800">{storeData?.tradeName}</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1 justify-end"><Phone size={12}/> {storeData?.phone}</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-6">
        
        {/* GALERIA DE FOTOS (CLICÁVEL) */}
        {mainImage ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[300px] md:h-[500px] rounded-2xl overflow-hidden mb-8">
            <div 
              className="md:col-span-2 relative h-full group cursor-pointer"
              onClick={() => openLightbox(0)}
            >
              <img src={mainImage} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                 <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-4 group-hover:translate-y-0 shadow-lg">
                    <ImageIcon className="text-slate-700" size={24} />
                 </div>
              </div>
            </div>
            <div className="hidden md:grid grid-cols-2 col-span-2 gap-2 h-full">
              {secondaryImages.map((img: string, index: number) => (
                <div 
                  key={index} 
                  className="relative h-full overflow-hidden group cursor-pointer"
                  onClick={() => openLightbox(index + 1)}
                >
                  <img src={img} alt={`Foto ${index + 2}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
              ))}
              {Array.from({ length: Math.max(0, 4 - secondaryImages.length) }).map((_, idx) => (
                <div key={`empty-${idx}`} className="bg-slate-200 h-full flex items-center justify-center text-slate-400">
                  <ImageIcon size={32} opacity={0.3} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full h-[400px] bg-slate-200 rounded-2xl mb-8 flex flex-col items-center justify-center text-slate-400">
            <Home size={64} opacity={0.5} />
            <p className="mt-4 font-medium">Sem fotos disponíveis</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* COLUNA ESQUERDA (Detalhes do Imóvel) */}
          <div className="flex-1 space-y-10">
            <div>
              <div className="flex gap-2 mb-3">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{property.transaction}</span>
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider">{property.type}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 leading-tight">{property.title}</h1>
              <p className="text-slate-500 flex items-start gap-2 text-lg">
                <MapPin className="mt-1 shrink-0 text-blue-500" size={20} />
                {property.neighborhood}, {property.city} - {property.state}
              </p>
            </div>

            <div className="flex flex-wrap gap-6 py-6 border-y border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Ruler size={24} /></div>
                <div><p className="text-xs text-slate-500 uppercase font-semibold">Área Útil</p><p className="font-bold text-slate-800 text-lg">{property.area} m²</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><BedDouble size={24} /></div>
                <div><p className="text-xs text-slate-500 uppercase font-semibold">Quartos</p><p className="font-bold text-slate-800 text-lg">{property.bedrooms}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Bath size={24} /></div>
                <div><p className="text-xs text-slate-500 uppercase font-semibold">Banheiros</p><p className="font-bold text-slate-800 text-lg">{property.bathrooms}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Car size={24} /></div>
                <div><p className="text-xs text-slate-500 uppercase font-semibold">Vagas</p><p className="font-bold text-slate-800 text-lg">{property.garage}</p></div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Sobre o Imóvel</h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line text-lg">
                {property.description || 'Nenhuma descrição fornecida para este imóvel.'}
              </p>
            </div>

            {property.amenities && property.amenities.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-slate-800 mb-6">Comodidades</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-2">
                  {property.amenities.map((amenity: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-700 font-medium">
                      <CheckCircle2 size={20} className="text-blue-500 shrink-0" />
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Localização</h3>
              <p className="text-slate-600 mb-4">{property.address}, {property.neighborhood} - {property.city}/{property.state}</p>
              <div className="w-full h-[400px] bg-slate-200 rounded-2xl overflow-hidden border border-slate-200">
                <iframe 
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  scrolling="no" 
                  marginHeight={0} 
                  marginWidth={0} 
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=-46.8%2C-23.7%2C-46.4%2C-23.4&layer=mapnik&marker=${property.latitude || '-23.5505'},${property.longitude || '-46.6333'}`}
                ></iframe>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA (Formulário e Preços) */}
          <div className="w-full lg:w-[400px]">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100 sticky top-24">
              <div className="mb-6 pb-6 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-1">Valor de {property.transaction}</p>
                <h2 className="text-4xl font-extrabold text-blue-600 mb-4">{formatCurrency(property.price)}</h2>
                <div className="flex items-center justify-between text-slate-600 mb-2">
                  <span className="flex items-center gap-2"><Building2 size={16}/> Condomínio</span>
                  <span className="font-semibold">{property.condoFee > 0 ? formatCurrency(property.condoFee) : 'Isento / Não inf.'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-2"><Calendar size={16}/> IPTU</span>
                  <span className="font-semibold">{property.iptu > 0 ? formatCurrency(property.iptu) : 'Isento / Não inf.'}</span>
                </div>
              </div>

              <form onSubmit={handleSendLead} className="space-y-4">
                <button type="submit" disabled={isSendingLead} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all text-lg">
                  <Send size={24} /> Falar com Corretor
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* SECÇÃO: IMÓVEIS SEMELHANTES */}
        {similarProperties.length > 0 && (
          <div className="mt-24 pt-12 border-t border-slate-200">
            <h3 className="text-2xl font-bold text-slate-800 mb-8">Outros imóveis que pode gostar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarProperties.map((prop) => (
                <Link key={prop.id} href={`/loja/${slug}/imovel/${prop.id}`} className="block group">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-lg transition-all h-full flex flex-col">
                    <div className="relative h-56 bg-slate-100 overflow-hidden">
                      {prop.imageUrls && prop.imageUrls.length > 0 ? (
                        <img src={prop.imageUrls[0]} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300"><Home size={48} /></div>
                      )}
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-slate-700">
                        {prop.transaction}
                      </div>
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-lg font-bold text-slate-800 line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors">{prop.title}</h3>
                      <p className="text-slate-500 text-sm flex items-start gap-1 mb-4 line-clamp-1">
                        <MapPin size={14} className="mt-0.5 shrink-0" /> {prop.neighborhood || prop.address}
                      </p>
                      
                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                        <div>
                          <p className="text-xl font-bold text-blue-600">{formatCurrency(prop.price)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL / LIGHTBOX DE IMAGENS EM ECRÃ INTEIRO */}
      {lightboxIndex !== null && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center"
          onClick={closeLightbox} // Clicar fora fecha a imagem
        >
          {/* Botão Fechar */}
          <button 
            onClick={closeLightbox} 
            className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-[110] p-2 bg-black/50 rounded-full"
          >
            <X size={32} />
          </button>

          {/* Botões de Navegação (Só mostra se houver mais de 1 foto) */}
          {images.length > 1 && (
            <>
              <button 
                onClick={prevImage} 
                className="absolute left-4 md:left-8 text-white/50 hover:text-white transition-colors z-[110] p-3 bg-black/50 hover:bg-black/80 rounded-full"
              >
                <ChevronLeft size={40} />
              </button>
              <button 
                onClick={nextImage} 
                className="absolute right-4 md:right-8 text-white/50 hover:text-white transition-colors z-[110] p-3 bg-black/50 hover:bg-black/80 rounded-full"
              >
                <ChevronRight size={40} />
              </button>
            </>
          )}

          {/* Imagem Principal */}
          <div 
            className="relative w-full max-w-6xl h-full flex items-center justify-center p-4 md:p-12"
            onClick={(e) => e.stopPropagation()} // Previne fechar ao clicar na foto
          >
            <img
              src={images[lightboxIndex]}
              alt={`Foto Ampliada ${lightboxIndex + 1}`}
              className="max-w-full max-h-full object-contain select-none shadow-2xl rounded-lg"
            />
          </div>

          {/* Contador de Imagens */}
          <div className="absolute bottom-6 text-white/70 font-medium tracking-widest bg-black/50 px-4 py-2 rounded-full text-sm">
             {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}