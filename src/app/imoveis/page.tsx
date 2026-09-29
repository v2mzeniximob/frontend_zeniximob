'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { maskPhone } from '@/src/utils/mask'; // ou '../../utils/masks' dependendo da estrutura
import { Search, MapPin, Building, Bed, Car, Maximize, MessageCircle, X, CheckCircle2, Loader2 } from 'lucide-react';

export default function VitrinePublicaPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [isLeadSent, setIsLeadSent] = useState(false);

  // Estados do formulário de contato do cliente
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientMessage, setClientMessage] = useState('');

  // Filtros públicos
  const [filterType, setFilterType] = useState('all');
  const [filterTransaction, setFilterTransaction] = useState('all');

  useEffect(() => {
    async function fetchPublicProperties() {
      try {
        // Rota pública para listar todos os imóveis disponíveis de todas as lojas
        const res = await api.get('/public/properties').catch(() => ({ data: [] }));
        setProperties(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPublicProperties();
  }, []);

  const filtered = properties.filter(p => {
    const matchType = filterType === 'all' || p.type === filterType;
    const matchTrans = filterTransaction === 'all' || p.transaction === filterTransaction;
    return matchType && matchTrans && p.isActive;
  });

  async function handleSendLead(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/public/leads', {
        name: clientName,
        phone: clientPhone,
        notes: clientMessage,
        propertyId: selectedProperty.id,
        realEstateId: selectedProperty.realEstateId, // Direciona o Lead direto para a Imobiliária dona do imóvel!
        interest: selectedProperty.transaction,
        status: 'Novo'
      });
      setIsLeadSent(true);
      setTimeout(() => {
        setIsLeadSent(false);
        setSelectedProperty(null);
        setClientName('');
        setClientPhone('');
        setClientMessage('');
      }, 3000);
    } catch (error) {
      alert('Erro ao enviar mensagem. Tente novamente.');
    }
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header Público */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl">Z</div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">ZenixImob <span className="text-emerald-600 text-xs uppercase bg-emerald-50 px-2 py-0.5 rounded-full">Vitrine</span></span>
          </div>
          <a href="/login" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Área Restrita (Login)</a>
        </div>
      </header>

      {/* Hero / Filtros */}
      <div className="bg-slate-900 text-white py-16 px-6 text-center">
        <h1 className="text-4xl font-extrabold mb-4">Encontre o Imóvel dos Seus Sonhos</h1>
        <p className="text-slate-400 max-w-xl mx-auto mb-8">Navegue pelas melhores oportunidades da nossa rede de imobiliárias parceiras.</p>
        
        <div className="max-w-3xl mx-auto bg-white p-4 rounded-2xl shadow-xl flex flex-col md:flex-row gap-3">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl outline-none">
            <option value="all">Todos os Tipos</option>
            <option value="Casa">Casa</option>
            <option value="Apartamento">Apartamento</option>
            <option value="Terreno">Terreno</option>
            <option value="Comercial">Comercial</option>
          </select>

          <select value={filterTransaction} onChange={e => setFilterTransaction(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl outline-none">
            <option value="all">Comprar ou Alugar</option>
            <option value="Venda">Comprar (Venda)</option>
            <option value="Aluguel">Alugar</option>
          </select>
        </div>
      </div>

      {/* Listagem de Imóveis */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="text-center py-20 text-slate-400"><Loader2 className="animate-spin inline mr-2" /> Carregando imóveis disponíveis...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">Nenhum imóvel encontrado com estes filtros.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map(prop => (
              <div key={prop.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="h-56 bg-slate-100 relative">
                  {prop.imageUrl ? (
                    <img src={prop.imageUrl} alt={prop.title} className="w-full h-full object-cover" />
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
      </main>

      {/* Modal de Contato com o Corretor / Imobiliária */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Demonstrar Interesse</h3>
                <p className="text-xs text-slate-400 line-clamp-1">{selectedProperty.title}</p>
              </div>
              <button onClick={() => setSelectedProperty(null)} className="text-slate-400 hover:text-white"><X size={20}/></button>
            </div>

            {isLeadSent ? (
              <div className="p-12 text-center space-y-3">
                <CheckCircle2 size={48} className="text-emerald-500 mx-auto" />
                <h4 className="font-bold text-xl text-slate-800">Mensagem Enviada!</h4>
                <p className="text-sm text-slate-500">Um corretor da imobiliária responsável entrará em contacto connosco em breve.</p>
              </div>
            ) : (
              <form onSubmit={handleSendLead} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Seu Nome Completo</label>
                  <input type="text" required value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Ex: Maria Souza" className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp / Telefone</label>
                  <input type="text" required value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="(00) 00000-0000" className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem</label>
                  <textarea rows={3} value={clientMessage} onChange={e => setClientMessage(e.target.value)} placeholder="Olá, gostaria de agendar uma visita para este imóvel." className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 resize-none"></textarea>
                </div>
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-colors">
                  Enviar Mensagem para a Imobiliária
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}