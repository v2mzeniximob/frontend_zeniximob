'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../../lib/api';
import { 
  MapPin, Phone, Mail, Home, Loader2, BedDouble, Bath, Car, 
  CheckCircle2, Ruler, Calendar, Send, ChevronLeft, Building2, 
  ImageIcon
} from 'lucide-react';
import Link from 'next/link';

export default function DetalheImovelPage({ params }: { params: { slug: string, propertyId: string } }) {
  const [storeData, setStoreData] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados do formulário de Lead
  const [leadForm, setLeadForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [isSendingLead, setIsSendingLead] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        const response = await api.get(`/public/stores/${params.slug}/properties/${params.propertyId}`);
        setStoreData(response.data.realEstate);
        setProperty(response.data.property);
      } catch (err) {
        setError('Imóvel não encontrado ou indisponível.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPropertyDetails();
  }, [params.slug, params.propertyId]);

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

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Home size={64} className="text-slate-300 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800">Ups!</h1>
        <p className="text-slate-500 mt-2">{error}</p>
        <Link href={`/loja/${params.slug}`} className="mt-6 text-blue-600 font-medium hover:underline">Voltar para a vitrine</Link>
      </div>
    );
  }

  // Organizar imagens para a galeria (1 destaque + 4 secundárias)
  const images = property.imageUrls && property.imageUrls.length > 0 ? property.imageUrls : [];
  const mainImage = images[0] || null;
  const secondaryImages = images.slice(1, 5);

  // Endereço para o iFrame do Google Maps
  const mapQuery = encodeURIComponent(`${property.neighborhood || ''}, ${property.city || ''}, ${property.state || ''}, Brasil`);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      
      {/* HEADER DA LOJA E NAVEGAÇÃO */}
      <header className="bg-white border-b border-slate-200 py-4 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <Link href={`/loja/${params.slug}`} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium text-sm">
            <ChevronLeft size={18} /> Voltar para Imóveis
          </Link>
          <div className="text-right">
            <h2 className="font-bold text-slate-800">{storeData.tradeName}</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1 justify-end"><Phone size={12}/> {storeData.phone}</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-6">
        
        {/* GALERIA DE FOTOS (Estilo Airbnb/NovaEstate) */}
        {mainImage ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[300px] md:h-[500px] rounded-2xl overflow-hidden mb-8">
            <div className="md:col-span-2 relative h-full group cursor-pointer">
              <img src={mainImage} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="hidden md:grid grid-cols-2 col-span-2 gap-2 h-full">
              {secondaryImages.map((img: string, index: number) => (
                <div key={index} className="relative h-full overflow-hidden group cursor-pointer">
                  <img src={img} alt={`Foto ${index + 2}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
              {/* Preencher espaços vazios se tiver menos de 5 fotos */}
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
          
          {/* COLUNA ESQUERDA (Detalhes do Imóvel - 70%) */}
          <div className="flex-1 space-y-10">
            
            {/* Título e Tags */}
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

            {/* Ficha Rápida (Ícones) */}
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

            {/* Descrição */}
            <div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Sobre o Imóvel</h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line text-lg">
                {property.description || 'Nenhuma descrição fornecida para este imóvel.'}
              </p>
            </div>

            {/* Comodidades (Amenities) */}
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

            {/* Localização / Mapa */}
            <div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Localização</h3>
              <p className="text-slate-600 mb-4">{property.address}, {property.neighborhood} - {property.city}/{property.state}</p>
              <div className="w-full h-[400px] bg-slate-200 rounded-2xl overflow-hidden border border-slate-200">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=AQUI_VAI_A_SUA_CHAVE_DO_GOOGLE_MAPS_SE_TIVER&q=${mapQuery}`}
                ></iframe>
                {/* NOTA: Como um iframe grátis do Google Maps precisa de chave de API para funcionar perfeitamente, 
                    como alternativa grátis podemos usar o OpenStreetMap: */}
                <iframe 
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  scrolling="no" 
                  marginHeight={0} 
                  marginWidth={0} 
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=-46.8%2C-23.7%2C-46.4%2C-23.4&layer=mapnik&marker=${property.latitude || '-23.5505'},${property.longitude || '-46.6333'}`}
                  className="hidden" // Remova o hidden se quiser usar o OpenStreetMap em vez do Google
                ></iframe>
              </div>
              <p className="text-xs text-slate-400 mt-2">* A localização no mapa indica a região do bairro para segurança do proprietário.</p>
            </div>

          </div>

          {/* COLUNA DIREITA (Formulário e Preços - 30%) */}
          <div className="w-full lg:w-[400px]">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100 sticky top-24">
              
              {/* Box de Preço */}
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

              {/* Box do Corretor */}
              {property.broker && (
                <div className="mb-6 flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
                    {property.broker.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase">Corretor Responsável</p>
                    <p className="font-bold text-slate-800">{property.broker.name}</p>
                    <p className="text-xs text-slate-500">CRECI: {property.broker.creci}</p>
                  </div>
                </div>
              )}

              {/* Formulário de Contato */}
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">Agendar Visita / Proposta</h3>
                
                {leadSuccess ? (
                  <div className="bg-green-50 text-green-800 p-6 rounded-2xl text-center border border-green-200">
                    <CheckCircle2 size={40} className="mx-auto text-green-500 mb-3" />
                    <h4 className="font-bold text-lg mb-1">Mensagem Enviada!</h4>
                    <p className="text-sm">Obrigado! Um dos nossos corretores entrará em contato consigo em breve.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSendLead} className="space-y-4">
                    <div>
                      <input required type="text" placeholder="Seu Nome Completo" value={leadForm.name} onChange={e => setLeadForm({...leadForm, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                    </div>
                    <div>
                      <input required type="text" placeholder="Telefone / WhatsApp" value={leadForm.phone} onChange={e => setLeadForm({...leadForm, phone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                    </div>
                    <div>
                      <input type="email" placeholder="Seu E-mail (Opcional)" value={leadForm.email} onChange={e => setLeadForm({...leadForm, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                    </div>
                    <div>
                      <textarea placeholder="Olá, tenho interesse neste imóvel e gostaria de mais informações..." value={leadForm.message} onChange={e => setLeadForm({...leadForm, message: e.target.value})} rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"></textarea>
                    </div>

                    <button type="submit" disabled={isSendingLead} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-70 text-lg">
                      {isSendingLead ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                      {isSendingLead ? 'A Enviar...' : 'Falar com Corretor'}
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-2">Os seus dados estão seguros connosco.</p>
                  </form>
                )}
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}