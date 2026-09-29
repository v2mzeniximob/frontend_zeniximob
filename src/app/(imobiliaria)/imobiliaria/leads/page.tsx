'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../../../lib/api';
import { maskPhone } from '@/src/utils/mask';
import { Plus, X, Loader2, MessageSquare, Edit, Search, Filter, Phone, Mail } from 'lucide-react';

type LeadForm = {
  name: string;
  phone: string;
  email?: string;
  interest: string;
  status?: 'Novo' | 'Em Atendimento' | 'Em Proposta' | 'Fechado' | 'Perdido';
  propertyId?: string;
  notes?: string;
};

const leadSchema = z.object({
  name: z.string().min(3, 'Nome do cliente é obrigatório'),
  phone: z.string().min(14, 'Telefone incompleto'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  interest: z.string().min(1, 'Selecione o tipo de interesse'),
  status: z.enum(['Novo', 'Em Atendimento', 'Em Proposta', 'Fechado', 'Perdido']).default('Novo'),
  propertyId: z.string().optional().or(z.literal('')),
  notes: z.string().optional(),
}) satisfies z.ZodType<LeadForm>;

// Mapeamento de cores para os status do Lead
const statusConfig: Record<string, { label: string, color: string }> = {
  'Novo': { label: 'Novo', color: 'bg-blue-100 text-blue-700' },
  'Em Atendimento': { label: 'Em Atendimento', color: 'bg-amber-100 text-amber-700' },
  'Em Proposta': { label: 'Em Proposta', color: 'bg-purple-100 text-purple-700' },
  'Fechado': { label: 'Fechado (Ganho)', color: 'bg-emerald-100 text-emerald-700' },
  'Perdido': { label: 'Perdido', color: 'bg-slate-100 text-slate-500' },
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<LeadForm>({
    resolver: zodResolver(leadSchema)
  });

  async function fetchData() {
    setIsLoading(true);
    try {
      const [leadsRes, propRes] = await Promise.all([
        api.get('/leads').catch(() => ({ data: [] })), // Fallback caso rota não exista
        api.get('/properties').catch(() => ({ data: [] }))
      ]);
      setLeads(leadsRes.data);
      setProperties(propRes.data.filter((p: any) => p.isActive)); 
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLeads = leads.filter(lead => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      lead.name?.toLowerCase().includes(term) ||
      lead.phone?.includes(term) ||
      lead.email?.toLowerCase().includes(term);
      
    const matchesStatus = 
      statusFilter === 'all' ? true :
      lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  function handleEdit(lead: any) {
    setEditingId(lead.id);
    reset({
      name: lead.name || '',
      phone: maskPhone(lead.phone) || '',
      email: lead.email || '',
      interest: lead.interest || '',
      status: lead.status || 'Novo',
      propertyId: lead.propertyId || '',
      notes: lead.notes || '',
    });
    setIsModalOpen(true);
  }

  function handleCreateNew() {
    setEditingId(null);
    reset({
      name: '', phone: '', email: '', interest: '', status: 'Novo', propertyId: '', notes: ''
    });
    setIsModalOpen(true);
  }

  async function onSubmit(data: LeadForm) {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        propertyId: data.propertyId === "" ? null : data.propertyId,
      };

      if (editingId) {
        await api.put(`/leads/${editingId}`, payload);
      } else {
        await api.post('/leads', payload);
      }
      
      await fetchData();
      setIsModalOpen(false);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro interno ao salvar Lead.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">CRM de Leads</h1>
          <p className="text-slate-500 text-sm">Acompanhe os potenciais clientes e o funil de vendas.</p>
        </div>
        <button onClick={handleCreateNew} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-sm">
          <Plus size={20} /> Adicionar Lead
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input type="text" placeholder="Buscar por Nome, E-mail ou Telefone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={18} className="text-slate-400" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-full md:w-48 bg-white">
            <option value="all">Todos os Status</option>
            <option value="Novo">Novo</option>
            <option value="Em Atendimento">Em Atendimento</option>
            <option value="Em Proposta">Em Proposta</option>
            <option value="Fechado">Fechado (Ganho)</option>
            <option value="Perdido">Perdido</option>
          </select>
        </div>
      </div>

      {/* Tabela de Leads */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4">Interesse</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    <Loader2 className="animate-spin inline-block mr-2" size={20} /> Carregando leads...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Nenhum lead encontrado.</td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs shrink-0">
                          {lead.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{lead.name}</p>
                          <p className="text-xs text-slate-400 line-clamp-1">{lead.notes || 'Sem anotações'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-1"><Phone size={12} className="text-slate-400"/> {maskPhone(lead.phone)}</div>
                        {lead.email && <div className="flex items-center gap-1"><Mail size={12} className="text-slate-400"/> {lead.email}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-700">{lead.interest}</span>
                      {lead.property && (
                        <p className="text-xs text-emerald-600 mt-1 line-clamp-1 flex items-center gap-1">
                          <MessageSquare size={10} /> {lead.property.title}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[lead.status || 'Novo']?.color}`}>
                        {statusConfig[lead.status || 'Novo']?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleEdit(lead)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Gerenciar Atendimento">
                        <Edit size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FANTASMA */}
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm items-center justify-center z-50 p-4 ${isModalOpen ? 'flex animate-in fade-in zoom-in duration-200' : 'hidden'}`}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10">
            <h2 className="text-xl font-semibold text-slate-800">
              {editingId ? 'Atendimento do Lead' : 'Novo Lead'}
            </h2>
            <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Cliente</label>
                <input type="text" {...register('name')} placeholder="Ex: João da Silva" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp / Telefone</label>
                <input type="text" {...register('phone')} onChange={(e) => setValue('phone', maskPhone(e.target.value), { shouldValidate: true })} placeholder="(00) 00000-0000" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                {errors.phone && <span className="text-red-500 text-xs">{errors.phone.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail (Opcional)</label>
                <input type="email" {...register('email')} placeholder="cliente@email.com" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
              </div>
            </div>

            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">Tipo de Interesse</label>
                <select {...register('interest')} className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                  <option value="">Selecione...</option>
                  <option value="Comprar">Comprar um imóvel</option>
                  <option value="Alugar">Alugar um imóvel</option>
                  <option value="Vender">Quer Vender um imóvel</option>
                  <option value="Investimento">Investimento</option>
                </select>
                {errors.interest && <span className="text-red-500 text-xs">{errors.interest.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">Imóvel de Interesse (Opcional)</label>
                <select {...register('propertyId')} className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                  <option value="">Nenhum específico</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.title} ({p.transaction})</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status do Atendimento</label>
                <select {...register('status')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium">
                  <option value="Novo">🔵 Novo</option>
                  <option value="Em Atendimento">🟠 Em Atendimento</option>
                  <option value="Em Proposta">🟣 Em Proposta</option>
                  <option value="Fechado">🟢 Fechado (Ganho)</option>
                  <option value="Perdido">⚪ Perdido</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Anotações do Atendimento</label>
              <textarea {...register('notes')} rows={4} placeholder="Registe aqui o histórico da conversa, visitas agendadas, propostas..." className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"></textarea>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center disabled:opacity-70">
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (editingId ? 'Salvar Histórico' : 'Cadastrar Lead')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}