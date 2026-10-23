'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { 
  LogOut, Home, FileText, Wrench, DollarSign, AlertCircle, 
  CheckCircle, Clock, Plus, Building, User, Loader2, X,
  MapPin, MessageSquare, Send, Globe, Calendar, Key, Sparkles, RefreshCw,
  HardHat, Layers, Copy, ExternalLink, Compass, Building2, Users
} from 'lucide-react';
import { api } from '@/src/lib/api';

export default function PortalDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string; 
   
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
   
  const [contracts, setContracts] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [condoBills, setCondoBills] = useState<any[]>([]);
  const [condoReservations, setCondoReservations] = useState<any[]>([]);
  const [condoAssemblies, setCondoAssemblies] = useState<any[]>([]);
   
  // Estados para Temporada (Reais)
  const [seasonProperties, setSeasonProperties] = useState<any[]>([]);
  const [seasonBookings, setSeasonBookings] = useState<any[]>([]);
  const [icalForm, setIcalForm] = useState<{ [key: string]: { airbnbIcalUrl: string; bookingIcalUrl: string; vrboIcalUrl: string } }>({});
  const [isSavingIcal, setIsSavingIcal] = useState<string | null>(null);

  // Estados para Incorporadora (Acompanhamento de Obra & Kit Personalização)
  const [devProjects, setDevProjects] = useState<any[]>([]);
  const [selectedDevProject, setSelectedDevProject] = useState<any>(null);
  const [unitNumber, setUnitNumber] = useState('');
  const [selectedContractId, setSelectedContractId] = useState('');
  const [selectedKitIds, setSelectedKitIds] = useState<string[]>([]);
  const [isSubmittingKit, setIsSubmittingKit] = useState(false);

  const [activeTab, setActiveTab] = useState<'resumo' | 'boletos' | 'condominio' | 'manutencao' | 'temporada' | 'incorporadora'>('resumo');

  // Modal Nova Reserva de Área Comum
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [reservationForm, setReservationForm] = useState({ areaName: 'Salão de Festas', reservationDate: '', notes: '' });
  const [isSavingReservation, setIsSavingReservation] = useState(false);

  // Modal Novo Chamado
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isSavingTicket, setIsSavingTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    title: '', description: '', priority: 'Média', propertyId: ''
  });

  // Modal Interação (Ver/Responder Chamado)
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('@ZenixPortal:token');
    const userData = localStorage.getItem('@ZenixPortal:user');

    if (!token || !userData) {
      router.push(`/loja/${slug}/portal-cliente/login`);
      return;
    }

    setUser(JSON.parse(userData));
    api.defaults.headers.authorization = `Bearer ${token}`;
     
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [response, resIncorp] = await Promise.all([
        api.get('/portal/dashboard'),
        api.get('/portal/incorporadora').catch(() => ({ data: { projects: [] } }))
      ]);

      if (response.data.contracts) {
        setContracts(response.data.contracts);
        if (response.data.contracts.length > 0 && !selectedContractId) {
          setSelectedContractId(response.data.contracts[0].id);
        }
      }
      if (response.data.tickets) setTickets(response.data.tickets);
      if (response.data.properties) setProperties(response.data.properties);
      if (response.data.condoBills) setCondoBills(response.data.condoBills);
      if (response.data.condoReservations) setCondoReservations(response.data.condoReservations);
      if (response.data.condoAssemblies) setCondoAssemblies(response.data.condoAssemblies);
       
      // Dados reais de temporada retornados pelo backend
      if (response.data.seasonProperties) {
        setSeasonProperties(response.data.seasonProperties);
        const initialIcal: any = {};
        response.data.seasonProperties.forEach((p: any) => {
          initialIcal[p.id] = {
            airbnbIcalUrl: p.airbnbIcalUrl || '',
            bookingIcalUrl: p.bookingIcalUrl || '',
            vrboIcalUrl: p.vrboIcalUrl || ''
          };
        });
        setIcalForm(initialIcal);
      }
      if (response.data.seasonBookings) setSeasonBookings(response.data.seasonBookings);

      if (response.data.contracts && response.data.contracts.length === 1) {
        setTicketForm(prev => ({ ...prev, propertyId: response.data.contracts[0].propertyId }));
      }
      if (response.data.properties && response.data.properties.length === 1) {
        setTicketForm(prev => ({ ...prev, propertyId: response.data.properties[0].id }));
      }

      // Dados reais do Módulo Incorporadora (Obras e Kits de Personalização)
      const fetchedProjects = resIncorp.data?.projects || [];
      setDevProjects(fetchedProjects);
      if (fetchedProjects.length > 0) {
        if (!selectedDevProject) {
          setSelectedDevProject(fetchedProjects[0]);
        } else {
          const updated = fetchedProjects.find((p: any) => p.id === selectedDevProject.id);
          if (updated) setSelectedDevProject(updated);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados do portal', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('@ZenixPortal:token');
    localStorage.removeItem('@ZenixPortal:user');
    router.push(`/loja/${slug}/portal-cliente/login`); 
  };

  const formatCurrency = (val: any) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  const handlePayment = (invoice: any) => {
    const link = invoice.ticketUrl || invoice.invoiceUrl || invoice.bankSlipUrl || invoice.url;
    if (link) {
      window.open(link, '_blank');
    } else if (invoice.pixQrCode) {
      navigator.clipboard.writeText(invoice.pixQrCode);
      alert('Código PIX Copia e Cola copiado para a área de transferência!');
    } else {
      alert('O link de pagamento ainda não está disponível. Entre em contato com a imobiliária ou condomínio.');
    }
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingReservation(true);
    try {
      await api.post('/portal/condo/reservations', reservationForm);
      alert('Reserva solicitada com sucesso!');
      setIsReservationModalOpen(false);
      setReservationForm({ areaName: 'Salão de Festas', reservationDate: '', notes: '' });
      fetchDashboardData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao registrar reserva.');
    } finally {
      setIsSavingReservation(false);
    }
  };

  // Salvar Links iCal reais no backend
  const handleSaveIcal = async (propertyId: string) => {
    setIsSavingIcal(propertyId);
    try {
      await api.put(`/properties/${propertyId}/ical-links`, icalForm[propertyId]);
      alert('Links de integração iCal salvos e sincronizados com sucesso!');
      fetchDashboardData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar os links de integração.');
    } finally {
      setIsSavingIcal(null);
    }
  };

  // Funções da Incorporadora (Kit Opções / Personalização da Unidade)
  const toggleKitOption = (id: string) => {
    setSelectedKitIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleConfirmCustomization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevProject) return;
    if (selectedKitIds.length === 0) {
      alert('Selecione pelo menos um acabamento ou kit para personalizar sua unidade.');
      return;
    }
    if (!confirm('Ao confirmar, o valor adicional será lançado como Aditivo Contratual em seus boletos e a Ordem de Serviço será enviada à Engenharia da obra. Deseja prosseguir?')) {
      return;
    }

    setIsSubmittingKit(true);
    try {
      const res = await api.post(`/portal/incorporadora/${selectedDevProject.id}/custom-order`, {
        unitNumber,
        contractId: selectedContractId || undefined,
        selectedOptionIds: selectedKitIds
      });
      alert(res.data?.message || 'Personalização confirmada com sucesso!');
      setSelectedKitIds([]);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao confirmar personalização da unidade.');
    } finally {
      setIsSubmittingKit(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTicket(true);
    try {
      await api.post('/portal/tickets', { ...ticketForm });
      setIsTicketModalOpen(false);
      setTicketForm({ title: '', description: '', priority: 'Média', propertyId: ticketForm.propertyId });
      fetchDashboardData();
    } catch (error) {
      alert('Erro ao abrir chamado de manutenção.');
    } finally {
      setIsSavingTicket(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket) return;
     
    setIsSendingMessage(true);
    try {
      const response = await api.post(`/portal/tickets/${selectedTicket.id}/messages`, {
        message: newMessage
      });
      setSelectedTicket({
        ...selectedTicket,
        messages: [...(selectedTicket.messages || []), response.data]
      });
      setNewMessage('');
      fetchDashboardData();
    } catch (error) {
      alert('Erro ao enviar mensagem.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 size={40} className="animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-medium">Carregando o seu portal...</p>
      </div>
    );
  }

  const totalKitSelectedAmount = (selectedDevProject?.customizationOptions || [])
    .filter((o: any) => selectedKitIds.includes(o.id))
    .reduce((acc: number, o: any) => acc + Number(o.additionalPrice || 0), 0);

  const memorial = selectedDevProject?.visualMemorialJson || {};

  const TicketCard = ({ ticket }: { ticket: any }) => (
    <div 
      onClick={() => setSelectedTicket(ticket)}
      className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-shadow group"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{ticket.title}</h4>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
          ticket.status === 'Concluído' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
          ticket.status === 'Em Andamento' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
          'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          {ticket.status}
        </span>
      </div>
      <p className="text-sm text-slate-600 mb-3 line-clamp-1">{ticket.description}</p>
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
          <Clock size={12}/> {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
        </p>
        <div className="flex items-center gap-1 text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
          Ver / Interagir <MessageSquare size={14}/>
        </div>
      </div>
    </div>
  );

  const IncorporadoraPortalSection = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-700 to-slate-900 p-6 rounded-2xl text-white shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="bg-white/20 text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            Incorporadora & Engenharia
          </span>
          <h3 className="text-xl font-bold mt-2">Acompanhamento de Obra & Personalização da Unidade</h3>
          <p className="text-xs text-indigo-100 mt-1">
            Acompanhe o cronograma físico da construção, diário de obra, memorial descritivo e escolha seu Kit de Acabamentos.
          </p>
        </div>
        {selectedDevProject && (
          <div className="bg-white/10 backdrop-blur px-4 py-3 rounded-xl border border-white/15 text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-indigo-200 block">Progresso Geral da Obra</span>
            <span className="text-2xl font-black text-emerald-400">{selectedDevProject.overallProgressPct || 0}%</span>
          </div>
        )}
      </div>

      {devProjects.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 shadow-sm">
          <HardHat size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-700">Nenhum empreendimento em obras disponível no momento</h3>
          <p className="text-xs text-slate-400 mt-1">Assim que a incorporadora liberar o acompanhamento do seu empreendimento, ele aparecerá aqui.</p>
        </div>
      ) : (
        <>
          {devProjects.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {devProjects.map((proj: any) => (
                <button
                  key={proj.id}
                  onClick={() => {
                    setSelectedDevProject(proj);
                    setSelectedKitIds([]);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    selectedDevProject?.id === proj.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🏗️ {proj.name} ({proj.overallProgressPct || 0}%)
                </button>
              ))}
            </div>
          )}

          {selectedDevProject && (
            <>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h4 className="text-lg font-black text-slate-800">{selectedDevProject.name}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={13}/> {selectedDevProject.address} — {selectedDevProject.city}/{selectedDevProject.state}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedDevProject.tour360ExteriorUrl && (
                      <a href={selectedDevProject.tour360ExteriorUrl} target="_blank" rel="noreferrer" className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3 py-2 rounded-xl border border-blue-200 flex items-center gap-1.5">
                        <Compass size={14}/> Tour 360° Fachada
                      </a>
                    )}
                    {selectedDevProject.tour360DecoratedUrl && (
                      <a href={selectedDevProject.tour360DecoratedUrl} target="_blank" rel="noreferrer" className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-2 rounded-xl border border-indigo-200 flex items-center gap-1.5">
                        <Sparkles size={14}/> Tour 360° Decorado
                      </a>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: '1. Fundação & Terraplenagem', pct: selectedDevProject.foundationPct || 0 },
                    { label: '2. Supraestrutura / Concreto', pct: selectedDevProject.structurePct || 0 },
                    { label: '3. Alvenaria & Vedação', pct: selectedDevProject.masonryPct || 0 },
                    { label: '4. Instalações Elétricas / Hidr.', pct: selectedDevProject.installationsPct || 0 },
                    { label: '5. Fachada & Design Exterior', pct: selectedDevProject.facadePct || 0 },
                    { label: '6. Acabamentos & Interiores', pct: selectedDevProject.finishingPct || 0 },
                  ].map(stage => (
                    <div key={stage.label} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>{stage.label}</span>
                        <span className="text-indigo-600">{stage.pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div style={{ width: `${stage.pct}%` }} className="h-full bg-indigo-600 rounded-full transition-all duration-700" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                      Kit Opções & Customização
                    </span>
                    <h4 className="text-base font-black text-slate-800 mt-1">
                      Personalize o Interior da sua Unidade
                    </h4>
                  </div>

                  <form onSubmit={handleConfirmCustomization} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Número da sua Unidade / Apto *</label>
                        <input
                          required
                          type="text"
                          placeholder="Ex: Apto 1204 - Torre A"
                          value={unitNumber}
                          onChange={e => setUnitNumber(e.target.value)}
                          className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Vincular ao Contrato</label>
                        <select
                          value={selectedContractId}
                          onChange={e => setSelectedContractId(e.target.value)}
                          className="w-full p-3 border border-slate-300 rounded-xl bg-white outline-none focus:border-indigo-500"
                        >
                          <option value="">Selecione seu contrato...</option>
                          {contracts.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.property?.title || 'Contrato Ativo'} ({formatCurrency(c.rentValue)})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {(selectedDevProject.customizationOptions || []).length === 0 ? (
                        <p className="text-slate-400 text-xs py-4 text-center">Nenhum kit opcional cadastrado para este empreendimento no momento.</p>
                      ) : (
                        selectedDevProject.customizationOptions.map((opt: any) => {
                          const isSelected = selectedKitIds.includes(opt.id);
                          const isExpired = (selectedDevProject.overallProgressPct || 0) > (opt.maxStageAllowedPct || 100);

                          return (
                            <div
                              key={opt.id}
                              onClick={() => !isExpired && toggleKitOption(opt.id)}
                              className={`p-4 rounded-xl border transition-all flex justify-between items-center ${
                                isExpired
                                  ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-indigo-50 border-indigo-600 shadow-sm cursor-pointer'
                                  : 'bg-white border-slate-200 hover:border-indigo-300 cursor-pointer'
                              }`}
                            >
                              <div>
                                <span className="text-[10px] font-bold uppercase text-indigo-600">{opt.category}</span>
                                <p className="font-bold text-slate-800 text-sm">{opt.title}</p>
                                <p className="text-slate-500 text-xs mt-0.5">{opt.specification}</p>
                              </div>
                              <div className="text-right shrink-0 ml-4">
                                <span className="font-black text-emerald-700 text-sm block">+ {formatCurrency(opt.additionalPrice)}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="p-4 bg-slate-900 text-white rounded-xl flex justify-between items-center gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Valor do Aditivo</span>
                        <span className="text-xl font-black text-emerald-400">{formatCurrency(totalKitSelectedAmount)}</span>
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmittingKit}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-3 rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSubmittingKit ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>}
                        Confirmar Personalização
                      </button>
                    </div>
                  </form>
                </div>

                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3 text-xs">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Layers size={16} className="text-indigo-600"/> Memorial Descritivo Padrão
                    </h4>
                    <p className="text-slate-600"><strong className="text-slate-800">Fachada:</strong> {memorial.fachada || 'Conforme projeto executivo.'}</p>
                    <p className="text-slate-600"><strong className="text-slate-800">Pisos:</strong> {memorial.piso || 'Porcelanato de 1ª linha.'}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      
      {/* NAVBAR */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${user?.role === 'CLIENT' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{user?.role === 'CLIENT' ? 'Área do Inquilino / Comprador' : 'Área do Proprietário / Investidor'}</p>
                <p className="font-bold text-slate-800 line-clamp-1">Olá, {user?.name}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 p-2 transition-colors rounded-lg hover:bg-red-50" title="Sair">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 animate-in fade-in duration-500">
        
        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 mb-8 overflow-x-auto">
          <button onClick={() => setActiveTab('resumo')} className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'resumo' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
            <Home size={16}/> {user?.role === 'CLIENT' ? 'Meu Contrato' : 'Meus Imóveis'}
          </button>
          <button onClick={() => setActiveTab('boletos')} className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'boletos' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
            <DollarSign size={16}/> Boletos
          </button>
          <button onClick={() => setActiveTab('condominio')} className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'condominio' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
            <Building2 size={16}/> Condomínio & Atas
          </button>
          <button onClick={() => setActiveTab('incorporadora')} className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'incorporadora' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
            <HardHat size={16}/> Obras
          </button>
          <button onClick={() => setActiveTab('manutencao')} className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'manutencao' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
            <Wrench size={16}/> Manutenção
          </button>
        </div>

        {/* ======================= CONTEÚDO DAS ABAS ======================= */}
        {activeTab === 'resumo' && (
          <div className="space-y-4">
            {user?.role === 'CLIENT' ? (
              contracts.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 shadow-sm"><AlertCircle size={40} className="mx-auto text-slate-300 mb-3" /><h3 className="font-bold text-slate-700">Nenhum contrato ativo</h3></div>
              ) : (
                contracts.map(contract => (
                  <div key={contract.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-lg font-black text-slate-800">{contract.property?.title}</h2>
                    <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1"><MapPin size={14}/> {contract.property?.address}</p>
                    <p className="text-blue-600 font-bold mt-4">Valor Mensal: {formatCurrency(contract.rentValue)}</p>
                  </div>
                ))
              )
            ) : (
              properties.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 shadow-sm"><AlertCircle size={40} className="mx-auto text-slate-300 mb-3" /><h3 className="font-bold text-slate-700">Nenhum imóvel vinculado</h3></div>
              ) : (
                properties.map(prop => (
                  <div key={prop.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-black text-slate-800">{prop.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{prop.address}</p>
                  </div>
                ))
              )
            )}
          </div>
        )}

        {activeTab === 'boletos' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-lg">Meus Boletos</h3>
            {contracts.flatMap(c => c.invoices || []).length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum boleto gerado no momento.</p>
            ) : (
              contracts.flatMap(c => c.invoices || []).map((invoice: any) => (
                <div key={invoice.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-800">Vencimento: {new Date(invoice.dueDate).toLocaleDateString('pt-BR')}</p>
                    <p className="text-sm text-slate-500">{invoice.description || 'Parcela Mensal'}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-black text-lg text-slate-800">{formatCurrency(invoice.totalAmount)}</p>
                    {invoice.status !== 'Pago' && (
                      <button onClick={() => handlePayment(invoice)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg"><DollarSign size={14}/> Pagar</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ======================= CONDOMÍNIO, ÁREAS COMUNS & ATAS ======================= */}
        {activeTab === 'condominio' && (
          <div className="space-y-8">
            
            {/* 1. Faturas de Condomínio */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-indigo-600 to-slate-900 p-6 rounded-2xl text-white shadow-md">
                <span className="bg-white/20 text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">Taxas Condominiais</span>
                <h3 className="text-xl font-bold mt-2">Boletos do Condomínio & Rateios</h3>
                <p className="text-xs text-indigo-100 mt-1">Acompanhe as taxas ordinárias, fundos de reserva e consumo da sua unidade.</p>
              </div>
              {condoBills.length === 0 ? (
                <div className="bg-white p-6 rounded-2xl text-center border text-slate-400 text-xs">Nenhum boleto de condomínio em aberto.</div>
              ) : (
                condoBills.map((bill: any) => (
                  <div key={bill.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">{bill.condominium?.name} — Unidade {bill.unit?.unitNumber}</p>
                      <p className="text-xs text-slate-500">Ref: {bill.referenceMonth} • Vencimento: {new Date(bill.dueDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-black text-lg text-indigo-600">{formatCurrency(bill.amount)}</p>
                      {bill.status !== 'Pago' && (
                        <button onClick={() => handlePayment(bill)} className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg">Pagar</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 2. Reserva de Áreas Comuns */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Calendar size={20} className="text-indigo-600"/> Reserva de Áreas Comuns</h3>
                  <p className="text-xs text-slate-500">Agende salão de festas, churrasqueira ou quadra esportiva.</p>
                </div>
                <button onClick={() => setIsReservationModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                  <Plus size={16}/> Nova Reserva
                </button>
              </div>

              {condoReservations.length === 0 ? (
                <div className="bg-white p-6 rounded-2xl text-center border text-slate-400 text-xs">Nenhuma reserva realizada.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {condoReservations.map((resv: any) => (
                    <div key={resv.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-800 text-sm">{resv.areaName}</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Confirmado</span>
                      </div>
                      <p className="text-xs text-slate-500">Data: {new Date(resv.reservationDate).toLocaleString('pt-BR')}</p>
                      {resv.notes && <p className="text-xs text-slate-400 italic">{resv.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Reuniões, Assembleias & Atas */}
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Users size={20} className="text-indigo-600"/> Reuniões, Assembleias & Atas</h3>
                <p className="text-xs text-slate-500">Fique por dentro das datas de reuniões marcadas e consulte as atas de reuniões passadas.</p>
              </div>

              {condoAssemblies.length === 0 ? (
                <div className="bg-white p-6 rounded-2xl text-center border text-slate-400 text-xs">Nenhuma assembleia ou reunião registrada.</div>
              ) : (
                <div className="space-y-3">
                  {condoAssemblies.map((asm: any) => (
                    <div key={asm.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 text-sm">{asm.title}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${asm.status === 'Encerrada' ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-800'}`}>
                            {asm.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Data: {new Date(asm.assemblyDate).toLocaleString('pt-BR')}</p>
                        <p className="text-xs text-slate-600 mt-2">{asm.description}</p>
                      </div>
                      {asm.minutesUrl && (
                        <a href={asm.minutesUrl} target="_blank" rel="noreferrer" className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-4 py-2 rounded-xl border border-indigo-200 flex items-center gap-1.5 shrink-0">
                          <FileText size={14}/> Baixar Ata da Reunião
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === 'incorporadora' && <IncorporadoraPortalSection />}

        {activeTab === 'manutencao' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Chamados Abertos</h3>
              <button onClick={() => setIsTicketModalOpen(true)} className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm hover:bg-blue-700"><Plus size={14}/> Novo Chamado</button>
            </div>
            {tickets.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 border-dashed"><Wrench size={32} className="mx-auto text-slate-300 mb-3" /><p className="text-sm font-medium text-slate-500">Nenhum chamado aberto.</p></div>
            ) : (
              tickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)
            )}
          </div>
        )}
      </main>

      {/* MODAL: NOVA RESERVA DE ÁREA COMUM */}
      {isReservationModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2"><Calendar size={20} className="text-indigo-600"/> Agendar Área Comum</h2>
              <button onClick={() => setIsReservationModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateReservation} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Área Desejada</label>
                <select value={reservationForm.areaName} onChange={e => setReservationForm({...reservationForm, areaName: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl text-sm bg-white">
                  <option value="Salão de Festas">Salão de Festas</option>
                  <option value="Churrasqueira">Churrasqueira</option>
                  <option value="Quadra Esportiva">Quadra Esportiva</option>
                  <option value="Espaço Gourmet">Espaço Gourmet</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Data e Horário</label>
                <input required type="datetime-local" value={reservationForm.reservationDate} onChange={e => setReservationForm({...reservationForm, reservationDate: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Observações (Opcional)</label>
                <input type="text" placeholder="Ex: Cota de limpeza acordada" value={reservationForm.notes} onChange={e => setReservationForm({...reservationForm, notes: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl text-sm" />
              </div>
              <button type="submit" disabled={isSavingReservation} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-sm transition-all disabled:opacity-50">
                {isSavingReservation ? <Loader2 size={18} className="animate-spin mx-auto"/> : 'Solicitar Agendamento'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO CHAMADO */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2"><Wrench size={20}/> Abrir Chamado</h2>
              <button onClick={() => setIsTicketModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div><label className="block text-xs font-bold text-slate-600 mb-1">Assunto</label><input required type="text" value={ticketForm.title} onChange={e => setTicketForm({...ticketForm, title: e.target.value})} placeholder="Ex: Manutenção condomínio" className="w-full p-3 border border-slate-300 rounded-xl text-sm" /></div>
              <div><label className="block text-xs font-bold text-slate-600 mb-1">Descrição</label><textarea required rows={4} value={ticketForm.description} onChange={e => setTicketForm({...ticketForm, description: e.target.value})} placeholder="Detalhes..." className="w-full p-3 border border-slate-300 rounded-xl text-sm" /></div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm">Enviar Chamado</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHAT DO CHAMADO */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="font-bold text-slate-800 text-lg">{selectedTicket.title}</h2>
              <button onClick={() => setSelectedTicket(null)} className="p-2 text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="p-4 bg-blue-600 text-white rounded-2xl text-sm max-w-[85%] ml-auto">{selectedTicket.description}</div>
              {selectedTicket.messages?.map((msg: any) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === 'ADMIN' ? 'items-start' : 'items-end'}`}>
                  <div className={`p-4 rounded-2xl text-sm max-w-[85%] ${msg.sender === 'ADMIN' ? 'bg-white border text-slate-700' : 'bg-blue-600 text-white'}`}>{msg.message}</div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex gap-2">
              <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Escreva sua mensagem..." className="flex-1 p-3 bg-slate-50 border rounded-xl text-sm" />
              <button type="submit" className="px-5 bg-blue-600 text-white rounded-xl font-bold"><Send size={18} /></button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}