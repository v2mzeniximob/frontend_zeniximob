'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { 
  Users, Plus, Search, Edit, Power, Loader2, UserCircle, Phone, Mail, 
  Briefcase, Percent, FileSpreadsheet, Filter, Download,
  DollarSign,
  X
} from 'lucide-react';
import { maskCpf, maskPhone } from '@/src/utils/mask';

const initialForm = {
  name: '', cpf: '', creci: '', phone: '', email: '', password: '', 
  saleCommission: '', rentCommission: ''
};

export default function CorretoresPage() {
  const [activeTab, setActiveTab] = useState<'lista' | 'relatorios'>('lista');
  const [brokers, setBrokers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ===============================================
  // ESTADOS DO RELATÓRIO DE COMISSÕES
  // ===============================================
  const [reportFilter, setReportFilter] = useState({ brokerId: 'Todos', type: 'Todos', startDate: '', endDate: '' });
  const [reportData, setReportData] = useState<any[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    fetchBrokers();
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

  const handleOpenModal = (broker: any = null) => {
    if (broker) {
      setEditingId(broker.id);
      setFormData({
        ...broker,
        password: '', // Não trazemos a senha para edição
        cpf: maskCpf(broker.cpf),
        phone: maskPhone(broker.phone),
        saleCommission: broker.saleCommission || '',
        rentCommission: broker.rentCommission || ''
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
      payload.phone = payload.phone.replace(/\D/g, '');

      if (!editingId && !payload.password) {
        alert("A senha é obrigatória para novos corretores.");
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
    if(!confirm('Deseja alterar o status deste corretor?')) return;
    try {
      await api.patch(`/brokers/${id}/status`);
      fetchBrokers();
    } catch (error) {
      alert('Erro ao alterar status.');
    }
  };

  // ===============================================
  // FUNÇÕES DO RELATÓRIO
  // ===============================================
  const generateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingReport(true);
    try {
      const queryParams = new URLSearchParams(reportFilter).toString();
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
    
    // Cabeçalhos
    const headers = ['Data', 'Tipo', 'Imóvel', 'Cliente', 'Corretor', 'Valor Operação (R$)', '% Comissão', 'Valor Comissão (R$)', 'Status'];
    
    // Linhas
    const rows = reportData.map(r => [
      new Date(r.date).toLocaleDateString('pt-BR'),
      r.type,
      `"${r.propertyTitle}"`, // Aspas para não quebrar CSV se tiver vírgulas
      `"${r.clientName}"`,
      `"${r.brokerName}"`,
      r.operationValue.toFixed(2),
      r.commissionPercent,
      r.commissionValue.toFixed(2),
      r.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers.join(";") + "\n" 
      + rows.map(e => e.join(";")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Relatorio_Comissoes_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const filteredBrokers = brokers.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.cpf.includes(searchTerm.replace(/\D/g, ''))
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto font-sans animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Users className="text-blue-600 bg-blue-50 p-1.5 rounded-lg" size={36} />
            Gestão de Equipe & Comissões
          </h1>
          <p className="text-slate-500 mt-2 text-sm">Gira os seus corretores, defina percentagens de comissão e extraia relatórios financeiros.</p>
        </div>
      </div>

      {/* ABAS */}
      <div className="flex gap-4 border-b border-slate-200 mb-6">
        <button 
          onClick={() => setActiveTab('lista')} 
          className={`pb-4 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'lista' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Users size={18} /> Equipe de Corretores
        </button>
        <button 
          onClick={() => setActiveTab('relatorios')} 
          className={`pb-4 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'relatorios' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <FileSpreadsheet size={18} /> Relatório de Comissões
        </button>
      </div>

      {/* ================================================== */}
      {/* ABA 1: LISTA DE CORRETORES */}
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
              <Plus size={18} /> Novo Corretor
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="p-4">Corretor</th>
                  <th className="p-4">Contactos</th>
                  <th className="p-4">Comissões (Venda / Aluguel)</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2"/> Carregando corretores...</td></tr>
                ) : filteredBrokers.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhum corretor cadastrado.</td></tr>
                ) : (
                  filteredBrokers.map((broker) => (
                    <tr key={broker.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold bg-blue-50 text-blue-600 border border-blue-100">
                            {broker.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{broker.name}</p>
                            <p className="text-xs text-slate-500">CRECI: {broker.creci}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-slate-700 flex items-center gap-2"><Phone size={14} className="text-slate-400"/> {maskPhone(broker.phone)}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-2 mt-1"><Mail size={14} className="text-slate-400"/> {broker.email}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded border border-indigo-200" title="Comissão de Venda">{broker.saleCommission || 0}% Venda</span>
                          <span className="bg-orange-50 text-orange-700 text-xs font-bold px-2 py-1 rounded border border-orange-200" title="Comissão de Locação">{broker.rentCommission || 0}% Locação</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${broker.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${broker.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                          {broker.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleOpenModal(broker)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent" title="Editar"><Edit size={16} /></button>
                          <button onClick={() => handleToggleStatus(broker.id)} className={`p-2 rounded-lg transition-colors border border-transparent ${broker.isActive ? 'text-red-500 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`} title={broker.isActive ? 'Desativar' : 'Ativar'}><Power size={16} /></button>
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
      {/* ABA 2: RELATÓRIOS FINANCEIROS */}
      {/* ================================================== */}
      {activeTab === 'relatorios' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* BARRA DE FILTROS */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><Filter size={16}/> Filtros do Relatório</h3>
            <form onSubmit={generateReport} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Corretor</label>
                <select value={reportFilter.brokerId} onChange={e => setReportFilter({...reportFilter, brokerId: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                  <option value="Todos">Geral (Todos)</option>
                  {brokers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
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
                  {isGeneratingReport ? <Loader2 size={16} className="animate-spin" /> : <Search size={16}/>} Filtrar
                </button>
              </div>
            </form>
          </div>

          {/* DASHBOARD SUMÁRIO (Kardex) */}
          {reportData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Briefcase size={24}/></div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Negócios Fechados</p>
                  <h3 className="text-2xl font-black text-slate-800">{reportData.length}</h3>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign size={24}/></div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Volume de Operações</p>
                  <h3 className="text-2xl font-black text-slate-800">{formatCurrency(reportData.reduce((acc, curr) => acc + curr.operationValue, 0))}</h3>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-emerald-500 shadow-sm flex items-center gap-4 bg-emerald-50/30">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl"><Percent size={24}/></div>
                <div>
                  <p className="text-xs font-bold text-emerald-800 uppercase">Total em Comissões</p>
                  <h3 className="text-2xl font-black text-emerald-700">{formatCurrency(reportData.reduce((acc, curr) => acc + curr.commissionValue, 0))}</h3>
                </div>
              </div>
            </div>
          )}

          {/* TABELA DE RESULTADOS */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-700">Resultado do Relatório</h3>
              {reportData.length > 0 && (
                <button onClick={exportToCSV} className="text-sm font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                  <Download size={16}/> Exportar para Excel / CSV
                </button>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    <th className="p-4">Data</th>
                    <th className="p-4">Tipo & Imóvel</th>
                    <th className="p-4">Corretor</th>
                    <th className="p-4">Valor Operação</th>
                    <th className="p-4">Base Comissão</th>
                    <th className="p-4 text-right text-emerald-700">Valor Comissão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {reportData.length === 0 ? (
                    <tr><td colSpan={6} className="p-10 text-center text-slate-400">Utilize os filtros acima para gerar o relatório.</td></tr>
                  ) : (
                    reportData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-600">{new Date(row.date).toLocaleDateString('pt-BR')}</td>
                        <td className="p-4">
                          <span className={`inline-block mb-1 text-[10px] font-bold px-2 py-0.5 rounded border ${row.type === 'Venda' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{row.type}</span>
                          <p className="font-bold text-slate-800 line-clamp-1" title={row.propertyTitle}>{row.propertyTitle}</p>
                        </td>
                        <td className="p-4 font-semibold text-slate-700">{row.brokerName}</td>
                        <td className="p-4 font-bold text-slate-700">{formatCurrency(row.operationValue)}</td>
                        <td className="p-4 text-slate-500">{row.commissionPercent}%</td>
                        <td className="p-4 text-right font-black text-emerald-600">{formatCurrency(row.commissionValue)}</td>
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
      {/* MODAL CADASTRAR/EDITAR CORRETOR */}
      {/* ================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl shrink-0">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {editingId ? <Edit className="text-blue-600" size={24}/> : <UserCircle className="text-blue-600" size={24}/>}
                {editingId ? 'Editar Corretor' : 'Cadastrar Corretor'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"><X size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="brokerForm" onSubmit={handleSubmit} className="space-y-6">
                
                <section>
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><UserCircle size={16} className="text-blue-500"/> Dados Profissionais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Nome Completo *</label>
                      <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">CPF *</label>
                      <input required type="text" value={formData.cpf} onChange={e => setFormData({...formData, cpf: maskCpf(e.target.value)})} placeholder="000.000.000-00" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">CRECI *</label>
                      <input required type="text" value={formData.creci} onChange={e => setFormData({...formData, creci: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
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
                      <label className="block text-xs font-bold text-slate-600 mb-1">Senha {editingId && '(Deixe em branco para não alterar)'} {(!editingId) && '*'}</label>
                      <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50" />
                    </div>
                  </div>
                </section>

                <section className="bg-blue-50 p-5 rounded-xl border border-blue-200">
                  <h3 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2"><Percent size={16}/> Comissionamento Padrão</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Comissão em Vendas (%)</label>
                      <input type="number" step="0.1" value={formData.saleCommission} onChange={e => setFormData({...formData, saleCommission: e.target.value})} placeholder="Ex: 3" className="w-full p-2.5 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Comissão em Locações (%)</label>
                      <input type="number" step="0.1" value={formData.rentCommission} onChange={e => setFormData({...formData, rentCommission: e.target.value})} placeholder="Ex: 10" className="w-full p-2.5 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-3 font-medium">Estes valores serão usados automaticamente para calcular o relatório financeiro de honorários.</p>
                </section>

              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
              <button type="submit" form="brokerForm" disabled={isSaving} className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-70">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16}/>} {editingId ? 'Salvar Alterações' : 'Cadastrar Corretor'}
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}