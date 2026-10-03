'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { Plus, X, Loader2, User, Phone, MessageCircle, Mail, Calendar, Clock, Briefcase } from 'lucide-react';
import { maskPhone } from '@/src/utils/mask';

const STAGES = ['Novo', 'Atendimento', 'Visita', 'Proposta', 'Negociação', 'Fechado', 'Perdido'];

export default function CRMPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [brokers, setBrokers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modais
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  // Formulários
  const [form, setForm] = useState({ name: '', phone: '', email: '', interest: 'Compra', notes: '', brokerId: '' });
  const [historyForm, setHistoryForm] = useState({ actionType: 'WhatsApp', description: '' });
  const [isSaving, setIsSaving] = useState(false);

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

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        phone: form.phone.replace(/\D/g, ''), // Limpa a máscara para o DB
        brokerId: form.brokerId === '' ? null : form.brokerId
      };
      
      await api.post('/leads', payload);
      setIsNewLeadModalOpen(false);
      setForm({ name: '', phone: '', email: '', interest: 'Compra', notes: '', brokerId: '' });
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

  const handleAddHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setIsSaving(true);
    try {
      await api.post(`/leads/${selectedLead.id}/history`, historyForm);
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
          <p className="text-slate-500 mt-2 text-sm">Gira os seus clientes, acompanhe negociações e registe o histórico de contactos.</p>
        </div>
        <button onClick={() => setIsNewLeadModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm">
          <Plus size={18} /> Novo Lead Manual
        </button>
      </div>

      {/* QUADRO KANBAN (Scroll Horizontal) */}
      <div className="flex-1 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
        <div className="flex gap-5 min-w-max h-full">
          {STAGES.map(stage => {
            const stageLeads = leads.filter(l => l.stage === stage);
            return (
              <div key={stage} className="w-[340px] bg-slate-100/50 rounded-2xl border border-slate-200 flex flex-col max-h-full">
                {/* Cabeçalho da Coluna */}
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-100/80 rounded-t-2xl shrink-0">
                  <h3 className="font-bold text-slate-700">{stage}</h3>
                  <span className="bg-white text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">{stageLeads.length}</span>
                </div>

                {/* Lista de Cards */}
                <div className="p-3 flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-slate-300">
                  {stageLeads.map(lead => (
                    <div key={lead.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col gap-3 group" onClick={() => setSelectedLead(lead)}>
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
                          {lead.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">{lead.name}</h4>
                          <p className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                            {lead.interest}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <p className="text-xs text-slate-600 flex items-center gap-1.5 mb-1"><Phone size={12} className="text-slate-400"/> {maskPhone(lead.phone)}</p>
                        <p className="text-xs text-slate-600 flex items-center gap-1.5"><Briefcase size={12} className="text-slate-400"/> {lead.broker?.name || 'Sem corretor'}</p>
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

      {/* MODAL: DETALHES E HISTÓRICO DO LEAD */}
      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[85vh] flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Esquerda: Dados do Cliente */}
            <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-200 p-6 flex flex-col overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 shrink-0 shadow-sm border border-blue-200">
                  <User size={32} />
                </div>
                <button onClick={() => setSelectedLead(null)} className="md:hidden text-slate-400 p-2 hover:bg-slate-200 rounded-lg"><X size={20}/></button>
              </div>
              
              <h2 className="text-2xl font-bold text-slate-800">{selectedLead.name}</h2>
              <div className="mt-4 text-sm text-slate-600 space-y-4">
                <p className="flex items-center gap-3 font-medium bg-white p-3 rounded-xl border border-slate-200 shadow-sm"><Phone size={18} className="text-blue-500"/> {maskPhone(selectedLead.phone)}</p>
                {selectedLead.email && <p className="flex items-center gap-3 font-medium bg-white p-3 rounded-xl border border-slate-200 shadow-sm"><Mail size={18} className="text-blue-500"/> {selectedLead.email}</p>}
                
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <p className="font-bold text-slate-700 mb-3 uppercase tracking-wider text-xs">Perfil do Lead</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-xs text-slate-500 font-bold">Interesse</span>
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{selectedLead.interest}</span>
                    </div>
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-xs text-slate-500 font-bold flex items-center gap-2"><Briefcase size={14}/> Corretor</span>
                      <span className="text-sm font-bold text-slate-800">{selectedLead.broker?.name || 'Não Atribuído'}</span>
                    </div>
                  </div>
                </div>

                {selectedLead.notes && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <p className="font-bold text-slate-700 mb-2 uppercase tracking-wider text-xs">Anotações Iniciais</p>
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-slate-700 italic">
                      {selectedLead.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Direita: Linha do Tempo (Timeline) */}
            <div className="w-full md:w-2/3 flex flex-col h-full relative">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10 shadow-sm">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Clock className="text-blue-500"/> Histórico de Atendimento</h3>
                <button onClick={() => setSelectedLead(null)} className="hidden md:flex p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><X size={20}/></button>
              </div>

              {/* TIMELINE */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                <div className="space-y-6">
                  {selectedLead.history?.map((event: any, index: number) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-md border-2 border-white
                          ${event.actionType === 'WhatsApp' ? 'bg-green-500' : 
                            event.actionType === 'Ligação' ? 'bg-blue-500' : 
                            event.actionType === 'Visita' ? 'bg-purple-500' : 
                            event.actionType === 'Sistema' ? 'bg-slate-400' : 'bg-amber-500'}`}>
                          {event.actionType === 'WhatsApp' ? <MessageCircle size={18}/> : 
                           event.actionType === 'Ligação' ? <Phone size={18}/> : 
                           event.actionType === 'Visita' ? <Calendar size={18}/> : <Clock size={18}/>}
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
                  {(!selectedLead.history || selectedLead.history.length === 0) && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                      <MessageCircle size={48} className="mb-4"/>
                      <p className="font-medium text-lg">Nenhum histórico registado.</p>
                      <p className="text-sm">Seja o primeiro a contactar este cliente!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Formulário para adicionar novo histórico */}
              <div className="p-5 bg-white border-t border-slate-200 shrink-0">
                <form onSubmit={handleAddHistory} className="flex gap-3">
                  <select 
                    value={historyForm.actionType} 
                    onChange={e => setHistoryForm({...historyForm, actionType: e.target.value})}
                    className="px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold bg-slate-50 cursor-pointer"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Ligação">Ligação</option>
                    <option value="E-mail">E-mail</option>
                    <option value="Visita">Visita</option>
                    <option value="Anotação">Anotação Interna</option>
                  </select>
                  <input 
                    required type="text" placeholder="Descreva o que foi falado ou acordado com o cliente..."
                    value={historyForm.description} onChange={e => setHistoryForm({...historyForm, description: e.target.value})}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-70">
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Registar Ação'}
                  </button>
                </form>
              </div>
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
                  <label className="block text-sm font-bold text-slate-700 mb-1">Interesse</label>
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
                <label className="block text-sm font-bold text-slate-700 mb-1">Anotações Iniciais</label>
                <textarea rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Ex: Procura apartamento T3 na zona norte com garagem..."></textarea>
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