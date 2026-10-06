'use client';

import { useState, useEffect } from 'react';
import { api } from '@/src/lib/api';
import { 
  Loader2, DollarSign, User, Calendar, CheckCircle2, 
  AlertCircle, X, CreditCard, Copy, QrCode, ArrowRight, Building2, Receipt,
  ExternalLink, Briefcase, ArrowRightLeft, FileUp, CheckCircle, Calculator, FileDown
} from 'lucide-react';

export default function FinanceiroPage() {
  const [activeTab, setActiveTab] = useState<'cobrancas' | 'repasses'>('cobrancas');
  const [contractsWithInvoices, setContractsWithInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para Aba: Cobranças
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isGeneratingId, setIsGeneratingId] = useState<string | null>(null);

  // Estados para Aba: Repasses
  const [selectedRepasse, setSelectedRepasse] = useState<any>(null);
  const [isSavingRepasse, setIsSavingRepasse] = useState(false);
  const [repasseForm, setRepasseForm] = useState({
    iptuValue: 0, condoValue: 0, waterValue: 0, fineValue: 0, 
    transferStatus: 'Aguardando',
    iptuDocUrl: '', condoDocUrl: '', waterDocUrl: '', fineDocUrl: ''
  });

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/contracts?include=invoices,tenant');
      setContractsWithInvoices(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  // ==========================================
  // FUNÇÕES DA ABA: COBRANÇAS
  // ==========================================
  const handleGenerateCharge = async (invoiceId: string, method: 'pix' | 'boleto') => {
    setIsGeneratingId(invoiceId);
    try {
      const res = await api.post(`/invoices/${invoiceId}/charge`, { method });
      const updatedInvoice = res.data.invoice;
      
      setSelectedContract((prev: any) => {
        const newInvoices = prev.invoices.map((inv: any) => 
          inv.id === invoiceId ? updatedInvoice : inv
        );
        return { ...prev, invoices: newInvoices };
      });
      
      fetchFinancialData(); 
      alert(`${method === 'pix' ? 'PIX' : 'Boleto'} gerado com sucesso!`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao gerar cobrança. Verifique o Mercado Pago.');
    } finally {
      setIsGeneratingId(null);
    }
  };

  // NOVA FUNÇÃO: DAR BAIXA MANUAL PARA TESTAR OS REPASSES
  const handleMarkAsPaid = async (invoiceId: string) => {
    if(!confirm('Deseja confirmar o recebimento desta fatura manualmente? Ela irá para a tela de Repasses.')) return;
    
    try {
      // Chama a rota markAsPaid que já existe no seu backend
      const res = await api.put(`/invoices/${invoiceId}/pay`);
      const updatedInvoice = res.data;

      // Atualiza o modal instantaneamente
      setSelectedContract((prev: any) => {
        if (!prev) return prev;
        const newInvoices = prev.invoices.map((inv: any) => 
          inv.id === invoiceId ? { ...inv, status: 'Pago', paidDate: new Date().toISOString() } : inv
        );
        return { ...prev, invoices: newInvoices };
      });
      
      alert('Pagamento confirmado! A fatura agora está disponível na aba de Repasses.');
      fetchFinancialData(); // Atualiza as listas no fundo
    } catch (error) {
      console.error(error);
      alert('Erro ao confirmar pagamento. Verifique se a rota PUT /invoices/:id/pay está no seu backend (routes.ts).');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Código PIX Copiado e pronto a colar!');
  };

  // ==========================================
  // FUNÇÕES DA ABA: REPASSES
  // ==========================================
  const repasses = contractsWithInvoices
    .flatMap(c => (c.invoices || []).map((inv: any) => ({ ...inv, contract: c })))
    .filter((inv: any) => inv.status === 'Pago');

  const handleOpenRepasseModal = (invoice: any) => {
    setSelectedRepasse(invoice);
    setRepasseForm({
      iptuValue: invoice.iptuValue || 0,
      condoValue: invoice.condoValue || 0,
      waterValue: invoice.waterValue || 0,
      fineValue: invoice.fineValue || 0,
      transferStatus: invoice.transferStatus || 'Aguardando',
      iptuDocUrl: invoice.iptuDocUrl || '',
      condoDocUrl: invoice.condoDocUrl || '',
      waterDocUrl: invoice.waterDocUrl || '',
      fineDocUrl: invoice.fineDocUrl || ''
    });
  };

  const getRepasseLiquido = () => {
    if (!selectedRepasse) return 0;
    const base = selectedRepasse.ownerAmount || 0;
    const descontos = Number(repasseForm.iptuValue) + Number(repasseForm.condoValue) + Number(repasseForm.waterValue);
    const acrescimos = Number(repasseForm.fineValue);
    return base - descontos + acrescimos;
  };

  const handleSaveRepasse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingRepasse(true);
    try {
      await api.put(`/invoices/${selectedRepasse.id}/repasse`, repasseForm);
      alert('Repasse salvo com sucesso!');
      setSelectedRepasse(null);
      fetchFinancialData(); 
    } catch (error) {
      alert('Erro ao salvar repasse.');
    } finally {
      setIsSavingRepasse(false);
    }
  };

  const handleGenerateRepassePDF = () => {
    if (!selectedRepasse) return;
    
    const propTitle = selectedRepasse.contract?.property?.title || 'Imóvel';
    const tenantName = selectedRepasse.contract?.tenant?.name || 'Inquilino';
    const liquido = getRepasseLiquido();

    const html = `
      <html>
        <head>
          <title>Extrato de Repasse - ${propTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; max-width: 800px; margin: 0 auto; }
            h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
            .section { margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 5px; }
            .row.bold { font-weight: bold; border-bottom: none; }
            .row.total { font-size: 1.2em; font-weight: 900; color: #059669; border-top: 2px solid #cbd5e1; padding-top: 15px; border-bottom: none; }
            .text-red { color: #dc2626; }
            .text-green { color: #059669; }
          </style>
        </head>
        <body>
          <h1>Extrato de Repasse Detalhado</h1>
          <p><strong>Referência:</strong> ${selectedRepasse.description}</p>
          <p><strong>Imóvel:</strong> ${propTitle}</p>
          <p><strong>Inquilino Pagador:</strong> ${tenantName}</p>
          <p><strong>Data de Emissão do Extrato:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>

          <div class="section">
            <h3>1. Composição do Aluguel</h3>
            <div class="row"><span>Valor do Aluguel Recebido:</span> <span>${formatCurrency(selectedRepasse.totalAmount)}</span></div>
            <div class="row text-red"><span>Taxa de Administração Imobiliária (-):</span> <span>${formatCurrency(selectedRepasse.realEstateFee)}</span></div>
            <div class="row bold"><span>Repasse Base (Aluguel Bruto):</span> <span>${formatCurrency(selectedRepasse.ownerAmount)}</span></div>
          </div>

          <div class="section">
            <h3>2. Descontos e Despesas Adiantadas (-)</h3>
            <div class="row text-red"><span>IPTU:</span> <span>${formatCurrency(Number(repasseForm.iptuValue))}</span></div>
            <div class="row text-red"><span>Condomínio:</span> <span>${formatCurrency(Number(repasseForm.condoValue))}</span></div>
            <div class="row text-red"><span>Água / Sabesp:</span> <span>${formatCurrency(Number(repasseForm.waterValue))}</span></div>
          </div>

          <div class="section">
            <h3>3. Acréscimos (+)</h3>
            <div class="row text-green"><span>Multas Aplicadas:</span> <span>${formatCurrency(Number(repasseForm.fineValue))}</span></div>
          </div>

          <div class="section">
            <div class="row total"><span>Valor Líquido a Transferir:</span> <span>${formatCurrency(liquido)}</span></div>
            <p style="text-align: right; margin-top: 5px; font-size: 0.9em; color: #64748b;">Status no sistema: ${repasseForm.transferStatus}</p>
          </div>
          
          <p style="text-align: center; margin-top: 50px; font-size: 0.8em; color: #94a3b8;">Documento gerado automaticamente pelo Sistema de Gestão Imobiliária.</p>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = function() { printWindow.print(); }
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center items-center h-64"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

  return (
    <div className="p-8 max-w-[1600px] mx-auto font-sans animate-in fade-in duration-300 pb-20">
      
      {/* CABEÇALHO E ABAS */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <DollarSign className="text-emerald-600 bg-emerald-50 p-1.5 rounded-lg" size={36} />
            Painel Financeiro
          </h1>
          <p className="text-slate-500 mt-2">Acompanhe as cobranças e gere repasses detalhados para proprietários.</p>
        </div>
        
        <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 w-full md:w-auto">
          <button onClick={() => setActiveTab('cobrancas')} className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'cobrancas' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
            <Receipt size={16}/> Cobranças (Inquilinos)
          </button>
          <button onClick={() => setActiveTab('repasses')} className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'repasses' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}>
            <ArrowRightLeft size={16}/> Repasses (Proprietários)
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ABA: COBRANÇAS (LISTAGEM DE CONTRATOS) */}
      {/* ========================================================================= */}
      {activeTab === 'cobrancas' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <div className="col-span-4 pl-2">Cliente / Imóvel</div>
            <div className="col-span-3">Progresso / Faturas</div>
            <div className="col-span-3">Valor da Parcela</div>
            <div className="col-span-2 text-right pr-2">Ações</div>
          </div>

          <div className="divide-y divide-slate-100">
            {contractsWithInvoices.map(contract => {
              const paidCount = contract.invoices?.filter((i: any) => i.status === 'Pago').length || 0;
              const totalCount = contract.invoices?.length || 0;
              const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
              const isSale = contract.type === 'Venda';

              return (
                <div key={contract.id} onClick={() => setSelectedContract(contract)} className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-blue-50/50 transition-colors cursor-pointer group">
                  <div className="col-span-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 rounded-full flex items-center justify-center font-bold shadow-sm shrink-0">
                      {contract.tenant?.name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors flex items-center gap-2 line-clamp-1">
                        {contract.tenant?.name}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider border ${isSale ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                          {contract.type}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Building2 size={12} className="shrink-0"/> <span className="truncate">{contract.property?.title}</span>
                      </p>
                    </div>
                  </div>

                  <div className="col-span-3">
                    <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                      <span>{paidCount} pagas</span>
                      <span>{totalCount} total</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>

                  <div className="col-span-3 flex flex-col justify-center">
                    <p className="font-bold text-slate-800 text-base">{formatCurrency(contract.rentValue)}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                      {isSale ? 'Por Parcela' : 'Por Mês'}
                    </p>
                  </div>

                  <div className="col-span-2 flex justify-end">
                    <button className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg flex items-center gap-2 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                      Detalhes <ArrowRight size={16}/>
                    </button>
                  </div>
                </div>
              );
            })}
            
            {contractsWithInvoices.length === 0 && (
              <div className="p-12 text-center text-slate-500">
                Nenhum contrato com faturas encontrado.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: REPASSES */}
      {/* ========================================================================= */}
      {activeTab === 'repasses' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repasses.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 border-dashed text-slate-500">
                Nenhum aluguel pago aguardando repasse no momento.
              </div>
            ) : (
              repasses.map(invoice => {
                const isRepassado = invoice.transferStatus === 'Repassado';
                return (
                  <div key={invoice.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase">{invoice.description}</span>
                        <h3 className="font-bold text-slate-800 line-clamp-1">{invoice.contract?.property?.title}</h3>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${isRepassado ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {invoice.transferStatus || 'Aguardando'}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl mb-4 border border-slate-100">
                      <div className="flex justify-between text-sm mb-1"><span className="text-slate-500">Recebido:</span><span className="font-bold text-slate-700">{formatCurrency(invoice.totalAmount)}</span></div>
                      <div className="flex justify-between text-sm pt-2 mt-2 border-t border-slate-200"><span className="font-bold text-slate-700">Repasse Base:</span><span className="font-black text-emerald-600">{formatCurrency(invoice.ownerAmount)}</span></div>
                    </div>

                    <button onClick={() => handleOpenRepasseModal(invoice)} className={`w-full mt-auto py-2.5 text-sm font-bold rounded-xl transition-colors border ${isRepassado ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'}`}>
                      {isRepassado ? 'Ver Detalhes do Repasse' : 'Ajustar e Confirmar Repasse'}
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL ORIGINAL: LISTA DE FATURAS DO CONTRATO (ABERTO PELA ABA COBRANÇAS) */}
      {/* ========================================================================= */}
      {selectedContract && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] transform transition-all">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <Briefcase className="text-blue-600 bg-blue-100 p-1.5 rounded-lg" size={32}/>
                Ficha Financeira: <span className="text-blue-700">{selectedContract.tenant?.name}</span>
              </h2>
              <button onClick={() => setSelectedContract(null)} className="text-slate-400 hover:text-red-500 transition-colors bg-white hover:bg-red-50 p-1.5 rounded-xl border border-slate-200 hover:border-red-200">
                <X size={20}/>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 bg-slate-50/50">
              {/* DADOS DO CLIENTE */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><User size={14}/> Dados do Cliente</h3>
                  <div className="space-y-4 text-sm">
                    <div><span className="block text-xs text-slate-500 mb-0.5">CPF / CNPJ</span><span className="font-semibold text-slate-800">{selectedContract.tenant?.document || selectedContract.tenant?.cpf || 'Não informado'}</span></div>
                    <div><span className="block text-xs text-slate-500 mb-0.5">E-mail</span><span className="font-semibold text-slate-800 truncate block">{selectedContract.tenant?.email || 'Não informado'}</span></div>
                    <div><span className="block text-xs text-slate-500 mb-0.5">Telefone</span><span className="font-semibold text-slate-800">{selectedContract.tenant?.phone || 'Não informado'}</span></div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-5 rounded-2xl shadow-md text-white relative overflow-hidden">
                  <CreditCard size={100} className="absolute -right-4 -bottom-4 text-white opacity-10" />
                  <div className="flex items-center gap-2 mb-2 relative z-10"><CreditCard size={20} className="text-blue-200"/><h3 className="font-bold">Mercado Pago Ativo</h3></div>
                  <p className="text-xs text-blue-100 mb-1 leading-relaxed relative z-10">O sistema está pronto para emitir as cobranças oficiais para o seu cliente.</p>
                </div>
              </div>

              {/* CRONOGRAMA DE FATURAS */}
              <div className="lg:col-span-2">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Calendar className="text-blue-500" size={18}/> Cronograma de Faturas</h3>
                <div className="space-y-4 pr-2">
                  {selectedContract.invoices?.map((invoice: any, index: number) => (
                    <div key={invoice.id} className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between">
                        
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 font-bold shrink-0">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-base">{invoice.description}</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              Vencimento: <span className={new Date(invoice.dueDate) < new Date() && invoice.status !== 'Pago' ? 'text-red-500 font-bold' : ''}>{new Date(invoice.dueDate).toLocaleDateString('pt-BR')}</span>
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                          <p className="font-black text-slate-800 text-lg">{formatCurrency(invoice.amount || invoice.totalAmount)}</p>
                          {(invoice.realEstateFee > 0 || invoice.ownerAmount > 0) && (
                            <div className="flex gap-1.5 mt-1">
                              <span className="text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded" title="Valor repassado ao dono">Repasse: {formatCurrency(invoice.ownerAmount)}</span>
                              <span className="text-[9px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded" title="Comissão da Imobiliária">Taxa: {formatCurrency(invoice.realEstateFee)}</span>
                            </div>
                          )}
                          <div className="mt-2">
                            {invoice.status === 'Pago' ? (
                              <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200"><CheckCircle2 size={14}/> Fatura Paga</span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs font-bold text-orange-700 bg-orange-100 px-3 py-1 rounded-full border border-orange-200"><AlertCircle size={14}/> {invoice.status}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* GERAR PIX / BOLETO / BAIXAR MANUAL */}
                      {invoice.status !== 'Pago' && (
                        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col items-center justify-between gap-4 bg-slate-50 -mx-5 -mb-5 p-5 rounded-b-2xl">
                          
                          {/* BLOCO PIX */}
                          {invoice.pixQrCodeBase64 ? (
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                              <img src={`data:image/jpeg;base64,${invoice.pixQrCodeBase64}`} alt="QR Code PIX" className="w-24 h-24 rounded-xl shadow-sm bg-white p-1 border border-slate-200" />
                              <div className="flex-1 text-center sm:text-left">
                                <p className="text-sm font-bold text-slate-700 mb-2">QR Code Gerado!</p>
                                <div className="flex flex-col sm:flex-row gap-2 justify-center sm:justify-start">
                                  <button onClick={() => copyToClipboard(invoice.pixQrCode)} className="text-xs font-bold flex items-center justify-center sm:justify-start gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-sm w-full sm:w-auto"><Copy size={14} /> Copiar (Pix)</button>
                                  <button onClick={() => handleMarkAsPaid(invoice.id)} className="text-xs font-bold flex items-center justify-center sm:justify-start gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-sm w-full sm:w-auto"><CheckCircle2 size={14} /> Confirmar Recebimento</button>
                                </div>
                              </div>
                            </div>
                          ) 
                          
                          /* BLOCO BOLETO */
                          : invoice.ticketUrl ? (
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                              <div className="w-16 h-16 bg-white border border-blue-100 rounded-xl flex items-center justify-center shadow-sm shrink-0"><Receipt size={32} className="text-blue-500" /></div>
                              <div className="flex-1 text-center sm:text-left">
                                <p className="text-sm font-bold text-blue-900 mb-2">Boleto Gerado com Sucesso!</p>
                                <div className="flex flex-col sm:flex-row gap-2 justify-center sm:justify-start">
                                  <a href={invoice.ticketUrl} target="_blank" rel="noreferrer" className="text-xs font-bold flex items-center justify-center sm:justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-sm w-full sm:w-auto"><ExternalLink size={14} /> Visualizar e Imprimir</a>
                                  <button onClick={() => handleMarkAsPaid(invoice.id)} className="text-xs font-bold flex items-center justify-center sm:justify-start gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-sm w-full sm:w-auto"><CheckCircle2 size={14} /> Confirmar Recebimento</button>
                                </div>
                              </div>
                            </div>
                          ) 
                          
                          /* BOTÕES DEFAULT */
                          : (
                            <div className="w-full flex justify-end gap-3 flex-wrap">
                              <button onClick={() => handleMarkAsPaid(invoice.id)} className="text-sm font-bold flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2.5 rounded-xl transition-all shadow-sm w-full sm:w-auto" title="Marcar como Pago para testar os Repasses">
                                <CheckCircle2 size={16} /> Dar Baixa Manual
                              </button>
                              <button onClick={() => handleGenerateCharge(invoice.id, 'boleto')} disabled={isGeneratingId === invoice.id} className="text-sm font-bold flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 disabled:opacity-50 px-4 py-2.5 rounded-xl transition-all shadow-sm w-full sm:w-auto">
                                {isGeneratingId === invoice.id ? <Loader2 size={16} className="animate-spin" /> : <Receipt size={16} />} Gerar Boleto
                              </button>
                              <button onClick={() => handleGenerateCharge(invoice.id, 'pix')} disabled={isGeneratingId === invoice.id} className="text-sm font-bold flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-5 py-2.5 rounded-xl transition-all shadow-sm w-full sm:w-auto">
                                {isGeneratingId === invoice.id ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />} Gerar PIX
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {(!selectedContract.invoices || selectedContract.invoices.length === 0) && (
                    <div className="text-center bg-white border border-slate-200 rounded-2xl p-8">
                      <Calendar size={32} className="mx-auto text-slate-300 mb-3" />
                      <p className="font-bold text-slate-700">Nenhuma fatura encontrada.</p>
                      <p className="text-sm text-slate-500 mt-1">Apague este contrato e crie novamente para gerar as parcelas.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL NOVO: AJUSTE DE REPASSE (ABERTO PELA ABA REPASSES) */}
      {/* ========================================================================= */}
      {selectedRepasse && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Calculator className="text-emerald-600"/> Ajuste Financeiro do Repasse
              </h2>
              <button onClick={() => setSelectedRepasse(null)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-200/50 rounded-full"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              <form id="repasseForm" onSubmit={handleSaveRepasse} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* COLUNA ESQUERDA: DESCONTOS E ACRÉSCIMOS */}
                <div className="space-y-5">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 border-b pb-2">Descontos & Acréscimos</h3>
                  
                  {/* IPTU */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm font-bold text-slate-700">IPTU (R$)</label>
                      <input type="number" step="0.01" value={repasseForm.iptuValue} onChange={e => setRepasseForm({...repasseForm, iptuValue: parseFloat(e.target.value) || 0})} className="w-24 p-2 text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold" />
                    </div>
                    <div className="flex items-center gap-2">
                      <FileUp size={16} className="text-slate-400"/>
                      <input type="text" placeholder="URL do Comprovante de Pagamento" value={repasseForm.iptuDocUrl} onChange={e => setRepasseForm({...repasseForm, iptuDocUrl: e.target.value})} className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs" />
                    </div>
                  </div>

                  {/* CONDOMÍNIO */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm font-bold text-slate-700">Condomínio (R$)</label>
                      <input type="number" step="0.01" value={repasseForm.condoValue} onChange={e => setRepasseForm({...repasseForm, condoValue: parseFloat(e.target.value) || 0})} className="w-24 p-2 text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold" />
                    </div>
                    <div className="flex items-center gap-2">
                      <FileUp size={16} className="text-slate-400"/>
                      <input type="text" placeholder="URL do Comprovante" value={repasseForm.condoDocUrl} onChange={e => setRepasseForm({...repasseForm, condoDocUrl: e.target.value})} className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs" />
                    </div>
                  </div>

                  {/* ÁGUA/OUTROS */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm font-bold text-slate-700">Água (R$)</label>
                      <input type="number" step="0.01" value={repasseForm.waterValue} onChange={e => setRepasseForm({...repasseForm, waterValue: parseFloat(e.target.value) || 0})} className="w-24 p-2 text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold" />
                    </div>
                    <div className="flex items-center gap-2">
                      <FileUp size={16} className="text-slate-400"/>
                      <input type="text" placeholder="URL da Conta" value={repasseForm.waterDocUrl} onChange={e => setRepasseForm({...repasseForm, waterDocUrl: e.target.value})} className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs" />
                    </div>
                  </div>

                  {/* MULTA */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm font-bold text-emerald-700">Multa Cobrada (+) (R$)</label>
                      <input type="number" step="0.01" value={repasseForm.fineValue} onChange={e => setRepasseForm({...repasseForm, fineValue: parseFloat(e.target.value) || 0})} className="w-24 p-2 text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold" />
                    </div>
                    <div className="flex items-center gap-2">
                      <FileUp size={16} className="text-slate-400"/>
                      <input type="text" placeholder="Documento da Multa (opcional)" value={repasseForm.fineDocUrl} onChange={e => setRepasseForm({...repasseForm, fineDocUrl: e.target.value})} className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs" />
                    </div>
                  </div>
                </div>

                {/* COLUNA DIREITA: RESUMO FINANCEIRO */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 border-b pb-2">Resumo Final</h3>
                  
                  <div className="bg-slate-800 p-6 rounded-2xl shadow-inner text-white mb-6">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Aluguel Base Recebido:</span><span>{formatCurrency(selectedRepasse.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-red-300">
                        <span>Taxa de Administração (-):</span><span>{formatCurrency(selectedRepasse.realEstateFee)}</span>
                      </div>
                      <div className="border-t border-slate-700 pt-3 flex justify-between items-center text-slate-300 font-medium">
                        <span>Repasse Líquido Base:</span><span>{formatCurrency(selectedRepasse.ownerAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-amber-300 mt-2">
                        <span>Descontos Aplicados (-):</span><span>{formatCurrency(Number(repasseForm.iptuValue) + Number(repasseForm.condoValue) + Number(repasseForm.waterValue))}</span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-300">
                        <span>Acréscimos/Multa (+):</span><span>{formatCurrency(repasseForm.fineValue)}</span>
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-600 flex justify-between items-center">
                      <span className="font-bold text-slate-200 uppercase tracking-wider">A Transferir</span>
                      <span className="text-3xl font-black text-emerald-400">{formatCurrency(getRepasseLiquido())}</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Status do Repasse</label>
                    <select value={repasseForm.transferStatus} onChange={e => setRepasseForm({...repasseForm, transferStatus: e.target.value})} className="w-full p-4 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-700 shadow-sm">
                      <option value="Aguardando">Aguardando Transferência</option>
                      <option value="Repassado">Dinheiro Transferido (Concluído)</option>
                    </select>
                  </div>

                  {/* BOTÃO GERAR PDF */}
                  <button type="button" onClick={handleGenerateRepassePDF} className="w-full py-3.5 text-sm font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-200 rounded-xl flex items-center justify-center gap-2 transition-colors">
                    <FileDown size={18}/> Gerar Recibo PDF p/ Proprietário
                  </button>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button onClick={() => setSelectedRepasse(null)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
              <button form="repasseForm" type="submit" disabled={isSavingRepasse} className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-2">
                {isSavingRepasse ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} Salvar Repasse
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}