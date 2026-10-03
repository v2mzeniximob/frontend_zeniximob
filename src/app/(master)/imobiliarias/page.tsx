'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/src/lib/api';

import { Plus, Power, X, Loader2, Building2, Link as LinkIcon, Edit, Search, Filter } from 'lucide-react';
import { maskCep, maskCnpj, maskCpf, maskPhone } from '@/src/utils/mask';

const realEstateSchema = z.object({
  planId: z.string().optional(),
  franchiseeId: z.string().optional(),
  cnpj: z.string().min(18, 'CNPJ incompleto'),
  corporateName: z.string().min(3, 'Razão social obrigatória'),
  tradeName: z.string().min(3, 'Nome fantasia obrigatório'),
  stateRegistration: z.string().optional(),
  cityRegistration: z.string().optional(),
  cep: z.string().min(9, 'CEP incompleto').optional(),
  address: z.string().min(5, 'Endereço obrigatório').optional(),
  phone: z.string().min(14, 'Telefone incompleto').optional(),
  respName: z.string().optional(),
  respCpf: z.string().optional(),
  respPhone: z.string().optional(),
  respAddress: z.string().optional(),
  email: z.string().email('E-mail inválido'),
  password: z.string().optional(),
  contractUrl: z.string().url('URL inválida').optional().or(z.literal('')),
});

type RealEstateForm = z.infer<typeof realEstateSchema>;

export default function ImobiliariasPage() {
  const [realEstates, setRealEstates] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [franchisees, setFranchisees] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<RealEstateForm>({
    resolver: zodResolver(realEstateSchema)
  });

  async function fetchData() {
    setIsLoading(true);
    try {
      const [reRes, plansRes, franRes] = await Promise.all([
        api.get('/real-estates'),
        api.get('/plans'),
        api.get('/franchisees')
      ]);
      setRealEstates(reRes.data);
      setPlans(plansRes.data.filter((p: any) => p.isActive)); 
      setFranchisees(franRes.data);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRealEstates = realEstates.filter(re => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      re.tradeName?.toLowerCase().includes(term) ||
      re.cnpj?.includes(term) ||
      (re.respCpf && re.respCpf.includes(term));
      
    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? re.isActive === true :
      re.isActive === false;

    return matchesSearch && matchesStatus;
  });

  function handleEdit(re: any) {
    setEditingId(re.id);
    reset({
      planId: re.planId || '',
      franchiseeId: re.franchiseeId || '',
      cnpj: maskCnpj(re.cnpj) || '',
      corporateName: re.corporateName || '',
      tradeName: re.tradeName || '',
      stateRegistration: (re.stateRegistration && re.stateRegistration !== 'ISENTO') ? re.stateRegistration : '',
      cityRegistration: (re.cityRegistration && re.cityRegistration !== 'ISENTO') ? re.cityRegistration : '',
      cep: maskCep(re.cep) || '',
      address: re.address || '',
      phone: maskPhone(re.phone) || '',
      respName: re.respName || '',
      respCpf: maskCpf(re.respCpf) || '',
      respPhone: maskPhone(re.respPhone) || '',
      respAddress: re.respAddress || '',
      email: re.email || '',
      contractUrl: re.contractUrl || '',
      password: '', 
    });
    setIsModalOpen(true);
  }

  function handleCreateNew() {
    setEditingId(null);
    reset({
      planId: plans.length > 0 ? plans[0].id : '', 
      franchiseeId: '', cnpj: '', corporateName: '', tradeName: '', stateRegistration: '', cityRegistration: '',
      cep: '', address: '', phone: '', respName: '', respCpf: '', respPhone: '', respAddress: '',
      email: '', contractUrl: '', password: ''
    });
    setIsModalOpen(true);
  }

  async function handleCnpjManualChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = maskCnpj(e.target.value);
    setValue('cnpj', masked, { shouldValidate: true });

    if (masked.length === 18 && !editingId) {
      setIsFetchingCnpj(true);
      try {
        const rawCnpj = masked.replace(/\D/g, '');
        const response = await api.get(`/integrations/cnpj/${rawCnpj}`);
        const data = response.data;
        setValue('corporateName', data.razao_social, { shouldValidate: true });
        setValue('tradeName', data.nome_fantasia, { shouldValidate: true });
        setValue('cep', maskCep(data.cep), { shouldValidate: true });
        setValue('address', data.endereco, { shouldValidate: true });
        if (data.telefone) setValue('phone', maskPhone(data.telefone), { shouldValidate: true });
      } catch (error) {
        console.log('CNPJ não encontrado.');
      } finally {
        setIsFetchingCnpj(false);
      }
    }
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
        const fullAddress = `${data.street}, - ${data.neighborhood}, ${data.city} - ${data.state}`;
        setValue('address', fullAddress, { shouldValidate: true });
      } catch (error) {
        console.log('CEP não encontrado.');
      } finally {
        setIsFetchingCep(false);
      }
    }
  }

  async function onSubmit(data: RealEstateForm) {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        franchiseeId: data.franchiseeId === "" ? null : data.franchiseeId,
        stateRegistration: data.stateRegistration || 'ISENTO',
        cityRegistration: data.cityRegistration || 'ISENTO',
        contractUrl: data.contractUrl || null,
      };

      if (!payload.password) delete payload.password;

      if (editingId) {
        await api.put(`/real-estates/${editingId}`, payload);
      } else {
        await api.post('/real-estates', payload);
        alert("Imobiliária cadastrada! A senha de acesso inicial é: 123456");
      }
      
      await fetchData();
      setIsModalOpen(false);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro interno no servidor ao salvar.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleStatus(id: string) {
    if(!confirm('Deseja mesmo alterar o status desta imobiliária?')) return;
    try {
      await api.patch(`/real-estates/${id}/status`);
      fetchData();
    } catch (error) {
      alert('Erro ao alterar status.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestão de Imobiliárias</h1>
          <p className="text-slate-500 text-sm">Gerencie as lojas, planos vinculados e acessos.</p>
        </div>
        <button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-sm">
          <Building2 size={20} /> Nova Imobiliária
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input type="text" placeholder="Buscar por Nome, CNPJ ou CPF..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={18} className="text-slate-400" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-48 bg-white">
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
                <th className="px-6 py-4">Imobiliária</th>
                <th className="px-6 py-4">CNPJ / Inscrições</th>
                <th className="px-6 py-4">Responsável</th>
                <th className="px-6 py-4">Contrato</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    <Loader2 className="animate-spin inline-block mr-2" size={20} /> Carregando...
                  </td>
                </tr>
              ) : filteredRealEstates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Nenhuma imobiliária encontrada.</td>
                </tr>
              ) : (
                filteredRealEstates.map((re) => (
                  <tr key={re.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{re.tradeName}</p>
                        <p className="text-xs text-blue-600 font-medium mt-1">{re.plan?.name || 'Sem plano'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span>{maskCnpj(re.cnpj)}</span>
                        <span className="text-xs text-slate-400 mt-1">IE: {re.stateRegistration} | IM: {re.cityRegistration}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700">{re.respName}</span>
                        <span className="text-xs text-slate-400 mt-1">CPF: {maskCpf(re.respCpf || '')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {re.contractUrl ? (
                        <a href={re.contractUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1 text-xs font-bold">
                          <LinkIcon size={14} /> Ver PDF
                        </a>
                      ) : <span className="text-slate-400 text-xs">Nenhum</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${ re.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200' }`}>
                        {re.isActive ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleEdit(re)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar Cadastro">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => toggleStatus(re.id)} className={`p-2 rounded-lg transition-colors ${ re.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50' }`} title={re.isActive ? 'Desativar' : 'Ativar'}>
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

      <div className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm items-center justify-center z-50 p-4 ${isModalOpen ? 'flex animate-in fade-in zoom-in-95 duration-200' : 'hidden'}`}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="text-blue-600" size={24}/>
              {editingId ? 'Editar Imobiliária' : 'Cadastrar Nova Imobiliária'}
            </h2>
            <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6">
              <h3 className="text-sm font-semibold text-blue-800 mb-3 uppercase tracking-wider">Vínculos Operacionais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Plano Base *</label>
                  <select {...register('planId')} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="">Selecione um plano...</option>
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name} - R$ {p.price}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Franquia Vinculada (Opcional)</label>
                  <select {...register('franchiseeId')} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="">Nenhuma (Pertence ao Master)</option>
                    {franchisees.map(f => <option key={f.id} value={f.id}>{f.tradeName}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-500 border-b border-slate-100 pb-2 mb-4 uppercase tracking-wider">1. Dados da Empresa</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-1">
                    CNPJ * {isFetchingCnpj && <Loader2 size={14} className="animate-spin text-blue-500" />}
                  </label>
                  <input type="text" {...register('cnpj')} onChange={handleCnpjManualChange} placeholder="00.000.000/0000-00" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  {errors.cnpj && <span className="text-red-500 text-xs">{errors.cnpj.message}</span>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Razão Social *</label>
                  <input type="text" {...register('corporateName')} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" />
                  {errors.corporateName && <span className="text-red-500 text-xs">{errors.corporateName.message}</span>}
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nome Fantasia *</label>
                  <input type="text" {...register('tradeName')} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" />
                  {errors.tradeName && <span className="text-red-500 text-xs">{errors.tradeName.message}</span>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Inscrição Estadual</label>
                  <input type="text" {...register('stateRegistration')} placeholder="Opcional ou ISENTO" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Inscrição Municipal</label>
                  <input type="text" {...register('cityRegistration')} placeholder="Opcional ou ISENTO" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-1">
                    CEP {isFetchingCep && <Loader2 size={14} className="animate-spin text-blue-500" />}
                  </label>
                  <input type="text" {...register('cep')} onChange={handleCepManualChange} placeholder="00000-000" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  {errors.cep && <span className="text-red-500 text-xs">{errors.cep.message}</span>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Endereço da Empresa</label>
                  <input type="text" {...register('address')} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" />
                  {errors.address && <span className="text-red-500 text-xs">{errors.address.message}</span>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <input type="text" {...register('phone')} onChange={(e) => setValue('phone', maskPhone(e.target.value), { shouldValidate: true })} placeholder="(00) 00000-0000" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  {errors.phone && <span className="text-red-500 text-xs">{errors.phone.message}</span>}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-500 border-b border-slate-100 pb-2 mb-4 uppercase tracking-wider">2. Dados do Responsável Legal</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                  <input type="text" {...register('respName')} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">CPF do Responsável</label>
                  <input type="text" {...register('respCpf')} onChange={(e) => setValue('respCpf', maskCpf(e.target.value), { shouldValidate: true })} placeholder="000.000.000-00" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Celular / WhatsApp Pessoal</label>
                  <input type="text" {...register('respPhone')} onChange={(e) => setValue('respPhone', maskPhone(e.target.value), { shouldValidate: true })} placeholder="(00) 00000-0000" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Endereço Residencial do Responsável</label>
                <input type="text" {...register('respAddress')} placeholder="Rua, Número, Bairro, Cidade - Estado" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><LinkIcon size={16}/> Documentos</h3>
              <label className="block text-sm font-medium text-slate-600 mb-1">URL do Contrato Assinado entre Master e Imobiliária (Opcional)</label>
              <input type="url" {...register('contractUrl')} placeholder="Ex: Link do Google Drive / PDF" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-700" />
            </div>

            <div>
               <h3 className="text-sm font-bold text-slate-500 border-b border-slate-100 pb-2 mb-4 uppercase tracking-wider">3. Acesso à Plataforma</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1">E-mail de Login *</label>
                   <input type="email" {...register('email')} placeholder="acesso@imobiliaria.com.br" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                   {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1">
                     Senha
                   </label>
                   <input type="password" {...register('password')} placeholder="Será gerada automaticamente" disabled className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none bg-slate-100 cursor-not-allowed" />
                   {!editingId && <p className="text-xs text-blue-600 mt-1 font-medium">A senha padrão 123456 será criada automaticamente.</p>}
                 </div>
               </div>
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-70">
                {isSubmitting && <Loader2 className="animate-spin" size={20} />}
                {editingId ? 'Salvar Alterações' : 'Cadastrar Imobiliária'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}