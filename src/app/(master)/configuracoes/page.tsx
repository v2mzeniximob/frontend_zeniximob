'use client';

import { useState, useEffect } from 'react';
import { api } from '@/src/lib/api';
import { DEFAULT_LANDING_CONFIG } from '@/src/app/page';
import {
  Settings, Users, CreditCard, FileCode2, Globe, Save, Plus, CheckCircle2, X, Power, Trash2, RotateCcw, Edit
} from 'lucide-react';

export default function MasterConfigPage() {
  const [activeTab, setActiveTab] = useState<'usuarios' | 'pagamentos' | 'modelos' | 'landing'>('usuarios');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estados
  const [config, setConfig] = useState<any>({});
  const [landingConfig, setLandingConfig] = useState<any>(DEFAULT_LANDING_CONFIG);
  const [landingSubTab, setLandingSubTab] = useState<'hero' | 'pilares' | 'modulos' | 'telas' | 'faq' | 'contato'>('hero');
  const [admins, setAdmins] = useState<any[]>([]);
  
  // Modal Novo / Editar Admin
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
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
      } else if (activeTab === 'landing') {
        const res = await api.get('/public/landing-page');
        if (res.data?.config) {
          setLandingConfig({ ...DEFAULT_LANDING_CONFIG, ...res.data.config });
        }
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
  // AÇÕES: CONFIGURAÇÕES GERAIS E CONTRATOS
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
  // AÇÕES: LANDING PAGE (CMS)
  // -------------------------
  const handleSaveLanding = async () => {
    setIsSaving(true);
    try {
      await api.put('/master/landing-page', { config: landingConfig });
      localStorage.setItem('@ZenixImob:landingConfig', JSON.stringify(landingConfig));
      alert('✅ Landing Page atualizada e publicada no site com sucesso!');
    } catch (error) {
      alert('Erro ao salvar Landing Page no servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetLanding = () => {
    if (!confirm('Deseja restaurar todos os padrões de fábrica da Landing Page?')) return;
    setLandingConfig(DEFAULT_LANDING_CONFIG);
  };

  // -------------------------
  // AÇÕES: USUÁRIOS MASTER
  // -------------------------
  const handleOpenModalAdmin = (admin?: any) => {
    if (admin) {
      setEditingAdminId(admin.id);
      setAdminForm({ name: admin.name, email: admin.email, password: '' });
    } else {
      setEditingAdminId(null);
      setAdminForm({ name: '', email: '', password: '' });
    }
    setIsModalOpen(true);
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAdminId) {
        await api.put(`/master/admins/${editingAdminId}`, adminForm);
        alert('Usuário Master atualizado com sucesso!');
      } else {
        await api.post('/master/admins', adminForm);
        alert('Novo usuário Master criado com sucesso!');
      }
      setIsModalOpen(false);
      setAdminForm({ name: '', email: '', password: '' });
      setEditingAdminId(null);
      fetchData();
    } catch (error) {
      alert('Erro ao salvar usuário. O e-mail pode já estar em uso.');
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
        <p className="text-slate-500 mt-2">Gerencie acessos, meios de pagamento, modelos de contratos e o CMS da página inicial.</p>
      </div>

      {/* TABS (ABAS) */}
      <div className="flex flex-wrap bg-white rounded-xl shadow-sm border border-slate-200 p-1 mb-6 w-full lg:w-fit gap-1">
        <button onClick={() => setActiveTab('usuarios')} className={`px-5 py-3 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'usuarios' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
          <Users size={17}/> Usuários Master
        </button>
        <button onClick={() => setActiveTab('pagamentos')} className={`px-5 py-3 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'pagamentos' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
          <CreditCard size={17}/> Mercado Pago (SaaS)
        </button>
        <button onClick={() => setActiveTab('modelos')} className={`px-5 py-3 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'modelos' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
          <FileCode2 size={17}/> Modelos de Contrato
        </button>
        <button onClick={() => setActiveTab('landing')} className={`px-5 py-3 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'landing' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
          <Globe size={17}/> Landing Page (Site)
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden min-h-[500px]">
        
        {/* ABA: USUÁRIOS MASTER */}
        {activeTab === 'usuarios' && (
          <div>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800">Equipe de Gestão Zenix</h2>
              <button onClick={() => handleOpenModalAdmin()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm transition-all shadow-sm">
                <Plus size={16} /> Novo Usuário
              </button>
            </div>
            
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="p-4 pl-6 font-bold uppercase tracking-wider text-xs">Nome / E-mail</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs">Data de Criação</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs text-center">Status</th>
                  <th className="p-4 pr-6 font-bold uppercase tracking-wider text-xs text-right">Ações</th>
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
                    <td className="p-4 pr-6 text-right space-x-2">
                      <button onClick={() => handleOpenModalAdmin(admin)} className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1">
                        <Edit size={13}/> Editar
                      </button>
                      <button onClick={() => handleToggleStatus(admin.id, admin.isActive)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5 ${admin.isActive ? 'bg-amber-50 hover:bg-amber-100 text-amber-700' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'}`}>
                        <Power size={13}/> {admin.isActive ? 'Desativar' : 'Habilitar'}
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

        {/* ABA: LAND PAGE / SITE PÚBLICO (CMS MASTER) */}
        {activeTab === 'landing' && (
          <div className="p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Editor Visual da Landing Page (Site Público)</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Altere textos, imagens, estatísticas, pilares, cards de módulos e WhatsApp comercial da página inicial.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleResetLanding}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5"
                >
                  <RotateCcw size={14} /> Restaurar Padrão
                </button>
                <button
                  type="button"
                  onClick={handleSaveLanding}
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-sm flex items-center gap-2"
                >
                  {isSaving ? <span className="animate-spin">⏳</span> : <Save size={15} />} Publicar Site
                </button>
              </div>
            </div>

            {/* Sub-abas do Editor da Landing Page */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              {[
                { id: 'hero', label: '1. Topo & Imagem Principal' },
                { id: 'pilares', label: '2. Os 4 Pilares do Ecossistema' },
                { id: 'modulos', label: '3. Cards de Módulos (23)' },
                { id: 'telas', label: '4. Galeria de Telas' },
                { id: 'faq', label: '5. Perguntas Frequentes (FAQ)' },
                { id: 'contato', label: '6. Marca & WhatsApp' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setLandingSubTab(st.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    landingSubTab === st.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* SUB-ABA 1: HERO */}
            {landingSubTab === 'hero' && (
              <div className="space-y-4 text-xs bg-white p-6 rounded-2xl border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Texto do Selo Superior (Badge)</label>
                    <input
                      type="text"
                      value={landingConfig.hero?.badgeText || ''}
                      onChange={(e) => setLandingConfig({ ...landingConfig, hero: { ...landingConfig.hero, badgeText: e.target.value } })}
                      className="w-full p-3 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Título (Linha 1)</label>
                    <input
                      type="text"
                      value={landingConfig.hero?.titleLine1 || ''}
                      onChange={(e) => setLandingConfig({ ...landingConfig, hero: { ...landingConfig.hero, titleLine1: e.target.value } })}
                      className="w-full p-3 border border-slate-300 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-blue-700 mb-1">Título Destaque (Degradê Azul)</label>
                    <input
                      type="text"
                      value={landingConfig.hero?.titleHighlight || ''}
                      onChange={(e) => setLandingConfig({ ...landingConfig, hero: { ...landingConfig.hero, titleHighlight: e.target.value } })}
                      className="w-full p-3 border border-blue-300 rounded-xl font-bold bg-blue-50/30"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Subtítulo</label>
                    <textarea
                      rows={3}
                      value={landingConfig.hero?.subtitle || ''}
                      onChange={(e) => setLandingConfig({ ...landingConfig, hero: { ...landingConfig.hero, subtitle: e.target.value } })}
                      className="w-full p-3 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">URL da Imagem de Preview do Dashboard</label>
                    <input
                      type="url"
                      value={landingConfig.hero?.dashboardPreviewUrl || ''}
                      onChange={(e) => setLandingConfig({ ...landingConfig, hero: { ...landingConfig.hero, dashboardPreviewUrl: e.target.value } })}
                      className="w-full p-3 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Legenda da Imagem</label>
                    <input
                      type="text"
                      value={landingConfig.hero?.dashboardCaption || ''}
                      onChange={(e) => setLandingConfig({ ...landingConfig, hero: { ...landingConfig.hero, dashboardCaption: e.target.value } })}
                      className="w-full p-3 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-ABA 2: PILARES */}
            {landingSubTab === 'pilares' && (
              <div className="space-y-4 text-xs">
                {(landingConfig.pillars || []).map((pillar: any, idx: number) => (
                  <div key={pillar.id || idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
                    <h3 className="font-black text-sm text-indigo-700">Pilar #{idx + 1}: {pillar.tabLabel}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">Nome da Aba</label>
                        <input
                          type="text"
                          value={pillar.tabLabel}
                          onChange={(e) => {
                            const updated = [...landingConfig.pillars];
                            updated[idx].tabLabel = e.target.value;
                            setLandingConfig({ ...landingConfig, pillars: updated });
                          }}
                          className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">Selo (Badge)</label>
                        <input
                          type="text"
                          value={pillar.badge}
                          onChange={(e) => {
                            const updated = [...landingConfig.pillars];
                            updated[idx].badge = e.target.value;
                            setLandingConfig({ ...landingConfig, pillars: updated });
                          }}
                          className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">URL da Imagem</label>
                        <input
                          type="url"
                          value={pillar.imageUrl}
                          onChange={(e) => {
                            const updated = [...landingConfig.pillars];
                            updated[idx].imageUrl = e.target.value;
                            setLandingConfig({ ...landingConfig, pillars: updated });
                          }}
                          className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block font-bold text-slate-600 mb-1">Título</label>
                        <input
                          type="text"
                          value={pillar.title}
                          onChange={(e) => {
                            const updated = [...landingConfig.pillars];
                            updated[idx].title = e.target.value;
                            setLandingConfig({ ...landingConfig, pillars: updated });
                          }}
                          className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block font-bold text-slate-600 mb-1">Descrição</label>
                        <textarea
                          rows={2}
                          value={pillar.description}
                          onChange={(e) => {
                            const updated = [...landingConfig.pillars];
                            updated[idx].description = e.target.value;
                            setLandingConfig({ ...landingConfig, pillars: updated });
                          }}
                          className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block font-bold text-slate-600 mb-1">Tópicos (1 por linha)</label>
                        <textarea
                          rows={4}
                          value={(pillar.bullets || []).join('\n')}
                          onChange={(e) => {
                            const updated = [...landingConfig.pillars];
                            updated[idx].bullets = e.target.value.split('\n');
                            setLandingConfig({ ...landingConfig, pillars: updated });
                          }}
                          className="w-full p-2.5 border border-slate-300 rounded-xl font-mono bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SUB-ABA 3: MÓDULOS */}
            {landingSubTab === 'modulos' && (
              <div className="space-y-4 text-xs bg-white p-6 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm text-slate-800">Cards de Funcionalidades ({landingConfig.features?.length || 0})</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setLandingConfig({
                        ...landingConfig,
                        features: [...(landingConfig.features || []), { title: 'Nova Funcionalidade', description: 'Detalhes...', badge: 'Módulo' }]
                      })
                    }
                    className="bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                  >
                    <Plus size={14} /> Adicionar Card
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(landingConfig.features || []).map((feat: any, idx: number) => (
                    <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-indigo-600">Card #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = landingConfig.features.filter((_: any, i: number) => i !== idx);
                            setLandingConfig({ ...landingConfig, features: updated });
                          }}
                          className="text-rose-600 p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Selo"
                        value={feat.badge || ''}
                        onChange={(e) => {
                          const updated = [...landingConfig.features];
                          updated[idx].badge = e.target.value;
                          setLandingConfig({ ...landingConfig, features: updated });
                        }}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Título"
                        value={feat.title || ''}
                        onChange={(e) => {
                          const updated = [...landingConfig.features];
                          updated[idx].title = e.target.value;
                          setLandingConfig({ ...landingConfig, features: updated });
                        }}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold"
                      />
                      <textarea
                        rows={2}
                        placeholder="Descrição"
                        value={feat.description || ''}
                        onChange={(e) => {
                          const updated = [...landingConfig.features];
                          updated[idx].description = e.target.value;
                          setLandingConfig({ ...landingConfig, features: updated });
                        }}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-ABA 4: TELAS */}
            {landingSubTab === 'telas' && (
              <div className="space-y-4 text-xs bg-white p-6 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm text-slate-800">Galeria de Telas do Sistema</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setLandingConfig({
                        ...landingConfig,
                        screensGallery: [...(landingConfig.screensGallery || []), { title: 'Nova Tela', subtitle: 'Resumo...', imageUrl: 'https://images.unsplash.com/...0' }]
                      })
                    }
                    className="bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                  >
                    <Plus size={14} /> Adicionar Tela
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(landingConfig.screensGallery || []).map((scr: any, idx: number) => (
                    <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-700">Tela #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = landingConfig.screensGallery.filter((_: any, i: number) => i !== idx);
                            setLandingConfig({ ...landingConfig, screensGallery: updated });
                          }}
                          className="text-rose-600 p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={scr.title || ''}
                        onChange={(e) => {
                          const updated = [...landingConfig.screensGallery];
                          updated[idx].title = e.target.value;
                          setLandingConfig({ ...landingConfig, screensGallery: updated });
                        }}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold"
                      />
                      <input
                        type="url"
                        placeholder="URL da Imagem"
                        value={scr.imageUrl || ''}
                        onChange={(e) => {
                          const updated = [...landingConfig.screensGallery];
                          updated[idx].imageUrl = e.target.value;
                          setLandingConfig({ ...landingConfig, screensGallery: updated });
                        }}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      />
                      <textarea
                        rows={2}
                        value={scr.subtitle || ''}
                        onChange={(e) => {
                          const updated = [...landingConfig.screensGallery];
                          updated[idx].subtitle = e.target.value;
                          setLandingConfig({ ...landingConfig, screensGallery: updated });
                        }}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-ABA 5: FAQ */}
            {landingSubTab === 'faq' && (
              <div className="space-y-4 text-xs bg-white p-6 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm text-slate-800">Perguntas Frequentes (FAQ)</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setLandingConfig({
                        ...landingConfig,
                        faqs: [...(landingConfig.faqs || []), { question: 'Nova dúvida?', answer: 'Resposta...' }]
                      })
                    }
                    className="bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                  >
                    <Plus size={14} /> Nova Pergunta
                  </button>
                </div>
                <div className="space-y-3">
                  {(landingConfig.faqs || []).map((faq: any, idx: number) => (
                    <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-indigo-600">FAQ #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = landingConfig.faqs.filter((_: any, i: number) => i !== idx);
                            setLandingConfig({ ...landingConfig, faqs: updated });
                          }}
                          className="text-rose-600 p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => {
                          const updated = [...landingConfig.faqs];
                          updated[idx].question = e.target.value;
                          setLandingConfig({ ...landingConfig, faqs: updated });
                        }}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold"
                      />
                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => {
                          const updated = [...landingConfig.faqs];
                          updated[idx].answer = e.target.value;
                          setLandingConfig({ ...landingConfig, faqs: updated });
                        }}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-ABA 6: CONTATO & MARCA */}
            {landingSubTab === 'contato' && (
              <div className="space-y-4 text-xs bg-white p-6 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">Marca &amp; WhatsApp Comercial</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Nome (Parte 1)</label>
                    <input
                      type="text"
                      value={landingConfig.brand?.nameFirst || ''}
                      onChange={(e) => setLandingConfig({ ...landingConfig, brand: { ...landingConfig.brand, nameFirst: e.target.value } })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-blue-600 mb-1">Nome (Destaque Azul)</label>
                    <input
                      type="text"
                      value={landingConfig.brand?.nameHighlight || ''}
                      onChange={(e) => setLandingConfig({ ...landingConfig, brand: { ...landingConfig.brand, nameHighlight: e.target.value } })}
                      className="w-full p-2.5 border border-blue-300 rounded-xl bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-emerald-700 mb-1">WhatsApp Comercial (com 55 + DDD)</label>
                    <input
                      type="text"
                      placeholder="5511999999999"
                      value={landingConfig.brand?.whatsappNumber || ''}
                      onChange={(e) => setLandingConfig({ ...landingConfig, brand: { ...landingConfig.brand, whatsappNumber: e.target.value } })}
                      className="w-full p-2.5 border border-emerald-300 rounded-xl bg-white font-bold"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: NOVO / EDITAR USUÁRIO MASTER */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Users size={18} className="text-indigo-600"/> {editingAdminId ? 'Editar Admin Master' : 'Novo Admin Master'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveAdmin} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome Completo</label>
                <input required type="text" value={adminForm.name} onChange={e => setAdminForm({...adminForm, name: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">E-mail</label>
                <input required type="email" value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {editingAdminId ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha Provisória'}
                </label>
                <input type="password" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
              </div>
              <button type="submit" className="w-full py-3.5 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors">
                {editingAdminId ? 'Salvar Alterações' : 'Criar Usuário'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}