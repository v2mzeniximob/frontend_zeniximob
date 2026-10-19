'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { 
  Users, Plus, Search, Edit, Power, Loader2, UserCircle, Phone, Mail, 
  Briefcase, Percent, FileSpreadsheet, Filter, Download,
  DollarSign, X, Shield, Shuffle, Building2, CheckCircle2, Settings, FileText, Send, Image as ImageIcon
} from 'lucide-react';
import { maskCpf, maskPhone } from '@/src/utils/mask';

const initialForm = {
  name: '', cpf: '', cnpj: '', creci: '', phone: '', email: '', password: '', 
  role: 'Corretor',
  saleCommission: '6', 
  rentCommission: '100',
  captureCommission: '10',
  managerCommission: '5',
  inRoulette: true,
  taxRuleId: '',
  profileImageUrl: ''
};

export default function CorretoresPage() {
  const [activeTab, setActiveTab] = useState<'lista' | 'relatorios'>('lista');
  const [brokers, setBrokers] = useState<any[]>([]);
  const [taxRules, setTaxRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
   
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Estados do Modal de Emissão de Nota de Repasse
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceBroker, setInvoiceBroker] = useState<any>(null);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceRuleId, setInvoiceRuleId] = useState('');
  const [isEmittingInvoice, setIsEmittingInvoice] = useState(false);

  // Estados do Rateio (Split) e Relatório
  const [splitSettings, setSplitSettings] = useState({
    agencySplitPercent: 50,
    sellerSplitPercent: 35,
    captatorSplitPercent: 10,
    managerSplitPercent: 5
  });
  const [isSavingSplit, setIsSavingSplit] = useState(false);

  const [reportFilter, setReportFilter] = useState({ brokerId: 'Todos', type: 'Todos', startDate: '', endDate: '' });
  const [reportData, setReportData] = useState<any[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    fetchBrokers();
    fetchTaxRules();
    fetchSplitSettings();
  }, []);

  const fetchBrokers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/brokers');
      setBrokers(response.data);
    } catch (error) {
      console.error('Erro ao listar corretores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTaxRules = async () => {
    try {
      const res = await api.get('/tax-rules');
      setTaxRules(res.data || []);
    } catch (error) {
      console.error('Erro ao carregar regras fiscais:', error);
    }
  };

  const fetchSplitSettings = async () => {
    try {
      const res = await api.get('/brokers/split-settings');
      if (res.data) {
        setSplitSettings({
          agencySplitPercent: res.data.agencySplitPercent ?? 50,
          sellerSplitPercent: res.data.sellerSplitPercent ?? 35,
          captatorSplitPercent: res.data.captatorSplitPercent ?? 10,
          managerSplitPercent: res.data.managerSplitPercent ?? 5
        });
      }
    } catch (error) {
      console.error('Erro ao carregar regras de split:', error);
    }
  };

  const handleSaveSplitSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = Number(splitSettings.agencySplitPercent) + Number(splitSettings.sellerSplitPercent) + Number(splitSettings.captatorSplitPercent) + Number(splitSettings.managerSplitPercent);
    if (total !== 100) {
      alert(`A soma das porcentagens do Rateio deve ser exatamente 100%. Atualmente está em ${total}%.`);
      return;
    }

    setIsSavingSplit(true);
    try {
      await api.put('/brokers/split-settings', splitSettings);
      alert('Regras de Rateio (Split) atualizadas com sucesso!');
      if (reportData.length > 0) {
        generateReport();
      }
    } catch (error) {
      alert('Erro ao salvar regras de rateio.');
    } finally {
      setIsSavingSplit(false);
    }
  };

  const handleOpenModal = (broker: any = null) => {
    if (broker) {
      setEditingId(broker.id);
      setFormData({
        ...broker,
        password: '',
        cpf: maskCpf(broker.cpf || ''),
        phone: maskPhone(broker.phone || ''),
        cnpj: broker.cnpj || '',
        taxRuleId: broker.taxRuleId || '',
        role: broker.role || 'Corretor',
        saleCommission: broker.saleCommission ?? '6',
        rentCommission: broker.rentCommission ?? '100',
        captureCommission: broker.captureCommission ?? '10',
        managerCommission: broker.managerCommission ?? '5',
        inRoulette: broker.inRoulette ?? true,
        profileImageUrl: broker.profileImageUrl || ''
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
      payload.cpf = payload.cpf.replace(/\D/g, '');
      if (payload.cnpj) payload.cnpj = payload.cnpj.replace(/\D/g, '');
      payload.phone = payload.phone.replace(/\D/g, '');

      if (!editingId && !payload.password) {
        alert("A senha é obrigatória para novos cadastros.");
        setIsSaving(false);
        return;
      }

      if (editingId) {
        await api.put(`/brokers/${editingId}`, payload);
      } else {
        await api.post('/brokers', payload);
      }
       
      setIsModalOpen(false);
      fetchBrokers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar corretor.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    if(!confirm('Deseja alterar o status de acesso deste profissional?')) return;
    try {
      await api.patch(`/brokers/${id}/status`);
      fetchBrokers();
    } catch (error) {
      alert('Erro ao alterar status.');
    }
  };

  const handleToggleRoulette = async (id: string) => {
    try {
      await api.patch(`/brokers/${id}/roulette`);
      fetchBrokers();
    } catch (error) {
      alert('Erro ao alterar participação na roleta.');
    }
  };

  // Emitir Nota Fiscal de Repasse
  const handleOpenInvoiceModal = (broker: any) => {
    setInvoiceBroker(broker);
    setInvoiceAmount('');
    setInvoiceRuleId(broker.taxRuleId || (taxRules[0]?.id ?? ''));
    setIsInvoiceModalOpen(true);
  };

  const handleEmitBrokerInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceBroker || !invoiceAmount) return;

    setIsEmittingInvoice(true);
    try {
      const res = await api.post('/broker-invoices/emit', {
        brokerId: invoiceBroker.id,
        taxRuleId: invoiceRuleId || undefined,
        amount: Number(invoiceAmount)
      });
      alert(res.data?.message || 'Nota Fiscal de repasse processada com sucesso!');
      setIsInvoiceModalOpen(false);
      setInvoiceBroker(null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao emitir nota de repasse.');
    } finally {
      setIsEmittingInvoice(false);
    }
  };

  const generateReport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGeneratingReport(true);
    try {
      const queryParams = new URLSearchParams(reportFilter as any).toString();
      const response = await api.get(`/brokers/reports/commissions?${queryParams}`);
      setReportData(response.data);
    } catch (error) {
      alert('Erro ao gerar relatório.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const exportToCSV = () => {
    if (reportData.length === 0) return;
     
    const headers = [
      'Data', 'Tipo', 'Imovel', 'Cliente', 'Valor Operacao (R$)', 
      '% Honorarios', 'Comissao Bruta (R$)', 'Imobiliaria (R$)', 
      'Vendedor', 'Valor Vendedor (R$)', 'Captador', 'Valor Captador (R$)', 
      'Gerente', 'Valor Gerente (R$)'
    ];
     
    const rows = reportData.map(r => [
      new Date(r.date).toLocaleDateString('pt-BR'),
      r.type,
      `"${r.propertyTitle}"`,
      `"${r.clientName}"`,
      r.operationValue.toFixed(2),
      `${r.commissionPercent}%`,
      r.commissionValue.toFixed(2),
      r.agencyAmount.toFixed(2),
      `"${r.sellerName}"`,
      r.sellerAmount.toFixed(2),
      `"${r.captatorName}"`,
      r.captatorAmount.toFixed(2),
      `"${r.managerName}"`,
      r.managerAmount.toFixed(2)
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers.join(";") + "\n" 
      + rows.map(e => e.join(";")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Relatorio_Split_Comissoes_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const filteredBrokers = brokers.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (b.cpf && b.cpf.includes(searchTerm.replace(/\D/g, '')))
  );

  const getRoleBadge = (role: string) => {
    if (role === 'Gerente') {
      return <span className="bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"><Shield size={12}/> Gerente</span>;
    }
    if (role === 'Captador') {
      return <span className="bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold px-2.5 py-0.5 rounded-full">Captador</span>;
    }
    return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-2.5 py-0.5 rounded-full">Corretor</span>;
  };

  const totalGrossCommissions = reportData.reduce((acc, curr) => acc + curr.commissionValue, 0);
  const totalAgencyShare = reportData.reduce((acc, curr) => acc + curr.agencyAmount, 0);
  const totalTeamShare = reportData.reduce((acc, curr) => 
    reportFilter.brokerId !== 'Todos' 
      ? acc + curr.filteredBrokerShare 
      : acc + (curr.sellerAmount + curr.captatorAmount + curr.managerAmount), 
  0);

  return (
    <div className="p-8 max-w-[1600px] mx-auto font-sans animate-in fade-in duration-300">
       
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Users className="text-blue-600 bg-blue-50 p-1.5 rounded-lg" size={36} />
            Gestão de Equipe, Hierarquia & Rateio (Split)
          </h1>
          <p className="text-slate-500 mt-2 text-sm">Configure cargos, vínculos fiscais, fila da Roleta de Leads e o Rateio Automático de Comissões.</p>
        </div>
      </div>

      {/* ABAS */}
      <div className="flex gap-4 border-b border-slate-200 mb-6">
        <button 
          onClick={() => setActiveTab('lista')} 
          className={`pb-4 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'lista' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Users size={18} /> Equipe & Cargos ({brokers.length})
        </button>
        <button 
          onClick={() => setActiveTab('relatorios')} 
          className={`pb-4 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'relatorios' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <FileSpreadsheet size={18} /> Rateio (Split) & Relatório de Comissões
        </button>
      </div>

      {/* ================================================== */}
      {/* ABA 1: LISTA DE CORRETORES E HIERARQUIA            */}
      {/* ================================================== */}
      {activeTab === 'lista' && (
        <>
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="relative flex-1 md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por Nome ou CPF..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
              />
            </div>
            <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm">
              <Plus size={18} /> Cadastrar Membro da Equipe
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="p-4">Profissional & Cargo</th>
                  <th className="p-4">Contactos</th>
                  <th className="p-4">Base de Honorários</th>
                  <th className="p-4 text-center">Fila da Roleta</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Ações Fiscais & Gestão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isLoading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2"/> Carregando equipe...</td></tr>
                ) : filteredBrokers.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400">Nenhum corretor cadastrado.</td></tr>
                ) : (
                  filteredBrokers.map((broker) => (
                    <tr key={broker.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {broker.profileImageUrl ? (
                            <img src={broker.profileImageUrl} alt={broker.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" />
                          ) : (
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border shrink-0 ${broker.role === 'Gerente' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                              {broker.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-800">{broker.name}</p>
                              {getRoleBadge(broker.role)}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">CRECI: {broker.creci} {broker.cnpj ? `| CNPJ: ${broker.cnpj}` : ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-slate-700 flex items-center gap-2"><Phone size={14} className="text-slate-400"/> {maskPhone(broker.phone || '')}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-2 mt-1"><Mail size={14} className="text-slate-400"/> {broker.email}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5">
                          <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded border border-indigo-200">{broker.saleCommission || 6}% Venda</span>
                          <span className="bg-orange-50 text-orange-700 text-xs font-bold px-2 py-1 rounded border border-orange-200">{broker.rentCommission || 100}% Locação</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => handleToggleRoulette(broker.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${broker.inRoulette !== false ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'}`}
                        >
                          <Shuffle size={12}/>
                          {broker.inRoulette !== false ? 'Na Roleta' : 'Pausado'}
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${broker.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${broker.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                          {broker.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleOpenInvoiceModal(broker)} className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all" title="Emitir NFS-e de Repasse via Focus NFe">
                            <FileText size={14} /> Emitir Nota
                          </button>
                          <button onClick={() => handleOpenModal(broker)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Editar"><Edit size={16} /></button>
                          <button onClick={() => handleToggleStatus(broker.id)} className={`p-2 rounded-lg transition-colors ${broker.isActive ? 'text-red-500 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`} title={broker.isActive ? 'Desativar' : 'Ativar'}><Power size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ================================================== */}
      {/* ABA 2: REGRAS DE SPLIT E RELATÓRIO DE COMISSÕES    */}
      {/* ================================================== */}
      {activeTab === 'relatorios' && (
        <div className="space-y-6 animate-in fade-in duration-300">
           
          {/* CONFIGURAÇÃO DO RATEIO PADRÃO DA LOJA (SPLIT) */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 text-white">
                  <Settings size={18} className="text-blue-400"/> Regra de Rateio de Comissões (Split da Imobiliária)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Defina como 100% da comissão bruta de cada negócio é dividida entre a Loja e a Equipe.</p>
              </div>
              <span className="text-xs font-bold bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                Soma Atual: <strong className={Number(splitSettings.agencySplitPercent) + Number(splitSettings.sellerSplitPercent) + Number(splitSettings.captatorSplitPercent) + Number(splitSettings.managerSplitPercent) === 100 ? 'text-emerald-400' : 'text-red-400'}>
                  {Number(splitSettings.agencySplitPercent) + Number(splitSettings.sellerSplitPercent) + Number(splitSettings.captatorSplitPercent) + Number(splitSettings.managerSplitPercent)}%
                </strong> / 100%
              </span>
            </div>

            <form onSubmit={handleSaveSplitSettings} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">🏢 Imobiliária (%)</label>
                <input type="number" step="0.5" value={splitSettings.agencySplitPercent} onChange={e => setSplitSettings({...splitSettings, agencySplitPercent: Number(e.target.value)})} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-sm outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-300 mb-1">🤝 Corretor Vendedor (%)</label>
                <input type="number" step="0.5" value={splitSettings.sellerSplitPercent} onChange={e => setSplitSettings({...splitSettings, sellerSplitPercent: Number(e.target.value)})} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-sm outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-amber-300 mb-1">🏠 Corretor Captador (%)</label>
                <input type="number" step="0.5" value={splitSettings.captatorSplitPercent} onChange={e => setSplitSettings({...splitSettings, captatorSplitPercent: Number(e.target.value)})} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-sm outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-purple-300 mb-1">👑 Gerente da Equipe (%)</label>
                <input type="number" step="0.5" value={splitSettings.managerSplitPercent} onChange={e => setSplitSettings({...splitSettings, managerSplitPercent: Number(e.target.value)})} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-sm outline-none focus:border-blue-500" />
              </div>
              <div>
                <button type="submit" disabled={isSavingSplit} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all">
                  {isSavingSplit ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle2 size={16}/>}
                  Salvar Regra
                </button>
              </div>
            </form>
          </div>

          {/* BARRA DE FILTROS */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><Filter size={16}/> Filtros de Apuração</h3>
            <form onSubmit={generateReport} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Profissional (Vendedor/Captador/Gerente)</label>
                <select value={reportFilter.brokerId} onChange={e => setReportFilter({...reportFilter, brokerId: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                  <option value="Todos">Visão Geral (Toda a Loja)</option>
                  {brokers.map(b => <option key={b.id} value={b.id}>{b.name} ({b.role || 'Corretor'})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Natureza</label>
                <select value={reportFilter.type} onChange={e => setReportFilter({...reportFilter, type: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                  <option value="Todos">Locação e Venda</option>
                  <option value="Locação">Apenas Locação</option>
                  <option value="Venda">Apenas Venda</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Data Inicial</label>
                <input type="date" value={reportFilter.startDate} onChange={e => setReportFilter({...reportFilter, startDate: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Data Final</label>
                <input type="date" value={reportFilter.endDate} onChange={e => setReportFilter({...reportFilter, endDate: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <button type="submit" disabled={isGeneratingReport} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg flex justify-center items-center gap-2 transition-all">
                  {isGeneratingReport ? <Loader2 size={16} className="animate-spin" /> : <Search size={16}/>} Apurar Rateio
                </button>
              </div>
            </form>
          </div>

          {/* DASHBOARD SUMÁRIO DO SPLIT */}
          {reportData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-slate-100 text-slate-700 rounded-xl"><Briefcase size={24}/></div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Negócios Apurados</p>
                  <h3 className="text-2xl font-black text-slate-800">{reportData.length}</h3>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><DollarSign size={24}/></div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Comissão Bruta Total</p>
                  <h3 className="text-2xl font-black text-slate-800">{formatCurrency(totalGrossCommissions)}</h3>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm flex items-center gap-4 bg-indigo-50/20">
                <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl"><Building2 size={24}/></div>
                <div>
                  <p className="text-xs font-bold text-indigo-900 uppercase">Caixa da Imobiliária</p>
                  <h3 className="text-2xl font-black text-indigo-700">{formatCurrency(totalAgencyShare)}</h3>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-emerald-500 shadow-sm flex items-center gap-4 bg-emerald-50/30">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl"><Percent size={24}/></div>
                <div>
                  <p className="text-xs font-bold text-emerald-800 uppercase">
                    {reportFilter.brokerId !== 'Todos' ? 'Líquido do Profissional' : 'Total Repasse Equipe'}
                  </p>
                  <h3 className="text-2xl font-black text-emerald-700">{formatCurrency(totalTeamShare)}</h3>
                </div>
              </div>
            </div>
          )}

          {/* TABELA DE RESULTADOS COM SPLIT DETALHADO */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-700">Detalhamento de Split por Contrato</h3>
              {reportData.length > 0 && (
                <button onClick={exportToCSV} className="text-sm font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                  <Download size={16}/> Exportar Rateio para Excel (CSV)
                </button>
              )}
            </div>
             
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    <th className="p-4">Data / Imóvel</th>
                    <th className="p-4">Comissão Bruta</th>
                    <th className="p-4 text-indigo-700">🏢 Imobiliária ({splitSettings.agencySplitPercent}%)</th>
                    <th className="p-4 text-blue-700">🤝 Vendedor ({splitSettings.sellerSplitPercent}%)</th>
                    <th className="p-4 text-amber-700">🏠 Captador ({splitSettings.captatorSplitPercent}%)</th>
                    <th className="p-4 text-purple-700">👑 Gerente ({splitSettings.managerSplitPercent}%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {reportData.length === 0 ? (
                    <tr><td colSpan={6} className="p-10 text-center text-slate-400">Clique em "Apurar Rateio" acima para calcular as divisões de comissão.</td></tr>
                  ) : (
                    reportData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${row.type === 'Venda' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{row.type}</span>
                            <span className="text-xs text-slate-400">{new Date(row.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p className="font-bold text-slate-800 line-clamp-1" title={row.propertyTitle}>{row.propertyTitle}</p>
                        <p className="text-xs text-slate-500">Valor Base: {formatCurrency(row.operationValue)}</p>
                      </td>
                         
                        <td className="p-4">
                          <p className="font-black text-slate-800">{formatCurrency(row.commissionValue)}</p>
                          <span className="text-xs text-slate-400">({row.commissionPercent}% honorários)</span>
                        </td>

                        <td className="p-4 font-bold text-indigo-700 bg-indigo-50/20">
                          {formatCurrency(row.agencyAmount)}
                        </td>

                        <td className="p-4">
                          <p className="font-bold text-emerald-600">{formatCurrency(row.sellerAmount)}</p>
                          <p className="text-xs text-slate-600 font-medium">{row.sellerName}</p>
                        </td>

                        <td className="p-4">
                          <p className="font-bold text-amber-600">{formatCurrency(row.captatorAmount)}</p>
                          <p className="text-xs text-slate-600 font-medium">{row.captatorName}</p>
                        </td>

                        <td className="p-4">
                          <p className="font-bold text-purple-600">{formatCurrency(row.managerAmount)}</p>
                          <p className="text-xs text-slate-600 font-medium">{row.managerName}</p>
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

      {/* ================================================== */}
      {/* MODAL CADASTRAR/EDITAR CORRETOR & CARGO            */}
      {/* ================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
             
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl shrink-0">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {editingId ? <Edit className="text-blue-600" size={24}/> : <UserCircle className="text-blue-600" size={24}/>}
                {editingId ? 'Editar Profissional' : 'Cadastrar Profissional'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"><X size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="brokerForm" onSubmit={handleSubmit} className="space-y-6">
                 
                <section>
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><UserCircle size={16} className="text-blue-500"/> Dados & Hierarquia</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Nome Completo *</label>
                      <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Cargo / Nível na Imobiliária *</label>
                      <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-2.5 border border-blue-400 bg-blue-50/40 font-bold text-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                        <option value="Corretor">🤝 Corretor (Vendas & Locação)</option>
                        <option value="Captador">🏠 Captador (Angariador de Imóveis)</option>
                        <option value="Gerente">👑 Gerente Comercial (Líder de Equipe)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">CPF *</label>
                      <input required type="text" value={formData.cpf} onChange={e => setFormData({...formData, cpf: maskCpf(e.target.value)})} placeholder="000.000.000-00" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">CNPJ (Opcional - Caso PJ/MEI)</label>
                      <input type="text" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} placeholder="00.000.000/0000-00" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">CRECI *</label>
                      <input required type="text" value={formData.creci} onChange={e => setFormData({...formData, creci: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Regra Fiscal Padrão de Repasse</label>
                      <select value={formData.taxRuleId} onChange={e => setFormData({...formData, taxRuleId: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                        <option value="">Selecione a regra fiscal...</option>
                        {taxRules.map(rule => <option key={rule.id} value={rule.id}>{rule.name} ({rule.serviceCode})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Telefone / WhatsApp *</label>
                      <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: maskPhone(e.target.value)})} placeholder="(00) 00000-0000" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">E-mail (Acesso à Plataforma) *</label>
                      <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">URL da Foto de Perfil (Avatar / Imagem)</label>
                      <div className="flex gap-2 items-center">
                        <input type="url" value={formData.profileImageUrl || ''} onChange={e => setFormData({...formData, profileImageUrl: e.target.value})} placeholder="https://exemplo.com/foto-corretor.jpg" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                        {formData.profileImageUrl && (
                          <img src={formData.profileImageUrl} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Senha {editingId && '(Deixe em branco para não alterar)'} {(!editingId) && '*'}</label>
                      <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50" />
                    </div>
                  </div>
                </section>

                <section className="bg-blue-50 p-5 rounded-xl border border-blue-200 space-y-4">
                  <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2"><Percent size={16}/> Comissionamento & Roleta de Leads</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Honorários Padrão em Vendas (%)</label>
                      <input type="number" step="0.1" value={formData.saleCommission} onChange={e => setFormData({...formData, saleCommission: e.target.value})} placeholder="Ex: 6" className="w-full p-2.5 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Honorários Padrão em Locações (%)</label>
                      <input type="number" step="0.1" value={formData.rentCommission} onChange={e => setFormData({...formData, rentCommission: e.target.value})} placeholder="Ex: 100" className="w-full p-2.5 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white" />
                    </div>
                  </div>

                  <label className="flex items-center gap-3 pt-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.inRoulette} 
                      onChange={e => setFormData({...formData, inRoulette: e.target.checked})} 
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span className="text-xs font-bold text-slate-700">Participar da fila da Roleta Automática de Leads (WhatsApp / Site)</span>
                  </label>
                </section>

              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
              <button type="submit" form="brokerForm" disabled={isSaving} className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-70">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16}/>} {editingId ? 'Salvar Alterações' : 'Cadastrar Profissional'}
              </button>
            </div>
             
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* MODAL DE EMISSÃO DE NFS-E DE REPASSE (FOCUS NFE)   */}
      {/* ================================================== */}
      {isInvoiceModalOpen && invoiceBroker && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="text-blue-600" size={20}/> Emitir Nota de Repasse
              </h2>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"><X size={18}/></button>
            </div>

            <form onSubmit={handleEmitBrokerInvoice} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Corretor / Tomador</label>
                <input type="text" disabled value={`${invoiceBroker.name} (${invoiceBroker.cnpj || invoiceBroker.cpf})`} className="w-full p-2.5 border border-slate-200 bg-slate-100 rounded-lg text-xs font-bold text-slate-700" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Regra Fiscal</label>
                <select value={invoiceRuleId} onChange={e => setInvoiceRuleId(e.target.value)} required className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white font-medium">
                  <option value="">Selecione a regra fiscal...</option>
                  {taxRules.map(rule => <option key={rule.id} value={rule.id}>{rule.name} ({rule.serviceCode})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Valor do Repasse (R$)</label>
                <input type="number" step="0.01" required value={invoiceAmount} onChange={e => setInvoiceAmount(e.target.value)} placeholder="0.00" className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-bold text-blue-600 outline-none" />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsInvoiceModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600">Cancelar</button>
                <button type="submit" disabled={isEmittingInvoice} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2">
                  {isEmittingInvoice ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>} Transmitir via Focus NFe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}