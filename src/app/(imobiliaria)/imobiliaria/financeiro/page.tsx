'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { 
  Loader2, DollarSign, User, Calendar, CheckCircle2, 
  AlertCircle, X, CreditCard, Copy, QrCode, ArrowRight, Building2 
} from 'lucide-react';

export default function FinanceiroPage() {
  const [contractsWithInvoices, setContractsWithInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Controlo da Modal e Ações
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isGeneratingPixId, setIsGeneratingPixId] = useState<string | null>(null);

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

  // ==========================================
  // FUNÇÃO MÁGICA: GERAR PIX NO MERCADO PAGO
  // ==========================================
  const handleGeneratePix = async (invoiceId: string) => {
    setIsGeneratingPixId(invoiceId);
    try {
      const res = await api.post(`/invoices/${invoiceId}/pix`);
      const updatedInvoice = res.data.invoice;
      
      // Atualiza o estado local para mostrar o QR Code imediatamente sem recarregar a página
      setSelectedContract((prev: any) => {
        const newInvoices = prev.invoices.map((inv: any) => 
          inv.id === invoiceId ? updatedInvoice : inv
        );
        return { ...prev, invoices: newInvoices };
      });
      
      // Atualiza a lista por trás
      fetchFinancialData(); 
      
      alert('PIX gerado com sucesso!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao gerar PIX. Verifique as credenciais do Mercado Pago.');
    } finally {
      setIsGeneratingPixId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Código PIX Copiado e pronto a colar!');
  };

  if (isLoading) return <div className="p-8 flex justify-center items-center h-64"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans animate-in fade-in duration-300">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <DollarSign className="text-emerald-600 bg-emerald-50 p-1.5 rounded-lg" size={36} />
            Painel Financeiro
          </h1>
          <p className="text-slate-500 mt-2">Acompanhe as cobranças, emita PIX e faça a gestão dos pagamentos dos seus inquilinos.</p>
        </div>
      </div>

      {/* LISTAGEM MODERNA EM LINHAS */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Cabeçalho da Lista */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-4 pl-2">Inquilino / Imóvel</div>
          <div className="col-span-3">Progresso / Faturas</div>
          <div className="col-span-3">Valor Mensal</div>
          <div className="col-span-2 text-right pr-2">Ações</div>
        </div>

        {/* Corpo da Lista */}
        <div className="divide-y divide-slate-100">
          {contractsWithInvoices.map(contract => {
            const paidCount = contract.invoices?.filter((i: any) => i.status === 'Pago').length || 0;
            const totalCount = contract.invoices?.length || 0;
            const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

            return (
              <div 
                key={contract.id} 
                onClick={() => setSelectedContract(contract)}
                className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-blue-50/50 transition-colors cursor-pointer group"
              >
                {/* Coluna 1: Inquilino e Imóvel */}
                <div className="col-span-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 rounded-full flex items-center justify-center font-bold shadow-sm">
                    {contract.tenant?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{contract.tenant?.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Building2 size={12}/> {contract.property?.title}
                    </p>
                  </div>
                </div>

                {/* Coluna 2: Status das Faturas */}
                <div className="col-span-3">
                  <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                    <span>{paidCount} pagas</span>
                    <span>{totalCount} total</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Coluna 3: Valor */}
                <div className="col-span-3">
                  <p className="font-bold text-slate-800 text-base">R$ {Number(contract.rentValue).toFixed(2)}</p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">Por mês</p>
                </div>

                {/* Coluna 4: Ação */}
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

      {/* MODAL DETALHADA COM FATURAS E MERCADO PAGO */}
      {selectedContract && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] transform transition-all">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <User className="text-blue-600 bg-blue-100 p-1 rounded-lg" size={28}/>
                Ficha Financeira: <span className="text-blue-700">{selectedContract.tenant?.name}</span>
              </h2>
              <button onClick={() => setSelectedContract(null)} className="text-slate-400 hover:text-red-500 transition-colors bg-white hover:bg-red-50 p-1.5 rounded-xl border border-slate-200 hover:border-red-200">
                <X size={20}/>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 bg-slate-50/50">
              
              {/* DADOS DO CLIENTE E STATUS MERCADO PAGO */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Dados do Inquilino</h3>
                  <div className="space-y-4 text-sm">
                    <div><span className="block text-xs text-slate-500 mb-0.5">CPF</span><span className="font-semibold text-slate-800">{selectedContract.tenant?.cpf || 'Não informado'}</span></div>
                    <div><span className="block text-xs text-slate-500 mb-0.5">E-mail</span><span className="font-semibold text-slate-800">{selectedContract.tenant?.email || 'Não informado'}</span></div>
                    <div><span className="block text-xs text-slate-500 mb-0.5">Telefone</span><span className="font-semibold text-slate-800">{selectedContract.tenant?.phone || 'Não informado'}</span></div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-5 rounded-2xl shadow-md text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard size={20} className="text-blue-200"/>
                    <h3 className="font-bold">Mercado Pago Ativo</h3>
                  </div>
                  <p className="text-xs text-blue-100 mb-4 leading-relaxed">O sistema está pronto para emitir cobranças oficiais. Clique em "Gerar PIX" nas faturas ao lado.</p>
                </div>
              </div>

              {/* LISTA DE FATURAS COM QR CODE */}
              <div className="lg:col-span-2">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Calendar className="text-slate-400" size={18}/> Cronograma de Faturas
                </h3>
                
                <div className="space-y-3 pr-2">
                  {selectedContract.invoices?.map((invoice: any, index: number) => (
                    <div key={invoice.id} className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-base">{invoice.description}</p>
                            <p className="text-xs text-slate-500 font-medium">Vencimento: <span className={new Date(invoice.dueDate) < new Date() && invoice.status !== 'Pago' ? 'text-red-500 font-bold' : ''}>{new Date(invoice.dueDate).toLocaleDateString('pt-BR')}</span></p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                          <p className="font-black text-slate-800 text-lg">R$ {Number(invoice.amount).toFixed(2)}</p>
                          
                          {invoice.status === 'Pago' ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                              <CheckCircle2 size={14}/> Fatura Paga
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-bold text-orange-700 bg-orange-100 px-3 py-1 rounded-full border border-orange-200">
                              <AlertCircle size={14}/> {invoice.status}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ÁREA MÁGICA: GERAR E EXIBIR PIX */}
                      {invoice.status !== 'Pago' && (
                        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                          
                          {invoice.pixQrCodeBase64 ? (
                            // SE JÁ TIVER PIX GERADO: MOSTRA O QR CODE
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <img 
                                src={`data:image/jpeg;base64,${invoice.pixQrCodeBase64}`} 
                                alt="QR Code PIX" 
                                className="w-24 h-24 rounded-lg shadow-sm bg-white p-1 border border-slate-200" 
                              />
                              <div className="flex-1 text-center sm:text-left">
                                <p className="text-xs font-bold text-slate-700 mb-2">QR Code Gerado!</p>
                                <div className="flex flex-col gap-2">
                                  <button 
                                    onClick={() => copyToClipboard(invoice.pixQrCode)} 
                                    className="text-xs font-bold flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors w-full sm:w-auto shadow-sm"
                                  >
                                    <Copy size={14} /> Copiar Código (Pix Copia e Cola)
                                  </button>
                                  {invoice.ticketUrl && (
                                    <a 
                                      href={invoice.ticketUrl} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1"
                                    >
                                      Visualizar Boleto / Fatura PDF
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            // SE AINDA NÃO TEM PIX: MOSTRA O BOTÃO DE GERAR
                            <div className="w-full flex justify-end">
                              <button 
                                onClick={() => handleGeneratePix(invoice.id)}
                                disabled={isGeneratingPixId === invoice.id}
                                className="text-sm font-bold flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-5 py-2.5 rounded-xl transition-all shadow-sm"
                              >
                                {isGeneratingPixId === invoice.id ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
                                {isGeneratingPixId === invoice.id ? 'A gerar...' : 'Gerar Cobrança PIX'}
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
                      <p className="text-sm text-slate-500 mt-1">Este contrato não possui cronograma financeiro.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}