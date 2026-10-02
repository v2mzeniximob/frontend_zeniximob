'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { Loader2, DollarSign, User, Calendar, CheckCircle2, AlertCircle, X, CreditCard } from 'lucide-react';

export default function FinanceiroPage() {
  const [contractsWithInvoices, setContractsWithInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado para controlar qual cliente está aberto na Modal
  const [selectedContract, setSelectedContract] = useState<any>(null);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    setIsLoading(true);
    try {
      // Aqui o Backend deve devolver os contratos fazendo "include" das faturas e do inquilino
      const response = await api.get('/contracts?include=invoices,tenant');
      setContractsWithInvoices(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center text-slate-500"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <DollarSign className="text-emerald-600" size={32} />
          Painel Financeiro
        </h1>
        <p className="text-slate-500 mt-1">Gere cobranças, acompanhe pagamentos e integre com gateways.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contractsWithInvoices.map(contract => (
          <div key={contract.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-lg">
                {contract.tenant?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{contract.tenant?.name}</h3>
                <p className="text-xs text-slate-500">{contract.property?.title}</p>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Valor Mensal:</span>
                <span className="font-bold text-slate-800">R$ {Number(contract.rentValue).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Faturas Geradas:</span>
                <span className="font-bold text-blue-600">{contract.invoices?.length || 0} parcelas</span>
              </div>
            </div>

            <button 
              onClick={() => setSelectedContract(contract)}
              className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
            >
              Ver Detalhes e Cobranças
            </button>
          </div>
        ))}
      </div>

      {/* MODAL DETALHADA COM FATURAS (PRONTA PARA INTEGRAÇÃO) */}
      {selectedContract && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <User className="text-blue-600" size={24}/>
                Ficha Financeira: {selectedContract.tenant?.name}
              </h2>
              <button onClick={() => setSelectedContract(null)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* DADOS DO CLIENTE */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Dados do Inquilino</h3>
                  <div className="space-y-3 text-sm">
                    <p><strong className="text-slate-700">CPF:</strong> {selectedContract.tenant?.cpf}</p>
                    <p><strong className="text-slate-700">E-mail:</strong> {selectedContract.tenant?.email}</p>
                    <p><strong className="text-slate-700">Telefone:</strong> {selectedContract.tenant?.phone}</p>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">Futura Integração</h3>
                  <p className="text-xs text-blue-600 mb-3">O botão de gerar link conectará via API ao Mercado Pago.</p>
                  <button disabled className="w-full py-2 bg-blue-600/50 text-white rounded cursor-not-allowed text-sm font-bold flex items-center justify-center gap-2">
                    <CreditCard size={16}/> Ligar Mercado Pago
                  </button>
                </div>
              </div>

              {/* LISTA DE FATURAS */}
              <div className="lg:col-span-2">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Calendar className="text-slate-400" size={18}/> Cronograma de Faturas
                </h3>
                
                <div className="space-y-3">
                  {selectedContract.invoices?.map((invoice: any, index: number) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{invoice.description}</p>
                          <p className="text-xs text-slate-500">Vencimento: {new Date(invoice.dueDate).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <p className="font-bold text-slate-800">R$ {Number(invoice.amount).toFixed(2)}</p>
                        
                        {invoice.status === 'Pago' ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                            <CheckCircle2 size={14}/> Pago
                          </span>
                        ) : (
                          <div className="flex flex-col items-end gap-2">
                            <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                              <AlertCircle size={14}/> Pendente
                            </span>
                            {/* BOTÃO FUTURO PARA GERAR COBRANÇA */}
                            <button className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded transition-colors">
                              Gerar PIX / Boleto
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!selectedContract.invoices || selectedContract.invoices.length === 0) && (
                    <p className="text-center text-slate-500 text-sm py-4">Nenhuma fatura encontrada.</p>
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