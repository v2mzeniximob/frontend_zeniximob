'use client';

import { useState, useEffect } from 'react';
import { api } from '@/src/lib/api';
import { 
  FileSignature, Plus, Search, Loader2, Home, User, Link as LinkIcon, 
  FileDown, AlertCircle, X, CheckSquare, Trash2, Calendar, DollarSign, Key
} from 'lucide-react';

const initialForm = {
  type: 'Locação',
  propertyId: '',
  tenantId: '',
  startDate: '',
  endDate: '',
  rentValue: '',
  adminFeePercent: '',
  documentUrl: '',
  depositValue: '', // NOVO CAMPO: CAUÇÃO
  depositDate: ''   // NOVO CAMPO: DATA CAUÇÃO
};

export default function ContratosPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [storeData, setStoreData] = useState<any>(null); 
  
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
      const [resContracts, resProps, resClients, resStore] = await Promise.all([
        api.get('/contracts'),
        api.get('/properties').catch(() => ({ data: [] })),
        api.get('/clients').catch(() => ({ data: [] })),
        api.get('/my-store').catch(() => ({ data: {} }))
      ]);
      setContracts(resContracts.data);
      setProperties(resProps.data.filter((p: any) => p.rentStatus === 'Vago' || p.rentStatus === 'Disponível'));
      setClients(resClients.data);
      setStoreData(resStore.data);
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
    setIsSaving(true);
    try {
      await api.post('/contracts', formData);
      alert('Contrato gerado com sucesso! Faturas criadas no sistema.');
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao emitir contrato. Verifique se existe uma Proposta Aceita.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm('Tem certeza? Isso excluirá o contrato e todas as faturas geradas, e o imóvel voltará a ficar vago.')) return;
    try {
      await api.delete(`/contracts/${id}`);
      fetchData();
    } catch (error) {
      alert('Erro ao excluir contrato.');
    }
  };

  const handleGeneratePDF = () => {
    if (!formData.tenantId || !formData.propertyId) {
      alert("Por favor, selecione um Imóvel e um Cliente antes de gerar o PDF.");
      return;
    }

    const template = formData.type === 'Venda' ? storeData?.saleContractTemplate : storeData?.tenantContractTemplate;
    const titlePDF = formData.type === 'Venda' ? 'Contrato de Venda' : 'Contrato de Locação';

    if (!template) {
      alert(`O modelo do ${titlePDF} não está configurado. Vá a Configurações > Modelos e Termos para configurá-lo.`);
      return;
    }

    const clientData = clients.find(c => c.id === formData.tenantId);
    const propertyData = properties.find(p => p.id === formData.propertyId);

    if (!clientData || !propertyData) {
      alert('Erro ao carregar dados do cliente ou imóvel.');
      return;
    }

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const clienteNome = clientData.clientType === 'PJ' ? clientData.corporateName : clientData.name;
    const endereco = propertyData.neighborhood ? `${propertyData.address}, ${propertyData.neighborhood}, ${propertyData.city}` : propertyData.address;

    let html = template
      .replace(/{{NOME_CLIENTE}}/g, clienteNome || '_________________________')
      .replace(/{{CPF_CLIENTE}}/g, clientData.document || '_________________________')
      .replace(/{{CPF_CNPJ}}/g, clientData.document || '_________________________')
      .replace(/{{TELEFONE}}/g, clientData.phone || '_________________________')
      .replace(/{{EMAIL}}/g, clientData.email || '_________________________')
      .replace(/{{ENDERECO_IMOVEL}}/g, endereco || '_________________________')
      .replace(/{{VALOR}}/g, formData.rentValue ? `R$ ${formData.rentValue}` : formatCurrency(propertyData.price))
      .replace(/{{NOME_IMOBILIARIA}}/g, storeData?.tradeName || 'Imobiliária');

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

  const filteredContracts = contracts.filter(c => 
    c.property?.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto font-sans animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <FileSignature className="text-blue-600 bg-blue-50 p-1.5 rounded-lg" size={36} />
            Gestão de Contratos
          </h1>
          <p className="text-slate-500 mt-2 text-sm">Emita novos contratos para gerar as faturas automaticamente no painel financeiro.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por Imóvel ou Cliente..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
            />
          </div>
          <button 
            onClick={handleOpenModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm whitespace-nowrap text-sm"
          >
            <Plus size={18} /> Emitir Contrato
          </button>
        </div>
      </div>

      {/* LISTAGEM DE CONTRATOS */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
              <th className="p-4">Imóvel & Tipo</th>
              <th className="p-4">Inquilino / Comprador</th>
              <th className="p-4">Início</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {isLoading ? <tr><td colSpan={5} className="p-8 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2"/> Carregando contratos...</td></tr> : 
             filteredContracts.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhum contrato ativo.</td></tr> :
             filteredContracts.map(c => (
               <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                 <td className="p-4">
                   <p className="font-bold text-slate-800 flex items-center gap-2"><Home size={14} className="text-slate-400"/> {c.property?.title}</p>
                   <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded border ${c.type === 'Venda' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{c.type.toUpperCase()}</span>
                 </td>
                 <td className="p-4">
                   <p className="font-bold text-slate-700 flex items-center gap-2"><User size={14} className="text-slate-400"/> {c.tenant?.name}</p>
                 </td>
                 <td className="p-4">
                   <p className="text-slate-600 flex items-center gap-2"><Calendar size={14} className="text-slate-400"/> {new Date(c.startDate).toLocaleDateString('pt-BR')}</p>
                 </td>
                 <td className="p-4 text-center">
                   <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border 
                     ${c.status === 'Ativo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                     {c.status}
                   </span>
                 </td>
                 <td className="p-4 text-right">
                   <div className="flex justify-end gap-3 items-center">
                     {c.documentUrl ? (
                       <a href={c.documentUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 font-bold text-xs flex items-center gap-1"><LinkIcon size={14}/> PDF</a>
                     ) : <span className="text-slate-400 text-xs">S/ Doc</span>}
                     <button onClick={() => handleDelete(c.id)} className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded transition-colors" title="Excluir"><Trash2 size={16}/></button>
                   </div>
                 </td>
               </tr>
             ))
            }
          </tbody>
        </table>
      </div>

      {/* MODAL EMISSÃO DE CONTRATO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileSignature className="text-blue-600" size={24}/> Emissão de Contrato
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-200 p-2 rounded-lg transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* TIPO DE CONTRATO */}
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.type === 'Locação' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>
                  <input type="radio" name="type" value="Locação" checked={formData.type === 'Locação'} onChange={(e) => setFormData({...formData, type: e.target.value})} className="hidden" />
                  <Key size={18}/> <span className="font-bold text-sm">Locação (Aluguel)</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.type === 'Venda' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>
                  <input type="radio" name="type" value="Venda" checked={formData.type === 'Venda'} onChange={(e) => setFormData({...formData, type: e.target.value})} className="hidden" />
                  <DollarSign size={18}/> <span className="font-bold text-sm">Venda de Imóvel</span>
                </label>
              </div>

              {/* IMÓVEL E INQUILINO */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Selecione o Imóvel *</label>
                  <select required value={formData.propertyId} onChange={e => setFormData({...formData, propertyId: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                    <option value="">Selecione...</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Selecione o {formData.type === 'Venda' ? 'Comprador' : 'Inquilino'} *</label>
                  <select required value={formData.tenantId} onChange={e => setFormData({...formData, tenantId: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                    <option value="">Selecione...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* DADOS FINANCEIROS */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="text-slate-400">$</span> DADOS FINANCEIROS & PRAZOS
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Data de Início / 1ª Parcela *</label>
                    <input required type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Data de Término do Contrato {formData.type === 'Venda' && '(Opcional)'}</label>
                    <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white" />
                    {formData.type === 'Venda' && <p className="text-[10px] text-slate-400 mt-1">Deixe vazio para gerar apenas 1 parcela/fatura.</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Valor {formData.type === 'Venda' ? 'Total (R$)' : 'Mensal do Aluguel (R$)'} *</label>
                    <input required type="number" step="0.01" value={formData.rentValue} onChange={e => setFormData({...formData, rentValue: e.target.value})} placeholder="0.00" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Taxa Admin / Comissão (%)</label>
                    <input type="number" step="0.1" value={formData.adminFeePercent} onChange={e => setFormData({...formData, adminFeePercent: e.target.value})} placeholder="Ex: 10" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white" />
                  </div>
                </div>

                {/* NOVO BLOCO: CAUÇÃO */}
                {formData.type === 'Locação' && (
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Valor do Caução (R$) (Opcional)</label>
                      <input type="number" step="0.01" value={formData.depositValue} onChange={e => setFormData({...formData, depositValue: e.target.value})} placeholder="0.00" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Vencimento do Caução</label>
                      <input type="date" value={formData.depositDate} onChange={e => setFormData({...formData, depositDate: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* LINK DO CONTRATO + BOTÃO DE PDF */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-1">Link do Contrato Assinado (PDF / Drive)</label>
                <input type="url" value={formData.documentUrl} onChange={e => setFormData({...formData, documentUrl: e.target.value})} placeholder="https://..." className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white mb-4" />
                
                <div className="border-t border-slate-200 pt-4 flex flex-col md:flex-row justify-between items-center gap-4">
                  <p className="text-xs text-slate-500 font-medium">Ainda não gerou o documento?</p>
                  <button type="button" onClick={handleGeneratePDF} className="w-full md:w-auto px-4 py-2.5 text-xs font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm">
                    <FileDown size={16}/> Gerar e Imprimir Contrato (PDF)
                  </button>
                </div>
              </div>

              {/* AVISO DO SISTEMA */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-amber-800 text-sm">
                <AlertCircle className="shrink-0 mt-0.5" size={18}/>
                <div>
                  <p className="font-bold mb-1">Atenção: <span className="font-normal">Ao salvar, o sistema irá automaticamente:</span></p>
                  <ol className="list-decimal pl-4 space-y-1 text-xs font-medium text-amber-700">
                    <li>Mudar o status do imóvel para <strong>{formData.type === 'Venda' ? 'Vendido' : 'Alugado'}</strong>.</li>
                    <li>Mudar o perfil do cliente para <strong>{formData.type === 'Venda' ? 'Comprador' : 'Inquilino'}</strong>.</li>
                    <li>Gerar as faturas financeiras {formData.depositValue ? '(incluindo Caução)' : ''}.</li>
                  </ol>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all flex items-center gap-2">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckSquare size={16}/>} Confirmar & Gerar Faturas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}