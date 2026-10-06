'use client';

import { useState, useEffect } from 'react';
import { api } from '@/src/lib/api';
import { 
  FileSignature, Plus, Search, Loader2, FileDown, 
  Trash2, Building2, Briefcase, Link as LinkIcon, CheckSquare,
  X
} from 'lucide-react';

const initialForm = {
  type: 'MASTER_IMOBILIARIA',
  franchiseeId: '',
  realEstateId: '',
  startDate: '',
  endDate: '',
  value: '',
  documentUrl: ''
};

export default function MasterContratosPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [realEstates, setRealEstates] = useState<any[]>([]);
  const [franchisees, setFranchisees] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<any>(initialForm);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resContracts, resRealEstates, resFranchisees, resConfig] = await Promise.all([
        api.get('/master/contracts'),
        api.get('/real-estates').catch(() => ({ data: [] })), // Busca as imobiliárias cadastradas
        api.get('/franchisees').catch(() => ({ data: [] })),   // Busca os franqueados cadastrados
        api.get('/master/config').catch(() => ({ data: {} }))
      ]);
      setContracts(resContracts.data);
      setRealEstates(resRealEstates.data);
      setFranchisees(resFranchisees.data);
      setConfig(resConfig.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.type === 'MASTER_FRANQUEADO' && !formData.franchiseeId) return alert('Selecione o Franqueado.');
    if (formData.type === 'MASTER_IMOBILIARIA' && !formData.realEstateId) return alert('Selecione a Imobiliária.');
    if (formData.type === 'FRANQUEADO_IMOBILIARIA' && (!formData.realEstateId || !formData.franchiseeId)) return alert('Selecione o Franqueado e a Imobiliária.');

    setIsSaving(true);
    try {
      await api.post('/master/contracts', formData);
      alert('Contrato gerado com sucesso! Faturas de cobrança criadas no sistema SaaS.');
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao emitir contrato.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm('Atenção: Isso excluirá o contrato e todas as faturas geradas. Continuar?')) return;
    try {
      await api.delete(`/master/contracts/${id}`);
      fetchData();
    } catch (error) {
      alert('Erro ao excluir contrato.');
    }
  };

  // ==========================================
  // GERADOR DE PDF INTELIGENTE
  // ==========================================
  const handleGeneratePDF = () => {
    let template = '';
    let titlePDF = 'Contrato SaaS';
    let nomeFranqueado = 'N/A';
    let cnpjFranqueado = 'N/A';
    let nomeImobiliaria = 'N/A';
    let cnpjImobiliaria = 'N/A';

    // Captura os dados com base na escolha
    if (formData.franchiseeId) {
      const f = franchisees.find(x => x.id === formData.franchiseeId);
      if (f) { nomeFranqueado = f.tradeName || f.corporateName; cnpjFranqueado = f.cnpj; }
    }
    if (formData.realEstateId) {
      const r = realEstates.find(x => x.id === formData.realEstateId);
      if (r) { nomeImobiliaria = r.tradeName || r.corporateName; cnpjImobiliaria = r.cnpj; }
    }

    // Seleciona o Template correto configurado no banco de dados do Master
    if (formData.type === 'MASTER_FRANQUEADO') {
      template = config?.templateMasterFranchisee;
      titlePDF = 'Contrato de Franquia';
    } else if (formData.type === 'MASTER_IMOBILIARIA') {
      template = config?.templateMasterRealEstate;
      titlePDF = 'Contrato Zenix x Imobiliária';
    } else {
      template = config?.templateFranchiseeRealEstate;
      titlePDF = 'Contrato Franqueado x Imobiliária';
    }

    if (!template) {
      alert('O modelo HTML para este tipo de contrato não foi salvo. Vá a Configurações > Modelos de Contrato para configurá-lo.');
      return;
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    // Troca as tags HTML pelas variáveis reais
    const html = template
      .replace(/{{NOME_FRANQUEADO}}/g, nomeFranqueado)
      .replace(/{{CNPJ_FRANQUEADO}}/g, cnpjFranqueado)
      .replace(/{{NOME_IMOBILIARIA}}/g, nomeImobiliaria)
      .replace(/{{CNPJ_IMOBILIARIA}}/g, cnpjImobiliaria)
      .replace(/{{CNPJ}}/g, formData.type === 'MASTER_FRANQUEADO' ? cnpjFranqueado : cnpjImobiliaria)
      .replace(/{{VALOR}}/g, formatCurrency(Number(formData.value)))
      .replace(/{{DATA}}/g, dataAtual);

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${titlePDF}</title>
            <style>body { font-family: Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; max-width: 900px; margin: auto; }</style>
          </head>
          <body>
            ${html}
            <script>window.onload = function() { window.print(); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const filteredContracts = contracts.filter(c => 
    c.franchisee?.tradeName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.realEstate?.tradeName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto font-sans animate-in fade-in duration-300 pb-20">
      
      {/* HEADER MASTER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <span className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3 inline-block shadow-sm">Zenix Master</span>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <FileSignature className="text-indigo-600 bg-indigo-50 p-1.5 rounded-lg" size={36} />
            Contratos SaaS & Franquias
          </h1>
          <p className="text-slate-500 mt-2 text-sm">Gere contratos e inicie as cobranças recorrentes para imobiliárias e franqueados.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" placeholder="Buscar por cliente..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm bg-white shadow-sm"
            />
          </div>
          <button onClick={handleOpenModal} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md whitespace-nowrap text-sm">
            <Plus size={18} /> Emitir Contrato
          </button>
        </div>
      </div>

      {/* LISTAGEM DE CONTRATOS */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden min-h-[500px]">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
              <th className="p-4 pl-6">Tipo / Vínculo</th>
              <th className="p-4">Cliente (Imobiliária/Franquia)</th>
              <th className="p-4">Mensalidade</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 pr-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {isLoading ? <tr><td colSpan={5} className="p-12 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2"/> Carregando ecossistema...</td></tr> : 
             filteredContracts.length === 0 ? <tr><td colSpan={5} className="p-12 text-center text-slate-400">Nenhum contrato ativo.</td></tr> :
             filteredContracts.map(c => (
               <tr key={c.id} className="hover:bg-indigo-50/30 transition-colors">
                 <td className="p-4 pl-6">
                   <span className="inline-block mt-1 text-[10px] font-bold px-2.5 py-1 rounded-md border bg-slate-100 text-slate-600 border-slate-200">
                     {c.type.replace(/_/g, ' x ')}
                   </span>
                 </td>
                 <td className="p-4">
                   {c.realEstate && <p className="font-bold text-slate-800 flex items-center gap-2"><Building2 size={14} className="text-indigo-500"/> {c.realEstate.tradeName || c.realEstate.corporateName}</p>}
                   {c.franchisee && <p className="font-bold text-slate-700 flex items-center gap-2 mt-1"><Briefcase size={14} className="text-amber-500"/> {c.franchisee.tradeName || c.franchisee.corporateName}</p>}
                 </td>
                 <td className="p-4">
                   <p className="font-black text-indigo-700">R$ {c.value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                   <p className="text-xs text-slate-400">{c.invoices?.length || 0} faturas geradas</p>
                 </td>
                 <td className="p-4 text-center">
                   <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                     {c.status}
                   </span>
                 </td>
                 <td className="p-4 pr-6 text-right">
                   <div className="flex justify-end gap-3 items-center">
                     {c.documentUrl ? (
                       <a href={c.documentUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"><LinkIcon size={14}/> Ver Doc</a>
                     ) : <span className="text-slate-400 text-xs italic">S/ Doc</span>}
                     <button onClick={() => handleDelete(c.id)} className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors" title="Excluir"><Trash2 size={16}/></button>
                   </div>
                 </td>
               </tr>
             ))
            }
          </tbody>
        </table>
      </div>

      {/* MODAL DE EMISSÃO DE CONTRATO MASTER */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <FileSignature className="text-indigo-600" size={24}/> Novo Contrato SaaS
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-200 p-2 rounded-xl transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* TIPO DE CONTRATO */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Natureza do Contrato *</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-bold text-slate-700 text-sm outline-none">
                  <option value="MASTER_IMOBILIARIA">1. Zenix Master ➔ Imobiliária (Direta)</option>
                  <option value="MASTER_FRANQUEADO">2. Zenix Master ➔ Franqueado (Sócio)</option>
                  <option value="FRANQUEADO_IMOBILIARIA">3. Franqueado ➔ Imobiliária (Intermediação)</option>
                </select>
              </div>

              {/* SELEÇÃO DINÂMICA DE CLIENTES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {(formData.type === 'MASTER_FRANQUEADO' || formData.type === 'FRANQUEADO_IMOBILIARIA') && (
                  <div className="animate-in fade-in">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Selecione o Franqueado</label>
                    <select required value={formData.franchiseeId} onChange={e => setFormData({...formData, franchiseeId: e.target.value})} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-sm outline-none">
                      <option value="">Selecione...</option>
                      {franchisees.map(f => <option key={f.id} value={f.id}>{f.tradeName || f.corporateName}</option>)}
                    </select>
                  </div>
                )}
                
                {(formData.type === 'MASTER_IMOBILIARIA' || formData.type === 'FRANQUEADO_IMOBILIARIA') && (
                  <div className="animate-in fade-in">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Selecione a Imobiliária</label>
                    <select required value={formData.realEstateId} onChange={e => setFormData({...formData, realEstateId: e.target.value})} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-sm outline-none">
                      <option value="">Selecione...</option>
                      {realEstates.map(r => <option key={r.id} value={r.id}>{r.tradeName || r.corporateName}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* DADOS FINANCEIROS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mensalidade (R$) *</label>
                  <input required type="number" step="0.01" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} placeholder="0.00" className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Início da Cobrança *</label>
                  <input required type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fim do Contrato</label>
                  <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white" />
                </div>
              </div>

              {/* PDF E LINKS */}
              <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="w-full">
                  <label className="block text-sm font-bold text-indigo-900 mb-1">Anexar Contrato (ZapSign / Drive)</label>
                  <input type="url" value={formData.documentUrl} onChange={e => setFormData({...formData, documentUrl: e.target.value})} placeholder="https://..." className="w-full px-4 py-2.5 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white" />
                </div>
                <div className="shrink-0 pt-5">
                  <button type="button" onClick={handleGeneratePDF} className="w-full px-4 py-2.5 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-100 border border-indigo-300 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm">
                    <FileDown size={16}/> Imprimir PDF
                  </button>
                </div>
              </div>

              {/* BOTÕES FINAIS */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all flex items-center gap-2 shadow-md">
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckSquare size={18}/>} Gerar Contrato & Faturas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}