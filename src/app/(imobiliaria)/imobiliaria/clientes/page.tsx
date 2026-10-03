'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { 
  Users, Plus, Search, Edit, Power, User, Building, 
  MapPin, Phone, Mail, FileText, CheckSquare, X, Briefcase, Loader2,
  ShieldCheck, Landmark, FolderOpen, FileDown
} from 'lucide-react';
import { maskCep, maskCnpj, maskCpf, maskPhone } from '@/src/utils/mask'; 

const initialForm = {
  clientType: 'PF',
  name: '', corporateName: '', document: '', rg: '', stateRegistration: '', cityRegistration: '',
  cep: '', street: '', neighborhood: '', city: '', state: '', phone: '', email: '',
  maritalStatus: '', spouseName: '', spouseCpf: '', spouseRg: '', spouseDocUrl: '',
  respName: '', respCpf: '', respRg: '', respCep: '', respStreet: '', respNeighborhood: '', respCity: '', respState: '', respPhone: '', respEmail: '',
  
  // Garantias
  guaranteeType: '', insuranceCompanyId: '', guarantorName: '', guarantorCpf: '', guarantorRg: '', guarantorCivilStatus: '', guarantorPhone: '', guarantorEmail: '', guarantorAddress: '', guarantorIncome: '', guarantorDocUrl: '', guarantorPropertyRegistryUrl: '',
  
  // Financiamento
  educationLevel: '', financingDriveLink: '',
  
  isTenant: false, isBuyer: false, documentUrl: '', brokerId: ''
};

export default function ClientesPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [brokers, setBrokers] = useState<any[]>([]);
  const [insuranceCompanies, setInsuranceCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resClients, resBrokers, resInsurance] = await Promise.all([
        api.get('/clients'),
        api.get('/brokers').catch(() => ({ data: [] })),
        api.get('/insurance-companies').catch(() => ({ data: [] }))
      ]);
      setClients(resClients.data);
      setBrokers(resBrokers.data);
      setInsuranceCompanies(resInsurance.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (client: any = null) => {
    if (client) {
      setEditingId(client.id);
      setFormData({
        ...initialForm,
        ...client,
        document: client.clientType === 'PJ' ? maskCnpj(client.document) : maskCpf(client.document),
        phone: maskPhone(client.phone || ''),
        cep: maskCep(client.cep || ''),
        guarantorCpf: client.guarantorCpf ? maskCpf(client.guarantorCpf) : '',
        guarantorPhone: client.guarantorPhone ? maskPhone(client.guarantorPhone) : '',
        brokerId: client.brokerId || '',
        insuranceCompanyId: client.insuranceCompanyId || ''
      });
    } else {
      setEditingId(null);
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { ...formData };
      
      // Limpeza de pontuação para o backend
      payload.document = payload.document.replace(/\D/g, '');
      payload.phone = payload.phone.replace(/\D/g, '');
      payload.cep = payload.cep.replace(/\D/g, '');
      if(payload.respCpf) payload.respCpf = payload.respCpf.replace(/\D/g, '');
      if(payload.respPhone) payload.respPhone = payload.respPhone.replace(/\D/g, '');
      if(payload.guarantorCpf) payload.guarantorCpf = payload.guarantorCpf.replace(/\D/g, '');
      if(payload.guarantorPhone) payload.guarantorPhone = payload.guarantorPhone.replace(/\D/g, '');

      if (payload.clientType === 'PF') {
        payload.corporateName = ''; payload.stateRegistration = ''; payload.cityRegistration = '';
        payload.respName = ''; payload.respCpf = '';
      } else {
        payload.rg = ''; payload.spouseName = ''; payload.spouseCpf = '';
      }

      if (editingId) {
        await api.put(`/clients/${editingId}`, payload);
      } else {
        await api.post('/clients', payload);
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar cliente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    if(!confirm('Deseja alterar o status deste cliente?')) return;
    try {
      await api.patch(`/clients/${id}/status`);
      fetchData();
    } catch (error) {
      alert('Erro ao alterar status.');
    }
  };

  // GERAR PDF DO CHECKLIST DE FINANCIAMENTO
  const handleGenerateFinancingPDF = async () => {
    try {
      const resStore = await api.get('/my-store');
      const template = resStore.data.financingTemplate;
      
      if (!template) {
        alert('Modelo de PDF não configurado! Vá a "Configurações > Templates de Documentos" para criar o modelo do Checklist.');
        return;
      }

      const clienteNome = formData.clientType === 'PJ' ? formData.corporateName : formData.name;
      
      // Substituição das Tags
      let html = template
        .replace(/{{NOME_CLIENTE}}/g, clienteNome || '_________________________')
        .replace(/{{CPF_CLIENTE}}/g, formData.document || '_________________________')
        .replace(/{{TELEFONE}}/g, formData.phone || '_________________________')
        .replace(/{{EMAIL}}/g, formData.email || '_________________________')
        .replace(/{{ESCOLARIDADE}}/g, formData.educationLevel || 'Não informada')
        .replace(/{{LINK_DRIVE}}/g, formData.financingDriveLink ? `<a href="${formData.financingDriveLink}" target="_blank">Acessar Documentos no Google Drive</a>` : 'Nenhum link fornecido.');

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Checklist Financiamento - ${clienteNome}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                h1, h2, h3 { color: #1e3a8a; }
                a { color: #2563eb; text-decoration: none; font-weight: bold; }
              </style>
            </head>
            <body>
              ${html}
              <script>
                window.onload = function() { window.print(); }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (error) {
      alert('Erro ao buscar o template de financiamento.');
    }
  };

  const filteredClients = clients.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.corporateName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.document?.includes(searchTerm.replace(/\D/g, ''))
  );

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Users className="text-blue-600 bg-blue-50 p-1.5 rounded-lg" size={36} />
            Gestão de Clientes (CRM)
          </h1>
          <p className="text-slate-500 mt-2 text-sm">Cadastre compradores, inquilinos ou prospectos gerais (PF ou PJ).</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por Nome ou CPF/CNPJ..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
            />
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm whitespace-nowrap text-sm"
          >
            <Plus size={18} /> Novo Cliente
          </button>
        </div>
      </div>

      {/* LISTAGEM DE CLIENTES */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="p-4">Cliente / Empresa</th>
                <th className="p-4">Contactos</th>
                <th className="p-4">Perfil & Corretor</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2"/> Carregando clientes...</td></tr>
              ) : filteredClients.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-medium">Nenhum cliente encontrado.</td></tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${client.clientType === 'PJ' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                          {client.clientType === 'PJ' ? <Building size={18}/> : <User size={18}/>}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{client.clientType === 'PJ' ? client.corporateName : client.name}</p>
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                            <FileText size={10}/> {client.clientType === 'PJ' ? maskCnpj(client.document) : maskCpf(client.document)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-700 flex items-center gap-2"><Phone size={14} className="text-slate-400"/> {maskPhone(client.phone)}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-1"><Mail size={14} className="text-slate-400"/> {client.email || 'Sem e-mail'}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1.5 mb-2">
                        {client.isBuyer && <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">Comprador</span>}
                        {client.isTenant && <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-200">Inquilino</span>}
                        {!client.isBuyer && !client.isTenant && <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">Prospecto</span>}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5"><Briefcase size={12}/> {client.broker?.name || 'Sem corretor atribuído'}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${client.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${client.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        {client.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal(client)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100" title="Editar">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleToggleStatus(client.id)} className={`p-2 rounded-lg transition-colors border border-transparent ${client.isActive ? 'text-red-500 hover:bg-red-50 hover:border-red-100' : 'text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100'}`} title={client.isActive ? 'Desativar' : 'Ativar'}>
                          <Power size={16} />
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

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl shrink-0">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {editingId ? <Edit className="text-blue-600" size={24}/> : <Users className="text-blue-600" size={24}/>}
                {editingId ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="clientForm" onSubmit={handleSubmit} className="space-y-8">
                
                {/* TIPO DE CLIENTE */}
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.clientType === 'PF' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>
                    <input type="radio" name="clientType" value="PF" checked={formData.clientType === 'PF'} onChange={(e) => setFormData({...formData, clientType: e.target.value})} className="hidden" />
                    <User size={20}/> <span className="font-bold">Pessoa Física (PF)</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.clientType === 'PJ' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>
                    <input type="radio" name="clientType" value="PJ" checked={formData.clientType === 'PJ'} onChange={(e) => setFormData({...formData, clientType: e.target.value})} className="hidden" />
                    <Building size={20}/> <span className="font-bold">Pessoa Jurídica (PJ)</span>
                  </label>
                </div>

                {/* DADOS PRINCIPAIS */}
                <section>
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><FileText size={16} className="text-blue-500"/> Dados Principais</h3>
                  
                  {formData.clientType === 'PF' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-600 mb-1">Nome Completo *</label>
                        <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">CPF *</label>
                        <input required type="text" value={formData.document} onChange={(e) => setFormData({...formData, document: maskCpf(e.target.value)})} placeholder="000.000.000-00" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">RG</label>
                        <input type="text" value={formData.rg} onChange={(e) => setFormData({...formData, rg: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Telefone / WhatsApp *</label>
                        <input required type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: maskPhone(e.target.value)})} placeholder="(00) 00000-0000" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">E-mail</label>
                        <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-600 mb-1">Razão Social *</label>
                        <input required type="text" value={formData.corporateName} onChange={(e) => setFormData({...formData, corporateName: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">CNPJ *</label>
                        <input required type="text" value={formData.document} onChange={(e) => setFormData({...formData, document: maskCnpj(e.target.value)})} placeholder="00.000.000/0000-00" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-slate-600 mb-1">Nome Fantasia</label>
                        <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Insc. Estadual</label>
                        <input type="text" value={formData.stateRegistration} onChange={(e) => setFormData({...formData, stateRegistration: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Insc. Municipal</label>
                        <input type="text" value={formData.cityRegistration} onChange={(e) => setFormData({...formData, cityRegistration: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Telefone da Empresa *</label>
                        <input required type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: maskPhone(e.target.value)})} placeholder="(00) 00000-0000" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-600 mb-1">E-mail Comercial</label>
                        <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                    </div>
                  )}
                </section>

                {/* ENDEREÇO PRINCIPAL */}
                <section>
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><MapPin size={16} className="text-blue-500"/> Endereço ({formData.clientType === 'PF' ? 'Residencial' : 'Sede'})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">CEP</label>
                      <input type="text" value={formData.cep} onChange={(e) => setFormData({...formData, cep: maskCep(e.target.value)})} placeholder="00000-000" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Rua, Número, Complemento</label>
                      <input type="text" value={formData.street} onChange={(e) => setFormData({...formData, street: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Bairro</label>
                      <input type="text" value={formData.neighborhood} onChange={(e) => setFormData({...formData, neighborhood: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Cidade</label>
                      <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Estado (UF)</label>
                      <input type="text" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                  </div>
                </section>

                {/* DADOS ESPECÍFICOS */}
                {formData.clientType === 'PF' ? (
                  <section className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-200 pb-2"><Users size={16} className="text-slate-500"/> Dados do Cônjuge (Opcional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Estado Civil</label>
                        <select value={formData.maritalStatus} onChange={(e) => setFormData({...formData, maritalStatus: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm">
                          <option value="">Selecione...</option>
                          <option value="Solteiro">Solteiro(a)</option>
                          <option value="Casado">Casado(a)</option>
                          <option value="Divorciado">Divorciado(a)</option>
                          <option value="Viuvo">Viúvo(a)</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-600 mb-1">Nome do Cônjuge</label>
                        <input type="text" value={formData.spouseName} onChange={(e) => setFormData({...formData, spouseName: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">CPF do Cônjuge</label>
                        <input type="text" value={formData.spouseCpf} onChange={(e) => setFormData({...formData, spouseCpf: maskCpf(e.target.value)})} placeholder="000.000.000-00" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-600 mb-1">RG do Cônjuge</label>
                        <input type="text" value={formData.spouseRg} onChange={(e) => setFormData({...formData, spouseRg: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm" />
                      </div>
                    </div>
                  </section>
                ) : (
                  <section className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-200 pb-2"><User size={16} className="text-indigo-500"/> Responsável Legal da Empresa</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-600 mb-1">Nome do Responsável *</label>
                        <input type="text" required={formData.clientType === 'PJ'} value={formData.respName} onChange={(e) => setFormData({...formData, respName: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">CPF do Responsável *</label>
                        <input type="text" required={formData.clientType === 'PJ'} value={formData.respCpf} onChange={(e) => setFormData({...formData, respCpf: maskCpf(e.target.value)})} placeholder="000.000.000-00" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Telefone Direto</label>
                        <input type="text" value={formData.respPhone} onChange={(e) => setFormData({...formData, respPhone: maskPhone(e.target.value)})} placeholder="(00) 00000-0000" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-600 mb-1">E-mail Direto</label>
                        <input type="email" value={formData.respEmail} onChange={(e) => setFormData({...formData, respEmail: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm" />
                      </div>
                    </div>
                  </section>
                )}

                {/* CONFIGURAÇÕES DE PLATAFORMA (CRM & PERFIL) */}
                <section className="bg-blue-50 p-5 rounded-xl border border-blue-200">
                  <h3 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2"><CheckSquare size={16}/> Classificação no CRM e Perfil</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Perfil do Cliente na Loja</label>
                      <div className="flex gap-4">
                        <label className={`flex items-center gap-2 cursor-pointer bg-white px-4 py-2.5 rounded-xl border transition-colors ${formData.isBuyer ? 'border-blue-500 shadow-sm' : 'border-slate-200 hover:border-blue-400'}`}>
                          <input type="checkbox" checked={formData.isBuyer} onChange={(e) => setFormData({...formData, isBuyer: e.target.checked})} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                          <span className="text-sm font-semibold text-slate-700">Comprador</span>
                        </label>
                        <label className={`flex items-center gap-2 cursor-pointer bg-white px-4 py-2.5 rounded-xl border transition-colors ${formData.isTenant ? 'border-purple-500 shadow-sm' : 'border-slate-200 hover:border-purple-400'}`}>
                          <input type="checkbox" checked={formData.isTenant} onChange={(e) => setFormData({...formData, isTenant: e.target.checked})} className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
                          <span className="text-sm font-semibold text-slate-700">Inquilino</span>
                        </label>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 font-medium">Marcando opções, liberta as secções especiais abaixo.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Corretor Responsável</label>
                      <select 
                        value={formData.brokerId} 
                        onChange={(e) => setFormData({...formData, brokerId: e.target.value})} 
                        className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                      >
                        <option value="">Nenhum / Atendimento Geral</option>
                        {brokers.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-500 mt-2 font-medium">O Lead gerado ficará vinculado a este corretor.</p>
                    </div>
                  </div>
                </section>

                {/* ========================================================= */}
                {/* 1. MÓDULO EXCLUSIVO: INQUILINO (GARANTIAS & FIADOR)       */}
                {/* ========================================================= */}
                {formData.isTenant && (
                  <section className="bg-purple-50 p-6 rounded-xl border border-purple-200 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-sm font-bold text-purple-900 mb-4 flex items-center gap-2 border-b border-purple-200 pb-2">
                      <ShieldCheck size={18}/> Garantia Locatícia (Inquilino)
                    </h3>
                    
                    <div className="mb-6">
                      <label className="block text-xs font-bold text-purple-800 mb-2">Qual será o modelo de garantia?</label>
                      <select value={formData.guaranteeType} onChange={(e) => setFormData({...formData, guaranteeType: e.target.value})} className="w-full md:w-1/2 p-2.5 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-sm">
                        <option value="">Selecione a garantia...</option>
                        <option value="Avalista">Avalista</option>
                        <option value="Fiador">Fiador</option>
                        <option value="Seguro Fiança">Seguro Fiança</option>
                        <option value="Caução">Caução</option>
                      </select>
                    </div>

                    {formData.guaranteeType === 'Seguro Fiança' && (
                      <div className="bg-white p-5 rounded-xl border border-purple-100 shadow-sm animate-in fade-in">
                        <label className="block text-xs font-bold text-slate-700 mb-2">Selecione a Empresa de Seguro Fiança</label>
                        <select value={formData.insuranceCompanyId} onChange={(e) => setFormData({...formData, insuranceCompanyId: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm">
                          <option value="">Escolha a Seguradora...</option>
                          {insuranceCompanies.map(company => (
                            <option key={company.id} value={company.id}>{company.name}</option>
                          ))}
                        </select>
                        <p className="text-[11px] text-purple-600 mt-2 font-medium">As seguradoras podem ser geridas no menu "Configurações".</p>
                      </div>
                    )}

                    {(formData.guaranteeType === 'Avalista' || formData.guaranteeType === 'Fiador') && (
                      <div className="bg-white p-5 rounded-xl border border-purple-100 shadow-sm animate-in fade-in space-y-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dados Completos do {formData.guaranteeType}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-600 mb-1">Nome Completo</label>
                            <input type="text" value={formData.guarantorName} onChange={(e) => setFormData({...formData, guarantorName: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">CPF</label>
                            <input type="text" value={formData.guarantorCpf} onChange={(e) => setFormData({...formData, guarantorCpf: maskCpf(e.target.value)})} placeholder="000.000.000-00" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">RG</label>
                            <input type="text" value={formData.guarantorRg} onChange={(e) => setFormData({...formData, guarantorRg: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Estado Civil</label>
                            <select value={formData.guarantorCivilStatus} onChange={(e) => setFormData({...formData, guarantorCivilStatus: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm">
                              <option value="">Selecione...</option>
                              <option value="Solteiro">Solteiro(a)</option>
                              <option value="Casado">Casado(a)</option>
                              <option value="Divorciado">Divorciado(a)</option>
                              <option value="Viuvo">Viúvo(a)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Renda Comprovada (R$)</label>
                            <input type="number" value={formData.guarantorIncome} onChange={(e) => setFormData({...formData, guarantorIncome: e.target.value})} placeholder="5000" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Telefone</label>
                            <input type="text" value={formData.guarantorPhone} onChange={(e) => setFormData({...formData, guarantorPhone: maskPhone(e.target.value)})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-600 mb-1">E-mail</label>
                            <input type="email" value={formData.guarantorEmail} onChange={(e) => setFormData({...formData, guarantorEmail: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-slate-600 mb-1">Endereço Residencial Completo</label>
                            <input type="text" value={formData.guarantorAddress} onChange={(e) => setFormData({...formData, guarantorAddress: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm bg-slate-50" />
                          </div>
                          
                          {/* DOCUMENTOS DO FIADOR */}
                          <div className="md:col-span-3 mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1"><FolderOpen size={14}/> Link Documentos Pessoais (Drive)</label>
                              <input type="url" value={formData.guarantorDocUrl} onChange={(e) => setFormData({...formData, guarantorDocUrl: e.target.value})} placeholder="https://drive.google.com/..." className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1"><Landmark size={14}/> Link do Registo de Imóveis (Drive)</label>
                              <input type="url" value={formData.guarantorPropertyRegistryUrl} onChange={(e) => setFormData({...formData, guarantorPropertyRegistryUrl: e.target.value})} placeholder="https://drive.google.com/..." className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {/* ========================================================= */}
                {/* 2. MÓDULO EXCLUSIVO: COMPRADOR (CHECKLIST FINANCIAMENTO)  */}
                {/* ========================================================= */}
                {formData.isBuyer && (
                  <section className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-4 border-b border-emerald-200 pb-2">
                      <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                        <CheckSquare size={18}/> Checklist para Financiamento Bancário
                      </h3>
                      <button 
                        type="button" 
                        onClick={handleGenerateFinancingPDF}
                        className="text-xs font-bold flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-all shadow-sm"
                      >
                        <FileDown size={14}/> Gerar PDF Checklist
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-emerald-800 mb-1">Grau de Escolaridade</label>
                        <select value={formData.educationLevel} onChange={(e) => setFormData({...formData, educationLevel: e.target.value})} className="w-full p-2.5 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-sm">
                          <option value="">Selecione...</option>
                          <option value="Ensino Fundamental">Ensino Fundamental</option>
                          <option value="Ensino Médio">Ensino Médio</option>
                          <option value="Ensino Superior">Ensino Superior</option>
                          <option value="Pós-graduação">Pós-graduação</option>
                          <option value="Mestrado/Doutorado">Mestrado/Doutorado</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-emerald-800 mb-1 flex items-center gap-1"><FolderOpen size={14}/> Pasta partilhada (Google Drive)</label>
                        <input type="url" value={formData.financingDriveLink} onChange={(e) => setFormData({...formData, financingDriveLink: e.target.value})} placeholder="https://drive.google.com/..." className="w-full p-2.5 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-sm" />
                        <p className="text-[10px] text-emerald-600 mt-1 font-medium">Coloque aqui o link da pasta contendo: Holerites, IRPF, Extrato FGTS, Certidão de Casamento e Comprovante de Morada.</p>
                      </div>
                    </div>
                  </section>
                )}

              </form>
            </div>

            {/* RODAPÉ DO MODAL (BOTÕES) */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
                Cancelar
              </button>
              <button type="submit" form="clientForm" disabled={isSaving} className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-70">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckSquare size={16}/>}
                {editingId ? 'Salvar Alterações' : 'Cadastrar Cliente'}
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}