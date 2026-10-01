'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { Plus, X, Loader2, Calendar, MapPin, User, CheckCircle2, Clock, XCircle, MessageSquare } from 'lucide-react';

export default function VisitasPage() {
  const [visits, setVisits] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [brokers, setBrokers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    leadId: '', propertyId: '', brokerId: '', date: '', notes: ''
  });

  const [feedbackForm, setFeedbackForm] = useState({
    status: 'Realizada', feedback: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resVisits, resLeads, resProps, resBrokers] = await Promise.all([
        api.get('/visits'),
        api.get('/leads'),
        api.get('/properties'),
        api.get('/brokers')
      ]);
      setVisits(resVisits.data);
      setLeads(resLeads.data);
      setProperties(resProps.data.filter((p: any) => p.isActive)); // Só exibe imóveis ativos
      setBrokers(resBrokers.data);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post('/visits', form);
      alert('Visita agendada com sucesso!');
      setIsModalOpen(false);
      setForm({ leadId: '', propertyId: '', brokerId: '', date: '', notes: '' });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao agendar.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenFeedback = (visit: any) => {
    setSelectedVisit(visit);
    setFeedbackForm({ status: 'Realizada', feedback: '' });
    setIsFeedbackModalOpen(true);
  };

  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.patch(`/visits/${selectedVisit.id}/status`, feedbackForm);
      alert('Feedback registado! O histórico do cliente foi atualizado.');
      setIsFeedbackModalOpen(false);
      fetchData();
    } catch (error) {
      alert('Erro ao salvar feedback.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center text-slate-500"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Calendar className="text-blue-600" size={32} />
            Controle de Visitas
          </h1>
          <p className="text-slate-500 mt-1">Agende demonstrações de imóveis e capte o feedback dos clientes.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus size={18} /> Agendar Visita
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLUNA 1: PRÓXIMAS VISITAS */}
        <div>
          <h2 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
            <Clock className="text-amber-500" size={20}/> Próximas Visitas (Agendadas)
          </h2>
          <div className="space-y-4">
            {visits.filter(v => v.status === 'Agendada').map(visit => (
              <div key={visit.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{visit.property?.title}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><MapPin size={14}/> {visit.property?.address}</p>
                  </div>
                  <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-center border border-blue-100">
                    <p className="text-xs font-bold uppercase">{new Date(visit.date).toLocaleDateString()}</p>
                    <p className="text-lg font-bold">{new Date(visit.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                
                <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100 text-sm">
                  <div className="flex-1">
                    <p className="text-xs text-slate-400">Cliente (Lead)</p>
                    <p className="font-bold text-slate-700 flex items-center gap-1"><User size={14}/> {visit.lead?.name}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-400">Corretor</p>
                    <p className="font-bold text-slate-700">{visit.broker?.name || 'Não atribuído'}</p>
                  </div>
                </div>

                <button onClick={() => handleOpenFeedback(visit)} className="w-full mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <MessageSquare size={16}/> Finalizar & Dar Feedback
                </button>
              </div>
            ))}
            {visits.filter(v => v.status === 'Agendada').length === 0 && (
              <p className="text-slate-500 text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">Nenhuma visita agendada.</p>
            )}
          </div>
        </div>

        {/* COLUNA 2: HISTÓRICO DE VISITAS */}
        <div>
          <h2 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
            <CheckCircle2 className="text-green-500" size={20}/> Histórico e Feedbacks
          </h2>
          <div className="space-y-4">
            {visits.filter(v => v.status !== 'Agendada').map(visit => (
              <div key={visit.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 opacity-80 hover:opacity-100 transition-opacity">
                <div className="flex justify-between items-center mb-2">
                  <span className={`px-2 py-1 text-xs font-bold rounded-md ${visit.status === 'Realizada' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    {visit.status}
                  </span>
                  <span className="text-xs font-bold text-slate-500">{new Date(visit.date).toLocaleDateString()}</span>
                </div>
                <h3 className="font-bold text-slate-700 text-sm">{visit.property?.title}</h3>
                <p className="text-xs text-slate-500 mt-1">Cliente: {visit.lead?.name} | Corretor: {visit.broker?.name}</p>
                {visit.feedback && (
                  <div className="mt-3 bg-white p-3 rounded border border-slate-200 text-sm text-slate-600 italic">
                    "{visit.feedback}"
                  </div>
                )}
              </div>
            ))}
            {visits.filter(v => v.status !== 'Agendada').length === 0 && (
              <p className="text-slate-500 text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">Nenhum histórico disponível.</p>
            )}
          </div>
        </div>

      </div>

      {/* MODAL: AGENDAR VISITA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="text-blue-600" size={20}/> Nova Visita
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSchedule} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Cliente (Lead do CRM)</label>
                <select required value={form.leadId} onChange={e => setForm({...form, leadId: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white">
                  <option value="">Selecione o cliente...</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Imóvel</label>
                <select required value={form.propertyId} onChange={e => setForm({...form, propertyId: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white">
                  <option value="">Selecione o imóvel...</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Data e Hora</label>
                  <input required type="datetime-local" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Corretor (Opcional)</label>
                  <select value={form.brokerId} onChange={e => setForm({...form, brokerId: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white">
                    <option value="">Sem corretor fixo</option>
                    {brokers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2 transition-colors shadow-sm">
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Confirmar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FEEDBACK DA VISITA */}
      {isFeedbackModalOpen && selectedVisit && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MessageSquare className="text-blue-600" size={20}/> Feedback da Visita
              </h2>
              <button onClick={() => setIsFeedbackModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSaveFeedback} className="p-5 space-y-4">
              <div className="bg-slate-100 p-3 rounded-lg mb-4 text-sm">
                <p><strong>Cliente:</strong> {selectedVisit.lead?.name}</p>
                <p><strong>Imóvel:</strong> {selectedVisit.property?.title}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Status Final</label>
                <select value={feedbackForm.status} onChange={e => setFeedbackForm({...feedbackForm, status: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white">
                  <option value="Realizada">Realizada (Sucesso)</option>
                  <option value="Cancelada">Cancelada (Faltou/Desistiu)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Feedback do Cliente</label>
                <textarea rows={3} required placeholder="Ex: Cliente gostou da sala, mas achou o quarto pequeno. Vai pensar." value={feedbackForm.feedback} onChange={e => setFeedbackForm({...feedbackForm, feedback: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 resize-none" />
                <p className="text-xs text-blue-600 mt-1">Este feedback será guardado automaticamente no Histórico do Lead no CRM.</p>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-4">
                <button type="button" onClick={() => setIsFeedbackModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2 transition-colors shadow-sm">
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Salvar Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}