'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../../lib/api';
import { Plus, Power, X, Loader2, Link as LinkIcon, Edit, Search, Filter } from 'lucide-react';
// IMPORTANTE: Utilizando o mesmo caminho exato que funcionou na página de Imobiliárias
import { maskCep, maskCnpj, maskCpf, maskPhone } from '@/src/utils/mask';

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
  password: z.string().optional(), 
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
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FranchiseeForm>({
    resolver: zodResolver(franchiseeSchema)
  });

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

  const filteredFranchisees = franchisees.filter(fran => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      fran.tradeName.toLowerCase().includes(term) ||
      fran.cnpj.includes(term) ||
      (fran.respCpf && fran.respCpf.includes(term));
      
    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? fran.isActive === true :
      fran.isActive === false;

    return matchesSearch && matchesStatus;
  });

  // CORREÇÃO: reset() idêntico ao da Imobiliária, blindado contra nulls que travam o preenchimento!
  function handleEdit(fran: any) {
    setEditingId(fran.id);
    reset({
      cnpj: fran.cnpj ? maskCnpj(fran.cnpj) : '',
      corporateName: fran.corporateName || '',
      tradeName: fran.tradeName || '',
      stateRegistration: (fran.stateRegistration && fran.stateRegistration !== 'ISENTO') ? fran.stateRegistration : '',
      cityRegistration: (fran.cityRegistration && fran.cityRegistration !== 'ISENTO') ? fran.cityRegistration : '',
      cep: fran.cep ? maskCep(fran.cep) : '',
      address: fran.address || '',
      phone: fran.phone ? maskPhone(fran.phone) : '',
      respName: fran.respName || '',
      respCpf: fran.respCpf ? maskCpf(fran.respCpf) : '',
      respPhone: fran.respPhone ? maskPhone(fran.respPhone) : '',
      respAddress: fran.respAddress || '',
      email: fran.email || '',
      contractUrl: fran.contractUrl || '',
      password: '', 
    });
    setIsModalOpen(true);
  }

  function handleCreateNew() {
    setEditingId(null);
    reset({
      cnpj: '', corporateName: '', tradeName: '', stateRegistration: '', cityRegistration: '',
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

  async function onSubmit(data: FranchiseeForm) {
    if (!editingId && (!data.password || data.password.length < 6)) {
      alert("Para um novo cadastro, a senha é obrigatória (mínimo 6 caracteres).");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        stateRegistration: data.stateRegistration || 'ISENTO',
        cityRegistration: data.cityRegistration || 'ISENTO',
        contractUrl: data.contractUrl || null,
      };

      if (!payload.password) delete payload.password; 

      if (editingId) {
        await api.put(`/franchisees/${editingId}`, payload);
      } else {
        await api.post('/franchisees', payload);
      }
      
      await fetchFranchisees();
      setIsModalOpen(false);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro interno no servidor.');
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
        <button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-sm">
          <Plus size={20} /> Nova Franquia
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
                <th className="px-6 py-4">Nome Fantasia</th>
                <th className="px-6 py-4">CNPJ / CPF Resp.</th>
                <th className="px-6 py-4">Contrato</th>
                <th className="px-6 py-4">Contato</th>
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
              ) : filteredFranchisees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Nenhum franqueado encontrado.</td>
                </tr>
              ) : (
                filteredFranchisees.map((fran) => (
                  <tr key={fran.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{fran.tradeName}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span>{maskCnpj(fran.cnpj)}</span>
                        <span className="text-xs text-slate-400 mt-1">CPF: {maskCpf(fran.respCpf || '')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {fran.contractUrl ? (
                        <a href={fran.contractUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1 text-xs">
                          <LinkIcon size={14} /> Ver Doc
                        </a>
                      ) : <span className="text-slate-400 text-xs">Nenhum</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span>{fran.email}</span>
                        <span className="text-xs text-slate-400 mt-1">{maskPhone(fran.phone)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${ fran.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500' }`}>
                        {fran.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleEdit(fran)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar Cadastro">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => toggleStatus(fran.id)} className={`p-2 rounded-lg transition-colors ${ fran.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50' }`} title={fran.isActive ? 'Desativar' : 'Ativar'}>
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
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10">
            <h2 className="text-xl font-semibold text-slate-800">
              {editingId ? 'Editar Franqueado' : 'Cadastrar Franqueado'}
            </h2>
            <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            
            <div>
              <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2 mb-4">Dados da Empresa</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                    CNPJ {isFetchingCnpj && <Loader2 size={14} className="animate-spin text-blue-500" />}
                  </label>
                  <input type="text" {...register('cnpj')} onChange={handleCnpjManualChange} placeholder="00.000.000/0000-00" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                  CEP {isFetchingCep && <Loader2 size={14} className="animate-spin text-blue-500" />}
                </label>
                <input type="text" {...register('cep')} onChange={handleCepManualChange} placeholder="00000-000" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Celular / WhatsApp</label>
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

            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <label className="block text-sm font-medium text-blue-800 mb-1">Link do Contrato Assinado (Opcional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-400">
                  <LinkIcon size={18} />
                </div>
                <input type="url" {...register('contractUrl')} placeholder="Ex: https://drive.google.com/..." className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-700" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail de Login</label>
                <input type="email" {...register('email')} placeholder="acesso@franquia.com" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {editingId ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha Provisória'}
                </label>
                <input type="password" {...register('password')} placeholder="••••••••" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center disabled:opacity-70">
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (editingId ? 'Salvar Alterações' : 'Cadastrar Franquia')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}