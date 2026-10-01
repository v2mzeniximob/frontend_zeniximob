'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { Plus, X, Loader2, User, Phone, MessageCircle, Mail, Calendar, Clock, ChevronRight } from 'lucide-react';

// Os estágios do nosso funil de vendas
const STAGES = ['Novo', 'Atendimento', 'Visita', 'Proposta', 'Negociação', 'Fechado', 'Perdido'];

export default function CRMPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modais
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  // Formulários
  const [form, setForm] = useState({ name: '', phone: '', email: '', interest: 'Compra', notes: '' });
  const [historyForm, setHistoryForm] = useState({ actionType: 'WhatsApp', description: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/leads');
      setLeads(response.data);
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post('/leads', form);
      setIsNewLeadModalOpen(false);
      setForm({ name: '', phone: '', email: '', interest: 'Compra', notes: '' });
      fetchLeads();
    } catch (error) {
      alert('Erro ao criar lead.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeStage = async (leadId: string, newStage: string) => {
    try {
      await api.put(`/leads/${leadId}`, { stage: newStage });
      fetchLeads();
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
      
      // Atualiza o lead selecionado e a lista
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
    <div className="p-8 max-w-[1600px] mx-auto font-sans h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <MessageCircle className="text-blue-600" size={32} />
            CRM & Funil de Vendas
          </h1>
          <p className="text-slate-500 mt-1">Gira os seus clientes, acompanhe negociações e registe o histórico de contactos.</p>
        </div>
        <button onClick={() => setIsNewLeadModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus size={18} /> Novo Lead
        </button>
      </div>

      {/* QUADRO KANBAN (Scroll Horizontal) */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max h-full">
          {STAGES.map(stage => {
            const stageLeads = leads.filter(l => l.stage === stage);
            return (
              <div key={stage} className="w-80 bg-slate-100/50 rounded-xl border border-slate-200 flex flex-col max-h-full">
                {/* Cabeçalho da Coluna */}
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-100 rounded-t-xl shrink-0">
                  <h3 className="font-bold text-slate-700">{stage}</h3>
                  <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">{stageLeads.length}</span>
                </div>

                {/* Lista de Cards */}
                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                  {stageLeads.map(lead => (
                    <div key={lead.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer flex flex-col gap-3 group" onClick={() => setSelectedLead(lead)}>
                      <div>
                        <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{lead.name}</h4>
                        <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-1">
                          Interesse: <span className="text-blue-600">{lead.interest}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-100" onClick={e => e.stopPropagation() /* Impede abrir o modal ao clicar no select */}>
                        <select 
                          value={lead.stage} 
                          onChange={(e) => handleChangeStage(lead.id, e.target.value)}
                          className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-600 outline-none focus:border-blue-500"
                        >
                          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock size={10}/> {new Date(lead.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="text-center p-4 text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[85vh] flex flex-col md:flex-row overflow-hidden">
            
            {/* Esquerda: Dados do Cliente */}
            <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-200 p-6 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 shrink-0">
                  <User size={32} />
                </div>
                <button onClick={() => setSelectedLead(null)} className="md:hidden text-slate-400"><X size={24}/></button>
              </div>
              
              <h2 className="text-2xl font-bold text-slate-800">{selectedLead.name}</h2>
              <div className="mt-2 text-sm text-slate-600 space-y-3">
                <p className="flex items-center gap-2"><Phone size={16}/> {selectedLead.phone}</p>
                {selectedLead.email && <p className="flex items-center gap-2"><Mail size={16}/> {selectedLead.email}</p>}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="font-semibold text-slate-700 mb-1">Interesse:</p>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{selectedLead.interest}</span>
                </div>
                {selectedLead.notes && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="font-semibold text-slate-700 mb-1">Anotações Iniciais:</p>
                    <p className="text-slate-500 italic">{selectedLead.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Direita: Linha do Tempo (Timeline) */}
            <div className="w-full md:w-2/3 flex flex-col h-full relative">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
                <h3 className="font-bold text-slate-800">Histórico de Atendimento</h3>
                <button onClick={() => setSelectedLead(null)} className="hidden md:block text-slate-400 hover:text-slate-600"><X size={24}/></button>
              </div>

              {/* TIMELINE */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                <div className="space-y-6">
                  {selectedLead.history?.map((event: any, index: number) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm
                          ${event.actionType === 'WhatsApp' ? 'bg-green-500' : 
                            event.actionType === 'Ligação' ? 'bg-blue-500' : 
                            event.actionType === 'Visita' ? 'bg-purple-500' : 
                            event.actionType === 'Sistema' ? 'bg-slate-400' : 'bg-amber-500'}`}>
                          {event.actionType === 'WhatsApp' ? <MessageCircle size={14}/> : 
                           event.actionType === 'Ligação' ? <Phone size={14}/> : 
                           event.actionType === 'Visita' ? <Calendar size={14}/> : <Clock size={14}/>}
                        </div>
                        {index !== selectedLead.history.length - 1 && <div className="w-0.5 h-full bg-slate-200 my-1"></div>}
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex-1 pb-4 mb-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-700 text-sm">{event.actionType}</span>
                          <span className="text-xs text-slate-400">{new Date(event.date).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-600 text-sm whitespace-pre-wrap">{event.description}</p>
                      </div>
                    </div>
                  ))}
                  {(!selectedLead.history || selectedLead.history.length === 0) && (
                    <p className="text-center text-slate-500">Nenhum histórico registado.</p>
                  )}
                </div>
              </div>

              {/* Formulário para adicionar novo histórico */}
              <div className="p-4 bg-white border-t border-slate-200">
                <form onSubmit={handleAddHistory} className="flex gap-3">
                  <select 
                    value={historyForm.actionType} 
                    onChange={e => setHistoryForm({...historyForm, actionType: e.target.value})}
                    className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm bg-slate-50"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Ligação">Ligação</option>
                    <option value="E-mail">E-mail</option>
                    <option value="Visita">Visita</option>
                    <option value="Anotação">Anotação</option>
                  </select>
                  <input 
                    required type="text" placeholder="Ex: Cliente gostou da casa, enviei proposta..."
                    value={historyForm.description} onChange={e => setHistoryForm({...historyForm, description: e.target.value})}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm"
                  />
                  <button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Registar'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVO LEAD */}
      {isNewLeadModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Novo Cliente (Lead)</h2>
              <button onClick={() => setIsNewLeadModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateLead} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome Completo</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Telefone</label>
                  <input required type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Interesse</label>
                  <select value={form.interest} onChange={e => setForm({...form, interest: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white">
                    <option value="Compra">Compra</option>
                    <option value="Locação">Locação</option>
                    <option value="Venda do seu Imóvel">Venda do seu Imóvel</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Anotações Iniciais</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg resize-none" placeholder="Ex: Procura T3 na zona norte..."></textarea>
              </div>
              <button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2">
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Salvar Lead'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}