'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { 
  Plus, Edit, X, CheckCircle2, XCircle, Loader2, Home, 
  MapPin, DollarSign, Camera, User, UserCheck, FileSignature, 
  Key, Sparkles, Rss, Link as LinkIcon, Share2
} from 'lucide-react';

// Lista padrão de características (pode adicionar mais se precisar)
const AVAILABLE_AMENITIES = [
  'Piscina', 'Churrasqueira', 'Elevador', 'Academia', 
  'Quadra Poliesportiva', 'Varanda', 'Ar Condicionado', 
  'Móveis Planejados', 'Portaria 24h', 'Salão de Festas'
];

// Função local para aplicar a máscara do CEP
const maskCep = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');
};

export default function ImoveisPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [brokers, setBrokers] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [storeSlug, setStoreSlug] = useState<string>(''); // Para gerar o link do XML
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false); // Loading da IA

  // Estado inicial do formulário completo
  const [form, setForm] = useState({
    title: '', type: 'Casa', category: 'Residencial', transaction: 'Locação',
    price: '', condoFee: '', iptu: '',
    area: '', bedrooms: '', bathrooms: '', garage: '', yearBuilt: '',
    cep: '', address: '', neighborhood: '', city: '', state: '',
    description: '', imageUrls: '', brokerId: '', ownerId: '', inspectionUrl: '',
    rentProposalUrl: '', saleProposalUrl: '', keyTermUrl: '',
    exportToPortals: false, // NOVO CAMPO: Integração XML Portais
    amenities: [] as string[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resProps, resBrokers, resOwners, resStore] = await Promise.all([
        api.get('/properties'),
        api.get('/brokers'),
        api.get('/owners'),
        api.get('/my-store').catch(() => ({ data: {} }))
      ]);
      setProperties(resProps.data);
      setBrokers(resBrokers.data);
      setOwners(resOwners.data);
      if(resStore.data.slug) setStoreSlug(resStore.data.slug);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (property?: any) => {
    if (property) {
      setEditingId(property.id);
      setForm({
        title: property.title || '',
        type: property.type || 'Casa',
        category: property.category || 'Residencial',
        transaction: property.transaction || 'Locação',
        price: property.price || '',
        condoFee: property.condoFee || '',
        iptu: property.iptu || '',
        area: property.area || '',
        bedrooms: property.bedrooms || '',
        bathrooms: property.bathrooms || '',
        garage: property.garage || '',
        yearBuilt: property.yearBuilt || '',
        cep: property.cep || '',
        address: property.address || '',
        neighborhood: property.neighborhood || '',
        city: property.city || '',
        state: property.state || '',
        description: property.description || '',
        imageUrls: property.imageUrls ? property.imageUrls.join(', ') : '',
        brokerId: property.brokerId || '',
        ownerId: property.ownerId || '',
        inspectionUrl: property.inspectionUrl || '',
        rentProposalUrl: property.rentProposalUrl || '',
        saleProposalUrl: property.saleProposalUrl || '',
        keyTermUrl: property.keyTermUrl || '',
        exportToPortals: property.exportToPortals || false, // Carrega o status do XML
        amenities: property.amenities || []
      });
    } else {
      setEditingId(null);
      setForm({
        title: '', type: 'Casa', category: 'Residencial', transaction: 'Locação',
        price: '', condoFee: '', iptu: '', area: '', bedrooms: '', bathrooms: '', garage: '', yearBuilt: '',
        cep: '', address: '', neighborhood: '', city: '', state: '',
        description: '', imageUrls: '', brokerId: '', ownerId: '', inspectionUrl: '',
        rentProposalUrl: '', saleProposalUrl: '', keyTermUrl: '',
        exportToPortals: false,
        amenities: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const urlsArray = form.imageUrls.split(',').map(url => url.trim()).filter(url => url !== '');
    const dataToSend = { ...form, imageUrls: urlsArray };

    try {
      if (editingId) {
        await api.put(`/properties/${editingId}`, dataToSend);
        alert('Imóvel atualizado com sucesso!');
      } else {
        await api.post('/properties', dataToSend);
        alert('Imóvel cadastrado com sucesso!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar imóvel.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    if (!confirm('Deseja alterar o status de visibilidade deste imóvel?')) return;
    try {
      await api.patch(`/properties/${id}/status`);
      fetchData();
    } catch (error) {
      alert('Erro ao alterar status.');
    }
  };

  const handleToggleAmenity = (amenity: string) => {
    setForm(prev => {
      const isSelected = prev.amenities.includes(amenity);
      if (isSelected) {
        return { ...prev, amenities: prev.amenities.filter(a => a !== amenity) };
      } else {
        return { ...prev, amenities: [...prev.amenities, amenity] };
      }
    });
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCep(e.target.value);
    setForm({ ...form, cep: masked });

    if (masked.length === 9) {
      setIsFetchingCep(true);
      try {
        const rawCep = masked.replace(/\D/g, '');
        const response = await api.get(`/integrations/cep/${rawCep}`);
        const data = response.data;
        
        setForm(prev => ({
          ...prev,
          address: data.street || prev.address,
          neighborhood: data.neighborhood || prev.neighborhood,
          city: data.city || prev.city,
          state: data.state || prev.state
        }));
      } catch (error) {
        console.log('CEP não encontrado.');
      } finally {
        setIsFetchingCep(false);
      }
    }
  };

  // =========================================================
  // GERAÇÃO DE DESCRIÇÃO COM INTELIGÊNCIA ARTIFICIAL
  // =========================================================
  const handleGenerateAiDescription = async () => {
    // Validar se existem os dados mínimos
    if (!form.type || !form.neighborhood || !form.price) {
      alert('Preencha pelo menos o Tipo, Bairro e Valor antes de pedir à IA para gerar o texto.');
      return;
    }

    setIsGeneratingAi(true);
    try {
      const response = await api.post('/ai/generate-description', {
        type: form.type,
        transaction: form.transaction,
        neighborhood: form.neighborhood,
        city: form.city,
        bedrooms: form.bedrooms || '0',
        suites: '0', // Poderia adicionar este campo no futuro
        garage: form.garage || '0',
        price: form.price,
        features: form.amenities.join(', ')
      });

      // Substitui o texto atual pela obra-prima da IA
      setForm(prev => ({ ...prev, description: response.data.description }));
      alert('✨ Descrição gerada com sucesso! Você pode editá-la se preferir.');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao contactar a Inteligência Artificial. Verifique a chave da OpenAI.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // =========================================================
  // COPIAR LINK DO FEED XML
  // =========================================================
  const handleCopyXmlLink = () => {
    if (!storeSlug) {
      alert('Erro: O slug da sua loja não está configurado.');
      return;
    }
    // Cria o link absoluto baseando-se na URL atual
    const xmlUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'}/public/xml/${storeSlug}`;
    navigator.clipboard.writeText(xmlUrl);
    alert(`Link do Feed XML copiado!\n\nCole este link no painel do Zap Imóveis ou VivaReal:\n${xmlUrl}`);
  };

  if (isLoading) return <div className="p-8 flex justify-center text-slate-500"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 max-w-[1600px] mx-auto font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Home className="text-blue-600" size={32} />
            Catálogo de Imóveis
          </h1>
          <p className="text-slate-500 mt-1">Gira os seus imóveis, vínculos e integrações com portais.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleCopyXmlLink} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors border border-slate-300">
            <Rss size={18} className="text-orange-500"/> Link Feed XML (Portais)
          </button>
          <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-sm">
            <Plus size={18} /> Novo Imóvel
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="py-4 px-6">Imóvel & Localização</th>
              <th className="py-4 px-6">Transação & Valor</th>
              <th className="py-4 px-6">Proprietário / Captação</th>
              <th className="py-4 px-6">Status (Site & Portais)</th>
              <th className="py-4 px-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {properties.map(prop => (
              <tr key={prop.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6">
                  <p className="font-bold text-slate-800 text-base">{prop.title}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin size={12}/> {prop.neighborhood}, {prop.city}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${prop.rentStatus === 'Alugado' ? 'bg-amber-100 text-amber-700' : prop.rentStatus === 'Vendido' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {prop.rentStatus ? prop.rentStatus.toUpperCase() : 'VAGO'}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">{prop.type}</span>
                  </div>
                </td>
                
                <td className="py-4 px-6">
                  <div className="flex flex-col items-start gap-1.5">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${prop.transaction === 'Venda' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {prop.transaction}
                    </span>
                    <p className="font-bold text-slate-800 text-lg">R$ {Number(prop.price).toLocaleString('pt-BR')}</p>
                    
                    {/* INDICADORES DE PROPOSTAS E TERMOS */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {prop.saleProposalUrl && <span className="bg-indigo-50 text-indigo-600 border border-indigo-200 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase" title="Possui Proposta de Venda">Proposta Venda</span>}
                      {prop.rentProposalUrl && <span className="bg-orange-50 text-orange-600 border border-orange-200 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase" title="Possui Proposta de Aluguel">Proposta Aluguel</span>}
                      {prop.keyTermUrl && <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase" title="Possui Termo de Chaves">Termo de Chaves</span>}
                    </div>
                  </div>
                </td>
                
                <td className="py-4 px-6 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <User size={14} className="text-slate-400" />
                    <span className="font-medium text-slate-700">Dono:</span> 
                    {prop.owner ? <span className="text-blue-600 font-bold">{prop.owner.name}</span> : <span className="text-slate-400 italic">Não vinculado</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <UserCheck size={14} className="text-slate-400" />
                    <span className="font-medium text-slate-700">Corretor:</span> 
                    {prop.broker ? <span className="text-slate-600">{prop.broker.name}</span> : <span className="text-slate-400 italic">Nenhum</span>}
                  </div>
                  {prop.inspectionUrl && (
                    <a href={prop.inspectionUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded mt-1 transition-colors">
                      <Camera size={12}/> Vistoria Inicial
                    </a>
                  )}
                </td>

                <td className="py-4 px-6 space-y-2">
                  <button onClick={() => handleToggleStatus(prop.id)} className="focus:outline-none block">
                    {prop.isActive 
                      ? <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle2 size={14}/> Site Oficial</span>
                      : <span className="bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><XCircle size={14}/> Oculto Site</span>
                    }
                  </button>
                  <div className="block">
                    {prop.exportToPortals 
                      ? <span className="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Rss size={14}/> Exporta XML</span>
                      : <span className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><XCircle size={14}/> Não Exporta</span>
                    }
                  </div>
                </td>
                
                <td className="py-4 px-6 text-right">
                  <button onClick={() => handleOpenModal(prop)} className="text-blue-600 hover:text-blue-800 font-bold bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ml-auto">
                    <Edit size={16} /> Editar
                  </button>
                </td>
              </tr>
            ))}
            {properties.length === 0 && (
              <tr><td colSpan={5} className="py-12 text-center text-slate-500 text-lg">Nenhum imóvel cadastrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {editingId ? <Edit className="text-blue-600" size={20}/> : <Plus className="text-blue-600" size={20}/>}
                {editingId ? 'Editar Imóvel' : 'Cadastrar Novo Imóvel'}
              </h2>
              
              {/* CHECKBOX XML NO CABEÇALHO DO MODAL */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer bg-orange-50 border border-orange-200 px-4 py-2 rounded-lg transition-colors hover:bg-orange-100">
                  <input type="checkbox" checked={form.exportToPortals} onChange={(e) => setForm({...form, exportToPortals: e.target.checked})} className="w-4 h-4 text-orange-600 rounded border-orange-300 focus:ring-orange-500" />
                  <Rss size={16} className="text-orange-600"/>
                  <span className="text-sm font-bold text-orange-800">Exportar para Zap/VivaReal</span>
                </label>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="property-form" onSubmit={handleSave} className="space-y-8">
                
                {/* SECÇÃO 1: BÁSICO */}
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">1. Informações Básicas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Título do Anúncio</label>
                      <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" placeholder="Ex: Lindo Apartamento com Varanda..." />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Transação</label>
                      <select value={form.transaction} onChange={e => setForm({...form, transaction: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white text-sm">
                        <option value="Locação">Locação</option>
                        <option value="Venda">Venda</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Tipo</label>
                      <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white text-sm">
                        <option value="Casa">Casa</option>
                        <option value="Apartamento">Apartamento</option>
                        <option value="Comercial">Comercial</option>
                        <option value="Terreno">Terreno</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECÇÃO 2: VALORES E ÁREA */}
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">2. Valores & Dimensões</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1"><DollarSign size={14}/> Valor (R$)</label>
                      <input required type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" placeholder="2500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Condomínio (R$)</label>
                      <input type="number" value={form.condoFee} onChange={e => setForm({...form, condoFee: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">IPTU (R$)</label>
                      <input type="number" value={form.iptu} onChange={e => setForm({...form, iptu: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Área (m²)</label>
                      <input required type="number" value={form.area} onChange={e => setForm({...form, area: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" placeholder="Ex: 80" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Quartos</label>
                      <input type="number" value={form.bedrooms} onChange={e => setForm({...form, bedrooms: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Banheiros</label>
                      <input type="number" value={form.bathrooms} onChange={e => setForm({...form, bathrooms: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Vagas</label>
                      <input type="number" value={form.garage} onChange={e => setForm({...form, garage: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" />
                    </div>
                  </div>
                </div>

                {/* SECÇÃO 3: ENDEREÇO */}
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">3. Localização</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-600 mb-1">
                        CEP {isFetchingCep && <Loader2 size={12} className="animate-spin text-blue-500" />}
                      </label>
                      <input required type="text" value={form.cep} onChange={handleCepChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" placeholder="00000-000" />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Endereço Completo</label>
                      <input required type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Bairro</label>
                      <input required type="text" value={form.neighborhood} onChange={e => setForm({...form, neighborhood: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Cidade</label>
                      <input required type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Estado (UF)</label>
                      <input required type="text" maxLength={2} value={form.state} onChange={e => setForm({...form, state: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm uppercase" />
                    </div>
                  </div>
                </div>

                {/* SECÇÃO 4: CARACTERÍSTICAS E COMODIDADES */}
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">4. Características & Comodidades</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {AVAILABLE_AMENITIES.map(amenity => (
                      <label key={amenity} className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                          checked={form.amenities.includes(amenity)}
                          onChange={() => handleToggleAmenity(amenity)}
                        />
                        <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* SECÇÃO 5: GESTÃO & CAPTAÇÃO */}
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                  <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4 border-b border-blue-200 pb-2 flex items-center gap-2">
                    <UserCheck size={18}/> 5. Gestão, Captação & Documentos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Proprietário (Dono do Imóvel)</label>
                      <select value={form.ownerId} onChange={e => setForm({...form, ownerId: e.target.value})} className="w-full px-4 py-2.5 border border-blue-200 rounded-lg outline-none focus:border-blue-500 bg-white text-sm">
                        <option value="">Selecione o proprietário...</option>
                        {owners.map(o => <option key={o.id} value={o.id}>{o.name} ({o.cpfOrCnpj})</option>)}
                      </select>
                      <p className="text-[11px] text-blue-600 mt-1">Vincula o imóvel para gerar repasses financeiros.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Corretor Responsável</label>
                      <select value={form.brokerId} onChange={e => setForm({...form, brokerId: e.target.value})} className="w-full px-4 py-2.5 border border-blue-200 rounded-lg outline-none focus:border-blue-500 bg-white text-sm">
                        <option value="">Nenhum (Livre)</option>
                        {brokers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <FileSignature size={14}/> Proposta de Aluguel (Link PDF)
                      </label>
                      <input type="url" value={form.rentProposalUrl} onChange={e => setForm({...form, rentProposalUrl: e.target.value})} className="w-full px-4 py-2.5 border border-blue-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-white" placeholder="Link do Google Drive..." />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <FileSignature size={14}/> Proposta de Venda (Link PDF)
                      </label>
                      <input type="url" value={form.saleProposalUrl} onChange={e => setForm({...form, saleProposalUrl: e.target.value})} className="w-full px-4 py-2.5 border border-blue-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-white" placeholder="Link do Google Drive..." />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Key size={14}/> Termo de Chaves (Link PDF)
                      </label>
                      <input type="url" value={form.keyTermUrl} onChange={e => setForm({...form, keyTermUrl: e.target.value})} className="w-full px-4 py-2.5 border border-blue-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-white" placeholder="Link do Google Drive..." />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Camera size={14}/> Laudo da Vistoria Inicial (Link PDF)
                      </label>
                      <input type="url" value={form.inspectionUrl} onChange={e => setForm({...form, inspectionUrl: e.target.value})} className="w-full px-4 py-2.5 border border-blue-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-white" placeholder="Link do Google Drive..." />
                    </div>

                  </div>
                </div>

                {/* SECÇÃO 6: MÍDIA & DESCRIÇÃO COM IA */}
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                    6. Apresentação na Vitrine 
                  </h3>
                  <div className="space-y-4">
                    
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <label className="block text-xs font-bold text-slate-600">Descrição Comercial</label>
                        {/* BOTAO INTELIGÊNCIA ARTIFICIAL */}
                        <button 
                          type="button" 
                          onClick={handleGenerateAiDescription}
                          disabled={isGeneratingAi}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                          {isGeneratingAi ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                          Gerar Texto com IA
                        </button>
                      </div>
                      <textarea rows={6} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm resize-y leading-relaxed bg-slate-50 focus:bg-white transition-colors" placeholder="Escreva à mão ou clique no botão acima para a Inteligência Artificial criar uma descrição persuasiva baseada nos dados..." />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Links das Imagens (Separados por vírgula)</label>
                      <textarea rows={2} value={form.imageUrls} onChange={e => setForm({...form, imageUrls: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm resize-none" placeholder="https://linkdafoto1.com, https://linkdafoto2.com" />
                    </div>
                  </div>
                </div>
                
              </form>
            </div>

            {/* RODAPÉ DO MODAL (BOTÕES) */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors text-sm">
                Cancelar
              </button>
              <button form="property-form" type="submit" disabled={isSaving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} 
                {editingId ? 'Salvar Alterações' : 'Cadastrar Imóvel'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}