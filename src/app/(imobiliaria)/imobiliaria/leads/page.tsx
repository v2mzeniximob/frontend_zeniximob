'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { Plus, X, Loader2, User, Phone, MessageCircle, Mail, Calendar, Clock, Briefcase, Search, Sparkles, MapPin, DollarSign, Home } from 'lucide-react';
import { maskPhone } from '@/src/utils/mask';

const STAGES = ['Novo', 'Atendimento', 'Visita', 'Proposta', 'Negociação', 'Fechado', 'Perdido'];

export default function CRMPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [brokers, setBrokers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modais e Abas
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [leadTab, setLeadTab] = useState<'historico' | 'perfil' | 'radar'>('historico');

  // Formulários
  const [form, setForm] = useState({ 
    name: '', phone: '', email: '', interest: 'Compra', notes: '', brokerId: '',
    searchType: '', searchTransaction: '', searchMinPrice: '', searchMaxPrice: '', 
    searchNeighborhoods: '', searchMinBedrooms: '', searchMinGarage: ''
  });
  const [historyForm, setHistoryForm] = useState({ actionType: 'WhatsApp', description: '' });
  
  // Estados de Carregamento
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingMatches, setIsFetchingMatches] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [leadsRes, brokersRes] = await Promise.all([
        api.get('/leads'),
        api.get('/brokers').catch(() => ({ data: [] }))
      ]);
      setLeads(leadsRes.data);
      setBrokers(brokersRes.data);
    } catch (error) {
      console.error('Erro ao buscar dados do CRM:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMatches = async (leadId: string) => {
    setIsFetchingMatches(true);
    try {
      const response = await api.get(`/leads/${leadId}/matches`);
      setMatches(response.data);
    } catch (error) {
      console.error("Erro ao buscar matches:", error);
      setMatches([]);
    } finally {
      setIsFetchingMatches(false);
    }
  };

  const handleOpenLeadDetails = (lead: any) => {
    setSelectedLead(lead);
    setLeadTab('historico');
    
    setForm({
      name: lead.name, phone: lead.phone, email: lead.email || '', interest: lead.interest, notes: lead.notes || '', brokerId: lead.brokerId || '',
      searchType: lead.searchType || '', searchTransaction: lead.searchTransaction || '', 
      searchMinPrice: lead.searchMinPrice || '', searchMaxPrice: lead.searchMaxPrice || '', 
      searchNeighborhoods: lead.searchNeighborhoods?.join(', ') || '', 
      searchMinBedrooms: lead.searchMinBedrooms || '', searchMinGarage: lead.searchMinGarage || ''
    });

    if (lead.searchMaxPrice || lead.searchTransaction || lead.searchType) {
      fetchMatches(lead.id);
    } else {
      setMatches([]);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setIsSaving(true);
    
    try {
      const payload = {
        ...form,
        searchNeighborhoods: form.searchNeighborhoods ? form.searchNeighborhoods.split(',').map((n: string) => n.trim()) : [],
        brokerId: form.brokerId === '' ? null : form.brokerId
      };
      
      const response = await api.put(`/leads/${selectedLead.id}`, payload);
      
      alert('Perfil de busca atualizado! O Radar de Imóveis foi recalculado.');
      
      setSelectedLead(response.data);
      fetchData();
      fetchMatches(selectedLead.id);
      
    } catch (error) {
      alert('Erro ao atualizar perfil do cliente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        phone: form.phone.replace(/\D/g, ''),
        brokerId: form.brokerId === '' ? null : form.brokerId
      };
      
      await api.post('/leads', payload);
      setIsNewLeadModalOpen(false);
      setForm({ 
        name: '', phone: '', email: '', interest: 'Comprador', notes: '', brokerId: '',
        searchType: '', searchTransaction: '', searchMinPrice: '', searchMaxPrice: '', searchNeighborhoods: '', searchMinBedrooms: '', searchMinGarage: ''
      });
      fetchData();
    } catch (error) {
      alert('Erro ao criar lead.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeStage = async (leadId: string, newStage: string) => {
    try {
      await api.put(`/leads/${leadId}`, { stage: newStage });
      fetchData();
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({ ...selectedLead, stage: newStage });
      }
    } catch (error) {
      alert('Erro ao mudar estágio.');
    }
  };

  // ==========================================
  // NOVA LÓGICA DE HISTÓRICO COM REDIRECIONAMENTO
  // ==========================================
  const handleAddHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setIsSaving(true);

    const currentAction = historyForm.actionType;
    const currentDescription = historyForm.description;

    try {
      await api.post(`/leads/${selectedLead.id}/history`, historyForm);
      
      // Redirecionamentos Automáticos baseados na Ação Escolhida
      if (currentAction === 'WhatsApp' && selectedLead.phone) {
        const cleanPhone = selectedLead.phone.replace(/\D/g, '');
        const message = encodeURIComponent(currentDescription);
        window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
      } 
      else if (currentAction === 'E-mail' && selectedLead.email) {
        const subject = encodeURIComponent(`Contato sobre Imóveis - Zenix`);
        const body = encodeURIComponent(currentDescription);
        window.open(`mailto:${selectedLead.email}?subject=${subject}&body=${body}`, '_self');
      }
      else if (currentAction === 'Ligação' && selectedLead.phone) {
        const cleanPhone = selectedLead.phone.replace(/\D/g, '');
        window.open(`tel:${cleanPhone}`, '_self');
      }

      setHistoryForm({ actionType: 'WhatsApp', description: '' });
      
      const response = await api.get('/leads');
      setLeads(response.data);
      const updatedLead = response.data.find((l: any) => l.id === selectedLead.id);
      setSelectedLead(updatedLead);
    } catch (error) {
      alert('Erro ao adicionar histórico.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center text-slate-500"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 max-w-[1600px] mx-auto font-sans h-[calc(100vh-4rem)] flex flex-col animate-in fade-in duration-300">
      
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <MessageCircle className="text-blue-600 bg-blue-50 p-1.5 rounded-lg" size={36} />
            CRM & Funil de Vendas
          </h1>
          <p className="text-slate-500 mt-2 text-sm">Gira os seus clientes, perfil de busca e matches com a base de imóveis.</p>
        </div>
        <button onClick={() => {
            setForm({ name: '', phone: '', email: '', interest: 'Comprador', notes: '', brokerId: '', searchType: '', searchTransaction: '', searchMinPrice: '', searchMaxPrice: '', searchNeighborhoods: '', searchMinBedrooms: '', searchMinGarage: '' });
            setIsNewLeadModalOpen(true);
          }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm">
          <Plus size={18} /> Novo Lead
        </button>
      </div>

      {/* QUADRO KANBAN */}
      <div className="flex-1 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
        <div className="flex gap-5 min-w-max h-full">
          {STAGES.map(stage => {
            const stageLeads = leads.filter(l => l.stage === stage);
            return (
              <div key={stage} className="w-[340px] bg-slate-100/50 rounded-2xl border border-slate-200 flex flex-col max-h-full">
                
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-100/80 rounded-t-2xl shrink-0">
                  <h3 className="font-bold text-slate-700">{stage}</h3>
                  <span className="bg-white text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">{stageLeads.length}</span>
                </div>

                <div className="p-3 flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-slate-300">
                  {stageLeads.map(lead => (
                    <div key={lead.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col gap-3 group relative" onClick={() => handleOpenLeadDetails(lead)}>
                      
                      {(lead.searchMaxPrice || lead.searchNeighborhoods?.length > 0) && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full p-1.5 shadow-md" title="Perfil de Busca Preenchido / Radar Ativo">
                          <Sparkles size={14} className="animate-pulse" />
                        </div>
                      )}

                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
                          {lead.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">{lead.name}</h4>
                          <p className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-wider truncate">
                            {lead.interest}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1.5">
                        <p className="text-xs text-slate-600 flex items-center gap-1.5"><Phone size={12} className="text-slate-400 shrink-0"/> {maskPhone(lead.phone)}</p>
                        {lead.email && (
                          <p className="text-xs text-slate-600 flex items-center gap-1.5 truncate"><Mail size={12} className="text-slate-400 shrink-0"/> <span className="truncate">{lead.email}</span></p>
                        )}
                        {lead.property && (
                          <div className="mt-1 pt-1.5 border-t border-slate-200">
                            <p className="text-xs text-indigo-700 font-semibold flex items-center gap-1.5 truncate">
                              <Home size={12} className="shrink-0"/> <span className="truncate">{lead.property.title}</span>
                            </p>
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-1">
                          <Briefcase size={10} className="shrink-0"/> {lead.broker?.name || 'S/ Corretor'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-1" onClick={e => e.stopPropagation()}>
                        <select 
                          value={lead.stage} 
                          onChange={(e) => handleChangeStage(lead.id, e.target.value)}
                          className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors"
                        >
                          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                          <Clock size={12}/> {new Date(lead.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="text-center p-6 text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-xl font-medium">
                      Nenhum lead nesta fase
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: DETALHES, HISTÓRICO E RADAR DO LEAD */}
      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl h-[90vh] flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="w-full md:w-1/4 bg-slate-50 border-r border-slate-200 p-6 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2 shrink-0 shadow-sm border border-blue-200">
                  <User size={32} />
                </div>
                <button onClick={() => setSelectedLead(null)} className="md:hidden text-slate-400 p-2 hover:bg-slate-200 rounded-lg"><X size={20}/></button>
              </div>
              
              <h2 className="text-xl font-bold text-slate-800 leading-tight">{selectedLead.name}</h2>
              <span className="inline-block mt-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold w-fit">{selectedLead.interest}</span>

              <div className="mt-8 flex flex-col gap-2">
                <button 
                  onClick={() => setLeadTab('historico')} 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${leadTab === 'historico' ? 'bg-white text-blue-600 shadow-sm border border-blue-100' : 'text-slate-600 hover:bg-slate-100 border border-transparent'}`}
                >
                  <Clock size={18} /> Linha do Tempo
                </button>
                <button 
                  onClick={() => setLeadTab('perfil')} 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${leadTab === 'perfil' ? 'bg-white text-blue-600 shadow-sm border border-blue-100' : 'text-slate-600 hover:bg-slate-100 border border-transparent'}`}
                >
                  <Search size={18} /> Perfil de Busca
                </button>
                <button 
                  onClick={() => setLeadTab('radar')} 
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-colors ${leadTab === 'radar' ? 'bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 shadow-sm border border-orange-200' : 'text-slate-600 hover:bg-slate-100 border border-transparent'}`}
                >
                  <div className="flex items-center gap-3"><Sparkles size={18} className={leadTab === 'radar' ? "text-orange-500" : ""} /> Radar Imóveis</div>
                  {matches.length > 0 && <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full">{matches.length}</span>}
                </button>
              </div>

              {/* DADOS DE CONTATO RÁPIDOS E CLICÁVEIS */}
              <div className="mt-auto pt-6 border-t border-slate-200 space-y-3">
                <a 
                  href={`https://wa.me/${selectedLead.phone?.replace(/\D/g, '')}`} 
                  target="_blank" rel="noreferrer" 
                  className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white hover:bg-green-50 hover:text-green-700 hover:border-green-200 p-2.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                  title="Abrir WhatsApp"
                >
                  <Phone size={14} className="text-green-500"/> {maskPhone(selectedLead.phone)}
                </a>

                {selectedLead.email && (
                  <a 
                    href={`mailto:${selectedLead.email}`} 
                    className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 p-2.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    title="Enviar E-mail"
                  >
                    <Mail size={14} className="text-blue-500"/> <span className="truncate">{selectedLead.email}</span>
                  </a>
                )}
                
                {selectedLead.property && (
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 bg-indigo-50 p-2.5 rounded-lg border border-indigo-100">
                    <Home size={14} className="text-indigo-500 shrink-0"/> <span className="truncate" title={selectedLead.property.title}>{selectedLead.property.title}</span>
                  </div>
                )}
                <p className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                  <Briefcase size={14} className="text-blue-500"/> {selectedLead.broker?.name || 'Sem Corretor'}
                </p>
              </div>
            </div>

            <div className="w-full md:w-3/4 flex flex-col h-full relative bg-slate-50/30">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10 shadow-sm">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  {leadTab === 'historico' ? <><Clock className="text-blue-500"/> Histórico de Atendimento</> : 
                   leadTab === 'perfil' ? <><Search className="text-blue-500"/> O que o cliente procura?</> : 
                   <><Sparkles className="text-orange-500"/> Radar de Matchmaking</>}
                </h3>
                <button onClick={() => setSelectedLead(null)} className="hidden md:flex p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><X size={20}/></button>
              </div>

              {leadTab === 'historico' && (
                <>
                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    <div className="space-y-6">
                      {selectedLead.history?.map((event: any, index: number) => (
                        <div key={event.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-md border-2 border-white
                              ${event.actionType === 'WhatsApp' ? 'bg-green-500' : 
                                event.actionType === 'Ligação' ? 'bg-blue-500' : 
                                event.actionType === 'E-mail' ? 'bg-cyan-500' :
                                event.actionType === 'Visita' ? 'bg-purple-500' : 
                                event.actionType === 'Sistema' ? 'bg-slate-400' : 
                                event.actionType === 'Mudança de Estágio' ? 'bg-indigo-500' : 'bg-amber-500'}`}>
                              {event.actionType === 'WhatsApp' ? <MessageCircle size={18}/> : 
                               event.actionType === 'Ligação' ? <Phone size={18}/> : 
                               event.actionType === 'E-mail' ? <Mail size={18}/> : 
                               event.actionType === 'Visita' ? <Calendar size={18}/> : 
                               event.actionType === 'Mudança de Estágio' ? <Briefcase size={18}/> : <Clock size={18}/>}
                            </div>
                            {index !== selectedLead.history.length - 1 && <div className="w-0.5 h-full bg-slate-200 my-2"></div>}
                          </div>
                          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex-1 pb-5 mb-2 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-slate-800">{event.actionType}</span>
                              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{new Date(event.date).toLocaleString()}</span>
                            </div>
                            <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">{event.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-5 bg-white border-t border-slate-200 shrink-0">
                    <form onSubmit={handleAddHistory} className="flex gap-3">
                      <select 
                        value={historyForm.actionType} 
                        onChange={e => setHistoryForm({...historyForm, actionType: e.target.value})}
                        className="px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold bg-slate-50 cursor-pointer w-[160px] shrink-0"
                      >
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Ligação">Ligação</option>
                        <option value="E-mail">E-mail</option>
                        <option value="Visita">Visita</option>
                        <option value="Anotação">Anotação Interna</option>
                      </select>
                      
                      <input 
                        required type="text" placeholder="Descreva o que foi falado (Será enviado ao cliente...)"
                        value={historyForm.description} onChange={e => setHistoryForm({...historyForm, description: e.target.value})}
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      
                      <button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-70 whitespace-nowrap">
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : 
                          (historyForm.actionType === 'WhatsApp' || historyForm.actionType === 'E-mail' || historyForm.actionType === 'Ligação') 
                            ? 'Registar & Abrir' 
                            : 'Registar Ação'
                        }
                      </button>
                    </form>
                  </div>
                </>
              )}

              {leadTab === 'perfil' && (
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                  <div className="max-w-3xl">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-6 text-sm text-blue-800">
                      <p className="font-bold flex items-center gap-2"><Search size={18}/> Radar Inteligente</p>
                      <p className="mt-1">Preencha o perfil abaixo. O sistema cruzará estas informações automaticamente com todos os imóveis da base e exibirá os resultados na aba <strong>"Radar Imóveis"</strong>.</p>
                    </div>

                    <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-6">
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Qual é a transação?</label>
                            <select value={form.searchTransaction} onChange={e => setForm({...form, searchTransaction: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                              <option value="">Qualquer (Indefinido)</option>
                              <option value="Locação">Apenas Locação / Aluguel</option>
                              <option value="Venda">Apenas Compra / Venda</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Imóvel</label>
                            <select value={form.searchType} onChange={e => setForm({...form, searchType: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                              <option value="">Qualquer (Indefinido)</option>
                              <option value="Casa">Casa</option>
                              <option value="Apartamento">Apartamento</option>
                              <option value="Comercial">Sala Comercial</option>
                              <option value="Terreno">Terreno</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1"><DollarSign size={14}/> Orçamento Máximo (R$)</label>
                            <input type="number" value={form.searchMaxPrice} onChange={e => setForm({...form, searchMaxPrice: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Ex: 500000" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1"><MapPin size={14}/> Bairros de Interesse (Separados por vírgula)</label>
                            <input type="text" value={form.searchNeighborhoods} onChange={e => setForm({...form, searchNeighborhoods: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Ex: Centro, Tatuapé, Moema..." />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1"><Home size={14}/> Quartos (Mínimo)</label>
                            <input type="number" value={form.searchMinBedrooms} onChange={e => setForm({...form, searchMinBedrooms: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Ex: 2" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Vagas de Garagem (Mínimo)</label>
                            <input type="number" value={form.searchMinGarage} onChange={e => setForm({...form, searchMinGarage: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Ex: 1" />
                          </div>
                        </div>

                        <div className="border-t border-slate-100 pt-5 mt-5">
                          <label className="block text-xs font-bold text-slate-700 mb-1">Deseja alterar o Corretor deste Lead?</label>
                          <select value={form.brokerId} onChange={e => setForm({...form, brokerId: e.target.value})} className="w-full md:w-1/2 px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                            <option value="">Sem corretor</option>
                            {brokers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                          </select>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-70">
                          {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Salvar Perfil e Atualizar Radar'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {leadTab === 'radar' && (
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                  {isFetchingMatches ? (
                    <div className="flex flex-col items-center justify-center h-64 text-orange-500">
                      <Sparkles size={48} className="animate-pulse mb-4" />
                      <p className="font-bold text-lg">A calcular compatibilidade...</p>
                      <p className="text-sm text-slate-500">Cruzando o perfil de busca com todos os imóveis da base.</p>
                    </div>
                  ) : matches.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400 opacity-80 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-lg mx-auto text-center">
                      <Search size={48} className="mb-4 text-slate-300"/>
                      <p className="font-bold text-xl text-slate-700 mb-2">Nenhum Match Encontrado</p>
                      <p className="text-sm">Não encontrámos imóveis ativos que batam com o Perfil de Busca preenchido. Tente ajustar o Orçamento ou Bairros na aba anterior.</p>
                    </div>
                  ) : (
                    <div className="max-w-4xl space-y-4">
                      {matches.map((match: any, i: number) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col sm:flex-row hover:shadow-md transition-all group">
                          <div className="w-full sm:w-48 h-48 sm:h-auto bg-slate-100 shrink-0 relative overflow-hidden">
                            {match.property.imageUrls && match.property.imageUrls[0] ? (
                              <img src={match.property.imageUrls[0]} alt="Imóvel" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300"><Home size={40}/></div>
                            )}
                            <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-black shadow-lg flex items-center gap-1 backdrop-blur-md
                              ${match.score >= 80 ? 'bg-emerald-500/90 text-white border border-emerald-400' : 
                                match.score >= 60 ? 'bg-yellow-400/90 text-yellow-900 border border-yellow-300' : 'bg-slate-800/90 text-white'}`}>
                              <Sparkles size={12}/> {match.score}% MATCH
                            </div>
                          </div>
                          
                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded uppercase tracking-wider">{match.property.transaction}</span>
                                  <h4 className="font-bold text-slate-800 text-lg mt-2 leading-tight">{match.property.title}</h4>
                                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-1"><MapPin size={14}/> {match.property.neighborhood}, {match.property.city}</p>
                                </div>
                                <p className="font-black text-blue-600 text-xl whitespace-nowrap ml-4">R$ {Number(match.property.price).toLocaleString('pt-BR')}</p>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div>Tipo: <span className="text-slate-800">{match.property.type}</span></div>
                                <div>Quartos: <span className="text-slate-800">{match.property.bedrooms}</span></div>
                                <div>Vagas: <span className="text-slate-800">{match.property.garage}</span></div>
                                <div>Área: <span className="text-slate-800">{match.property.area}m²</span></div>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center gap-3">
                              <a 
                                href={`https://wa.me/${selectedLead.phone.replace(/\D/g, '')}?text=Olá ${selectedLead.name.split(' ')[0]}! Encontrei um imóvel que bate exatamente com o que procura no bairro ${match.property.neighborhood}. Dá uma olhada:`} 
                                target="_blank" rel="noreferrer"
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-2"
                              >
                                <MessageCircle size={14}/> Enviar no WhatsApp
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVO LEAD */}
      {isNewLeadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Novo Lead Manual</h2>
              <button onClick={() => setIsNewLeadModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-lg transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateLead} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo *</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Ex: João Silva" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Telefone *</label>
                  <input required type="text" value={form.phone} onChange={e => setForm({...form, phone: maskPhone(e.target.value)})} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="(00) 00000-0000" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Interesse Inicial</label>
                  <select value={form.interest} onChange={e => setForm({...form, interest: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                    <option value="Comprador">Comprador</option>
                    <option value="Inquilino">Inquilino</option>
                    <option value="Venda do Imóvel">Venda do Imóvel</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Corretor Responsável</label>
                <select value={form.brokerId} onChange={e => setForm({...form, brokerId: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                  <option value="">Sem corretor (Atendimento Geral)</option>
                  {brokers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Anotações / O que procura?</label>
                <textarea rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Descreva brevemente... Pode detalhar o perfil exato depois na aba de Busca."></textarea>
              </div>
              <button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-70 mt-4">
                {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20}/>} 
                Salvar Novo Lead
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}