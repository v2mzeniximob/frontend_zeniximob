'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { Building, Bed, Car, Maximize, MessageCircle, X, CheckCircle2, MapPin, Phone, Mail, User } from 'lucide-react';

export default function LojaPublicaPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [realEstate, setRealEstate] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [brokers, setBrokers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados do Modal de Interesse
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [selectedBroker, setSelectedBroker] = useState<any | null>(null);
  const [isLeadSent, setIsLeadSent] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientMessage, setClientMessage] = useState('');

  // Filtros da Loja
  const [filterCategory, setFilterCategory] = useState('all'); // Residencial / Comercial
  const [filterTransaction, setFilterTransaction] = useState('all'); // Venda / Aluguel

  useEffect(() => {
    async function fetchStoreData() {
      try {
        // Busca os dados públicos da imobiliária pelo slug
        const res = await api.get(`/public/stores/${slug}`);
        setRealEstate(res.data.realEstate);
        setProperties(res.data.properties);
        setBrokers(res.data.brokers);
      } catch (error) {
        console.error('Imobiliária não encontrada:', error);
      } finally {
        setIsLoading(false);
      }
    }
    if (slug) fetchStoreData();
  }, [slug]);

  const filteredProperties = properties.filter(p => {
    const matchCategory = filterCategory === 'all' || p.category === filterCategory;
    const matchTrans = filterTransaction === 'all' || p.transaction === filterTransaction;
    return matchCategory && matchTrans && p.isActive;
  });

  async function handleSendLead(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/public/leads', {
        name: clientName,
        phone: clientPhone,
        notes: clientMessage,
        propertyId: selectedProperty?.id || null,
        brokerId: selectedBroker?.id || null,
        realEstateId: realEstate.id,
        interest: selectedProperty?.transaction || 'Geral',
        status: 'Novo'
      });
      setIsLeadSent(true);
      setTimeout(() => {
        setIsLeadSent(false);
        setSelectedProperty(null);
        setSelectedBroker(null);
        setClientName('');
        setClientPhone('');
        setClientMessage('');
      }, 3000);
    } catch (error) {
      alert('Erro ao enviar mensagem.');
    }
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">A carregar vitrine da imobiliária...</div>;
  }

  if (!realEstate) {
    return <div className="min-h-screen flex flex-col items-center justify-center text-slate-600"><h1 className="text-2xl font-bold mb-2">Imobiliária não encontrada</h1><p>Verifique o endereço digitado.</p></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header com a Marca da Imobiliária */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold text-2xl shadow-md">
              {realEstate.tradeName?.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800">{realEstate.tradeName}</h1>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin size={12}/> {realEstate.address}</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <span className="flex items-center gap-1.5"><Phone size={16} className="text-emerald-600"/> {realEstate.phone}</span>
            <button onClick={() => setSelectedBroker({ name: 'Atendimento Geral' })} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-colors">
              Fale Connosco
            </button>
          </div>
        </div>
      </header>

      {/* Banner / Filtros */}
      <div className="bg-slate-900 text-white py-16 px-6 text-center">
        <h2 className="text-3xl font-extrabold mb-3">Imóveis Exclusivos</h2>
        <p className="text-slate-400 max-w-lg mx-auto mb-8 text-sm">Confira as melhores oportunidades selecionadas pela nossa equipa.</p>
        
        <div className="max-w-3xl mx-auto bg-white p-4 rounded-2xl shadow-xl flex flex-col md:flex-row gap-3">
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl outline-none">
            <option value="all">Todas as Categorias</option>
            <option value="Residencial">Residencial</option>
            <option value="Comercial">Comercial</option>
          </select>

          <select value={filterTransaction} onChange={e => setFilterTransaction(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl outline-none">
            <option value="all">Comprar ou Alugar</option>
            <option value="Venda">Comprar (Venda)</option>
            <option value="Aluguel">Alugar</option>
          </select>
        </div>
      </div>

      {/* Grid de Imóveis */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {filteredProperties.length === 0 ? (
          <div className="text-center py-20 text-slate-400">Nenhum imóvel disponível no momento.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map(prop => (
              <div key={prop.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col">
                <div className="h-56 bg-slate-100 relative">
                  {prop.imageUrls && prop.imageUrls.length > 0 ? (
                    <img src={prop.imageUrls[0]} alt={prop.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400"><Building size={40}/></div>
                  )}
                  <span className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    {prop.transaction}
                  </span>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 line-clamp-1 mb-1">{prop.title}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mb-4"><MapPin size={14}/> {prop.address}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-6 bg-slate-50 p-3 rounded-xl">
                      <span className="flex items-center gap-1"><Maximize size={14}/> {prop.area} m²</span>
                      <span className="flex items-center gap-1"><Bed size={14}/> {prop.bedrooms} Qts</span>
                      <span className="flex items-center gap-1"><Car size={14}/> {prop.garage} Vagas</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-xl font-extrabold text-emerald-600">{formatCurrency(prop.price)}</span>
                    <button onClick={() => setSelectedProperty(prop)} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5">
                      <MessageCircle size={16} /> Tenho Interesse
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Secção de Corretores da Loja */}
        {brokers.length > 0 && (
          <div className="mt-20 border-t border-slate-200 pt-16">
            <h3 className="text-2xl font-bold text-slate-800 mb-8 text-center">Fale Direto com Nossos Corretores</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {brokers.map(broker => (
                <div key={broker.id} className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
                      {broker.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{broker.name}</h4>
                      <p className="text-xs text-slate-400">CRECI: {broker.creci}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedBroker(broker)} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 p-2.5 rounded-xl transition-colors" title="Contactar Corretor">
                    <MessageCircle size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal de Lead */}
      {(selectedProperty || selectedBroker) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Fale com {selectedBroker ? selectedBroker.name : 'a Imobiliária'}</h3>
                <p className="text-xs text-slate-400 line-clamp-1">{selectedProperty ? selectedProperty.title : realEstate.tradeName}</p>
              </div>
              <button onClick={() => { setSelectedProperty(null); setSelectedBroker(null); }} className="text-slate-400 hover:text-white"><X size={20}/></button>
            </div>

            {isLeadSent ? (
              <div className="p-12 text-center space-y-3">
                <CheckCircle2 size={48} className="text-emerald-500 mx-auto" />
                <h4 className="font-bold text-xl text-slate-800">Mensagem Enviada com Sucesso!</h4>
                <p className="text-sm text-slate-500">O responsável entrará em contacto connosco em breve.</p>
              </div>
            ) : (
              <form onSubmit={handleSendLead} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Seu Nome</label>
                  <input type="text" required value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Ex: Carlos Silva" className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp / Telefone</label>
                  <input type="text" required value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="(00) 00000-0000" className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem</label>
                  <textarea rows={3} value={clientMessage} onChange={e => setClientMessage(e.target.value)} placeholder="Tenho interesse e gostaria de mais informações." className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 resize-none"></textarea>
                </div>
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-colors">
                  Enviar Mensagem
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}