'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/src/lib/api';
import {
  Building2, Landmark, Compass, HardHat, FileSpreadsheet, Layers,
  Sparkles, Globe, Plus, CheckCircle2, AlertTriangle, Loader2,
  TrendingUp, DollarSign, Wrench, Package, ClipboardList, Eye,
  ExternalLink, Calculator, Percent, ShieldCheck, Box, Home, Send, Edit, Power, X, Save
} from 'lucide-react';

export default function IncorporadoraPage() {
  const [activeTab, setActiveTab] = useState<'viabilidade' | 'engenharia' | 'design_bim' | 'vitrine'>('viabilidade');
  const [isLoading, setIsLoading] = useState(true);

  // Dados Principais
  const [spes, setSpes] = useState<any[]>([]);
  const [landBanks, setLandBanks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Estados de Edição do Terreno (Land Bank Modal)
  const [isLandModalOpen, setIsLandModalOpen] = useState(false);
  const [editingLandId, setEditingLandId] = useState<string | null>(null);
  const [isSavingLand, setIsSavingLand] = useState(false);

  // Sub-abas de Engenharia e Design
  const [engSubTab, setEngSubTab] = useState<'cronograma' | 'curva_abc' | 'medicoes' | 'suprimentos' | 'diario' | 'incc'>('cronograma');
  const [designSubTab, setDesignSubTab] = useState<'personalizacao' | 'bim'>('personalizacao');

  // Formulários: 1. SPE, Terreno (Land Bank) e Novo Empreendimento
  const [speForm, setSpeForm] = useState({ cnpj: '', corporateName: '', tradeName: '', taxRegime: 'RET - Patrimônio de Afetação (4%)', pixKey: '' });
  const [landForm, setLandForm] = useState({
    speId: '', title: '', address: '', neighborhood: '', city: '', state: 'SP',
    areaSqm: '', utilizationCoefficient: '4', acquisitionCost: '', swapPercent: '0',
    estimatedVgv: '', estimatedConstructionCost: '', taxEstimatePercent: '4.0', defaultRiskPercent: '3.0', status: 'EM_ESTUDO', notes: ''
  });
  const [projectForm, setProjectForm] = useState({
    speId: '', landBankId: '', name: '', status: 'LANCAMENTO', address: '', neighborhood: '',
    city: '', state: 'SP', deliveryForecast: '', totalUnits: '40', vgvTotal: ''
  });

  // Formulários: 2. Engenharia (Orçamento ABC, Medição, Compras, RDO, INCC)
  const [budgetForm, setBudgetForm] = useState({
    code: '', stageName: 'Estrutura', itemDescription: '', category: 'Material', unit: 'm³', quantity: '', unitCost: ''
  });
  const [measurementForm, setMeasurementForm] = useState({
    contractorName: '', contractorCnpj: '', serviceDescription: '', periodReference: '', grossAmount: '', retentionPercent: '5', integrateToDre: true
  });
  const [supplyForm, setSupplyForm] = useState({
    materialName: '', unit: 'ton', quantityOrdered: '', supplierName: '', totalAmount: '', status: 'ENTREGUE_NO_CANTEIRO'
  });
  const [diaryForm, setDiaryForm] = useState({
    weatherMorning: 'Sol', weatherAfternoon: 'Sol', workforceCount: '25', activitiesExecuted: '', occurrences: '', photosUrls: '', engineerName: ''
  });
  const [inccPercentInput, setInccPercentInput] = useState('0.65');

  // Formulários: 3. BIM e Kit de Personalização de Unidades
  const [bimForm, setBimForm] = useState({
    discipline: 'Fachada / Exterior', fileName: '', fileFormat: 'IFC', fileUrl: '', version: 'R01',
    clashStatus: 'COMPATIBILIZADO', clashDescription: '', responsibleDesigner: ''
  });
  const [kitOptionForm, setKitOptionForm] = useState({
    category: 'Pisos e Porcelanatos', title: '', specification: '', imageUrl: '', additionalPrice: '', maxStageAllowedPct: '60'
  });
  const [customOrderForm, setCustomOrderForm] = useState({
    unitNumber: '', buyerName: '', buyerDocument: '', contractId: '', selectedOptionIds: [] as string[], approveAndGenerateAddendum: true
  });

  // Estado: 4. Progresso da Obra e Vitrine Pública
  const [progressAndSiteForm, setProgressAndSiteForm] = useState({
    foundationPct: 0, structurePct: 0, masonryPct: 0, installationsPct: 0, facadePct: 0, finishingPct: 0,
    showOnPublicSite: true, customHeadline: '', description: '', heroVideoUrl: '',
    tour360ExteriorUrl: '', tour360DecoratedUrl: '',
    facadeRendersText: '', interiorRendersText: '', floorPlansText: '',
    primaryThemeColor: '#0f172a', accentThemeColor: '#2563eb',
    memorialPiso: '', memorialFachada: '', memorialEsquadrias: '', memorialLoucas: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [resSpes, resLands, resProjects, resContracts, resStore] = await Promise.all([
        api.get('/incorporadoras/spes').catch(() => api.get('/incorporadora/spes')).catch(() => ({ data: [] })),
        api.get('/incorporadoras/land-bank').catch(() => api.get('/incorporadora/land-bank')).catch(() => ({ data: [] })),
        api.get('/incorporadoras/projects').catch(() => api.get('/incorporadora/projects')).catch(() => ({ data: [] })),
        api.get('/contracts').catch(() => ({ data: [] })),
        api.get('/my-store').catch(() => ({ data: {} }))
      ]);

      setSpes(resSpes.data || []);
      setLandBanks(resLands.data || []);
      setProjects(resProjects.data || []);
      setContracts(resContracts.data || []);
      setStoreInfo(resStore.data || {});

      if (resProjects.data?.length > 0 && !selectedProjectId) {
        selectProject(resProjects.data[0]);
      } else if (selectedProjectId) {
        const current = resProjects.data?.find((p: any) => p.id === selectedProjectId);
        if (current) selectProject(current);
      }
    } catch (error) {
      console.error('Erro ao carregar módulo incorporadora:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectProject = (proj: any) => {
    setSelectedProjectId(proj.id);
    const mem = proj.visualMemorialJson || {};
    setProgressAndSiteForm({
      foundationPct: proj.foundationPct || 0,
      structurePct: proj.structurePct || 0,
      masonryPct: proj.masonryPct || 0,
      installationsPct: proj.installationsPct || 0,
      facadePct: proj.facadePct || 0,
      finishingPct: proj.finishingPct || 0,
      showOnPublicSite: proj.showOnPublicSite !== false,
      customHeadline: proj.customHeadline || proj.name || '',
      description: proj.description || '',
      heroVideoUrl: proj.heroVideoUrl || '',
      tour360ExteriorUrl: proj.tour360ExteriorUrl || '',
      tour360DecoratedUrl: proj.tour360DecoratedUrl || '',
      facadeRendersText: (proj.facadeRendersUrls || []).join(', '),
      interiorRendersText: (proj.interiorRendersUrls || []).join(', '),
      floorPlansText: (proj.floorPlansUrls || []).join(', '),
      primaryThemeColor: proj.primaryThemeColor || '#0f172a',
      accentThemeColor: proj.accentThemeColor || '#2563eb',
      memorialPiso: mem.piso || 'Porcelanato Retificado 90x90cm nas áreas sociais e vinílico nos quartos.',
      memorialFachada: mem.fachada || 'Fachada contemporânea com pele de vidro, brises metálicos e revestimento cerâmico.',
      memorialEsquadrias: mem.esquadrias || 'Esquadrias de alumínio linha Gold com persianas integradas nos dormitórios.',
      memorialLoucas: mem.loucas || 'Louças e metais de alto padrão linha Deca/Docol com infraestrutura para aquecimento a gás.'
    });
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  // =========================================================================
  // HANDLERS DE SUBMISSÃO & LAND BANK (EDITAR / HABILITAR / DESABILITAR)
  // =========================================================================
  const handleCreateSpe = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/incorporadoras/spes', speForm).catch(() => api.post('/incorporadora/spes', speForm));
      setSpeForm({ cnpj: '', corporateName: '', tradeName: '', taxRegime: 'RET - Patrimônio de Afetação (4%)', pixKey: '' });
      fetchAllData();
      alert('SPE cadastrada com sucesso!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao criar SPE.');
    }
  };

  const handleOpenLandModal = (land?: any) => {
    if (land) {
      setEditingLandId(land.id);
      setLandForm({
        speId: land.speId || '',
        title: land.title || '',
        address: land.address || '',
        neighborhood: land.neighborhood || '',
        city: land.city || '',
        state: land.state || 'SP',
        areaSqm: land.areaSqm || '',
        utilizationCoefficient: land.utilizationCoefficient || '4',
        acquisitionCost: land.acquisitionCost || '',
        swapPercent: land.swapPercent || '0',
        estimatedVgv: land.estimatedVgv || '',
        estimatedConstructionCost: land.estimatedConstructionCost || '',
        taxEstimatePercent: land.taxEstimatePercent || '4.0',
        defaultRiskPercent: land.defaultRiskPercent || '3.0',
        status: land.status || 'EM_ESTUDO',
        notes: land.notes || ''
      });
    } else {
      setEditingLandId(null);
      setLandForm({
        speId: '', title: '', address: '', neighborhood: '', city: '', state: 'SP',
        areaSqm: '', utilizationCoefficient: '4', acquisitionCost: '', swapPercent: '0',
        estimatedVgv: '', estimatedConstructionCost: '', taxEstimatePercent: '4.0', defaultRiskPercent: '3.0', status: 'EM_ESTUDO', notes: ''
      });
    }
    setIsLandModalOpen(true);
  };

  const handleSaveLandBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLand(true);
    try {
      if (editingLandId) {
        await api.put(`/incorporadoras/land-bank/${editingLandId}`, landForm).catch(() => api.put(`/incorporadora/land-bank/${editingLandId}`, landForm));
        alert('Terreno atualizado com sucesso!');
      } else {
        await api.post('/incorporadoras/land-bank', landForm).catch(() => api.post('/incorporadora/land-bank', landForm));
        alert('Terreno e Estudo de Viabilidade registrados com sucesso!');
      }
      setIsLandModalOpen(false);
      fetchAllData();
    } catch (err) {
      alert('Erro ao salvar terreno no Land Bank.');
    } finally {
      setIsSavingLand(false);
    }
  };

  const handleToggleLandStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'APROVADO' ? 'EM_ESTUDO' : 'APROVADO';
    if (!confirm(`Deseja alterar o status deste terreno para ${newStatus}?`)) return;
    try {
      await api.patch(`/incorporadoras/land-bank/${id}/status`, { status: newStatus }).catch(() => api.put(`/incorporadora/land-bank/${id}`, { status: newStatus }));
      fetchAllData();
    } catch (err) {
      alert('Erro ao atualizar status do terreno.');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/incorporadoras/projects', projectForm).catch(() => api.post('/incorporadora/projects', projectForm));
      setProjectForm({
        speId: '', landBankId: '', name: '', status: 'LANCAMENTO', address: '', neighborhood: '',
        city: '', state: 'SP', deliveryForecast: '', totalUnits: '40', vgvTotal: ''
      });
      await fetchAllData();
      if (res.data?.id) setSelectedProjectId(res.data.id);
      alert('Empreendimento criado com sucesso!');
    } catch (err) {
      alert('Erro ao criar empreendimento.');
    }
  };

  const handleSaveProgressAndSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      const payload = {
        foundationPct: Number(progressAndSiteForm.foundationPct),
        structurePct: Number(progressAndSiteForm.structurePct),
        masonryPct: Number(progressAndSiteForm.masonryPct),
        installationsPct: Number(progressAndSiteForm.installationsPct),
        facadePct: Number(progressAndSiteForm.facadePct),
        finishingPct: Number(progressAndSiteForm.finishingPct),
        showOnPublicSite: progressAndSiteForm.showOnPublicSite,
        customHeadline: progressAndSiteForm.customHeadline,
        description: progressAndSiteForm.description,
        heroVideoUrl: progressAndSiteForm.heroVideoUrl,
        tour360ExteriorUrl: progressAndSiteForm.tour360ExteriorUrl,
        tour360DecoratedUrl: progressAndSiteForm.tour360DecoratedUrl,
        facadeRendersUrls: progressAndSiteForm.facadeRendersText.split(',').map(s => s.trim()).filter(Boolean),
        interiorRendersUrls: progressAndSiteForm.interiorRendersText.split(',').map(s => s.trim()).filter(Boolean),
        floorPlansUrls: progressAndSiteForm.floorPlansText.split(',').map(s => s.trim()).filter(Boolean),
        primaryThemeColor: progressAndSiteForm.primaryThemeColor,
        accentThemeColor: progressAndSiteForm.accentThemeColor,
        visualMemorialJson: {
          piso: progressAndSiteForm.memorialPiso,
          fachada: progressAndSiteForm.memorialFachada,
          esquadrias: progressAndSiteForm.memorialEsquadrias,
          loucas: progressAndSiteForm.memorialLoucas
        }
      };
      await api.put(`/incorporadoras/projects/${selectedProject.id}`, payload).catch(() => api.put(`/incorporadora/projects/${selectedProject.id}`, payload));
      fetchAllData();
      alert('Cronograma Físico e Vitrine Pública atualizados com sucesso!');
    } catch (err) {
      alert('Erro ao atualizar dados do empreendimento.');
    }
  };

  const handleAddBudgetItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      await api.post(`/incorporadoras/projects/${selectedProject.id}/budget-items`, budgetForm).catch(() => api.post(`/incorporadora/projects/${selectedProject.id}/budget-items`, budgetForm));
      setBudgetForm({ code: '', stageName: 'Estrutura', itemDescription: '', category: 'Material', unit: 'm³', quantity: '', unitCost: '' });
      fetchAllData();
    } catch (err) {
      alert('Erro ao adicionar item de orçamento.');
    }
  };

  const handleAddMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      await api.post(`/incorporadoras/projects/${selectedProject.id}/measurements`, measurementForm).catch(() => api.post(`/incorporadora/projects/${selectedProject.id}/measurements`, measurementForm));
      setMeasurementForm({ contractorName: '', contractorCnpj: '', serviceDescription: '', periodReference: '', grossAmount: '', retentionPercent: '5', integrateToDre: true });
      fetchAllData();
      alert('Medição registrada! Despesa lançada automaticamente no DRE.');
    } catch (err) {
      alert('Erro ao registrar medição.');
    }
  };

  const handleAddSupplyOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      await api.post(`/incorporadoras/projects/${selectedProject.id}/supply-orders`, supplyForm).catch(() => api.post(`/incorporadora/projects/${selectedProject.id}/supply-orders`, supplyForm));
      setSupplyForm({ materialName: '', unit: 'ton', quantityOrdered: '', supplierName: '', totalAmount: '', status: 'ENTREGUE_NO_CANTEIRO' });
      fetchAllData();
    } catch (err) {
      alert('Erro ao registrar compra/suprimento.');
    }
  };

  const handleAddWorkDiary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      const payload = {
        ...diaryForm,
        photosUrls: diaryForm.photosUrls.split(',').map(s => s.trim()).filter(Boolean)
      };
      await api.post(`/incorporadoras/projects/${selectedProject.id}/work-diaries`, payload).catch(() => api.post(`/incorporadora/projects/${selectedProject.id}/work-diaries`, payload));
      setDiaryForm({ weatherMorning: 'Sol', weatherAfternoon: 'Sol', workforceCount: '25', activitiesExecuted: '', occurrences: '', photosUrls: '', engineerName: '' });
      fetchAllData();
      alert('Diário de Obra (RDO) salvo com sucesso!');
    } catch (err) {
      alert('Erro ao salvar Diário de Obra.');
    }
  };

  const handleApplyIncc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      const res = await api.post(`/incorporadoras/projects/${selectedProject.id}/apply-incc`, { inccPercent: inccPercentInput }).catch(() => api.post(`/incorporadora/projects/${selectedProject.id}/apply-incc`, { inccPercent: inccPercentInput }));
      fetchAllData();
      alert(res.data?.message || 'INCC aplicado com sucesso!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao aplicar INCC.');
    }
  };

  const handleAddBimFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      await api.post(`/incorporadoras/projects/${selectedProject.id}/bim-files`, bimForm).catch(() => api.post(`/incorporadora/projects/${selectedProject.id}/bim-files`, bimForm));
      setBimForm({
        discipline: 'Fachada / Exterior', fileName: '', fileFormat: 'IFC', fileUrl: '', version: 'R01',
        clashStatus: 'COMPATIBILIZADO', clashDescription: '', responsibleDesigner: ''
      });
      fetchAllData();
      alert('Arquivo BIM / Planta adicionado ao repositório com controle de revisão!');
    } catch (err) {
      alert('Erro ao subir arquivo BIM.');
    }
  };

  const handleAddKitOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      await api.post(`/incorporadoras/projects/${selectedProject.id}/customization-options`, kitOptionForm).catch(() => api.post(`/incorporadora/projects/${selectedProject.id}/customization-options`, kitOptionForm));
      setKitOptionForm({ category: 'Pisos e Porcelanatos', title: '', specification: '', imageUrl: '', additionalPrice: '', maxStageAllowedPct: '60' });
      fetchAllData();
      alert('Kit de Acabamento adicionado ao catálogo do empreendimento!');
    } catch (err) {
      alert('Erro ao cadastrar kit.');
    }
  };

  const handleToggleKitSelection = (optionId: string) => {
    setCustomOrderForm(prev => {
      const exists = prev.selectedOptionIds.includes(optionId);
      return {
        ...prev,
        selectedOptionIds: exists
          ? prev.selectedOptionIds.filter(id => id !== optionId)
          : [...prev.selectedOptionIds, optionId]
      };
    });
  };

  const handleCreateCustomOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    if (customOrderForm.selectedOptionIds.length === 0) {
      alert('Selecione pelo menos 1 Kit/Acabamento para gerar o pedido e a Ordem de Serviço.');
      return;
    }
    try {
      await api.post(`/incorporadoras/projects/${selectedProject.id}/customization-orders`, customOrderForm).catch(() => api.post(`/incorporadora/projects/${selectedProject.id}/customization-orders`, customOrderForm));
      setCustomOrderForm({ unitNumber: '', buyerName: '', buyerDocument: '', contractId: '', selectedOptionIds: [], approveAndGenerateAddendum: true });
      fetchAllData();
      alert('Personalização registrada! Aditivo financeiro calculado e Ordem de Serviço (OS) enviada para o canteiro de obras.');
    } catch (err) {
      alert('Erro ao gerar personalização da unidade.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  const publicShowcaseUrl = storeInfo?.slug
    ? `/loja/${storeInfo.slug}/incorporadora`
    : '#';

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto font-sans space-y-6 pb-20">
      
      {/* CABEÇALHO PRINCIPAL CLARO + CONTROLES ALINHADOS DENTRO DO CARD */}
      <div className="bg-white text-slate-800 p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="max-w-2xl">
          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
            ERP Incorporação & Construção Civil
          </span>
          <h1 className="text-2xl md:text-3xl font-black mt-3 flex items-center gap-3 text-slate-800">
            <Building2 className="text-blue-600 bg-blue-50 p-2 rounded-xl shrink-0" size={40} />
            Módulo Incorporadora, Engenharia & BIM
          </h1>
          <p className="text-slate-500 text-sm mt-1.5">
            Land Bank, Viabilidade Econômica, Múltiplas SPEs, Curva ABC, Diário de Obra, Personalização de Unidades e Vitrine 360°.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-start xl:justify-end">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 min-w-[220px] flex-1 sm:flex-none">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Empreendimento Ativo</label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                const found = projects.find(p => p.id === e.target.value);
                if (found) selectProject(found);
              }}
              className="bg-transparent text-slate-800 font-bold text-sm outline-none pr-2 py-0.5 w-full cursor-pointer"
            >
              {projects.length === 0 && <option value="">Nenhum empreendimento</option>}
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  🏗️ {p.name} ({p.overallProgressPct || 0}% concluído)
                </option>
              ))}
            </select>
          </div>

          <Link
            href="/imobiliaria/incorporadoras/simulador"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all whitespace-nowrap"
          >
            <Calculator size={16} /> Simulador de Crédito
          </Link>

          {storeInfo?.slug && (
            <a
              href={publicShowcaseUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all whitespace-nowrap"
            >
              <Globe size={16} /> Ver Página da Incorporadora <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>

      {/* NAVEGAÇÃO PRINCIPAL DO MÓDULO */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'viabilidade', label: '1. SPEs, Land Bank & Viabilidade', icon: Landmark },
          { id: 'engenharia', label: '2. Engenharia, Curva ABC & Obra', icon: HardHat },
          { id: 'design_bim', label: '3. Design Exterior/Interior, BIM & Kit Opções', icon: Layers },
          { id: 'vitrine', label: '4. CRM Visual, Tour 360° & Página do Site', icon: Sparkles },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs transition-all ${
                active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: SPEs, LAND BANK & ESTUDO DE VIABILIDADE ECONÔMICA                   */}
      {/* ========================================================================= */}
      {activeTab === 'viabilidade' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* BLOCO A: MÚLTIPLAS EMPRESAS (SPEs) E LANÇAMENTO DE EMPREENDIMENTO */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Cadastro de SPE */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldCheck className="text-blue-600" size={20} /> Suporte a Múltiplas Empresas (SPEs / Patrimônio de Afetação)
              </h2>
              <form onSubmit={handleCreateSpe} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">CNPJ Isolado da SPE *</label>
                  <input required type="text" placeholder="00.000.000/0001-00" value={speForm.cnpj} onChange={e => setSpeForm({ ...speForm, cnpj: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Nome Fantasia da SPE *</label>
                  <input required type="text" placeholder="Ex: SPE Residencial Aurora" value={speForm.tradeName} onChange={e => setSpeForm({ ...speForm, tradeName: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Razão Social *</label>
                  <input required type="text" placeholder="Aurora Incorporações SPE Ltda" value={speForm.corporateName} onChange={e => setSpeForm({ ...speForm, corporateName: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Regime Tributário</label>
                  <select value={speForm.taxRegime} onChange={e => setSpeForm({ ...speForm, taxRegime: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white">
                    <option value="RET - Patrimônio de Afetação (4%)">RET - Patrimônio de Afetação (4%)</option>
                    <option value="RET - Minha Casa Minha Vida (1%)">RET - Habitação Popular (1%)</option>
                    <option value="Lucro Presumido">Lucro Presumido</option>
                  </select>
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm">
                    <Plus size={15} /> Cadastrar CNPJ de SPE
                  </button>
                </div>
              </form>

              <div className="pt-2 space-y-2 max-h-40 overflow-y-auto">
                {spes.map(s => (
                  <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{s.tradeName}</p>
                      <p className="text-slate-500">CNPJ: {s.cnpj} • {s.taxRegime}</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold text-[10px]">SPE Ativa</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Criar Novo Empreendimento / Obra */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building2 className="text-indigo-600" size={20} /> Lançar Novo Empreendimento / Obra
              </h2>
              <form onSubmit={handleCreateProject} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-600 mb-1">Nome Comercial do Empreendimento *</label>
                  <input required type="text" placeholder="Ex: Infinity Tower Residence" value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Vincular à SPE</label>
                  <select value={projectForm.speId} onChange={e => setProjectForm({ ...projectForm, speId: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white">
                    <option value="">Selecione a SPE...</option>
                    {spes.map(s => <option key={s.id} value={s.id}>{s.tradeName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Vincular ao Terreno (Land Bank)</label>
                  <select value={projectForm.landBankId} onChange={e => setProjectForm({ ...projectForm, landBankId: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white">
                    <option value="">Opcional...</option>
                    {landBanks.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Total de Unidades (Aptos/Lotes)</label>
                  <input required type="number" value={projectForm.totalUnits} onChange={e => setProjectForm({ ...projectForm, totalUnits: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">VGV Total Projetado (R$)</label>
                  <input required type="number" placeholder="25000000" value={projectForm.vgvTotal} onChange={e => setProjectForm({ ...projectForm, vgvTotal: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Endereço / Bairro *</label>
                  <input required type="text" placeholder="Av. Principal, 1000 - Jardins" value={projectForm.address} onChange={e => setProjectForm({ ...projectForm, address: e.target.value, neighborhood: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Cidade *</label>
                  <input required type="text" placeholder="São Paulo" value={projectForm.city} onChange={e => setProjectForm({ ...projectForm, city: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl" />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm">
                    <Plus size={15} /> Criar Empreendimento
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* BLOCO B: LAND BANK & SIMULADOR DE VIABILIDADE ECONÔMICA */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Compass className="text-emerald-600" size={22} /> Banco de Terrenos (Land Bank) & Simulador de Viabilidade Econômica
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Simule o potencial construtivo, permuta, VGV e margem antes de comprar o terreno.
                </p>
              </div>
              <button
                onClick={() => handleOpenLandModal()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus size={16} /> Novo Terreno
              </button>
            </div>

            {/* Tabela de Terrenos com Ações de Editar, Habilitar e Desabilitar */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Terreno / SPE</th>
                    <th className="p-3.5">Potencial Construtivo</th>
                    <th className="p-3.5">VGV Projetado</th>
                    <th className="p-3.5">Aquisição + Obra</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5">Margem Líquida</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {landBanks.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-slate-400">Nenhum terreno cadastrado no Land Bank.</td></tr>
                  ) : (
                    landBanks.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900">{l.title}</p>
                          <p className="text-slate-400">{l.city} {l.spe ? `• ${l.spe.tradeName}` : ''}</p>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-indigo-700">{l.buildableAreaSqm} m² construíveis</span>
                          <p className="text-slate-400">Terreno: {l.areaSqm} m² (CA {l.utilizationCoefficient}x)</p>
                        </td>
                        <td className="p-3.5 font-black text-emerald-700">{formatCurrency(l.estimatedVgv)}</td>
                        <td className="p-3.5 text-rose-600 font-bold">{formatCurrency(l.acquisitionCost + l.estimatedConstructionCost)}</td>
                        <td className="p-3.5 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            l.status === 'APROVADO' ? 'bg-emerald-100 text-emerald-800' :
                            l.status === 'DESCARTADO' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {l.status || 'EM_ESTUDO'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-3 py-1 rounded-full font-black text-xs ${l.projectedMarginPercent >= 20 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {l.projectedMarginPercent}% Margem
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenLandModal(l)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                            title="Editar Terreno"
                          >
                            <Edit size={14} /> Editar
                          </button>
                          <button
                            onClick={() => handleToggleLandStatus(l.id, l.status)}
                            className={`px-3 py-1.5 rounded-lg transition-colors font-bold inline-flex items-center gap-1 ${
                              l.status === 'APROVADO' ? 'bg-amber-50 hover:bg-amber-100 text-amber-700' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                            title={l.status === 'APROVADO' ? 'Desativar / Colocar em Estudo' : 'Aprovar / Habilitar Terreno'}
                          >
                            <Power size={14} /> {l.status === 'APROVADO' ? 'Desativar' : 'Habilitar'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CADASTRO / EDIÇÃO DE TERRENO (LAND BANK)                         */}
      {/* ========================================================================= */}
      {isLandModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Compass className="text-emerald-600" size={20} /> {editingLandId ? 'Editar Terreno (Land Bank)' : 'Novo Terreno & Viabilidade'}
              </h2>
              <button onClick={() => setIsLandModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2"><X size={20}/></button>
            </div>

            <form onSubmit={handleSaveLandBank} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Identificação da Área / Terreno *</label>
                  <input required type="text" placeholder="Ex: Terreno Esquina Quadra 14 - Zona Sul" value={landForm.title} onChange={e => setLandForm({ ...landForm, title: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cidade / Bairro *</label>
                  <input required type="text" placeholder="São Paulo - Moema" value={landForm.city} onChange={e => setLandForm({ ...landForm, city: e.target.value, neighborhood: e.target.value, address: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SPE Vinculada</label>
                  <select value={landForm.speId} onChange={e => setLandForm({ ...landForm, speId: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white">
                    <option value="">Sem SPE definida</option>
                    {spes.map(s => <option key={s.id} value={s.id}>{s.tradeName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Área do Terreno (m²) *</label>
                  <input required type="number" step="0.01" value={landForm.areaSqm} onChange={e => setLandForm({ ...landForm, areaSqm: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Coef. Aproveitamento (CA)</label>
                  <input required type="number" step="0.1" value={landForm.utilizationCoefficient} onChange={e => setLandForm({ ...landForm, utilizationCoefficient: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Custo Aquisição Terreno (R$)</label>
                  <input required type="number" step="0.01" value={landForm.acquisitionCost} onChange={e => setLandForm({ ...landForm, acquisitionCost: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Permuta c/ Terreneiro (%)</label>
                  <input type="number" step="0.5" value={landForm.swapPercent} onChange={e => setLandForm({ ...landForm, swapPercent: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-emerald-700 mb-1">VGV Projetado (R$) *</label>
                  <input required type="number" step="0.01" value={landForm.estimatedVgv} onChange={e => setLandForm({ ...landForm, estimatedVgv: e.target.value })} className="w-full p-2.5 border border-emerald-400 rounded-xl bg-white font-bold" />
                </div>
                <div>
                  <label className="block font-bold text-rose-700 mb-1">Custo Estimado de Obra (R$) *</label>
                  <input required type="number" step="0.01" value={landForm.estimatedConstructionCost} onChange={e => setLandForm({ ...landForm, estimatedConstructionCost: e.target.value })} className="w-full p-2.5 border border-rose-300 rounded-xl bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status da Área</label>
                  <select value={landForm.status} onChange={e => setLandForm({ ...landForm, status: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold">
                    <option value="EM_ESTUDO">Em Estudo</option>
                    <option value="APROVADO">Aprovado / Habilitado</option>
                    <option value="CONVERTIDO_EM_OBRA">Convertido em Obra</option>
                    <option value="DESCARTADO">Descartado</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setIsLandModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={isSavingLand} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-2">
                  {isSavingLand ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar Terreno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: ENGENHARIA, CURVA ABC, MEDIÇÕES, SUPRIMENTOS, RDO E INCC           */}
      {/* ========================================================================= */}
      {activeTab === 'engenharia' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {!selectedProject ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500">
              Cadastre ou selecione um Empreendimento no topo da página para gerenciar a engenharia e a obra.
            </div>
          ) : (
            <>
              {/* Sub-menu da Engenharia */}
              <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200">
                {[
                  { id: 'cronograma', label: 'Cronograma Físico-Financeiro' },
                  { id: 'curva_abc', label: `Orçamento & Curva ABC (${selectedProject.budgetItems?.length || 0})` },
                  { id: 'medicoes', label: `Medições de Empreiteiros (${selectedProject.measurements?.length || 0})` },
                  { id: 'suprimentos', label: `Suprimentos & Estoque (${selectedProject.supplyOrders?.length || 0})` },
                  { id: 'diario', label: `Diário de Obra / RDO (${selectedProject.workDiaries?.length || 0})` },
                  { id: 'incc', label: 'Carteira & Reajuste INCC' },
                ].map(st => (
                  <button
                    key={st.id}
                    onClick={() => setEngSubTab(st.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      engSubTab === st.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* 2.1 CRONOGRAMA FÍSICO-FINANCEIRO */}
              {engSubTab === 'cronograma' && (
                <form onSubmit={handleSaveProgressAndSite} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Avanço Físico-Financeiro da Obra: {selectedProject.name}</h3>
                      <p className="text-xs text-slate-500">Atualize os percentuais executados de cada etapa. Esses indicadores aparecem ao vivo no Portal do Cliente e na Vitrine Pública.</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs uppercase font-bold text-slate-400 block">Progresso Geral</span>
                      <span className="text-3xl font-black text-blue-600">{selectedProject.overallProgressPct || 0}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { key: 'foundationPct', label: '1. Terraplenagem & Fundação (%)' },
                      { key: 'structurePct', label: '2. Supraestrutura / Concreto (%)' },
                      { key: 'masonryPct', label: '3. Alvenaria & Vedação (%)' },
                      { key: 'installationsPct', label: '4. Instalações Elétricas / Hidráulicas (%)' },
                      { key: 'facadePct', label: '5. Fachada & Design Exterior (%)' },
                      { key: 'finishingPct', label: '6. Acabamentos & Design de Interiores (%)' },
                    ].map(stage => (
                      <div key={stage.key} className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                          <span>{stage.label}</span>
                          <span className="text-blue-600">{(progressAndSiteForm as any)[stage.key]}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={(progressAndSiteForm as any)[stage.key]}
                          onChange={e => setProgressAndSiteForm({ ...progressAndSiteForm, [stage.key]: Number(e.target.value) })}
                          className="w-full accent-blue-600 cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-sm">
                      Salvar Avanço Físico da Obra
                    </button>
                  </div>
                </form>
              )}

              {/* 2.2 ORÇAMENTO DE OBRA & CURVA ABC */}
              {engSubTab === 'curva_abc' && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Orçamento Executivo & Curva ABC de Insumos</h3>
                    <p className="text-xs text-slate-500">O sistema classifica automaticamente os insumos em Classe A (80% do impacto financeiro), B (15%) e C (5%).</p>
                  </div>

                  <form onSubmit={handleAddBudgetItem} className="grid grid-cols-1 sm:grid-cols-6 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs items-end">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Etapa</label>
                      <select value={budgetForm.stageName} onChange={e => setBudgetForm({ ...budgetForm, stageName: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white">
                        <option value="Fundação">Fundação</option>
                        <option value="Estrutura">Estrutura</option>
                        <option value="Alvenaria">Alvenaria</option>
                        <option value="Instalações">Instalações</option>
                        <option value="Fachada">Fachada</option>
                        <option value="Interiores">Acabamentos / Interiores</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-600 mb-1">Insumo / Serviço (SINAPI)</label>
                      <input required type="text" placeholder="Ex: Aço CA-50 / Concreto FCK 35" value={budgetForm.itemDescription} onChange={e => setBudgetForm({ ...budgetForm, itemDescription: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Qtd ({budgetForm.unit})</label>
                      <input required type="number" step="0.01" value={budgetForm.quantity} onChange={e => setBudgetForm({ ...budgetForm, quantity: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Custo Unit. (R$)</label>
                      <input required type="number" step="0.01" value={budgetForm.unitCost} onChange={e => setBudgetForm({ ...budgetForm, unitCost: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                    </div>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm">
                      + Insumo ABC
                    </button>
                  </form>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                        <tr>
                          <th className="p-3.5">Curva ABC</th>
                          <th className="p-3.5">Etapa</th>
                          <th className="p-3.5">Insumo / Serviço</th>
                          <th className="p-3.5">Quantidade</th>
                          <th className="p-3.5">Custo Unitário</th>
                          <th className="p-3.5">Custo Total Planejado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(selectedProject.budgetItems || []).map((item: any) => (
                          <tr key={item.id}>
                            <td className="p-3.5">
                              <span className={`px-2.5 py-1 rounded-full font-black text-[11px] ${
                                item.abcClass === 'A' ? 'bg-rose-100 text-rose-800' : item.abcClass === 'B' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                Classe {item.abcClass}
                              </span>
                            </td>
                            <td className="p-3.5 font-bold">{item.stageName}</td>
                            <td className="p-3.5 text-slate-900 font-bold">{item.itemDescription}</td>
                            <td className="p-3.5">{item.quantity} {item.unit}</td>
                            <td className="p-3.5">{formatCurrency(item.unitCost)}</td>
                            <td className="p-3.5 font-black text-slate-900">{formatCurrency(item.totalPlannedCost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 2.3 MEDIÇÕES DE EMPREITEIROS */}
              {engSubTab === 'medicoes' && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Medições de Empreiteiros & Retenção Contratual</h3>
                    <p className="text-xs text-slate-500">Aprove medições de serviços executados, retenha a caução de garantia e envie o valor líquido direto para o DRE da imobiliária/incorporadora.</p>
                  </div>

                  <form onSubmit={handleAddMeasurement} className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs items-end">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Empreiteira *</label>
                      <input required type="text" placeholder="Construtora Alfa Ltda" value={measurementForm.contractorName} onChange={e => setMeasurementForm({ ...measurementForm, contractorName: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-600 mb-1">Serviço Medido *</label>
                      <input required type="text" placeholder="Medição #02 - Armação e Concretagem Laje 4" value={measurementForm.serviceDescription} onChange={e => setMeasurementForm({ ...measurementForm, serviceDescription: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Valor Bruto (R$) *</label>
                      <input required type="number" step="0.01" value={measurementForm.grossAmount} onChange={e => setMeasurementForm({ ...measurementForm, grossAmount: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Retenção Caução (%)</label>
                      <input required type="number" step="0.5" value={measurementForm.retentionPercent} onChange={e => setMeasurementForm({ ...measurementForm, retentionPercent: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                    </div>
                    <div className="sm:col-span-5 flex justify-between items-center pt-2">
                      <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={measurementForm.integrateToDre} onChange={e => setMeasurementForm({ ...measurementForm, integrateToDre: e.target.checked })} className="w-4 h-4 accent-blue-600" />
                        Lançar automaticamente como Despesa Paga no DRE da Empresa
                      </label>
                      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm">
                        Aprovar Medição
                      </button>
                    </div>
                  </form>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                        <tr>
                          <th className="p-3.5">Empreiteiro</th>
                          <th className="p-3.5">Serviço Executado</th>
                          <th className="p-3.5">Valor Bruto</th>
                          <th className="p-3.5">Retenção Contratual</th>
                          <th className="p-3.5">Líquido Liberado</th>
                          <th className="p-3.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(selectedProject.measurements || []).map((m: any) => (
                          <tr key={m.id}>
                            <td className="p-3.5 font-bold text-slate-900">{m.contractorName}</td>
                            <td className="p-3.5">{m.serviceDescription}</td>
                            <td className="p-3.5">{formatCurrency(m.grossAmount)}</td>
                            <td className="p-3.5 text-amber-700 font-bold">-{formatCurrency(m.retentionAmount)} ({m.retentionPercent}%)</td>
                            <td className="p-3.5 font-black text-emerald-700">{formatCurrency(m.netAmount)}</td>
                            <td className="p-3.5"><span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold text-[10px]">{m.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 2.4 SUPRIMENTOS E ESTOQUE DE CANTEIRO */}
              {engSubTab === 'suprimentos' && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  <h3 className="text-lg font-bold text-slate-800">Suprimentos, Ordens de Compra & Estoque no Canteiro</h3>
                  <form onSubmit={handleAddSupplyOrder} className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs items-end">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-600 mb-1">Material / Insumo *</label>
                      <input required type="text" placeholder="Ex: Cimento CP-II 50kg / Porcelanato" value={supplyForm.materialName} onChange={e => setSupplyForm({ ...supplyForm, materialName: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Quantidade</label>
                      <input required type="number" step="0.01" value={supplyForm.quantityOrdered} onChange={e => setSupplyForm({ ...supplyForm, quantityOrdered: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Fornecedor & Valor Total (R$)</label>
                      <div className="flex gap-1">
                        <input required type="text" placeholder="Fornecedor" value={supplyForm.supplierName} onChange={e => setSupplyForm({ ...supplyForm, supplierName: e.target.value })} className="w-1/2 p-2.5 border border-slate-300 rounded-xl bg-white" />
                        <input required type="number" placeholder="R$" value={supplyForm.totalAmount} onChange={e => setSupplyForm({ ...supplyForm, totalAmount: e.target.value })} className="w-1/2 p-2.5 border border-slate-300 rounded-xl bg-white" />
                      </div>
                    </div>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm">
                      Emitir OC / Estoque
                    </button>
                  </form>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                        <tr>
                          <th className="p-3.5">Material</th>
                          <th className="p-3.5">Fornecedor</th>
                          <th className="p-3.5">Qtd Comprada</th>
                          <th className="p-3.5">Saldo no Canteiro</th>
                          <th className="p-3.5">Valor da Ordem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(selectedProject.supplyOrders || []).map((s: any) => (
                          <tr key={s.id}>
                            <td className="p-3.5 font-bold text-slate-900">{s.materialName}</td>
                            <td className="p-3.5">{s.supplierName}</td>
                            <td className="p-3.5">{s.quantityOrdered} {s.unit}</td>
                            <td className="p-3.5 font-bold text-blue-600">{s.quantityInStock} {s.unit} em estoque</td>
                            <td className="p-3.5 font-bold">{formatCurrency(s.totalAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 2.5 DIÁRIO DE OBRA (RDO) */}
              {engSubTab === 'diario' && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  <h3 className="text-lg font-bold text-slate-800">Diário de Obra (RDO) & Relatório Fotográfico</h3>
                  <form onSubmit={handleAddWorkDiary} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Clima Manhã / Tarde</label>
                      <div className="flex gap-2">
                        <select value={diaryForm.weatherMorning} onChange={e => setDiaryForm({ ...diaryForm, weatherMorning: e.target.value })} className="w-1/2 p-2.5 border border-slate-300 rounded-xl bg-white">
                          <option value="Sol">☀️ Sol</option>
                          <option value="Nublado">⛅ Nublado</option>
                          <option value="Chuva">🌧️ Chuva</option>
                        </select>
                        <select value={diaryForm.weatherAfternoon} onChange={e => setDiaryForm({ ...diaryForm, weatherAfternoon: e.target.value })} className="w-1/2 p-2.5 border border-slate-300 rounded-xl bg-white">
                          <option value="Sol">☀️ Sol</option>
                          <option value="Nublado">⛅ Nublado</option>
                          <option value="Chuva">🌧️ Chuva</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Operários no Canteiro</label>
                      <input required type="number" value={diaryForm.workforceCount} onChange={e => setDiaryForm({ ...diaryForm, workforceCount: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-600 mb-1">Engenheiro Responsável (ART/RRT)</label>
                      <input type="text" placeholder="Eng. Carlos Mendes - CREA 123456" value={diaryForm.engineerName} onChange={e => setDiaryForm({ ...diaryForm, engineerName: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-600 mb-1">Atividades Executadas no Dia *</label>
                      <input required type="text" placeholder="Concretagem dos pilares do 6º pavimento e início da alvenaria do 3º andar" value={diaryForm.activitiesExecuted} onChange={e => setDiaryForm({ ...diaryForm, activitiesExecuted: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-600 mb-1">Links das Fotos do Canteiro (separados por vírgula)</label>
                      <input type="text" placeholder="https://foto1.jpg, https://foto2.jpg" value={diaryForm.photosUrls} onChange={e => setDiaryForm({ ...diaryForm, photosUrls: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                    </div>
                    <div className="sm:col-span-4 flex justify-end">
                      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm">
                        Registrar Diário de Obra
                      </button>
                    </div>
                  </form>

                  <div className="space-y-3">
                    {(selectedProject.workDiaries || []).map((d: any) => (
                      <div key={d.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/60 flex flex-col sm:flex-row justify-between gap-4 text-xs">
                        <div>
                          <span className="font-black text-slate-800">{new Date(d.date).toLocaleDateString('pt-BR')}</span>
                          <span className="ml-3 text-slate-500">Clima: {d.weatherMorning} / {d.weatherAfternoon} • 👷 {d.workforceCount} operários</span>
                          <p className="mt-1.5 text-slate-700 font-medium">{d.activitiesExecuted}</p>
                        </div>
                        <span className="text-slate-400 font-bold self-start">{d.engineerName || 'Engenharia'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2.6 CARTEIRA DE RECEBÍVEIS & REAJUSTE INCC */}
              {engSubTab === 'incc' && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 max-w-2xl">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Percent className="text-blue-600" size={20} /> Correção Monetária da Carteira de Recebíveis (INCC)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Aplique a variação mensal do Índice Nacional de Custo da Construção (INCC-DI / INCC-M) sobre todas as parcelas em aberto dos contratos de compra e venda na planta.
                  </p>
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-xs text-blue-900 font-bold">
                    INCC Acumulado neste Empreendimento: {selectedProject.accumulatedInccPercent || 0}%
                  </div>
                  <form onSubmit={handleApplyIncc} className="flex items-end gap-3 pt-2">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Índice INCC do Mês (%)</label>
                      <input required type="number" step="0.01" value={inccPercentInput} onChange={e => setInccPercentInput(e.target.value)} className="w-full p-3 border border-slate-300 rounded-xl text-sm font-bold" />
                    </div>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3.5 rounded-xl shadow-md">
                      Aplicar Reajuste INCC na Carteira
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: DESIGN EXTERIOR/INTERIOR, BIM & PERSONALIZAÇÃO DE UNIDADES          */}
      {/* ========================================================================= */}
      {activeTab === 'design_bim' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {!selectedProject ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500">
              Selecione um Empreendimento no topo para gerenciar os Kits de Personalização e Projetos BIM.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200 w-fit">
                <button
                  onClick={() => setDesignSubTab('personalizacao')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    designSubTab === 'personalizacao' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  1. Personalização de Unidades (Kit Opções + Aditivo + OS Obra)
                </button>
                <button
                  onClick={() => setDesignSubTab('bim')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    designSubTab === 'bim' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  2. Repositório BIM, Fachada/Interiores & Compatibilização ({selectedProject.bimFiles?.length || 0})
                </button>
              </div>

              {/* 3.1 KIT OPÇÕES / CUSTOMIZAÇÃO DE UNIDADES -> ADITIVO + OS ENGENHARIA */}
              {designSubTab === 'personalizacao' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Coluna Esquerda: Catálogo de Kits de Acabamento */}
                  <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                    <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
                      Catálogo de Kits & Acabamentos Opcionais
                    </h3>
                    <form onSubmit={handleAddKitOption} className="space-y-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">Categoria</label>
                          <select value={kitOptionForm.category} onChange={e => setKitOptionForm({ ...kitOptionForm, category: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white">
                            <option value="Pisos e Porcelanatos">Pisos e Porcelanatos</option>
                            <option value="Bancadas e Marmoraria">Bancadas e Marmoraria</option>
                            <option value="Louças e Metais">Louças e Metais</option>
                            <option value="Iluminação e Gesso">Iluminação e Gesso</option>
                            <option value="Automação Residencial">Automação Residencial</option>
                            <option value="Planta Flexível">Planta Flexível / Reversível</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">Valor Adicional (R$) *</label>
                          <input required type="number" step="0.01" placeholder="14500" value={kitOptionForm.additionalPrice} onChange={e => setKitOptionForm({ ...kitOptionForm, additionalPrice: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                        </div>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">Título do Kit / Upgrade *</label>
                        <input required type="text" placeholder="Ex: Kit Bancada Quartzo Branco + Cuba Gourmet Inox" value={kitOptionForm.title} onChange={e => setKitOptionForm({ ...kitOptionForm, title: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">Especificação Técnica (Para o Canteiro) *</label>
                        <input required type="text" placeholder="Pedra Quartzo Kensho 2cm, misturador monocomando Docol..." value={kitOptionForm.specification} onChange={e => setKitOptionForm({ ...kitOptionForm, specification: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">URL da Imagem / Render do Acabamento</label>
                        <input type="text" placeholder="https://..." value={kitOptionForm.imageUrl} onChange={e => setKitOptionForm({ ...kitOptionForm, imageUrl: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                      </div>
                      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-sm">
                        + Cadastrar Kit de Personalização
                      </button>
                    </form>

                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {(selectedProject.customizationOptions || []).map((opt: any) => (
                        <div key={opt.id} className="p-3 border border-slate-200 rounded-xl flex justify-between items-center text-xs bg-slate-50/50">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-blue-600">{opt.category}</span>
                            <p className="font-bold text-slate-800">{opt.title}</p>
                            <p className="text-slate-500 text-[11px]">{opt.specification}</p>
                          </div>
                          <span className="font-black text-emerald-700 shrink-0 ml-2">+ {formatCurrency(opt.additionalPrice)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coluna Direita: Fechar Pedido do Comprador -> Aditivo Contratual + OS p/ Engenharia */}
                  <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">
                        Gerador de Aditivo de Personalização & Ordem de Serviço (OS) para a Obra
                      </h3>
                      <p className="text-xs text-slate-500">
                        Selecione os acabamentos escolhidos pelo comprador. O sistema gera o aditivo financeiro no contrato e dispara a OS exata para o engenheiro no canteiro.
                      </p>
                    </div>

                    <form onSubmit={handleCreateCustomOrder} className="space-y-4 text-xs bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Unidade / Apartamento *</label>
                          <input required type="text" placeholder="Ex: Apt 1402 - Torre A" value={customOrderForm.unitNumber} onChange={e => setCustomOrderForm({ ...customOrderForm, unitNumber: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Nome do Comprador *</label>
                          <input required type="text" placeholder="Nome do cliente" value={customOrderForm.buyerName} onChange={e => setCustomOrderForm({ ...customOrderForm, buyerName: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Vincular Contrato (Gera Fatura)</label>
                          <select value={customOrderForm.contractId} onChange={e => setCustomOrderForm({ ...customOrderForm, contractId: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white">
                            <option value="">Sem vínculo direto</option>
                            {contracts.map(c => (
                              <option key={c.id} value={c.id}>{c.tenant?.name} - {c.property?.title}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-2">Marque os Kits Escolhidos pelo Cliente:</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(selectedProject.customizationOptions || []).map((opt: any) => {
                            const checked = customOrderForm.selectedOptionIds.includes(opt.id);
                            return (
                              <label key={opt.id} className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${checked ? 'bg-blue-600 text-white border-blue-600 font-bold' : 'bg-white border-slate-200 text-slate-700'}`}>
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" checked={checked} onChange={() => handleToggleKitSelection(opt.id)} className="hidden" />
                                  <span>{opt.title}</span>
                                </div>
                                <span>+{formatCurrency(opt.additionalPrice)}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 border-t border-blue-200">
                        <span className="text-sm font-black text-blue-900">
                          Total do Aditivo Contratual: {formatCurrency(
                            (selectedProject.customizationOptions || [])
                              .filter((o: any) => customOrderForm.selectedOptionIds.includes(o.id))
                              .reduce((acc: number, o: any) => acc + Number(o.additionalPrice), 0)
                          )}
                        </span>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-sm">
                          Gerar Aditivo Financeiro & Emitir OS p/ Engenharia
                        </button>
                      </div>
                    </form>

                    {/* Lista de Ordens de Serviço (OS) de Personalização Emitidas para a Obra */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Ordens de Serviço (OS) de Customização no Canteiro</h4>
                      {(selectedProject.customizationOrders || []).map((ord: any) => (
                        <div key={ord.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50 text-xs space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-black text-slate-900 text-sm">{ord.unitNumber} — {ord.buyerName}</span>
                            <div className="flex gap-2">
                              <span className="bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full font-bold text-[10px]">{ord.engineeringOsCode}</span>
                              <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold text-[10px]">{ord.engineeringOsStatus}</span>
                            </div>
                          </div>
                          <pre className="bg-white p-3 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-700 whitespace-pre-wrap">{ord.engineeringInstructions}</pre>
                          <div className="text-right font-black text-blue-700">Aditivo Contratual: {formatCurrency(ord.totalAdditionalAmount)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 3.2 REPOSITÓRIO BIM, FACHADA/INTERIORES & COMPATIBILIZAÇÃO */}
              {designSubTab === 'bim' && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Repositório Central BIM (Revit, SketchUp, Promob, IFC, DWG) & Compatibilização</h3>
                    <p className="text-xs text-slate-500">Controle as revisões de maquetes 3D da fachada e projetos executivos de interiores para evitar conflitos com estrutura e hidráulica.</p>
                  </div>

                  <form onSubmit={handleAddBimFile} className="grid grid-cols-1 sm:grid-cols-6 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs items-end">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Disciplina</label>
                      <select value={bimForm.discipline} onChange={e => setBimForm({ ...bimForm, discipline: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white">
                        <option value="Fachada / Exterior">Fachada / Exterior</option>
                        <option value="Design de Interiores">Design de Interiores</option>
                        <option value="Arquitetura / Plantas">Arquitetura / Plantas</option>
                        <option value="Estrutural">Estrutural</option>
                        <option value="Hidrossanitário">Hidrossanitário</option>
                        <option value="Elétrica / Iluminação / Gesso">Elétrica / Iluminação / Gesso</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Software / Formato</label>
                      <select value={bimForm.fileFormat} onChange={e => setBimForm({ ...bimForm, fileFormat: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white">
                        <option value="IFC">BIM (.IFC)</option>
                        <option value="RVT">Revit (.RVT)</option>
                        <option value="SKP">SketchUp (.SKP)</option>
                        <option value="PROMOB">Promob (.PROMOB)</option>
                        <option value="DWG">AutoCAD (.DWG)</option>
                        <option value="PDF">Planta Humanizada (.PDF)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Nome do Arquivo & Revisão</label>
                      <div className="flex gap-1">
                        <input required type="text" placeholder="Fachada_TorreA" value={bimForm.fileName} onChange={e => setBimForm({ ...bimForm, fileName: e.target.value })} className="w-2/3 p-2.5 border border-slate-300 rounded-xl bg-white" />
                        <input required type="text" placeholder="R02" value={bimForm.version} onChange={e => setBimForm({ ...bimForm, version: e.target.value })} className="w-1/3 p-2.5 border border-slate-300 rounded-xl bg-white font-bold" />
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Status Compatibilização</label>
                      <select value={bimForm.clashStatus} onChange={e => setBimForm({ ...bimForm, clashStatus: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white">
                        <option value="COMPATIBILIZADO">✅ Compatibilizado</option>
                        <option value="EM_ANALISE">⏳ Em Análise (Clash)</option>
                        <option value="CONFLITO_DETECTADO">⚠️ Conflito Detectado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Link do Arquivo / Nuvem *</label>
                      <input required type="url" placeholder="https://drive..." value={bimForm.fileUrl} onChange={e => setBimForm({ ...bimForm, fileUrl: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                    </div>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm">
                      Publicar Revisão
                    </button>
                  </form>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                        <tr>
                          <th className="p-3.5">Disciplina</th>
                          <th className="p-3.5">Arquivo / Formato</th>
                          <th className="p-3.5">Revisão</th>
                          <th className="p-3.5">Compatibilização (Clash Detection)</th>
                          <th className="p-3.5 text-right">Download</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(selectedProject.bimFiles || []).map((bf: any) => (
                          <tr key={bf.id}>
                            <td className="p-3.5 font-bold text-slate-900">{bf.discipline}</td>
                            <td className="p-3.5">{bf.fileName} <span className="bg-slate-200 px-2 py-0.5 rounded text-[10px] font-bold ml-1">{bf.fileFormat}</span></td>
                            <td className="p-3.5 font-black text-blue-600">{bf.version}</td>
                            <td className="p-3.5">
                              <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                                bf.clashStatus === 'COMPATIBILIZADO' ? 'bg-emerald-100 text-emerald-800' : bf.clashStatus === 'CONFLITO_DETECTADO' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {bf.clashStatus}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              <a href={bf.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline">Abrir Projeto</a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: CRM VISUAL, TOUR 360º, MEMORIAL VISUAL & PÁGINA PÚBLICA DO SITE     */}
      {/* ========================================================================= */}
      {activeTab === 'vitrine' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {!selectedProject ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500">
              Selecione um Empreendimento no topo para configurar o Tour 360°, Renders e a Página Pública da Incorporadora.
            </div>
          ) : (
            <form onSubmit={handleSaveProgressAndSite} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Construtor da Página da Incorporadora no Site & CRM Visual ({selectedProject.name})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tudo o que você configurar aqui será exibido na página exclusiva da Incorporadora dentro do site da imobiliária.
                  </p>
                </div>
                <label className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={progressAndSiteForm.showOnPublicSite}
                    onChange={e => setProgressAndSiteForm({ ...progressAndSiteForm, showOnPublicSite: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  <span className="text-xs font-bold text-emerald-900">Exibir Empreendimento no Site Público</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Título de Impacto na Landing Page (Headline)</label>
                  <input type="text" value={progressAndSiteForm.customHeadline} onChange={e => setProgressAndSiteForm({ ...progressAndSiteForm, customHeadline: e.target.value })} className="w-full p-3 border border-slate-300 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vídeo Promocional do Empreendimento (YouTube / MP4)</label>
                  <input type="url" placeholder="https://..." value={progressAndSiteForm.heroVideoUrl} onChange={e => setProgressAndSiteForm({ ...progressAndSiteForm, heroVideoUrl: e.target.value })} className="w-full p-3 border border-slate-300 rounded-xl" />
                </div>

                <div>
                  <label className="block font-bold text-blue-700 mb-1">🌐 Link Tour Virtual 360° — Fachada & Áreas Comuns (Exterior)</label>
                  <input type="url" placeholder="https://my.matterport.com/..." value={progressAndSiteForm.tour360ExteriorUrl} onChange={e => setProgressAndSiteForm({ ...progressAndSiteForm, tour360ExteriorUrl: e.target.value })} className="w-full p-3 border border-blue-300 rounded-xl bg-blue-50/30" />
                </div>
                <div>
                  <label className="block font-bold text-indigo-700 mb-1">🛋️ Link Tour Virtual 360° — Apartamento Decorado (Interiores)</label>
                  <input type="url" placeholder="https://my.matterport.com/..." value={progressAndSiteForm.tour360DecoratedUrl} onChange={e => setProgressAndSiteForm({ ...progressAndSiteForm, tour360DecoratedUrl: e.target.value })} className="w-full p-3 border border-indigo-300 rounded-xl bg-indigo-50/30" />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Renders 3D da Fachada / Design Exterior (URLs separadas por vírgula)</label>
                  <textarea rows={2} value={progressAndSiteForm.facadeRendersText} onChange={e => setProgressAndSiteForm({ ...progressAndSiteForm, facadeRendersText: e.target.value })} placeholder="https://render-fachada1.jpg, https://render-rooftop.jpg" className="w-full p-3 border border-slate-300 rounded-xl" />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Renders 3D dos Interiores / Áreas Decoradas (URLs separadas por vírgula)</label>
                  <textarea rows={2} value={progressAndSiteForm.interiorRendersText} onChange={e => setProgressAndSiteForm({ ...progressAndSiteForm, interiorRendersText: e.target.value })} placeholder="https://living-decorado.jpg, https://varanda-gourmet.jpg" className="w-full p-3 border border-slate-300 rounded-xl" />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Plantas Baixas Humanizadas (URLs separadas por vírgula)</label>
                  <textarea rows={2} value={progressAndSiteForm.floorPlansText} onChange={e => setProgressAndSiteForm({ ...progressAndSiteForm, floorPlansText: e.target.value })} placeholder="https://planta-tipo-120m.jpg, https://planta-duplex.jpg" className="w-full p-3 border border-slate-300 rounded-xl" />
                </div>
              </div>

              {/* Memorial Descritivo Visual para o Cliente Final */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-sm font-bold text-slate-800">Memorial Descritivo Visual (Padrão de Entrega na Vitrine e App do Cliente)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Fachada & Design Exterior</label>
                    <input type="text" value={progressAndSiteForm.memorialFachada} onChange={e => setProgressAndSiteForm({ ...progressAndSiteForm, memorialFachada: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Pisos & Revestimentos Internos</label>
                    <input type="text" value={progressAndSiteForm.memorialPiso} onChange={e => setProgressAndSiteForm({ ...progressAndSiteForm, memorialPiso: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Esquadrias & Vidros</label>
                    <input type="text" value={progressAndSiteForm.memorialEsquadrias} onChange={e => setProgressAndSiteForm({ ...progressAndSiteForm, memorialEsquadrias: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mmb-1">Louças, Metais & Automação</label>
                    <input type="text" value={progressAndSiteForm.memorialLoucas} onChange={e => setProgressAndSiteForm({ ...progressAndSiteForm, memorialLoucas: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-8 py-3.5 rounded-xl shadow-sm">
                  Publicar Alterações na Vitrine da Incorporadora
                </button>
              </div>
            </form>
          )}
        </div>
      )}

    </div>
  );
}