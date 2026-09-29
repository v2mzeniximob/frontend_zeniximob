'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../../lib/api'; // <-- Caminho relativo para corrigir o erro
import { Plus, Power, X, Loader2, CheckCircle2, XCircle } from 'lucide-react';

// 1. Esquema Zod corrigido (sem os defaults)
const planSchema = z.object({
  name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
  price: z.coerce.number().min(0, 'O valor é obrigatório'),
  modules: z.string().min(1, 'Informe pelo menos um módulo'),
  hasSupport: z.boolean().optional(),
  supportPrice: z.coerce.number().optional(),
});

type PlanForm = z.infer<typeof planSchema>;

export default function PlanosPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Valores por defeito configurados no React Hook Form
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<PlanForm>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      hasSupport: false,
      supportPrice: 0
    }
  });

  const watchHasSupport = watch('hasSupport');

  async function fetchPlans() {
    try {
      const response = await api.get('/plans');
      setPlans(response.data);
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchPlans();
  }, []);

  async function onSubmit(data: PlanForm) {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        modules: data.modules.split(',').map(m => m.trim()),
        hasSupport: data.hasSupport || false,
        supportPrice: data.hasSupport ? (data.supportPrice || 0) : null
      };
      
      await api.post('/plans', payload);
      await fetchPlans(); 
      setIsModalOpen(false); 
      reset(); 
    } catch (error) {
      alert('Erro ao criar plano. Verifique o console.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleStatus(id: string) {
    try {
      await api.patch(`/plans/${id}/status`);
      fetchPlans();
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
          <h1 className="text-2xl font-bold text-slate-800">Gestão de Planos</h1>
          <p className="text-slate-500 text-sm">Crie e gerencie os pacotes do seu SaaS.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus size={20} />
          Novo Plano
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Nome do Plano</th>
                <th className="px-6 py-4">Valor Mensal</th>
                <th className="px-6 py-4">Módulos Inclusos</th>
                <th className="px-6 py-4 text-center">Suporte Premium</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    <Loader2 className="animate-spin inline-block mr-2" size={20} /> Carregando planos...
                  </td>
                </tr>
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Nenhum plano cadastrado ainda.
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{plan.name}</td>
                    <td className="px-6 py-4 text-blue-600 font-semibold">{formatCurrency(plan.price)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {plan.modules.map((mod: string, idx: number) => (
                          <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">
                            {mod}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {plan.hasSupport ? (
                        <div className="flex flex-col items-center text-green-600 text-xs font-medium">
                          <CheckCircle2 size={16} className="mb-0.5" />
                          +{formatCurrency(plan.supportPrice)}
                        </div>
                      ) : (
                        <XCircle size={16} className="text-slate-300 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        plan.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {plan.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => toggleStatus(plan.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          plan.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'
                        }`}
                        title={plan.isActive ? 'Inativar Plano' : 'Ativar Plano'}
                      >
                        <Power size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-semibold text-slate-800">Criar Novo Plano</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Plano</label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="Ex: Plano Master Multi"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor Mensal (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('price')}
                    placeholder="299.90"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  {errors.price && <span className="text-red-500 text-xs">{errors.price.message}</span>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Módulos (Separe por vírgulas)</label>
                <input
                  type="text"
                  {...register('modules')}
                  placeholder="Ex: CRM, Financeiro, Gestão de Leads"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                {errors.modules && <span className="text-red-500 text-xs">{errors.modules.message}</span>}
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('hasSupport')}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Inclui Suporte Premium pago à parte?</span>
                </label>

                {watchHasSupport && (
                  <div className="pl-6 animate-in slide-in-from-top-2">
                    <label className="block text-sm text-slate-600 mb-1">Valor do Suporte (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('supportPrice')}
                      placeholder="49.90"
                      className="w-1/2 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Salvar Plano'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}