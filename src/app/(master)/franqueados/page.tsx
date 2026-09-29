'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../../lib/api';
import { maskCep, maskCnpj, maskCpf, maskPhone } from '@/src/utils/mask';
import { Plus, Power, X, Loader2, Link as LinkIcon } from 'lucide-react';

const franchiseeSchema = z.object({
  cnpj: z.string().min(18, 'CNPJ incompleto'),
  corporateName: z.string().min(3, 'Razão social obrigatória'),
  tradeName: z.string().min(3, 'Nome fantasia obrigatório'),
  stateRegistration: z.string().optional(),
  cityRegistration: z.string().optional(),
  cep: z.string().min(9, 'CEP incompleto'),
  address: z.string().min(5, 'Endereço obrigatório'),
  phone: z.string().min(14, 'Telefone incompleto'),
  respName: z.string().min(3, 'Nome do responsável obrigatório'),
  respCpf: z.string().min(14, 'CPF incompleto'),
  respPhone: z.string().min(14, 'Telefone do responsável incompleto'),
  respAddress: z.string().min(5, 'Endereço do responsável obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  contractUrl: z.string().url('URL inválida').optional().or(z.literal('')),
});

type FranchiseeForm = z.infer<typeof franchiseeSchema>;

export default function FranqueadosPage() {
  const [franchisees, setFranchisees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FranchiseeForm>({
    resolver: zodResolver(franchiseeSchema)
  });

  const watchCnpj = watch('cnpj');
  const watchCep = watch('cep');

  async function fetchFranchisees() {
    try {
      const response = await api.get('/franchisees');
      setFranchisees(response.data);
    } catch (error) {
      console.error('Erro ao buscar franqueados:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchFranchisees();
  }, []);

  useEffect(() => {
    async function autoFillCnpj() {
      if (watchCnpj?.length === 18) {
        setIsFetchingCnpj(true);
        try {
          const rawCnpj = watchCnpj.replace(/\D/g, '');
          const response = await api.get(`/integrations/cnpj/${rawCnpj}`);
          const data = response.data;
          
          setValue('corporateName', data.razao_social, { shouldValidate: true });
          setValue('tradeName', data.nome_fantasia, { shouldValidate: true });
          setValue('cep', maskCep(data.cep), { shouldValidate: true });
          setValue('address', data.endereco, { shouldValidate: true });
          if (data.telefone) {
            setValue('phone', maskPhone(data.telefone), { shouldValidate: true });
          }
        } catch (error) {
          console.log('Aviso: CNPJ não encontrado na BrasilAPI.');
        } finally {
          setIsFetchingCnpj(false);
        }
      }
    }
    autoFillCnpj();
  }, [watchCnpj, setValue]);

  useEffect(() => {
    async function autoFillCep() {
      if (watchCep?.length === 9) {
        setIsFetchingCep(true);
        try {
          const rawCep = watchCep.replace(/\D/g, '');
          const response = await api.get(`/integrations/cep/${rawCep}`);
          const data = response.data;
          
          const fullAddress = `${data.street}, - ${data.neighborhood}, ${data.city} - ${data.state}`;
          setValue('address', fullAddress, { shouldValidate: true });
        } catch (error) {
          console.log('Aviso: CEP não encontrado.');
        } finally {
          setIsFetchingCep(false);
        }
      }
    }
    autoFillCep();
  }, [watchCep, setValue]);

  async function onSubmit(data: FranchiseeForm) {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        stateRegistration: data.stateRegistration || 'ISENTO',
        cityRegistration: data.cityRegistration || 'ISENTO',
        contractUrl: data.contractUrl || null,
      };

      await api.post('/franchisees', payload);
      await fetchFranchisees();
      setIsModalOpen(false);
      reset();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro interno no servidor ao cadastrar.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleStatus(id: string) {
    try {
      await api.patch(`/franchisees/${id}/status`);
      fetchFranchisees();
    } catch (error) {
      alert('Erro ao alterar status.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestão de Franqueados</h1>
          <p className="text-slate-500 text-sm">Administre as franquias da sua rede.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus size={20} />
          Nova Franquia
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Nome Fantasia</th>
                <th className="px-6 py-4">CNPJ</th>
                <th className="px-6 py-4">Contrato</th>
                <th className="px-6 py-4">E-mail</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    <Loader2 className="animate-spin inline-block mr-2" size={20} /> Carregando franqueados...
                  </td>
                </tr>
              ) : franchisees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Nenhuma franquia cadastrada.
                  </td>
                </tr>
              ) : (
                franchisees.map((fran) => (
                  <tr key={fran.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{fran.tradeName}</td>
                    <td className="px-6 py-4">{maskCnpj(fran.cnpj)}</td>
                    <td className="px-6 py-4">
                      {fran.contractUrl ? (
                        <a href={fran.contractUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1 text-xs">
                          <LinkIcon size={14} /> Ver Doc
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs">Nenhum</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{fran.email}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        fran.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {fran.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => toggleStatus(fran.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          fran.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'
                        }`}
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10">
              <h2 className="text-xl font-semibold text-slate-800">Cadastrar Franqueado</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              
              {/* === DADOS DA EMPRESA === */}
              <div>
                <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2 mb-4">Dados da Empresa</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                      CNPJ {isFetchingCnpj && <Loader2 size={14} className="animate-spin text-blue-500" />}
                    </label>
                    <input type="text" {...register('cnpj')} onChange={(e) => setValue('cnpj', maskCnpj(e.target.value), { shouldValidate: true })} placeholder="00.000.000/0000-00" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    {errors.cnpj && <span className="text-red-500 text-xs">{errors.cnpj.message}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Razão Social</label>
                    <input type="text" {...register('corporateName')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" />
                    {errors.corporateName && <span className="text-red-500 text-xs">{errors.corporateName.message}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome Fantasia</label>
                    <input type="text" {...register('tradeName')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" />
                    {errors.tradeName && <span className="text-red-500 text-xs">{errors.tradeName.message}</span>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Inscrição Estadual</label>
                    <input type="text" {...register('stateRegistration')} placeholder="Opcional ou ISENTO" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Inscrição Municipal</label>
                    <input type="text" {...register('cityRegistration')} placeholder="Opcional ou ISENTO" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* === LOCALIZAÇÃO DA EMPRESA === */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                    CEP {isFetchingCep && <Loader2 size={14} className="animate-spin text-blue-500" />}
                  </label>
                  <input type="text" {...register('cep')} onChange={(e) => setValue('cep', maskCep(e.target.value), { shouldValidate: true })} placeholder="00000-000" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  {errors.cep && <span className="text-red-500 text-xs">{errors.cep.message}</span>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Endereço da Empresa</label>
                  <input type="text" {...register('address')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" />
                  {errors.address && <span className="text-red-500 text-xs">{errors.address.message}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefone da Empresa</label>
                  <input type="text" {...register('phone')} onChange={(e) => setValue('phone', maskPhone(e.target.value), { shouldValidate: true })} placeholder="(00) 00000-0000" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  {errors.phone && <span className="text-red-500 text-xs">{errors.phone.message}</span>}
                </div>
              </div>

              {/* === DADOS DO RESPONSÁVEL === */}
              <div>
                <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2 mb-4">Dados do Responsável</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                    <input type="text" {...register('respName')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    {errors.respName && <span className="text-red-500 text-xs">{errors.respName.message}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">CPF do Responsável</label>
                    <input type="text" {...register('respCpf')} onChange={(e) => setValue('respCpf', maskCpf(e.target.value), { shouldValidate: true })} placeholder="000.000.000-00" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    {errors.respCpf && <span className="text-red-500 text-xs">{errors.respCpf.message}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Celular / WhatsApp (Resp.)</label>
                    <input type="text" {...register('respPhone')} onChange={(e) => setValue('respPhone', maskPhone(e.target.value), { shouldValidate: true })} placeholder="(00) 00000-0000" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    {errors.respPhone && <span className="text-red-500 text-xs">{errors.respPhone.message}</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Endereço Residencial do Responsável</label>
                  <input type="text" {...register('respAddress')} placeholder="Rua, Número, Bairro, Cidade - Estado" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  {errors.respAddress && <span className="text-red-500 text-xs">{errors.respAddress.message}</span>}
                </div>
              </div>

              {/* === CONTRATO E ACESSO === */}
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <label className="block text-sm font-medium text-blue-800 mb-1">Link do Contrato Assinado (Opcional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-400">
                    <LinkIcon size={18} />
                  </div>
                  <input type="url" {...register('contractUrl')} placeholder="Ex: https://drive.google.com/..." className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-700" />
                </div>
                {errors.contractUrl && <span className="text-red-500 text-xs mt-1 block">{errors.contractUrl.message}</span>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-mail de Login</label>
                  <input type="email" {...register('email')} placeholder="acesso@franquia.com" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Senha Provisória</label>
                  <input type="password" {...register('password')} placeholder="••••••••" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  {errors.password && <span className="text-red-500 text-xs">{errors.password.message}</span>}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center disabled:opacity-70">
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Cadastrar Franquia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}