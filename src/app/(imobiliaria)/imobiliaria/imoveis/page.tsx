'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../../../lib/api';
import { maskCep } from '@/src/utils/mask';
import { Plus, Power, X, Loader2, Home, Edit, Search, Filter, MapPin } from 'lucide-react';

const propertySchema = z.object({
  title: z.string().min(5, 'Título deve ter no mínimo 5 caracteres'),
  type: z.string().min(1, 'Selecione o tipo de imóvel'),
  transaction: z.string().min(1, 'Selecione a modalidade (Venda/Aluguel)'),
  price: z.coerce.number().min(1, 'O valor é obrigatório'),
  area: z.coerce.number().min(1, 'Área obrigatória'),
  bedrooms: z.coerce.number().min(0).default(0),
  bathrooms: z.coerce.number().min(0).default(0),
  garage: z.coerce.number().min(0).default(0),
  cep: z.string().min(9, 'CEP incompleto'),
  address: z.string().min(5, 'Endereço obrigatório'),
  description: z.string().optional(),
});

type PropertyForm = z.input<typeof propertySchema>;

export default function ImoveisPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<PropertyForm>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      bedrooms: 0, bathrooms: 0, garage: 0
    }
  });

  async function fetchProperties() {
    setIsLoading(true);
    try {
      const response = await api.get('/properties').catch(() => ({ data: [] })); // Trata caso a rota não exista ainda no backend
      setProperties(response.data);
    } catch (error) {
      console.error('Erro ao buscar imóveis:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchProperties();
  }, []);

  const filteredProperties = properties.filter(prop => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      prop.title?.toLowerCase().includes(term) ||
      prop.address?.toLowerCase().includes(term) ||
      prop.type?.toLowerCase().includes(term);
      
    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? prop.isActive === true :
      prop.isActive === false;

    return matchesSearch && matchesStatus;
  });

  function handleEdit(prop: any) {
    setEditingId(prop.id);
    reset({
      title: prop.title || '',
      type: prop.type || '',
      transaction: prop.transaction || '',
      price: prop.price || 0,
      area: prop.area || 0,
      bedrooms: prop.bedrooms || 0,
      bathrooms: prop.bathrooms || 0,
      garage: prop.garage || 0,
      cep: maskCep(prop.cep) || '',
      address: prop.address || '',
      description: prop.description || '',
    });
    setIsModalOpen(true);
  }

  function handleCreateNew() {
    setEditingId(null);
    reset({
      title: '', type: '', transaction: '', price: 0, area: 0,
      bedrooms: 0, bathrooms: 0, garage: 0, cep: '', address: '', description: ''
    });
    setIsModalOpen(true);
  }

  async function handleCepManualChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = maskCep(e.target.value);
    setValue('cep', masked, { shouldValidate: true });

    if (masked.length === 9) {
      setIsFetchingCep(true);
      try {
        const rawCep = masked.replace(/\D/g, '');
        const response = await api.get(`/integrations/cep/${rawCep}`);
        const data = response.data;
        const fullAddress = `${data.street}, ${data.neighborhood}, ${data.city} - ${data.state}`;
        setValue('address', fullAddress, { shouldValidate: true });
      } catch (error) {
        console.log('CEP não encontrado.');
      } finally {
        setIsFetchingCep(false);
      }
    }
  }

  async function onSubmit(data: PropertyForm) {
    setIsSubmitting(true);
    try {
      const payload = { ...data };

      if (editingId) {
        await api.put(`/properties/${editingId}`, payload);
      } else {
        await api.post('/properties', payload);
      }
      
      await fetchProperties();
      setIsModalOpen(false);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar o imóvel. O servidor pode não ter esta rota implementada ainda.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleStatus(id: string) {
    try {
      await api.patch(`/properties/${id}/status`);
      fetchProperties();
    } catch (error) {
      alert('Erro ao alterar status.');
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestão de Imóveis</h1>
          <p className="text-slate-500 text-sm">Cadastre e administre a sua carteira de propriedades.</p>
        </div>
        <button onClick={handleCreateNew} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-sm">
          <Plus size={20} /> Adicionar Imóvel
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input type="text" placeholder="Buscar por Título, Tipo ou Endereço..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={18} className="text-slate-400" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-full md:w-48 bg-white">
            <option value="all">Todos os Status</option>
            <option value="active">Disponíveis (Ativos)</option>
            <option value="inactive">Inativos / Vendidos</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Detalhes do Imóvel</th>
                <th className="px-6 py-4">Modalidade</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Área</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    <Loader2 className="animate-spin inline-block mr-2" size={20} /> Carregando propriedades...
                  </td>
                </tr>
              ) : filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Nenhum imóvel encontrado.</td>
                </tr>
              ) : (
                filteredProperties.map((prop) => (
                  <tr key={prop.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800 line-clamp-1">{prop.title}</span>
                        <div className="flex items-center text-xs text-slate-400 mt-1 gap-1">
                          <MapPin size={12} /> <span className="line-clamp-1">{prop.address}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-medium">
                        {prop.type} - {prop.transaction}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-emerald-600">
                      {formatCurrency(prop.price)}
                    </td>
                    <td className="px-6 py-4">{prop.area} m²</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${ prop.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500' }`}>
                        {prop.isActive ? 'Disponível' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleEdit(prop)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Editar Imóvel">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => toggleStatus(prop.id)} className={`p-2 rounded-lg transition-colors ${ prop.isActive ? 'text-red-500 hover:bg-red-50' : 'text-emerald-500 hover:bg-emerald-50' }`} title={prop.isActive ? 'Inativar' : 'Ativar'}>
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

      {/* MODAL FANTASMA (Oculto via CSS para manter o Hook Form vivo) */}
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm items-center justify-center z-50 p-4 ${isModalOpen ? 'flex animate-in fade-in zoom-in duration-200' : 'hidden'}`}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10">
            <h2 className="text-xl font-semibold text-slate-800">
              {editingId ? 'Editar Imóvel' : 'Cadastrar Novo Imóvel'}
            </h2>
            <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Título do Anúncio</label>
                <input type="text" {...register('title')} placeholder="Ex: Lindo Apartamento de 3 Quartos com Varanda" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                {errors.title && <span className="text-red-500 text-xs">{errors.title.message}</span>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Imóvel</label>
                <select {...register('type')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                  <option value="">Selecione...</option>
                  <option value="Apartamento">Apartamento</option>
                  <option value="Casa">Casa</option>
                  <option value="Terreno">Terreno</option>
                  <option value="Comercial">Sala Comercial</option>
                  <option value="Cobertura">Cobertura</option>
                </select>
                {errors.type && <span className="text-red-500 text-xs">{errors.type.message}</span>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Modalidade</label>
                <select {...register('transaction')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                  <option value="">Selecione...</option>
                  <option value="Venda">Venda</option>
                  <option value="Aluguel">Aluguel</option>
                  <option value="Ambos">Ambos</option>
                </select>
                {errors.transaction && <span className="text-red-500 text-xs">{errors.transaction.message}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-emerald-800 mb-1">Valor (R$)</label>
                <input type="number" step="0.01" {...register('price')} placeholder="0.00" className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                {errors.price && <span className="text-red-500 text-xs">{errors.price.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-800 mb-1">Área (m²)</label>
                <input type="number" {...register('area')} placeholder="0" className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                {errors.area && <span className="text-red-500 text-xs">{errors.area.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-800 mb-1">Quartos</label>
                <input type="number" {...register('bedrooms')} placeholder="0" className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-800 mb-1">Vagas</label>
                <input type="number" {...register('garage')} placeholder="0" className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                  CEP {isFetchingCep && <Loader2 size={14} className="animate-spin text-emerald-500" />}
                </label>
                <input type="text" {...register('cep')} onChange={handleCepManualChange} placeholder="00000-000" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                {errors.cep && <span className="text-red-500 text-xs">{errors.cep.message}</span>}
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo</label>
                <input type="text" {...register('address')} placeholder="Rua, Número, Bairro, Cidade - Estado" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50" />
                {errors.address && <span className="text-red-500 text-xs">{errors.address.message}</span>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
              <textarea {...register('description')} rows={4} placeholder="Descreva os diferenciais do imóvel, acabamentos, localização..." className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"></textarea>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center disabled:opacity-70">
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (editingId ? 'Salvar Alterações' : 'Publicar Imóvel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}