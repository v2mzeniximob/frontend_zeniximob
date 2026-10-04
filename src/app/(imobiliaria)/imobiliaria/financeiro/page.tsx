'use client';

import { useState, useEffect } from 'react';
import { 
  DollarSign, ArrowRightLeft, FileText, CheckCircle, Clock, 
  Search, Filter, Building, User, FileUp, Loader2, X, Calculator
} from 'lucide-react';
import { api } from '@/src/lib/api';

export default function FinanceiroPage() {
  const [activeTab, setActiveTab] = useState<'cobrancas' | 'repasses'>('cobrancas');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Repasse
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [repasseForm, setRepasseForm] = useState({
    iptuValue: 0, condoValue: 0, waterValue: 0, fineValue: 0, 
    transferStatus: 'Aguardando',
    iptuDocUrl: '', condoDocUrl: '', waterDocUrl: '', fineDocUrl: ''
  });
  const [isSavingRepasse, setIsSavingRepasse] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/invoices');
      setInvoices(response.data);
    } catch (error) {
      console.error('Erro ao buscar faturas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  // Separação dos dados para as abas
  const cobrancas = invoices.filter(inv => inv.status !== 'Pago' || activeTab === 'cobrancas'); 
  // Na aba de repasses, mostramos apenas o que o inquilino já pagou (Status = Pago)
  const repasses = invoices.filter(inv => inv.status === 'Pago');

  // Abre o Modal e carrega os valores preexistentes (se houver)
  const handleOpenRepasseModal = (invoice: any) => {
    setSelectedInvoice(invoice);
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

  // Salvar o Repasse
  const handleSaveRepasse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingRepasse(true);
    try {
      await api.put(`/invoices/${selectedInvoice.id}/repasse`, repasseForm);
      alert('Repasse atualizado e salvo com sucesso!');
      setSelectedInvoice(null);
      fetchInvoices(); // Atualiza a lista
    } catch (error) {
      alert('Erro ao salvar repasse.');
    } finally {
      setIsSavingRepasse(false);
    }
  };

  // Cálculo Dinâmico no Modal
  const getRepasseLiquido = () => {
    if (!selectedInvoice) return 0;
    const base = selectedInvoice.ownerAmount || 0;
    const iptu = Number(repasseForm.iptuValue) || 0;
    const condo = Number(repasseForm.condoValue) || 0;
    const water = Number(repasseForm.waterValue) || 0;
    const fine = Number(repasseForm.fineValue) || 0;
    
    // Repasse Base - Descontos (Contas que a imobiliária pagou pelo dono) + Acréscimos (Multas)
    return base - iptu - condo - water + fine;
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 size={40} className="animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-medium">Carregando dados financeiros...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-slate-50 min-h-screen pb-20">
      
      {/* CABEÇALHO E ABAS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <DollarSign className="text-blue-600" /> Gestão Financeira
          </h1>
          <p className="text-slate-500 mt-1">Gerencie cobranças de inquilinos e os repasses aos proprietários.</p>
        </div>
        
        <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 w-full sm:w-auto">
          <button 
            onClick={() => setActiveTab('cobrancas')} 
            className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'cobrancas' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <FileText size={16}/> Cobranças (Inquilinos)
          </button>
          <button 
            onClick={() => setActiveTab('repasses')} 
            className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'repasses' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ArrowRightLeft size={16}/> Repasses (Proprietários)
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: COBRANÇAS (INQUILINOS) */}
      {/* ========================================================================= */}
      {activeTab === 'cobrancas' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-4">Fatura</th>
                  <th className="p-4">Inquilino / Imóvel</th>
                  <th className="p-4">Vencimento</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {cobrancas.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">Nenhuma cobrança encontrada.</td></tr>
                ) : (
                  cobrancas.map(invoice => (
                    <tr key={invoice.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-700">{invoice.description || 'Fatura Padrão'}</td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{invoice.contract?.tenant?.name}</p>
                        <p className="text-xs text-slate-500">{invoice.contract?.property?.title}</p>
                      </td>
                      <td className="p-4 text-slate-600 font-medium">{new Date(invoice.dueDate).toLocaleDateString('pt-BR')}</td>
                      <td className="p-4 font-black text-slate-800">{formatCurrency(invoice.totalAmount)}</td>
                      <td className="p-4 text-center">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          invoice.status === 'Pago' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          invoice.status === 'Aguardando Pagamento' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: REPASSES (PROPRIETÁRIOS) */}
      {/* ========================================================================= */}
      {activeTab === 'repasses' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3">
            <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-emerald-800">Prontos para Repasse</h4>
              <p className="text-sm text-emerald-600">Estas são as faturas que os inquilinos já pagaram. Clique em "Ajustar Repasse" para deduzir despesas (IPTU, Condomínio) e anexar os recibos antes de transferir ao proprietário.</p>
            </div>
          </div>

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
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        isRepassado ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {invoice.transferStatus || 'Aguardando'}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl mb-4 border border-slate-100">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500">Aluguel Pago:</span>
                        <span className="font-bold text-slate-700">{formatCurrency(invoice.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-red-400">Taxa Imob. (-):</span>
                        <span className="font-bold text-red-500">{formatCurrency(invoice.realEstateFee)}</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 mt-2 border-t border-slate-200">
                        <span className="font-bold text-slate-700">Repasse Base:</span>
                        <span className="font-black text-emerald-600">{formatCurrency(invoice.ownerAmount)}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleOpenRepasseModal(invoice)}
                      className={`w-full mt-auto py-2.5 text-sm font-bold rounded-xl transition-colors border ${
                        isRepassado ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
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
      {/* MODAL DE AJUSTE DE REPASSE */}
      {/* ========================================================================= */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Calculator className="text-emerald-600"/> Ajuste Financeiro do Repasse
              </h2>
              <button onClick={() => setSelectedInvoice(null)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-200/50 rounded-full"><X size={18} /></button>
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

                  {/* MULTA (Acréscimo) */}
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
                        <span>Aluguel Base Recebido:</span>
                        <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-red-300">
                        <span>Taxa de Administração (-):</span>
                        <span>{formatCurrency(selectedInvoice.realEstateFee)}</span>
                      </div>
                      <div className="border-t border-slate-700 pt-3 flex justify-between items-center text-slate-300 font-medium">
                        <span>Repasse Líquido Base:</span>
                        <span>{formatCurrency(selectedInvoice.ownerAmount)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-amber-300">
                        <span>Descontos Aplicados (-):</span>
                        <span>{formatCurrency(Number(repasseForm.iptuValue) + Number(repasseForm.condoValue) + Number(repasseForm.waterValue))}</span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-300">
                        <span>Acréscimos/Multa (+):</span>
                        <span>{formatCurrency(repasseForm.fineValue)}</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-600 flex justify-between items-center">
                      <span className="font-bold text-slate-200 uppercase tracking-wider">A Transferir</span>
                      <span className="text-3xl font-black text-emerald-400">{formatCurrency(getRepasseLiquido())}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Status do Repasse</label>
                    <select 
                      value={repasseForm.transferStatus} 
                      onChange={e => setRepasseForm({...repasseForm, transferStatus: e.target.value})}
                      className="w-full p-4 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-700 mb-4 shadow-sm"
                    >
                      <option value="Aguardando">Aguardando Transferência</option>
                      <option value="Repassado">Dinheiro Transferido (Concluído)</option>
                    </select>
                  </div>
                </div>

              </form>
            </div>

            <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button onClick={() => setSelectedInvoice(null)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
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