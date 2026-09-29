'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../../../lib/api';
import { maskCpf, maskPhone } from '@/src/utils/mask';
import { Plus, Power, X, Loader2, UserCircle, Edit, Search, Filter } from 'lucide-react';

// NOTE: Removemos o realEstateId. O Backend vai pegar a Imobiliária direto do Token de Autenticação!
const brokerSchema = z.object({
  name: z.string().min(3, 'Nome obrigatório'),
  cpf: z.string().min(14, 'CPF incompleto'),
  creci: z.string().min(2, 'CRECI obrigatório'),
  phone: z.string().min(14, 'Telefone incompleto'),
  email: z.string().email('E-mail inválido'),
  password: z.string().optional(),
});

type BrokerForm = z.infer<typeof brokerSchema>;

export default function MeusCorretoresPage() {
  const [brokers, setBrokers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<BrokerForm>({
    resolver: zodResolver(brokerSchema)
  });

  async function fetchBrokers() {
    setIsLoading(true);
    try {
      // O backend deve retornar apenas os corretores DESTA imobiliária logada
      const response = await api.get('/brokers'); 
      setBrokers(response.data);
    } catch (error) {
      console.error('Erro ao buscar corretores:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchBrokers();
  }, []);

  const filteredBrokers = brokers.filter(broker => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      broker.name?.toLowerCase().includes(term) ||
      broker.cpf?.includes(term) ||
      broker.creci?.toLowerCase().includes(term);
      
    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? broker.isActive === true :
      broker.isActive === false;

    return matchesSearch && matchesStatus;
  });

  function handleEdit(broker: any) {
    setEditingId(broker.id);
    reset({
      name: broker.name || '',
      cpf: maskCpf(broker.cpf) || '',
      creci: broker.creci || '',
      phone: maskPhone(broker.phone) || '',
      email: broker.email || '',
      password: '', 
    });
    setIsModalOpen(true);
  }

  function handleCreateNew() {
    setEditingId(null);
    reset({ name: '', cpf: '', creci: '', phone: '', email: '', password: '' });
    setIsModalOpen(true);
  }

  async function onSubmit(data: BrokerForm) {
    if (!editingId && (!data.password || data.password.length < 6)) {
      alert("A senha é obrigatória para um novo corretor.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { ...data };
      if (!payload.password) delete payload.password;

      if (editingId) {
        await api.put(`/brokers/${editingId}`, payload);
      } else {
        await api.post('/brokers', payload);
      }
      
      await fetchBrokers();
      setIsModalOpen(false);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar o corretor.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleStatus(id: string) {
    try {
      await api.patch(`/brokers/${id}/status`);
      fetchBrokers();
    } catch (error) {
      alert('Erro ao alterar status.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Minha Equipe de Corretores</h1>
          <p className="text-slate-500 text-sm">Cadastre os seus corretores e os respetivos CRECIs.</p>
        </div>
        <button onClick={handleCreateNew} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-sm">
          <UserCircle size={20} /> Cadastrar Corretor
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input type="text" placeholder="Buscar por Nome, CPF ou CRECI..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={18} className="text-slate-400" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-full md:w-48 bg-white">
            <option value="all">Todos os Status</option>
            <option value="active">Apenas Ativos</option>
            <option value="inactive">Apenas Inativos</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Nome do Corretor</th>
                <th className="px-6 py-4">CRECI / CPF</th>
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    <Loader2 className="animate-spin inline-block mr-2" size={20} /> Carregando equipe...
                  </td>
                </tr>
              ) : filteredBrokers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Você ainda não tem corretores cadastrados.</td>
                </tr>
              ) : (
                filteredBrokers.map((broker) => (
                  <tr key={broker.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                        {broker.name.charAt(0).toUpperCase()}
                      </div>
                      {broker.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700">{broker.creci}</span>
                        <span className="text-xs text-slate-400 mt-1">{maskCpf(broker.cpf)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span>{broker.email}</span>
                        <span className="text-xs text-slate-400 mt-1">{maskPhone(broker.phone)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${ broker.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500' }`}>
                        {broker.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleEdit(broker)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Editar">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => toggleStatus(broker.id)} className={`p-2 rounded-lg transition-colors ${ broker.isActive ? 'text-red-500 hover:bg-red-50' : 'text-emerald-500 hover:bg-emerald-50' }`} title={broker.isActive ? 'Desativar' : 'Ativar'}>
                          <Power size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm items-center justify-center z-50 p-4 ${isModalOpen ? 'flex animate-in fade-in zoom-in duration-200' : 'hidden'}`}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10">
            <h2 className="text-xl font-semibold text-slate-800">
              {editingId ? 'Editar Corretor' : 'Cadastrar Novo Corretor'}
            </h2>
            <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                <input type="text" {...register('name')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
                <input type="text" {...register('cpf')} onChange={(e) => setValue('cpf', maskCpf(e.target.value), { shouldValidate: true })} placeholder="000.000.000-00" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                {errors.cpf && <span className="text-red-500 text-xs">{errors.cpf.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CRECI</label>
                <input type="text" {...register('creci')} placeholder="Ex: 12345-F" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                {errors.creci && <span className="text-red-500 text-xs">{errors.creci.message}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefone / WhatsApp</label>
                <input type="text" {...register('phone')} onChange={(e) => setValue('phone', maskPhone(e.target.value), { shouldValidate: true })} placeholder="(00) 00000-0000" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                {errors.phone && <span className="text-red-500 text-xs">{errors.phone.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail de Login</label>
                <input type="email" {...register('email')} placeholder="corretor@imobiliaria.com" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {editingId ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha Provisória'}
              </label>
              <input type="password" {...register('password')} placeholder="••••••••" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center disabled:opacity-70">
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (editingId ? 'Salvar Alterações' : 'Cadastrar Corretor')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}