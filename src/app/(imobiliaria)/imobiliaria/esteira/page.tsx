'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { 
  Plus, X, Loader2, GripVertical, DollarSign, 
  User, Home, UserCheck, KanbanSquare, Calendar, Building2
} from 'lucide-react';

export default function EsteiraPage() {
  const [stages, setStages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dados auxiliares para o Modal de Novo Negócio
  const [leads, setLeads] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [brokers, setBrokers] = useState<any[]>([]);

  // Controle de Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [form, setForm] = useState({
    title: '',
    transactionType: 'Venda',
    agreedPrice: '',
    stageId: '',
    leadId: '',
    propertyId: '',
    brokerId: ''
  });

  useEffect(() => {
    fetchKanban();
    fetchAuxiliaryData();
  }, []);

  const fetchKanban = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/deals/stages');
      setStages(res.data);
    } catch (error) {
      console.error('Erro ao carregar a esteira:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuxiliaryData = async () => {
    try {
      const [resLeads, resProps, resBrokers] = await Promise.all([
        api.get('/leads'),
        api.get('/properties'),
        api.get('/brokers')
      ]);
      setLeads(resLeads.data);
      setProperties(resProps.data);
      setBrokers(resBrokers.data);
    } catch (error) {
      console.error('Erro ao buscar dados auxiliares:', error);
    }
  };

  // =======================================================
  // LÓGICA DE DRAG-AND-DROP (NATIVA DO HTML5)
  // =======================================================
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('dealId', dealId);
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessário para permitir o "drop"
    e.currentTarget.classList.add('bg-slate-100');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-slate-100');
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-slate-100');
    
    const dealId = e.dataTransfer.getData('dealId');
    if (!dealId) return;

    // Atualização Otimista UI (Move o card visualmente antes da API responder)
    setStages(prevStages => {
      let movedDeal: any = null;
      const newStages = prevStages.map(stage => {
        const dealIndex = stage.deals.findIndex((d: any) => d.id === dealId);
        if (dealIndex > -1) {
          movedDeal = { ...stage.deals[dealIndex], stageId: targetStageId };
          return { ...stage, deals: stage.deals.filter((d: any) => d.id !== dealId) };
        }
        return stage;
      });

      if (movedDeal) {
        return newStages.map(stage => {
          if (stage.id === targetStageId) {
            return { ...stage, deals: [movedDeal, ...stage.deals] };
          }
          return stage;
        });
      }
      return prevStages;
    });

    try {
      await api.patch(`/deals/${dealId}/move`, { newStageId: targetStageId });
    } catch (error) {
      alert('Erro ao mover o card. A sincronizar novamente.');
      fetchKanban(); // Reverte caso a API falhe
    }
  };

  // =======================================================
  // CRIAR NOVO NEGÓCIO
  // =======================================================
  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Se o usuário não escolheu uma coluna, coloca na primeira coluna por padrão
      const defaultStageId = form.stageId || stages[0]?.id;
      if (!defaultStageId) {
        alert("Erro: Não existem colunas configuradas no Kanban.");
        setIsSaving(false);
        return;
      }

      await api.post('/deals', { ...form, stageId: defaultStageId });
      
      setIsModalOpen(false);
      setForm({ title: '', transactionType: 'Venda', agreedPrice: '', stageId: '', leadId: '', propertyId: '', brokerId: '' });
      fetchKanban();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao criar negócio.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center text-slate-500"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 max-w-[1800px] mx-auto font-sans h-[calc(100vh-4rem)] flex flex-col animate-in fade-in duration-300">
      
      {/* CABEÇALHO */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <KanbanSquare className="text-indigo-600 bg-indigo-50 p-1.5 rounded-lg" size={36} />
            Esteira de Negócios
          </h1>
          <p className="text-slate-500 mt-2 text-sm">Arraste os cards pelas fases do funil até ao fechamento do contrato.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus size={18} /> Novo Negócio
        </button>
      </div>

      {/* QUADRO KANBAN (DRAG & DROP) */}
      <div className="flex-1 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
        <div className="flex gap-5 min-w-max h-full">
          {stages.map(stage => (
            <div 
              key={stage.id} 
              className="w-[360px] bg-slate-100/60 rounded-2xl border border-slate-200 flex flex-col max-h-full transition-colors duration-200"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              
              {/* Cabeçalho da Coluna */}
              <div className="p-4 flex justify-between items-center border-b border-slate-200 bg-slate-100/80 rounded-t-2xl shrink-0" style={{ borderTop: `4px solid ${stage.colorCode}` }}>
                <h3 className="font-bold text-slate-700 truncate pr-2">{stage.name}</h3>
                <span className="bg-white text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm shrink-0">
                  {stage.deals?.length || 0}
                </span>
              </div>

              {/* Área dos Cards */}
              <div className="p-3 flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-slate-300">
                {stage.deals?.map((deal: any) => (
                  <div 
                    key={deal.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal.id)}
                    onDragEnd={handleDragEnd}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-grab active:cursor-grabbing group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${deal.transactionType === 'Venda' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {deal.transactionType}
                        </span>
                        <h4 className="font-bold text-slate-800 text-sm mt-1 leading-tight">{deal.title}</h4>
                      </div>
                      <GripVertical size={16} className="text-slate-300 group-hover:text-slate-500" />
                    </div>

                    {deal.agreedPrice && (
                      <p className="font-black text-emerald-600 text-base mb-3 flex items-center gap-1">
                        <DollarSign size={14}/> {Number(deal.agreedPrice).toLocaleString('pt-BR')}
                      </p>
                    )}

                    <div className="bg-slate-50 rounded-lg p-3 space-y-2 border border-slate-100">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <User size={12} className="text-slate-400" />
                        <span className="font-bold text-slate-700 truncate">{deal.lead?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Home size={12} className="text-slate-400" />
                        <span className="truncate">{deal.property?.title}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-between items-center border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                        <UserCheck size={12}/> {deal.broker?.name?.split(' ')[0] || 'Sem Corretor'}
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Calendar size={10}/> {new Date(deal.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}

                {(!stage.deals || stage.deals.length === 0) && (
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
                    <span className="text-sm font-medium text-slate-400">Solte os cards aqui</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: NOVO NEGÓCIO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><KanbanSquare className="text-indigo-600" size={24}/> Novo Negócio</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-lg transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleCreateDeal} className="p-6 space-y-5">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Título do Negócio *</label>
                <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="Ex: Compra - Apto Tatuapé" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Transação</label>
                  <select value={form.transactionType} onChange={e => setForm({...form, transactionType: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold">
                    <option value="Venda">Venda</option>
                    <option value="Locação">Locação</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Valor Acordado (R$)</label>
                  <input type="number" value={form.agreedPrice} onChange={e => setForm({...form, agreedPrice: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-emerald-700" placeholder="Ex: 500000" />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1"><User size={14}/> Cliente (Lead) *</label>
                  <select required value={form.leadId} onChange={e => setForm({...form, leadId: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                    <option value="">Selecione o Cliente...</option>
                    {leads.map(l => <option key={l.id} value={l.id}>{l.name} ({l.interest})</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1"><Building2 size={14}/> Imóvel em Negociação *</label>
                  <select required value={form.propertyId} onChange={e => setForm({...form, propertyId: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                    <option value="">Selecione o Imóvel...</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.title} - R$ {p.price}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1"><UserCheck size={14}/> Corretor *</label>
                  <select required value={form.brokerId} onChange={e => setForm({...form, brokerId: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                    <option value="">Selecione o Corretor...</option>
                    {brokers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Fase Inicial (Opcional)</label>
                <select value={form.stageId} onChange={e => setForm({...form, stageId: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                  {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">Se não escolher, entrará na primeira fase configurada.</p>
              </div>

              <button type="submit" disabled={isSaving} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-70 mt-4">
                {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20}/>} 
                Criar Negócio
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}