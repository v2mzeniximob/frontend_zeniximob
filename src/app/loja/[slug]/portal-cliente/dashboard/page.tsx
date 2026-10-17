'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { 
  LogOut, Home, FileText, Wrench, DollarSign, AlertCircle, 
  CheckCircle, Clock, Plus, Building, User, Loader2, X,
  MapPin, MessageSquare, Send, Globe, Calendar, Key, Sparkles, RefreshCw,
  HardHat, Layers, Copy, ExternalLink, Compass
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

  const [activeTab, setActiveTab] = useState<'resumo' | 'boletos' | 'manutencao' | 'temporada' | 'incorporadora'>('resumo');

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
      alert('O link de pagamento ainda não está disponível. Entre em contato com a imobiliária.');
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

  // Componente Reutilizável da Aba Incorporadora (Disponível para Comprador/Inquilino e Proprietário/Investidor)
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
          {/* Seletor de Empreendimento */}
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
              {/* 1. Avanço Físico por Etapa + Links Tour 360° */}
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

                {/* Diário de Obra Recente */}
                {(selectedDevProject.workDiaries || []).length > 0 && (
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Calendar size={14} className="text-indigo-600"/> Boletins Recentes do Diário de Obra (RDO)
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedDevProject.workDiaries.slice(0, 4).map((d: any) => (
                        <div key={d.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="font-bold text-slate-800">{new Date(d.date).toLocaleDateString('pt-BR')}</span>
                            <span className="text-slate-400">{d.engineerName || 'Engenharia'}</span>
                          </div>
                          <p className="text-slate-600">{d.activitiesExecuted}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Kit de Personalização de Unidades (My Home Design) + Memorial Descritivo */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                      Kit Opções & Customização
                    </span>
                    <h4 className="text-base font-black text-slate-800 mt-1">
                      Personalize o Interior da sua Unidade
                    </h4>
                    <p className="text-xs text-slate-500">
                      Selecione acabamentos superiores antes da entrega das chaves. O sistema calcula o aditivo contratual e emite a Ordem de Serviço (OS) direto para o canteiro de obras.
                    </p>
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
                        <label className="block font-bold text-slate-700 mb-1">Vincular ao Contrato (Gera Boleto do Aditivo)</label>
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
                                {isExpired && (
                                  <span className="text-[10px] font-bold text-red-600 block mt-1">
                                    Prazo encerrado (permitido até {opt.maxStageAllowedPct}% da obra)
                                  </span>
                                )}
                              </div>
                              <div className="text-right shrink-0 ml-4">
                                <span className="font-black text-emerald-700 text-sm block">+ {formatCurrency(opt.additionalPrice)}</span>
                                <span className="text-[10px] text-slate-400">Limite: {opt.maxStageAllowedPct}% obra</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Valor do Aditivo de Personalização</span>
                        <span className="text-xl font-black text-emerald-400">{formatCurrency(totalKitSelectedAmount)}</span>
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmittingKit}
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-3 rounded-xl shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSubmittingKit ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>}
                        Confirmar Personalização & Gerar OS
                      </button>
                    </div>
                  </form>
                </div>

                <div className="lg:col-span-5 space-y-6">
                  {/* Memorial Descritivo Visual */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3 text-xs">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Layers size={16} className="text-indigo-600"/> Memorial Descritivo Padrão
                    </h4>
                    <p className="text-slate-600"><strong className="text-slate-800">Fachada (Exterior):</strong> {memorial.fachada || 'Conforme projeto executivo da incorporadora.'}</p>
                    <p className="text-slate-600"><strong className="text-slate-800">Pisos e Revestimentos:</strong> {memorial.piso || 'Porcelanato e revestimentos cerâmicos de 1ª linha.'}</p>
                    <p className="text-slate-600"><strong className="text-slate-800">Esquadrias:</strong> {memorial.esquadrias || 'Alumínio com pintura eletrostática.'}</p>
                    <p className="text-slate-600"><strong className="text-slate-800">Louças e Metais:</strong> {memorial.loucas || 'Louças e metais de alto padrão.'}</p>
                  </div>

                  {/* Ordens de Serviço (OS) de Personalização Emitidas */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                    <h4 className="text-sm font-bold text-slate-800">Minhas Ordens de Personalização (Canteiro)</h4>
                    {(selectedDevProject.customizationOrders || []).length === 0 ? (
                      <p className="text-xs text-slate-400">Nenhum pedido de personalização emitido.</p>
                    ) : (
                      selectedDevProject.customizationOrders.map((ord: any) => (
                        <div key={ord.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-800">{ord.unitNumber}</span>
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
                              {ord.engineeringOsCode} • {ord.engineeringOsStatus}
                            </span>
                          </div>
                          <p className="text-slate-600 whitespace-pre-line text-[11px]">{ord.engineeringInstructions}</p>
                          <p className="font-black text-indigo-600 text-right">Aditivo: {formatCurrency(ord.totalAdditionalAmount)}</p>
                        </div>
                      ))
                    )}
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
        
        {/* ======================= VISÃO DO INQUILINO / COMPRADOR ======================= */}
        {user?.role === 'CLIENT' && (
          <div className="space-y-6">
            <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 overflow-x-auto">
              <button onClick={() => setActiveTab('resumo')} className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'resumo' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
                <Home size={16}/> Meu Contrato
              </button>
              <button onClick={() => setActiveTab('boletos')} className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'boletos' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
                <DollarSign size={16}/> Boletos
              </button>
              <button onClick={() => setActiveTab('incorporadora')} className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'incorporadora' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
                <HardHat size={16}/> Obra & Personalização
              </button>
              <button onClick={() => setActiveTab('temporada')} className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'temporada' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
                <Calendar size={16}/> Temporada / Estadias
              </button>
              <button onClick={() => setActiveTab('manutencao')} className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'manutencao' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
                <Wrench size={16}/> Manutenção
              </button>
            </div>

            {activeTab === 'resumo' && (
              <div className="space-y-4">
                {contracts.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 shadow-sm"><AlertCircle size={40} className="mx-auto text-slate-300 mb-3" /><h3 className="font-bold text-slate-700">Nenhum contrato ativo</h3></div>
                ) : (
                  contracts.map(contract => (
                    <div key={contract.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="h-32 bg-slate-200 relative">
                        {contract.property?.coverImage ? ( <img src={contract.property.coverImage} alt="Imóvel" className="w-full h-full object-cover" /> ) : ( <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-300"><Building size={40}/></div> )}
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-700 shadow-sm">Contrato Ativo</div>
                      </div>
                      <div className="p-6">
                        <h2 className="text-lg font-black text-slate-800">{contract.property?.title}</h2>
                        <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1"><MapPin size={14}/> {contract.property?.address}</p>
                        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                          <div><p className="text-xs font-bold text-slate-400 uppercase">Valor Mensal / Parcela</p><p className="text-lg font-black text-blue-600">{formatCurrency(contract.rentValue)}</p></div>
                          <div><p className="text-xs font-bold text-slate-400 uppercase">Vencimento</p><p className="text-lg font-black text-slate-700">Dia {contract.dueDate || '10'}</p></div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'boletos' && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800">Meus Boletos e Aditivos</h3>
                {contracts.flatMap(c => c.invoices || []).length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum boleto gerado no momento.</p>
                ) : (
                  contracts.flatMap(c => c.invoices || []).map((invoice: any) => {
                    const isPaid = invoice.status === 'Pago';
                    const isLate = invoice.status === 'Atrasado';
                    return (
                      <div key={invoice.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isPaid ? 'bg-emerald-50 text-emerald-600' : isLate ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                            {isPaid ? <CheckCircle size={24}/> : isLate ? <AlertCircle size={24}/> : <Clock size={24}/>}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">Vencimento: {new Date(invoice.dueDate).toLocaleDateString('pt-BR')}</p>
                            <p className="text-sm text-slate-500">{invoice.description || 'Parcela Mensal'}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                          <p className="font-black text-lg text-slate-800">{formatCurrency(invoice.totalAmount || invoice.value || invoice.amount)}</p>
                          {!isPaid && (
                            <button onClick={() => handlePayment(invoice)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"><DollarSign size={14}/> Pagar</button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {activeTab === 'incorporadora' && <IncorporadoraPortalSection />}

            {activeTab === 'temporada' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-2xl text-white shadow-md">
                  <span className="bg-white/20 text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">Short-Stay</span>
                  <h3 className="text-xl font-bold mt-2">Suas Reservas de Aluguel por Temporada</h3>
                  <p className="text-xs text-blue-100 mt-1">Acompanhe suas próximas estadias, check-ins e links de acesso rápido.</p>
                </div>

                {seasonBookings.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 shadow-sm">
                    <Calendar size={40} className="mx-auto text-slate-300 mb-3" />
                    <h3 className="font-bold text-slate-700">Nenhuma estadia por temporada no momento</h3>
                    <p className="text-xs text-slate-400 mt-1">Suas reservas em imóveis de temporada aparecerão aqui.</p>
                  </div>
                ) : (
                  seasonBookings.map((b: any) => (
                    <div key={b.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-800 text-base">{b.property?.title || 'Imóvel de Temporada'}</h4>
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">Confirmada</span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={14}/> {b.property?.address}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 block font-bold uppercase">Check-in</span>
                          <span className="font-extrabold text-slate-800">{new Date(b.checkIn).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold uppercase">Check-out</span>
                          <span className="font-extrabold text-slate-800">{new Date(b.checkOut).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold uppercase">Valor Total</span>
                          <span className="font-extrabold text-blue-600">{formatCurrency(b.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'manutencao' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Chamados Abertos</h3>
                  <button onClick={() => setIsTicketModalOpen(true)} className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm hover:bg-blue-700 transition-all">
                    <Plus size={14}/> Novo Chamado
                  </button>
                </div>
                {tickets.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 border-dashed"><Wrench size={32} className="mx-auto text-slate-300 mb-3" /><p className="text-sm font-medium text-slate-500">Você não possui chamados de manutenção abertos.</p></div>
                ) : (
                  tickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================= VISÃO DO PROPRIETÁRIO ======================= */}
        {user?.role === 'OWNER' && (
          <div className="space-y-6">
            <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 mb-6 overflow-x-auto">
              <button onClick={() => setActiveTab('resumo')} className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'resumo' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}>
                <Home size={16}/> Meus Imóveis (Longo Prazo)
              </button>
              <button onClick={() => setActiveTab('incorporadora')} className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'incorporadora' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
                <HardHat size={16}/> Obras & Incorporadora
              </button>
              <button onClick={() => setActiveTab('temporada')} className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'temporada' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}>
                <Sparkles size={16}/> Imóveis de Temporada & OTAs
              </button>
              <button onClick={() => setActiveTab('manutencao')} className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'manutencao' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}>
                <Wrench size={16}/> Manutenção
              </button>
            </div>

            {activeTab === 'resumo' && (
              <>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Home size={24} className="text-emerald-600"/> Meus Imóveis</h2>
                {properties.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 shadow-sm"><AlertCircle size={40} className="mx-auto text-slate-300 mb-3" /><h3 className="font-bold text-slate-700">Nenhum imóvel vinculado</h3></div>
                ) : (
                  properties.map(property => {
                    const isRented = property.rentStatus === 'Alugado';
                    return (
                      <div key={property.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6">
                          <div className="flex justify-between items-start">
                            <div><h3 className="text-lg font-black text-slate-800">{property.title}</h3><p className="text-sm text-slate-500 mt-1">{property.address}</p></div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider ${isRented ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{isRented ? 'Alugado' : 'Vago'}</span>
                          </div>
                          {isRented && property.contracts && property.contracts.length > 0 && (
                            <div className="mt-6 pt-5 border-t border-slate-100">
                              <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5"><FileText size={16}/> Extrato de Repasses</h4>
                              <div className="space-y-3">
                                {property.contracts[0].invoices?.slice(0, 3).map((invoice: any) => (
                                  <div key={invoice.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${invoice.status === 'Pago' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{invoice.status === 'Pago' ? <CheckCircle size={16}/> : <Clock size={16}/>}</div>
                                      <div><p className="text-sm font-bold text-slate-700">Ref. {new Date(invoice.dueDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric'})}</p><p className="text-[10px] font-bold text-slate-400 uppercase">{invoice.status === 'Pago' ? 'Repasse Realizado' : 'Aguardando Pagamento'}</p></div>
                                    </div>
                                    <p className="font-bold text-slate-800">{formatCurrency(invoice.ownerAmount || invoice.value || invoice.amount)}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </>
            )}

            {activeTab === 'incorporadora' && <IncorporadoraPortalSection />}

            {/* ABA DE TEMPORADA & INTEGRAÇÃO DE PLATAFORMAS (PROPRIETÁRIO) */}
            {activeTab === 'temporada' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 rounded-2xl text-white shadow-md">
                  <span className="bg-white/20 text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">Short-Stay & Canais</span>
                  <h3 className="text-xl font-bold mt-2">Gestão de Imóveis de Temporada & Sincronização de OTAs</h3>
                  <p className="text-xs text-emerald-100 mt-1">Insira os links iCal do Airbnb e Booking.com para unificar o calendário e evitar overbooking.</p>
                </div>

                {seasonProperties.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 shadow-sm">
                    <Sparkles size={40} className="mx-auto text-slate-300 mb-3" />
                    <h3 className="font-bold text-slate-700">Nenhum imóvel de temporada cadastrado em seu nome</h3>
                    <p className="text-xs text-slate-400 mt-1">Entre em contato com a imobiliária para cadastrar suas propriedades na modalidade de temporada.</p>
                  </div>
                ) : (
                  seasonProperties.map((prop: any) => (
                    <div key={prop.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-4">
                        <div>
                          <h3 className="text-lg font-black text-slate-800">{prop.title}</h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin size={14}/> {prop.address}</p>
                        </div>
                        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">Temporada Ativa</span>
                      </div>

                      {/* URL iCal de Exportação (Para colar no Airbnb/Booking) */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase">Link iCal do Nosso Sistema (Para exportar para o Airbnb / Booking)</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            readOnly 
                            value={`${process.env.NEXT_PUBLIC_API_URL || 'https://backend-zeniximob.onrender.com'}/public/properties/${prop.id}/ical/${prop.icalExportToken || 'token'}.ics`}
                            className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-600 select-all"
                          />
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_API_URL || 'https://backend-zeniximob.onrender.com'}/public/properties/${prop.id}/ical/${prop.icalExportToken || 'token'}.ics`);
                              alert('Link iCal copiado para a área de transferência!');
                            }}
                            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-lg whitespace-nowrap transition-colors"
                          >
                            Copiar Link
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500">Cole este link nas configurações de importação de calendário do Airbnb ou Booking.com para que eles bloqueiem as datas quando houver reserva no site.</p>
                      </div>

                      {/* Formulário para colar os links iCal das Plataformas */}
                      <div className="space-y-4 pt-2">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <Globe size={16} className="text-emerald-600"/> Links de Importação das Plataformas (Validação de Integração)
                        </h4>

                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Link iCal do Airbnb (.ics)</label>
                            <input 
                              type="text" 
                              placeholder="https://www.airbnb.com.br/calendar/ical/..."
                              value={icalForm[prop.id]?.airbnbIcalUrl || ''}
                              onChange={(e) => setIcalForm({
                                ...icalForm,
                                [prop.id]: { ...icalForm[prop.id], airbnbIcalUrl: e.target.value }
                              })}
                              className="w-full p-3 border border-slate-300 rounded-xl text-xs outline-none focus:border-emerald-500 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Link iCal do Booking.com (.ics)</label>
                            <input 
                              type="text" 
                              placeholder="https://admin.booking.com/hotel/hoteladmin/ical.ics?..."
                              value={icalForm[prop.id]?.bookingIcalUrl || ''}
                              onChange={(e) => setIcalForm({
                                ...icalForm,
                                [prop.id]: { ...icalForm[prop.id], bookingIcalUrl: e.target.value }
                              })}
                              className="w-full p-3 border border-slate-300 rounded-xl text-xs outline-none focus:border-emerald-500 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Link iCal do VRBO / Outros (.ics)</label>
                            <input 
                              type="text" 
                              placeholder="https://www.vrbo.com/ical/..."
                              value={icalForm[prop.id]?.vrboIcalUrl || ''}
                              onChange={(e) => setIcalForm({
                                ...icalForm,
                                [prop.id]: { ...icalForm[prop.id], vrboIcalUrl: e.target.value }
                              })}
                              className="w-full p-3 border border-slate-300 rounded-xl text-xs outline-none focus:border-emerald-500 bg-white"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => handleSaveIcal(prop.id)}
                            disabled={isSavingIcal === prop.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                          >
                            {isSavingIcal === prop.id ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                            Salvar e Validar Integração com Plataformas
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'manutencao' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Chamados Abertos</h3>
                  <button onClick={() => setIsTicketModalOpen(true)} className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm hover:bg-emerald-700 transition-all">
                    <Plus size={14}/> Novo Chamado
                  </button>
                </div>
                {tickets.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 border-dashed"><Wrench size={32} className="mx-auto text-slate-300 mb-3" /><p className="text-sm font-medium text-slate-500">Você não possui chamados de manutenção abertos.</p></div>
                ) : (
                  tickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL 1: NOVO CHAMADO DE MANUTENÇÃO */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2"><Wrench size={20} className={user?.role === 'CLIENT' ? "text-blue-600" : "text-emerald-600"}/> Abrir Chamado</h2>
              <button onClick={() => setIsTicketModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-200/50 rounded-full"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              {user?.role === 'CLIENT' && contracts.length > 1 && (
                <div><label className="block text-xs font-bold text-slate-600 mb-1">Qual Imóvel?</label><select required value={ticketForm.propertyId} onChange={e => setTicketForm({...ticketForm, propertyId: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"><option value="">Selecione o imóvel...</option>{contracts.map(c => <option key={c.propertyId} value={c.propertyId}>{c.property?.title}</option>)}</select></div>
              )}
              {user?.role === 'OWNER' && properties.length > 1 && (
                <div><label className="block text-xs font-bold text-slate-600 mb-1">Qual Imóvel?</label><select required value={ticketForm.propertyId} onChange={e => setTicketForm({...ticketForm, propertyId: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"><option value="">Selecione o imóvel...</option>{properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
              )}

              <div><label className="block text-xs font-bold text-slate-600 mb-1">Resumo do Problema (Título)</label><input required type="text" value={ticketForm.title} onChange={e => setTicketForm({...ticketForm, title: e.target.value})} placeholder="Ex: Infiltração no teto / Dúvida de Obra" className={`w-full p-3 border border-slate-300 rounded-xl focus:ring-2 outline-none text-sm ${user?.role === 'CLIENT' ? 'focus:ring-blue-500' : 'focus:ring-emerald-500'}`} /></div>
              <div><label className="block text-xs font-bold text-slate-600 mb-1">Descrição Detalhada</label><textarea required rows={4} value={ticketForm.description} onChange={e => setTicketForm({...ticketForm, description: e.target.value})} placeholder="Descreva o que está acontecendo..." className={`w-full p-3 border border-slate-300 rounded-xl focus:ring-2 outline-none text-sm resize-none ${user?.role === 'CLIENT' ? 'focus:ring-blue-500' : 'focus:ring-emerald-500'}`} /></div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Urgência</label>
                <select value={ticketForm.priority} onChange={e => setTicketForm({...ticketForm, priority: e.target.value})} className={`w-full p-3 border border-slate-300 rounded-xl focus:ring-2 outline-none text-sm bg-white ${user?.role === 'CLIENT' ? 'focus:ring-blue-500' : 'focus:ring-emerald-500'}`}>
                  <option value="Baixa">Baixa (Pode esperar alguns dias)</option><option value="Média">Média (Atrapalha o dia a dia)</option><option value="Alta">Alta (Emergência / Vazamento grave)</option>
                </select>
              </div>

              <button type="submit" disabled={isSavingTicket || !ticketForm.propertyId} className={`w-full mt-4 py-3.5 text-white rounded-xl font-bold text-sm shadow-sm transition-all disabled:opacity-50 flex justify-center items-center gap-2 ${user?.role === 'CLIENT' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                {isSavingTicket ? <Loader2 size={18} className="animate-spin"/> : 'Enviar Chamado à Imobiliária'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INTERAÇÃO (CHAT DO CHAMADO) */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h2 className="font-bold text-slate-800 text-lg line-clamp-1">{selectedTicket.title}</h2>
                <p className="text-xs text-slate-500 flex items-center gap-1.5"><Clock size={12}/> Aberto em {new Date(selectedTicket.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-200/50 rounded-full"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 flex flex-col gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 mb-1 mr-1">Sua Solicitação (Original)</span>
                <div className={`p-4 rounded-2xl rounded-tr-sm text-sm shadow-sm max-w-[85%] ${user?.role === 'CLIENT' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>
                  {selectedTicket.description}
                </div>
              </div>

              {selectedTicket.messages && selectedTicket.messages.map((msg: any) => {
                const isAdmin = msg.sender === 'ADMIN';
                return (
                  <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}>
                    <span className={`text-[10px] font-bold text-slate-400 mb-1 ${isAdmin ? 'ml-1' : 'mr-1'}`}>
                      {isAdmin ? 'Imobiliária' : 'Você'} • {new Date(msg.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <div className={`p-4 rounded-2xl text-sm shadow-sm max-w-[85%] whitespace-pre-wrap ${
                      isAdmin 
                        ? 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm' 
                        : (user?.role === 'CLIENT' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-emerald-600 text-white rounded-tr-sm')
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
              {selectedTicket.status === 'Concluído' ? (
                <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-500">
                  Este chamado já foi concluído.
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escreva uma nova informação ou dúvida..." 
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                  <button 
                    type="submit" 
                    disabled={isSendingMessage || !newMessage.trim()}
                    className={`px-5 text-white rounded-xl font-bold flex items-center justify-center transition-all disabled:opacity-50 ${user?.role === 'CLIENT' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                  >
                    {isSendingMessage ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}