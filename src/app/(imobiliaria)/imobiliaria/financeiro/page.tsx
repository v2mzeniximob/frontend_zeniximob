'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { Plus, X, Loader2, DollarSign, CheckCircle2, Clock, AlertCircle, FileText, ArrowBigRight } from 'lucide-react';

export default function FinanceiroPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    contractId: '',
    dueDate: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Busca faturas e APENAS os contratos que estão ativos para podermos gerar cobranças
      const [resInvoices, resContracts] = await Promise.all([
        api.get('/invoices'),
        api.get('/contracts?status=Ativo')
      ]);
      setInvoices(resInvoices.data);
      setContracts(resContracts.data);
    } catch (error) {
      console.error('Erro ao buscar dados financeiros:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post('/invoices', form);
      alert('Fatura gerada com sucesso! O split foi calculado automaticamente.');
      setIsModalOpen(false);
      setForm({ contractId: '', dueDate: '' });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao gerar fatura.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarcarComoPago = async (id: string) => {
    if (!confirm('Confirmar o recebimento deste valor? O status mudará para Pago.')) return;
    try {
      await api.patch(`/invoices/${id}/pay`);
      fetchData();
    } catch (error) {
      alert('Erro ao confirmar pagamento.');
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center text-slate-500"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 max-w-[1600px] mx-auto font-sans h-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <DollarSign className="text-green-600 bg-green-100 p-1.5 rounded-xl" size={36} />
            Financeiro & Repasses
          </h1>
          <p className="text-slate-500 mt-1">Gira cobranças de aluguéis, taxas da imobiliária e repasses a proprietários.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus size={18} /> Nova Cobrança
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="py-4 px-6">Contrato / Inquilino</th>
              <th className="py-4 px-6">Vencimento</th>
              <th className="py-4 px-6">Valor Total</th>
              <th className="py-4 px-6">Split (Repasse Inteligente)</th>
              <th className="py-4 px-6 text-center">Status</th>
              <th className="py-4 px-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {invoices.map(invoice => {
              const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== 'Pago';
              
              return (
                <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-800 flex items-center gap-2">
                      <FileText size={14} className="text-blue-500"/> {invoice.contract?.property?.title || 'Imóvel Indisponível'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Pagador: <span className="font-semibold">{invoice.contract?.tenant?.name}</span>
                    </p>
                  </td>
                  
                  <td className="py-4 px-6">
                    <p className={`font-bold flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-slate-700'}`}>
                      {isOverdue && <AlertCircle size={14} />}
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  </td>

                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-800 text-lg">
                      R$ {Number(invoice.totalAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </td>

                  <td className="py-4 px-6">
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-slate-500">Taxa Imobiliária:</span>
                        <span className="font-bold text-green-600">+ R$ {Number(invoice.realEstateFee).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-1">
                        <span className="text-slate-500 flex items-center gap-1"><ArrowBigRight size={10}/> Repassar:</span>
                        <span className="font-bold text-amber-600">R$ {Number(invoice.ownerAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 text-right">
                        Para: {invoice.contract?.property?.owner?.name}
                      </p>
                    </div>
                  </td>

                  <td className="py-4 px-6 text-center">
                    {invoice.status === 'Pago' ? (
                      <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center justify-center gap-1 w-fit mx-auto">
                        <CheckCircle2 size={14}/> Pago
                      </span>
                    ) : isOverdue ? (
                      <span className="bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center justify-center gap-1 w-fit mx-auto">
                        <AlertCircle size={14}/> Atrasado
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center justify-center gap-1 w-fit mx-auto">
                        <Clock size={14}/> Pendente
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-6 text-right">
                    {invoice.status !== 'Pago' && (
                      <button onClick={() => handleMarcarComoPago(invoice.id)} className="text-green-600 hover:text-green-800 font-medium bg-green-50 px-3 py-2 rounded-lg transition-colors text-xs flex items-center gap-1 ml-auto">
                        <CheckCircle2 size={16} /> Dar Baixa
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {invoices.length === 0 && (
              <tr><td colSpan={6} className="py-12 text-center text-slate-500">Nenhuma fatura gerada.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL NOVA COBRANÇA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <DollarSign className="text-green-600" size={20}/> Gerar Cobrança (Mês)
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 space-y-4">
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Selecione o Contrato Ativo</label>
                <select required value={form.contractId} onChange={e => setForm({...form, contractId: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-green-500 bg-white">
                  <option value="">Escolha um contrato...</option>
                  {contracts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.property.title} - Inquilino: {c.tenant?.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">Os valores e a taxa da imobiliária serão puxados automaticamente do contrato.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Data de Vencimento</label>
                <input required type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-green-500" />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center gap-2 transition-colors shadow-sm">
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Gerar Fatura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}