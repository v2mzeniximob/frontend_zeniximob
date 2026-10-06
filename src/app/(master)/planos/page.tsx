'use client';

import { useState, useEffect } from 'react';
import { api } from '@/src/lib/api';
import { 
  Package, Plus, Search, CheckCircle2, X, Edit, Trash2, 
  Layers, DollarSign, Users, ShieldCheck, Loader2
} from 'lucide-react';

// Lista oficial de módulos que a sua plataforma possui
const AVAILABLE_MODULES = [
  { id: 'CRM', label: 'CRM & Funil de Vendas' },
  { id: 'FINANCEIRO', label: 'Gestão Financeira & Repasses' },
  { id: 'CONTRATOS', label: 'Emissão de Contratos & PDFs' },
  { id: 'PORTAIS', label: 'Integração com Portais (VRSync)' },
  { id: 'VISTORIAS', label: 'Vistorias Digitais' },
  { id: 'CHAVES', label: 'Portaria e Controle de Chaves' },
  { id: 'TICKETS', label: 'Manutenção e Chamados' },
];

const initialForm = {
  name: '',
  price: '',
  modules: [] as string[],
  hasSupport: false,
  supportPrice: '',
  isActive: true
};

export default function GestaoPlanosPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<any>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      // Ajuste a rota caso a sua API do master seja diferente (ex: /master/plans)
      const response = await api.get('/plans');
      setPlans(response.data);
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (plan?: any) => {
    if (plan) {
      setEditingId(plan.id);
      setFormData({
        name: plan.name,
        price: plan.price,
        modules: plan.modules || [],
        hasSupport: plan.hasSupport,
        supportPrice: plan.supportPrice || '',
        isActive: plan.isActive
      });
    } else {
      setEditingId(null);
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  const handleToggleModule = (moduleId: string) => {
    setFormData((prev: any) => {
      const currentModules = prev.modules || [];
      if (currentModules.includes(moduleId)) {
        // Se já tem, remove
        return { ...prev, modules: currentModules.filter((m: string) => m !== moduleId) };
      } else {
        // Se não tem, adiciona
        return { ...prev, modules: [...currentModules, moduleId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.modules.length === 0) {
      alert('Selecione pelo menos um módulo para este plano.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await api.put(`/plans/${editingId}`, formData);
      } else {
        await api.post('/plans', formData);
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar plano.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este plano?')) return;
    try {
      await api.delete(`/plans/${id}`);
      fetchPlans();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao excluir.');
    }
  };

  const filteredPlans = plans.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-8 max-w-[1600px] mx-auto font-sans animate-in fade-in duration-300">
      
      {/* CABEÇALHO MASTER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <span className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3 inline-block shadow-sm">Zenix Master</span>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Package className="text-indigo-600" size={32} />
            Gestão de Planos & SaaS
          </h1>
          <p className="text-slate-500 mt-2">Crie e configure os pacotes de assinatura e os módulos liberados para as imobiliárias.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" placeholder="Buscar plano..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>
          <button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md text-sm whitespace-nowrap">
            <Plus size={18} /> Novo Plano
          </button>
        </div>
      </div>

      {/* LISTAGEM EM CARDS (Estilo Tabela de Preços) */}
      {isLoading ? (
        <div className="flex justify-center p-12 text-slate-400"><Loader2 className="animate-spin" size={40}/></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlans.map(plan => (
            <div key={plan.id} className={`bg-white rounded-3xl border-2 transition-all duration-300 relative flex flex-col ${plan.isActive ? 'border-indigo-100 hover:border-indigo-300 shadow-sm hover:shadow-xl' : 'border-slate-200 opacity-70 grayscale'}`}>
              
              {!plan.isActive && <div className="absolute top-4 right-4 bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-md">Inativo</div>}
              {plan._count?.realEstates > 0 && <div className="absolute -top-3 left-6 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">{plan._count.realEstates} Clientes Ativos</div>}

              <div className="p-6 border-b border-slate-100 flex-1">
                <h3 className="text-xl font-black text-slate-800 mb-2 mt-2">{plan.name}</h3>
                <div className="flex items-end gap-1 mb-6">
                  <span className="text-sm font-bold text-slate-400 mb-1">R$</span>
                  <span className="text-4xl font-black text-indigo-600">{Number(plan.price).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                  <span className="text-sm font-bold text-slate-400 mb-1">/mês</span>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Módulos Inclusos:</p>
                  {AVAILABLE_MODULES.map(module => {
                    const isIncluded = (plan.modules || []).includes(module.id);
                    return (
                      <div key={module.id} className={`flex items-center gap-2 text-sm ${isIncluded ? 'text-slate-700 font-bold' : 'text-slate-300 line-through'}`}>
                        {isIncluded ? <CheckCircle2 size={16} className="text-emerald-500"/> : <X size={16} />}
                        {module.label}
                      </div>
                    );
                  })}
                </div>

                {plan.hasSupport && (
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-sm font-bold text-indigo-700 bg-indigo-50 p-3 rounded-xl">
                    <ShieldCheck size={18}/> 
                    Suporte Adicional: R$ {Number(plan.supportPrice).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-b-3xl flex justify-between items-center gap-2 border-t border-slate-100 shrink-0">
                <button onClick={() => handleOpenModal(plan)} className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                  <Edit size={16}/> Editar
                </button>
                <button onClick={() => handleDelete(plan.id)} className="flex items-center justify-center p-2 text-slate-400 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors" title="Excluir Plano">
                  <Trash2 size={18}/>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* MODAL DE CRIAÇÃO / EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Package className="text-indigo-600" size={24}/> {editingId ? 'Editar Plano' : 'Criar Novo Plano'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-200 p-2 rounded-xl transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
              
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Plano *</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Premium Plus" className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Valor Mensal (R$) *</label>
                  <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Status do Plano</label>
                  <select value={formData.isActive ? 'true' : 'false'} onChange={e => setFormData({...formData, isActive: e.target.value === 'true'})} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white">
                    <option value="true">Ativo (Disponível para venda)</option>
                    <option value="false">Inativo (Oculto)</option>
                  </select>
                </div>
              </div>

              {/* SELEÇÃO DE MÓDULOS (CHECKBOXES) */}
              <div>
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Layers size={18} className="text-indigo-600"/> Módulos Liberados</h3>
                  <p className="text-xs text-slate-500 mt-1">Selecione quais funcionalidades a imobiliária terá acesso ao assinar este plano.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AVAILABLE_MODULES.map(module => (
                    <label key={module.id} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.modules.includes(module.id) ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                      <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${formData.modules.includes(module.id) ? 'bg-indigo-600 border-indigo-600' : 'border-2 border-slate-300'}`}>
                        {formData.modules.includes(module.id) && <CheckCircle2 size={14} className="text-white"/>}
                      </div>
                      <span className={`text-sm font-bold ${formData.modules.includes(module.id) ? 'text-indigo-900' : 'text-slate-600'}`}>{module.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* SUPORTE PREMIUM */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <label className="flex items-center gap-3 cursor-pointer mb-4">
                  <input type="checkbox" checked={formData.hasSupport} onChange={e => setFormData({...formData, hasSupport: e.target.checked})} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500" />
                  <span className="font-bold text-slate-700 text-sm">Cobrar Suporte / Setup Adicional?</span>
                </label>
                
                {formData.hasSupport && (
                  <div className="animate-in fade-in duration-300 pl-8">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Valor do Suporte (R$)</label>
                    <input type="number" step="0.01" value={formData.supportPrice} onChange={e => setFormData({...formData, supportPrice: e.target.value})} placeholder="Ex: 500.00" className="w-full max-w-[200px] px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all flex items-center gap-2 shadow-md">
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18}/>} Salvar Plano
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}