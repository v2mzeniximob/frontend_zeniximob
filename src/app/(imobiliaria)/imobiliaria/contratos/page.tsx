'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { 
  Key, Plus, X, Loader2, FileText, CheckCircle2, AlertCircle, Home, User, DollarSign, Calendar
} from 'lucide-react';

export default function ContratosPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // O estado do formulário reativo
  const [form, setForm] = useState({
    type: 'Locação', // Locação ou Venda
    propertyId: '',
    tenantId: '', // Serve tanto para Inquilino quanto para Comprador
    startDate: '',
    endDate: '',
    rentValue: '',
    adminFeePercent: '',
    readjustmentIndex: 'IGP-M',
    documentUrl: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Busca Contratos, Imóveis Disponíveis e Clientes
      const [resContracts, resProps, resClients] = await Promise.all([
        api.get('/contracts'),
        api.get('/properties').catch(() => ({ data: [] })),
        api.get('/clients')
      ]);
      setContracts(resContracts.data);
      // Filtra para mostrar apenas imóveis que não estejam alugados/vendidos no dropdown
      setProperties(resProps.data.filter((p: any) => p.rentStatus === 'Vago' || p.rentStatus === 'Disponível'));
      setClients(resClients.data);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post('/contracts', form);
      alert('Contrato gerado com sucesso! Faturas criadas no sistema.');
      setIsModalOpen(false);
      setForm({
        type: 'Locação', propertyId: '', tenantId: '', startDate: '', endDate: '', rentValue: '', adminFeePercent: '', readjustmentIndex: 'IGP-M', documentUrl: ''
      });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao gerar contrato.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEndContract = async (id: string) => {
    if(!confirm('Tem certeza que deseja encerrar este contrato? O imóvel voltará a ficar disponível.')) return;
    try {
      await api.put(`/contracts/${id}`, { status: 'Encerrado' });
      fetchData();
    } catch (error) {
      alert('Erro ao encerrar contrato.');
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto font-sans animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Key className="text-blue-600 bg-blue-50 p-1.5 rounded-lg" size={36} />
            Gestão de Contratos
          </h1>
          <p className="text-slate-500 mt-2 text-sm">Gere contratos de Locação ou Venda. A emissão criará as faturas financeiras automaticamente.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm">
          <Plus size={18} /> Novo Contrato
        </button>
      </div>

      {/* LISTAGEM DE CONTRATOS */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="p-4">Imóvel & Tipo</th>
                <th className="p-4">Cliente Associado</th>
                <th className="p-4">Financeiro</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2"/> Carregando contratos...</td></tr>
              ) : contracts.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-medium">Nenhum contrato ativo no sistema.</td></tr>
              ) : (
                contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-800 flex items-center gap-2"><Home size={14} className="text-slate-400"/> {contract.property?.title || 'Imóvel Excluído'}</p>
                      <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded border ${contract.type === 'Venda' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        {contract.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-700 flex items-center gap-2"><User size={14} className="text-slate-400"/> {contract.tenant?.name || 'Cliente Excluído'}</p>
                      <p className="text-xs text-slate-500 mt-1">Doc: {contract.tenant?.document}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-emerald-600 flex items-center gap-1"><DollarSign size={14}/> R$ {contract.rentValue?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {contract.type === 'Locação' ? `Taxa Admin: ${contract.adminFeePercent}%` : `Comissão: ${contract.adminFeePercent}%`}
                      </p>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${contract.status === 'Ativo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${contract.status === 'Ativo' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        {contract.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {contract.status === 'Ativo' && (
                        <button onClick={() => handleEndContract(contract.id)} className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-red-100">
                          Encerrar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NOVO CONTRATO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="text-blue-600" size={24}/>
                Emissão de Contrato
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-200 p-2 rounded-lg transition-colors"><X size={20}/></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="contract-form" onSubmit={handleSave} className="space-y-6">
                
                {/* TIPO DE CONTRATO */}
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <label className="block text-sm font-bold text-blue-900 mb-3 uppercase tracking-wider">Natureza da Operação</label>
                  <div className="flex gap-4">
                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.type === 'Locação' ? 'border-blue-600 bg-white text-blue-700 shadow-sm' : 'border-slate-200 hover:border-slate-300 text-slate-500 bg-slate-50'}`}>
                      <input type="radio" name="type" value="Locação" checked={form.type === 'Locação'} onChange={(e) => setForm({...form, type: e.target.value})} className="hidden" />
                      <Key size={18}/> <span className="font-bold">Locação (Aluguel)</span>
                    </label>
                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.type === 'Venda' ? 'border-indigo-600 bg-white text-indigo-700 shadow-sm' : 'border-slate-200 hover:border-slate-300 text-slate-500 bg-slate-50'}`}>
                      <input type="radio" name="type" value="Venda" checked={form.type === 'Venda'} onChange={(e) => setForm({...form, type: e.target.value})} className="hidden" />
                      <DollarSign size={18}/> <span className="font-bold">Venda do Imóvel</span>
                    </label>
                  </div>
                </div>

                {/* SELEÇÃO DE ENTIDADES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Selecione o Imóvel *</label>
                    <select required value={form.propertyId} onChange={e => setForm({...form, propertyId: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm">
                      <option value="">Buscar imóvel disponível...</option>
                      {properties.map(p => <option key={p.id} value={p.id}>{p.title} - {p.code}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      {form.type === 'Locação' ? 'Selecione o Inquilino *' : 'Selecione o Comprador *'}
                    </label>
                    <select required value={form.tenantId} onChange={e => setForm({...form, tenantId: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm">
                      <option value="">Buscar cliente no CRM...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name || c.corporateName} (Doc: {c.document})</option>)}
                    </select>
                  </div>
                </div>

                {/* DADOS FINANCEIROS */}
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider flex items-center gap-2"><DollarSign size={16}/> Dados Financeiros & Prazos</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Data de Início / 1ª Parcela *</label>
                      <input required type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-700" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        {form.type === 'Locação' ? 'Data de Término do Contrato *' : 'Data da Última Parcela (Opcional)'}
                      </label>
                      <input required={form.type === 'Locação'} type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-700" />
                      {form.type === 'Venda' && <p className="text-[10px] text-slate-400 mt-1">Deixe vazio se for pagamento à vista (1 parcela).</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        {form.type === 'Locação' ? 'Valor Mensal do Aluguel (R$) *' : 'Valor da Parcela / Venda (R$) *'}
                      </label>
                      <input required type="number" step="0.01" value={form.rentValue} onChange={e => setForm({...form, rentValue: e.target.value})} placeholder="0.00" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50 font-bold" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        {form.type === 'Locação' ? 'Taxa Admin (%)' : 'Comissão (%)'}
                      </label>
                      <input type="number" step="0.1" value={form.adminFeePercent} onChange={e => setForm({...form, adminFeePercent: e.target.value})} placeholder="Ex: 10" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                  </div>
                </div>

                {/* ARQUIVOS ANEXOS */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Link do Contrato Assinado (PDF / Google Drive)</label>
                  <input type="url" value={form.documentUrl} onChange={e => setForm({...form, documentUrl: e.target.value})} placeholder="https://..." className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white" />
                </div>

                {/* ALERTA DE AUTOMAÇÃO */}
                <div className="flex gap-3 bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-800 text-sm">
                  <AlertCircle className="shrink-0 mt-0.5" size={18}/>
                  <p>
                    <strong>Atenção:</strong> Ao salvar, o sistema irá automaticamente: <br/>
                    1. Mudar o status do imóvel para <b>{form.type === 'Locação' ? 'Alugado' : 'Vendido'}</b>.<br/>
                    2. Mudar o perfil do cliente para <b>{form.type === 'Locação' ? 'Inquilino' : 'Comprador'}</b>.<br/>
                    3. Gerar as faturas/parcelas financeiras para o período selecionado.
                  </p>
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
                Cancelar
              </button>
              <button form="contract-form" type="submit" disabled={isSaving} className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-70">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16}/>}
                Confirmar & Gerar Faturas
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}