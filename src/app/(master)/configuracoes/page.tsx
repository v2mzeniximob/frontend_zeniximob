'use client';

import { useState, useEffect } from 'react';
import { api } from '@/src/lib/api';
import { Settings, Users, CreditCard, FileCode2, Save, Plus, CheckCircle2, X, Power } from 'lucide-react';

export default function MasterConfigPage() {
  const [activeTab, setActiveTab] = useState<'usuarios' | 'pagamentos' | 'modelos'>('usuarios');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estados
  const [config, setConfig] = useState<any>({});
  const [admins, setAdmins] = useState<any[]>([]);
  
  // Modal Novo Admin
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'usuarios') {
        const res = await api.get('/master/admins');
        setAdmins(res.data);
      } else {
        const res = await api.get('/master/config');
        setConfig(res.data || {});
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------
  // AÇÕES: CONFIGURAÇÕES GERAIS
  // -------------------------
  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      await api.put('/master/config', config);
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      alert('Erro ao salvar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  // -------------------------
  // AÇÕES: USUÁRIOS MASTER
  // -------------------------
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/master/admins', adminForm);
      setIsModalOpen(false);
      setAdminForm({ name: '', email: '', password: '' });
      fetchData();
    } catch (error) {
      alert('Erro ao criar usuário. O e-mail pode já estar em uso.');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (!confirm(`Deseja ${currentStatus ? 'desativar' : 'ativar'} este usuário?`)) return;
    try {
      await api.patch(`/master/admins/${id}/status`, { isActive: !currentStatus });
      fetchData();
    } catch (error) {
      alert('Erro ao atualizar status.');
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto font-sans animate-in fade-in duration-300 pb-20">
      
      {/* CABEÇALHO */}
      <div className="mb-8">
        <span className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3 inline-block shadow-sm">Zenix Master</span>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Settings className="text-indigo-600" size={32} /> Configurações do Sistema
        </h1>
        <p className="text-slate-500 mt-2">Gerencie acessos, meios de pagamento e modelos de contratos da plataforma.</p>
      </div>

      {/* TABS (ABAS) */}
      <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 mb-6 w-full lg:w-fit">
        <button onClick={() => setActiveTab('usuarios')} className={`flex-1 lg:flex-none px-6 py-3 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'usuarios' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
          <Users size={18}/> Usuários Master
        </button>
        <button onClick={() => setActiveTab('pagamentos')} className={`flex-1 lg:flex-none px-6 py-3 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'pagamentos' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
          <CreditCard size={18}/> Mercado Pago (SaaS)
        </button>
        <button onClick={() => setActiveTab('modelos')} className={`flex-1 lg:flex-none px-6 py-3 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'modelos' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
          <FileCode2 size={18}/> Modelos de Contrato
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden min-h-[500px]">
        
        {/* ABA: USUÁRIOS MASTER */}
        {activeTab === 'usuarios' && (
          <div>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800">Equipe de Gestão Zenix</h2>
              <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm transition-all shadow-sm">
                <Plus size={16} /> Novo Usuário
              </button>
            </div>
            
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="p-4 pl-6 font-bold uppercase tracking-wider text-xs">Nome / E-mail</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs">Data de Criação</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs text-center">Status</th>
                  <th className="p-4 pr-6 font-bold uppercase tracking-wider text-xs text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {admins.map(admin => (
                  <tr key={admin.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6">
                      <p className="font-bold text-slate-800">{admin.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{admin.email}</p>
                    </td>
                    <td className="p-4 text-slate-500">{new Date(admin.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${admin.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {admin.isActive ? 'Ativo' : 'Bloqueado'}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button onClick={() => handleToggleStatus(admin.id, admin.isActive)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ml-auto">
                        <Power size={14}/> {admin.isActive ? 'Desativar' : 'Reativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ABA: MERCADO PAGO */}
        {activeTab === 'pagamentos' && (
          <div className="p-8 max-w-3xl">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Credenciais do Mercado Pago</h2>
            <p className="text-sm text-slate-500 mb-6">Estas chaves serão usadas para gerar as faturas (PIX/Boleto) de cobrança das assinaturas das imobiliárias e franqueados.</p>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Access Token (Produção)</label>
                <input 
                  type="text" 
                  value={config.mpAccessToken || ''} 
                  onChange={e => setConfig({...config, mpAccessToken: e.target.value})} 
                  placeholder="APP_USR-..." 
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Public Key (Produção)</label>
                <input 
                  type="text" 
                  value={config.mpPublicKey || ''} 
                  onChange={e => setConfig({...config, mpPublicKey: e.target.value})} 
                  placeholder="APP_USR-..." 
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono" 
                />
              </div>
              
              <button onClick={handleSaveConfig} disabled={isSaving} className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all">
                <Save size={18}/> Salvar Credenciais
              </button>
            </div>
          </div>
        )}

        {/* ABA: MODELOS DE CONTRATO HTML */}
        {activeTab === 'modelos' && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-1">Modelos Base de Contrato</h2>
                <p className="text-sm text-slate-500">Cole o código HTML dos contratos. O sistema preencherá as variáveis automaticamente.</p>
              </div>
              <button onClick={handleSaveConfig} disabled={isSaving} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all">
                <Save size={18}/> Salvar Modelos
              </button>
            </div>
            
            <div className="space-y-8">
              {/* Contrato Master x Franqueado */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-2">1. Contrato: Master x Franqueado</h3>
                <p className="text-xs text-slate-500 mb-3">Variáveis: {'{{NOME_FRANQUEADO}}'}, {'{{CNPJ}}'}, {'{{VALOR}}'}, {'{{DATA}}'}</p>
                <textarea 
                  rows={8} 
                  value={config.templateMasterFranchisee || ''} 
                  onChange={e => setConfig({...config, templateMasterFranchisee: e.target.value})} 
                  className="w-full p-4 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono bg-white" 
                  placeholder="<h1>Contrato de Franquia</h1>..."
                />
              </div>

              {/* Contrato Master x Imobiliária */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-2">2. Contrato: Master x Imobiliária (Direta)</h3>
                <p className="text-xs text-slate-500 mb-3">Variáveis: {'{{NOME_IMOBILIARIA}}'}, {'{{CNPJ}}'}, {'{{VALOR}}'}, {'{{DATA}}'}</p>
                <textarea 
                  rows={8} 
                  value={config.templateMasterRealEstate || ''} 
                  onChange={e => setConfig({...config, templateMasterRealEstate: e.target.value})} 
                  className="w-full p-4 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono bg-white" 
                  placeholder="<h1>Contrato de Software as a Service</h1>..."
                />
              </div>

              {/* Contrato Franqueado x Imobiliária */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-2">3. Contrato: Franqueado x Imobiliária</h3>
                <p className="text-xs text-slate-500 mb-3">Variáveis: {'{{NOME_FRANQUEADO}}'}, {'{{NOME_IMOBILIARIA}}'}, {'{{VALOR}}'}, {'{{DATA}}'}</p>
                <textarea 
                  rows={8} 
                  value={config.templateFranchiseeRealEstate || ''} 
                  onChange={e => setConfig({...config, templateFranchiseeRealEstate: e.target.value})} 
                  className="w-full p-4 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono bg-white" 
                  placeholder="<h1>Contrato de Intermediação de Software</h1>..."
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: NOVO USUÁRIO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Users size={18} className="text-indigo-600"/> Novo Admin Master</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                <input required type="text" value={adminForm.name} onChange={e => setAdminForm({...adminForm, name: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">E-mail</label>
                <input required type="email" value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Senha Provisória</label>
                <input required type="password" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button type="submit" className="w-full py-3.5 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors">
                Criar Usuário
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}