'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { 
  FileSignature, Key, Plus, X, Loader2, CheckCircle, 
  XCircle, Home, User, Link as LinkIcon, Briefcase, FileDown,
  Edit, Trash2 // <-- Novos ícones importados
} from 'lucide-react';

export default function PropostasPage() {
  const [activeTab, setActiveTab] = useState<'propostas' | 'termos'>('propostas');
  const [proposals, setProposals] = useState<any[]>([]);
  const [keyTerms, setKeyTerms] = useState<any[]>([]);
  const [storeData, setStoreData] = useState<any>(null); 
  
  const [properties, setProperties] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [brokers, setBrokers] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Novo estado para saber se estamos a editar um registo existente
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    type: 'Venda',
    propertyId: '',
    clientId: '',
    brokerId: '',
    documentUrl: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resProp, resTerm, resImov, resCli, resBrok, resStore] = await Promise.all([
        api.get('/proposals'),
        api.get('/key-terms'),
        api.get('/properties').catch(() => ({ data: [] })),
        api.get('/clients').catch(() => ({ data: [] })),
        api.get('/brokers').catch(() => ({ data: [] })),
        api.get('/my-store').catch(() => ({ data: {} })) 
      ]);
      setProposals(resProp.data);
      setKeyTerms(resTerm.data);
      setProperties(resImov.data);
      setClients(resCli.data);
      setBrokers(resBrok.data);
      setStoreData(resStore.data);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (item: any = null) => {
    if (item) {
      setEditingId(item.id);
      setForm({
        type: item.type,
        propertyId: item.propertyId,
        clientId: item.clientId,
        brokerId: item.brokerId || '',
        documentUrl: item.documentUrl || ''
      });
    } else {
      setEditingId(null);
      setForm({ type: 'Venda', propertyId: '', clientId: '', brokerId: '', documentUrl: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const endpoint = activeTab === 'propostas' ? 'proposals' : 'key-terms';
      
      if (editingId) {
        await api.put(`/${endpoint}/${editingId}`, form);
      } else {
        await api.post(`/${endpoint}`, form);
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      alert('Erro ao salvar o registo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, endpoint: string) => {
    if (!confirm('Deseja realmente excluir este registo? Esta ação não pode ser desfeita.')) return;
    try {
      await api.delete(`/${endpoint}/${id}`);
      fetchData();
    } catch (error) {
      alert('Erro ao excluir registo.');
    }
  };

  const updateStatus = async (id: string, newStatus: string, url: string = 'proposals') => {
    if(!confirm(`Deseja alterar o status para "${newStatus}"?`)) return;
    try {
      await api.patch(`/${url}/${id}/status`, { status: newStatus });
      fetchData();
    } catch (error) {
      alert('Erro ao atualizar status.');
    }
  };

  const handleGeneratePDF = () => {
    if (!form.clientId || !form.propertyId) {
      alert("Por favor, selecione um Cliente e um Imóvel antes de gerar o PDF.");
      return;
    }

    let template = '';
    let titlePDF = '';

    if (activeTab === 'termos') {
      template = storeData?.keyTermTemplate;
      titlePDF = 'Termo de Chaves';
    } else {
      if (form.type === 'Venda') {
        template = storeData?.saleProposalTemplate;
        titlePDF = 'Proposta de Venda';
      } else {
        template = storeData?.rentProposalTemplate;
        titlePDF = 'Proposta de Locação';
      }
    }

    if (!template) {
      alert('O modelo deste documento não está configurado. Vá a Configurações > Modelos e Termos e preencha a caixa correspondente.');
      return;
    }

    const clientData = clients.find(c => c.id === form.clientId);
    const propertyData = properties.find(p => p.id === form.propertyId);

    if (!clientData || !propertyData) {
      alert('Erro ao encontrar os dados do cliente ou imóvel para gerar o PDF.');
      return;
    }

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const clienteNome = clientData.clientType === 'PJ' ? clientData.corporateName : clientData.name;
    const endereco = propertyData.neighborhood ? `${propertyData.address} - ${propertyData.neighborhood}, ${propertyData.city}` : propertyData.address;

    let html = template
      .replace(/{{NOME_CLIENTE}}/g, clienteNome || '_________________________')
      .replace(/{{CPF_CLIENTE}}/g, clientData.document || '_________________________')
      .replace(/{{CPF_CNPJ}}/g, clientData.document || '_________________________')
      .replace(/{{TELEFONE}}/g, clientData.phone || '_________________________')
      .replace(/{{EMAIL}}/g, clientData.email || '_________________________')
      .replace(/{{ENDERECO_IMOVEL}}/g, endereco || '_________________________')
      .replace(/{{VALOR}}/g, formatCurrency(propertyData.price) || '_________________________')
      .replace(/{{NOME_IMOBILIARIA}}/g, storeData?.tradeName || 'Imobiliária')
      .replace(/{{ESCOLARIDADE}}/g, clientData.educationLevel || 'Não informada')
      .replace(/{{LINK_DRIVE}}/g, clientData.financingDriveLink || 'Nenhum link anexado');

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${titlePDF} - ${clienteNome}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
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
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto font-sans animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <FileSignature className="text-blue-600 bg-blue-50 p-1.5 rounded-lg" size={36} />
            Propostas e Termos
          </h1>
          <p className="text-slate-500 mt-2 text-sm">Gira as propostas de negociação e a entrega de chaves (obrigatório para gerar contrato).</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm">
          <Plus size={18} /> {activeTab === 'propostas' ? 'Nova Proposta' : 'Novo Termo de Chaves'}
        </button>
      </div>

      {/* ABAS */}
      <div className="flex gap-4 border-b border-slate-200 mb-6">
        <button 
          onClick={() => setActiveTab('propostas')} 
          className={`pb-4 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'propostas' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <FileSignature size={18} /> Propostas Negociais
        </button>
        <button 
          onClick={() => setActiveTab('termos')} 
          className={`pb-4 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'termos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Key size={18} /> Termos de Chaves
        </button>
      </div>

      {/* LISTAGEM: PROPOSTAS */}
      {activeTab === 'propostas' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="p-4">Imóvel & Operação</th>
                <th className="p-4">Cliente / Corretor</th>
                <th className="p-4">Documento (PDF)</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? <tr><td colSpan={5} className="p-8 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2"/> Carregando...</td></tr> : 
               proposals.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhuma proposta registada.</td></tr> :
               proposals.map(p => (
                 <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                   <td className="p-4">
                     <p className="font-bold text-slate-800 flex items-center gap-2"><Home size={14} className="text-slate-400"/> {p.property?.title}</p>
                     <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded border ${p.type === 'Venda' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>{p.type.toUpperCase()}</span>
                   </td>
                   <td className="p-4">
                     <p className="font-bold text-slate-700 flex items-center gap-2"><User size={14} className="text-slate-400"/> {p.client?.name}</p>
                     <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Briefcase size={12}/> {p.broker?.name || 'Sem corretor'}</p>
                   </td>
                   <td className="p-4">
                     {p.documentUrl ? (
                       <a href={p.documentUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1 text-xs font-bold"><LinkIcon size={14}/> Ver Proposta</a>
                     ) : <span className="text-slate-400 text-xs">Não anexado</span>}
                   </td>
                   <td className="p-4 text-center">
                     <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border 
                       ${p.status === 'Aceita' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                         p.status === 'Recusada' ? 'bg-red-50 text-red-700 border-red-200' : 
                         'bg-amber-50 text-amber-700 border-amber-200'}`}>
                       {p.status}
                     </span>
                   </td>
                   <td className="p-4 text-right">
                     <div className="flex items-center justify-end gap-1">
                       {p.status === 'Pendente' && (
                         <>
                           <button onClick={() => updateStatus(p.id, 'Aceita', 'proposals')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent" title="Aprovar"><CheckCircle size={16}/></button>
                           <button onClick={() => updateStatus(p.id, 'Recusada', 'proposals')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent" title="Recusar"><XCircle size={16}/></button>
                         </>
                       )}
                       <button onClick={() => handleOpenModal(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar Proposta"><Edit size={16}/></button>
                       <button onClick={() => handleDelete(p.id, 'proposals')} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={16}/></button>
                     </div>
                   </td>
                 </tr>
               ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* LISTAGEM: TERMOS DE CHAVES */}
      {activeTab === 'termos' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="p-4">Imóvel & Operação</th>
                <th className="p-4">Cliente recebedor</th>
                <th className="p-4">Termo (PDF)</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? <tr><td colSpan={5} className="p-8 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2"/> Carregando...</td></tr> : 
               keyTerms.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhum termo registado.</td></tr> :
               keyTerms.map(t => (
                 <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                   <td className="p-4">
                     <p className="font-bold text-slate-800 flex items-center gap-2"><Home size={14} className="text-slate-400"/> {t.property?.title}</p>
                     <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-100 text-slate-600 border-slate-200">{t.type.toUpperCase()}</span>
                   </td>
                   <td className="p-4">
                     <p className="font-bold text-slate-700 flex items-center gap-2"><User size={14} className="text-slate-400"/> {t.client?.name}</p>
                   </td>
                   <td className="p-4">
                     {t.documentUrl ? (
                       <a href={t.documentUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1 text-xs font-bold"><LinkIcon size={14}/> Ver Termo</a>
                     ) : <span className="text-slate-400 text-xs">Não anexado</span>}
                   </td>
                   <td className="p-4 text-center">
                     <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border 
                       ${t.status === 'Assinado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                       {t.status}
                     </span>
                   </td>
                   <td className="p-4 text-right">
                     <div className="flex items-center justify-end gap-1">
                       {t.status === 'Pendente' && (
                         <button onClick={() => updateStatus(t.id, 'Assinado', 'key-terms')} className="px-3 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100 mr-2">
                           Assinar
                         </button>
                       )}
                       <button onClick={() => handleOpenModal(t)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent" title="Editar Termo"><Edit size={16}/></button>
                       <button onClick={() => handleDelete(t.id, 'key-terms')} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent" title="Excluir"><Trash2 size={16}/></button>
                     </div>
                   </td>
                 </tr>
               ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL CADASTRAR/EDITAR */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {editingId ? <Edit className="text-blue-600" size={24}/> : <Plus className="text-blue-600" size={24}/>}
                {editingId 
                  ? (activeTab === 'propostas' ? 'Editar Proposta' : 'Editar Termo') 
                  : (activeTab === 'propostas' ? 'Registar Nova Proposta' : 'Registar Termo')}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-200 p-2 rounded-lg transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Natureza *</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                    <option value="Venda">Venda</option>
                    <option value="Locação">Locação</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Corretor Intermediador</label>
                  <select value={form.brokerId} onChange={e => setForm({...form, brokerId: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                    <option value="">Sem corretor / Direto</option>
                    {brokers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Imóvel Alvo *</label>
                <select required value={form.propertyId} onChange={e => setForm({...form, propertyId: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                  <option value="">Selecione...</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Cliente Interessado *</label>
                <select required value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                  <option value="">Selecione...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.document})</option>)}
                </select>
              </div>

              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
                  <div className="w-full">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Link do Documento (Drive/PDF) após assinado</label>
                    <input type="url" value={form.documentUrl} onChange={e => setForm({...form, documentUrl: e.target.value})} placeholder="https://..." className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" />
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 mt-2">
                  <p className="text-xs text-slate-500 mb-2 font-medium">Precisa gerar o documento em PDF?</p>
                  <button 
                    type="button" 
                    onClick={handleGeneratePDF}
                    className="w-full md:w-auto px-4 py-2.5 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <FileDown size={16}/> Imprimir / Salvar PDF ({activeTab === 'propostas' ? `Proposta de ${form.type}` : 'Termo de Chaves'})
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all flex items-center gap-2">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <FileSignature size={16}/>} {editingId ? 'Salvar Alterações' : 'Salvar Registo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}