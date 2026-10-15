'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, ShieldCheck, Key, Settings, DollarSign, Send, 
  CheckCircle2, AlertCircle, Loader2, Building, RefreshCw 
} from 'lucide-react';
import { api } from '@/src/lib/api';

export default function ModuloFiscalPage() {
  const [activeTab, setActiveTab] = useState<'focus' | 'certificate' | 'rules' | 'brokers_invoices'>('focus');
  const [isLoading, setIsLoading] = useState(false);

  // Estados de Configuração Focus NFe
  const [focusConfig, setFocusConfig] = useState({
    focusNfeToken: '',
    focusEnv: 'homologacao'
  });

  // Estados de Certificado A1
  const [certPassword, setCertPassword] = useState('');
  const [certFile, setCertFile] = useState<File | null>(null);

  // Estados de Regras Fiscais
  const [taxRules, setTaxRules] = useState<any[]>([]);
  const [newRule, setNewRule] = useState({
    name: '', serviceCode: '', issRate: '2.00', pisRate: '0.65', cofinsRate: '3.00', applyIbsCbs: false
  });

  // Estados de Corretores & Notas de Repasse
  const [brokers, setBrokers] = useState<any[]>([]);
  const [brokerInvoices, setBrokerInvoices] = useState<any[]>([]);
  const [selectedBroker, setSelectedBroker] = useState({
    brokerId: '', amount: '', taxRuleId: ''
  });

  useEffect(() => {
    fetchFiscalData();
  }, []);

  const fetchFiscalData = async () => {
    setIsLoading(true);
    try {
      const storeRes = await api.get('/my-store');
      if (storeRes.data) {
        setFocusConfig({
          focusNfeToken: storeRes.data.focusNfeToken || '',
          focusEnv: storeRes.data.focusEnv || 'homologacao'
        });
      }
      
      const rulesRes = await api.get('/tax-rules').catch(() => ({ data: [] }));
      setTaxRules(rulesRes.data || []);

      const brokersRes = await api.get('/brokers').catch(() => ({ data: [] }));
      setBrokers(brokersRes.data || []);

      const invoicesRes = await api.get('/broker-invoices').catch(() => ({ data: [] }));
      setBrokerInvoices(invoicesRes.data || []);
    } catch (error) {
      console.error('Erro ao buscar dados fiscais:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFocusConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/my-store/fiscal-config', focusConfig);
      alert('Configurações da Focus NFe salvas com sucesso!');
    } catch (err) {
      alert('Erro ao salvar configurações.');
    }
  };

  const handleUploadCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certFile) {
      alert('Selecione o arquivo do certificado .pfx');
      return;
    }
    const formData = new FormData();
    formData.append('certificate', certFile);
    formData.append('password', certPassword);

    try {
      await api.post('/my-store/certificate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Certificado Digital A1 enviado com sucesso!');
      setCertFile(null);
      setCertPassword('');
    } catch (err) {
      alert('Erro ao enviar certificado.');
    }
  };

  const handleCreateTaxRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tax-rules', newRule);
      alert('Regra fiscal cadastrada com sucesso!');
      setNewRule({ name: '', serviceCode: '', issRate: '2.00', pisRate: '0.65', cofinsRate: '3.00', applyIbsCbs: false });
      fetchFiscalData();
    } catch (err) {
      alert('Erro ao criar regra fiscal.');
    }
  };

  const handleEmitBrokerInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/broker-invoices/emit', selectedBroker);
      alert('Nota fiscal de repasse emitida com sucesso via Focus NFe!');
      setSelectedBroker({ brokerId: '', amount: '', taxRuleId: '' });
      fetchFiscalData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao emitir nota de repasse.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 font-sans bg-slate-50 min-h-screen">
      
      {/* CABEÇALHO */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-blue-100 text-blue-800 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            Gestão Fiscal & NFS-e
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-2">Módulo Fiscal & Focus NFe</h1>
          <p className="text-slate-500 text-sm mt-1">
            Configure seu certificado digital A1, regras de tributação (incluindo Reforma Tributária LC 214/2025) e notas de repasse para corretores.
          </p>
        </div>
      </div>

      {/* ABAS */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200">
        {[
          { id: 'focus', label: 'Configuração Focus NFe', icon: Settings },
          { id: 'certificate', label: 'Certificado Digital A1', icon: ShieldCheck },
          { id: 'rules', label: 'Regras Fiscais', icon: FileText },
          { id: 'brokers_invoices', label: 'Notas de Repasse (Corretores)', icon: DollarSign },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs transition-all ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-blue-400' : 'text-slate-400'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
        
        {/* ABA 1: CONFIGURAÇÃO FOCUS NFE */}
        {activeTab === 'focus' && (
          <form onSubmit={handleSaveFocusConfig} className="max-w-xl space-y-4 animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-slate-800">Credenciais da API Focus NFe</h3>
            <p className="text-xs text-slate-500">Insira o token fornecido pela Focus NFe para habilitar a emissão automatizada de notas fiscais de serviço.</p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ambiente de Operação</label>
              <select 
                value={focusConfig.focusEnv}
                onChange={e => setFocusConfig({ ...focusConfig, focusEnv: e.target.value })}
                className="w-full p-3 border border-slate-300 rounded-xl text-xs bg-white font-medium outline-none focus:border-blue-500"
              >
                <option value="homologacao">Homologação (Testes)</option>
                <option value="producao">Produção (Validade Fiscal)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Token da API Focus NFe</label>
              <input 
                type="text" 
                required
                placeholder="Insira o token da API..."
                value={focusConfig.focusNfeToken}
                onChange={e => setFocusConfig({ ...focusConfig, focusNfeToken: e.target.value })}
                className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono bg-white outline-none focus:border-blue-500"
              />
            </div>

            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all">
              Salvar Credenciais Focus NFe
            </button>
          </form>
        )}

        {/* ABA 2: CERTIFICADO A1 */}
        {activeTab === 'certificate' && (
          <form onSubmit={handleUploadCertificate} className="max-w-xl space-y-4 animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-slate-800">Upload do Certificado Digital e-CNPJ (A1)</h3>
            <p className="text-xs text-slate-500">O certificado no formato .pfx é utilizado para assinar digitalmente as notas fiscais transmitidas à prefeitura.</p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Arquivo do Certificado (.pfx)</label>
              <input 
                type="file" 
                accept=".pfx"
                onChange={e => setCertFile(e.target.files?.[0] || null)}
                className="w-full p-3 border border-slate-300 rounded-xl text-xs bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Senha do Certificado A1</label>
              <input 
                type="password" 
                required
                placeholder="Insira a senha do certificado..."
                value={certPassword}
                onChange={e => setCertPassword(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl text-xs bg-white outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all">
              Enviar e Validar Certificado A1
            </button>
          </form>
        )}

        {/* ABA 3: REGRAS FISCAIS */}
        {activeTab === 'rules' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800">Cadastro de Regras Fiscais & Alíquotas</h3>
              <p className="text-xs text-slate-500">Defina os códigos de serviço municipal e regras de tributação (incluindo IBS e CBS conforme LC 214/2025).</p>
            </div>

            <form onSubmit={handleCreateTaxRule} className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome da Regra</label>
                <input 
                  type="text" required placeholder="Ex: Taxa de Administração 10%"
                  value={newRule.name} onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs bg-white outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Código do Serviço (LC 116)</label>
                <input 
                  type="text" required placeholder="Ex: 10.05"
                  value={newRule.serviceCode} onChange={e => setNewRule({ ...newRule, serviceCode: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs bg-white outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alíquota ISS (%)</label>
                <input 
                  type="number" step="0.01" value={newRule.issRate} onChange={e => setNewRule({ ...newRule, issRate: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs bg-white outline-none"
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input 
                  type="checkbox" id="ibs" checked={newRule.applyIbsCbs} onChange={e => setNewRule({ ...newRule, applyIbsCbs: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
                <label htmlFor="ibs" className="text-xs font-bold text-slate-700 cursor-pointer">Aplicar Reforma (IBS/CBS - vigência dez/2026)</label>
              </div>
              <div className="sm:col-span-3 flex justify-end">
                <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md">
                  Cadastrar Regra Fiscal
                </button>
              </div>
            </form>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Nome</th>
                    <th className="p-3.5">Código de Serviço</th>
                    <th className="p-3.5">ISS (%)</th>
                    <th className="p-3.5">Reforma Tributária (IBS/CBS)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {taxRules.map(rule => (
                    <tr key={rule.id}>
                      <td className="p-3.5 font-bold text-slate-900">{rule.name}</td>
                      <td className="p-3.5">{rule.serviceCode}</td>
                      <td className="p-3.5">{rule.issRate}%</td>
                      <td className="p-3.5">
                        {rule.applyIbsCbs ? <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Ativo</span> : 'Não'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA 4: NOTAS DE REPASSE (CORRETORES) */}
        {activeTab === 'brokers_invoices' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800">Emissão de Notas de Repasse para Corretores</h3>
              <p className="text-xs text-slate-500">Vincule uma regra fiscal e emita a nota de serviço referente à comissão repassada ao corretor parceiro.</p>
            </div>

            <form onSubmit={handleEmitBrokerInvoice} className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Corretor</label>
                <select 
                  required value={selectedBroker.brokerId} onChange={e => setSelectedBroker({ ...selectedBroker, brokerId: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs bg-white outline-none font-medium"
                >
                  <option value="">Selecione o corretor...</option>
                  {brokers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Regra Fiscal</label>
                <select 
                  required value={selectedBroker.taxRuleId} onChange={e => setSelectedBroker({ ...selectedBroker, taxRuleId: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs bg-white outline-none font-medium"
                >
                  <option value="">Selecione a regra...</option>
                  {taxRules.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Valor do Repasse (R$)</label>
                <input 
                  type="number" step="0.01" required placeholder="0.00"
                  value={selectedBroker.amount} onChange={e => setSelectedBroker({ ...selectedBroker, amount: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs bg-white outline-none font-medium"
                />
              </div>

              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs p-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
                <Send size={16} /> Emitir Nota de Repasse
              </button>
            </form>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Corretor</th>
                    <th className="p-3.5">Valor do Repasse</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Documento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {brokerInvoices.map(inv => (
                    <tr key={inv.id}>
                      <td className="p-3.5 font-bold text-slate-900">{inv.broker?.name || 'Corretor'}</td>
                      <td className="p-3.5 font-bold text-blue-600">R$ {Number(inv.amount).toFixed(2)}</td>
                      <td className="p-3.5">
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">Emitida</span>
                      </td>
                      <td className="p-3.5">
                        {inv.pdfUrl && <a href={inv.pdfUrl} target="_blank" className="text-blue-600 underline font-bold">Baixar PDF</a>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}