'use client';

import { useState, useEffect } from 'react';
import { api } from '@/src/lib/api';
import { 
  Wallet, Search, Loader2, CheckCircle2, Clock, AlertTriangle, 
  Building2, Briefcase, QrCode, DollarSign, X, Copy, Barcode, ExternalLink
} from 'lucide-react';

export default function MasterFinanceiroPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'Pendente' | 'Pago'>('Pendente');

  // Estados do Modal PIX / Boleto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCharge, setSelectedCharge] = useState<any>(null);
  const [chargeType, setChargeType] = useState<'pix' | 'boleto'>('pix');
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/master/invoices');
      setInvoices(res.data);
    } catch (error) {
      console.error('Erro ao carregar faturas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    if (!confirm('Confirmar o recebimento desta fatura? O status mudará para Pago.')) return;
    try {
      await api.patch(`/master/invoices/${id}/pay`);
      alert('Fatura recebida com sucesso!');
      fetchInvoices();
    } catch (error) {
      alert('Erro ao dar baixa na fatura.');
    }
  };

  // GERAR PIX OU BOLETO E ABRIR MODAL
  const handleGenerateCharge = async (invoiceId: string, method: 'pix' | 'boleto') => {
    setGeneratingId(invoiceId);
    try {
      const res = await api.post(`/master/invoices/${invoiceId}/charge`, { method });
      setSelectedCharge(res.data.invoice);
      setChargeType(res.data.method);
      setIsModalOpen(true);
      fetchInvoices(); // Atualiza a lista no fundo
    } catch (error: any) {
      alert(error.response?.data?.error || `Erro ao gerar ${method} no Mercado Pago.`);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleCopyPix = () => {
    if (selectedCharge?.pixQrCode) {
      navigator.clipboard.writeText(selectedCharge.pixQrCode);
      alert('Código PIX Copia e Cola copiado para a área de transferência!');
    }
  };

  const now = new Date();
  const filteredInvoices = invoices.filter(inv => {
    if (activeTab === 'Pendente' && inv.status === 'Pago') return false;
    if (activeTab === 'Pago' && inv.status !== 'Pago') return false;

    const clientName = (inv.masterContract?.realEstate?.tradeName || inv.masterContract?.franchisee?.tradeName || '').toLowerCase();
    if (searchTerm && !clientName.includes(searchTerm.toLowerCase())) return false;

    return true;
  });

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const totalReceber = invoices.filter(i => i.status !== 'Pago').reduce((acc, i) => acc + i.amount, 0);
  const totalRecebido = invoices.filter(i => i.status === 'Pago').reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="p-8 max-w-[1600px] mx-auto font-sans animate-in fade-in duration-300 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <span className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3 inline-block shadow-sm">Zenix Master</span>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Wallet className="text-indigo-600 bg-indigo-50 p-1.5 rounded-lg" size={36} />
            Financeiro & Recebíveis
          </h1>
          <p className="text-slate-500 mt-2 text-sm">Gere cobranças (PIX/Boleto) das suas imobiliárias e franqueados.</p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-end min-w-[160px]">
            <span className="text-xs font-bold text-slate-400 uppercase">A Receber</span>
            <span className="text-xl font-black text-indigo-600">{formatCurrency(totalReceber)}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-end min-w-[160px]">
            <span className="text-xs font-bold text-slate-400 uppercase">Recebido (Total)</span>
            <span className="text-xl font-black text-emerald-600">{formatCurrency(totalRecebido)}</span>
          </div>
        </div>
      </div>

      {/* CONTROLES E BUSCA */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 w-full md:w-auto">
          <button onClick={() => setActiveTab('Pendente')} className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'Pendente' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
            <Clock size={16}/> Em Aberto
          </button>
          <button onClick={() => setActiveTab('Pago')} className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'Pago' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}>
            <CheckCircle2 size={16}/> Pagas
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" placeholder="Buscar por cliente..." 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm bg-white shadow-sm"
          />
        </div>
      </div>

      {/* LISTAGEM DE FATURAS */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden min-h-[500px]">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
              <th className="p-4 pl-6">Vencimento</th>
              <th className="p-4">Cliente / Origem</th>
              <th className="p-4">Descrição</th>
              <th className="p-4">Valor</th>
              <th className="p-4 pr-6 text-right">Ações de Cobrança</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {isLoading ? <tr><td colSpan={5} className="p-12 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2"/> Carregando faturas...</td></tr> : 
             filteredInvoices.length === 0 ? <tr><td colSpan={5} className="p-12 text-center text-slate-400">Nenhuma fatura encontrada.</td></tr> :
             filteredInvoices.map(inv => {
               const dueDate = new Date(inv.dueDate);
               const isOverdue = inv.status !== 'Pago' && dueDate < now;

               return (
                 <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                   <td className="p-4 pl-6">
                     <div className={`flex items-center gap-2 font-bold ${isOverdue ? 'text-red-600' : 'text-slate-700'}`}>
                       {isOverdue ? <AlertTriangle size={16}/> : <Clock size={16} className="text-slate-400"/>}
                       {dueDate.toLocaleDateString('pt-BR')}
                     </div>
                     {isOverdue && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold mt-1 inline-block">Atrasada</span>}
                   </td>
                   <td className="p-4">
                     {inv.masterContract?.realEstate && <p className="font-bold text-slate-800 flex items-center gap-2"><Building2 size={14} className="text-indigo-500"/> {inv.masterContract.realEstate.tradeName || inv.masterContract.realEstate.corporateName}</p>}
                     {inv.masterContract?.franchisee && <p className="font-bold text-slate-700 flex items-center gap-2 mt-1"><Briefcase size={14} className="text-amber-500"/> {inv.masterContract.franchisee.tradeName || inv.masterContract.franchisee.corporateName}</p>}
                   </td>
                   <td className="p-4">
                     <p className="text-slate-600">{inv.description}</p>
                   </td>
                   <td className="p-4">
                     <p className="font-black text-slate-800 text-base">{formatCurrency(inv.amount)}</p>
                   </td>
                   <td className="p-4 pr-6 text-right">
                     {inv.status === 'Pago' ? (
                       <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs">
                         <CheckCircle2 size={16}/> Recebido
                       </span>
                     ) : (
                       <div className="flex justify-end gap-2">
                         {/* BOTÃO PIX */}
                         <button 
                           onClick={() => handleGenerateCharge(inv.id, 'pix')} 
                           disabled={generatingId === inv.id}
                           className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 border bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 shadow-sm"
                         >
                           {generatingId === inv.id ? <Loader2 size={14} className="animate-spin"/> : <QrCode size={14}/>} PIX
                         </button>
                         
                         {/* BOTÃO BOLETO */}
                         <button 
                           onClick={() => handleGenerateCharge(inv.id, 'boleto')} 
                           disabled={generatingId === inv.id}
                           className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 border bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 shadow-sm"
                         >
                           {generatingId === inv.id ? <Loader2 size={14} className="animate-spin"/> : <Barcode size={14}/>} Boleto
                         </button>
                         
                         {/* BOTÃO BAIXA MANUAL */}
                         <button onClick={() => handleMarkAsPaid(inv.id)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm">
                           <CheckCircle2 size={14}/> Baixa
                         </button>
                       </div>
                     )}
                   </td>
                 </tr>
               );
             })
            }
          </tbody>
        </table>
      </div>

      {/* MODAL: EXIBIÇÃO DA COBRANÇA (PIX OU BOLETO) */}
      {isModalOpen && selectedCharge && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 text-center">
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                {chargeType === 'pix' ? <><QrCode size={18} className="text-indigo-600"/> Pagamento via PIX</> : <><Barcode size={18} className="text-indigo-600"/> Boleto Bancário</>}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            
            <div className="p-6 space-y-4 flex flex-col items-center">
              
              {/* LAYOUT SE FOR PIX */}
              {chargeType === 'pix' && (
                <>
                  <p className="text-sm text-slate-500 font-medium">Escaneie o código abaixo com o aplicativo do seu banco:</p>
                  {selectedCharge.pixQrCodeBase64 ? (
                    <div className="p-2 border-2 border-indigo-100 rounded-2xl bg-white shadow-sm inline-block">
                      <img src={`data:image/jpeg;base64,${selectedCharge.pixQrCodeBase64}`} alt="QR Code PIX" className="w-48 h-48 object-contain" />
                    </div>
                  ) : (
                    <div className="w-48 h-48 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 text-xs text-center p-4">
                      QR Code indisponível.
                    </div>
                  )}

                  <p className="text-2xl font-black text-slate-800 mt-2">{formatCurrency(selectedCharge.amount)}</p>

                  <div className="w-full mt-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-left">Ou use o PIX Copia e Cola</p>
                    <div className="flex gap-2">
                      <input type="text" readOnly value={selectedCharge.pixQrCode || ''} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-xs text-slate-500 truncate outline-none" />
                      <button onClick={handleCopyPix} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center shrink-0"><Copy size={16}/></button>
                    </div>
                  </div>
                </>
              )}

              {/* LAYOUT SE FOR BOLETO */}
              {chargeType === 'boleto' && (
                <>
                  <div className="w-24 h-24 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-2">
                    <Barcode size={48} />
                  </div>
                  <p className="text-2xl font-black text-slate-800">{formatCurrency(selectedCharge.amount)}</p>
                  <p className="text-sm text-slate-500 font-medium mb-4">O seu boleto foi gerado com sucesso pelo Mercado Pago.</p>
                  
                  {selectedCharge.ticketUrl ? (
                    <a href={selectedCharge.ticketUrl} target="_blank" rel="noreferrer" className="w-full py-3.5 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md">
                      <ExternalLink size={18}/> Acessar Boleto para Impressão
                    </a>
                  ) : (
                    <p className="text-sm text-red-500 font-bold bg-red-50 p-3 rounded-lg w-full">Ocorreu um erro ao recuperar o link do boleto.</p>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}