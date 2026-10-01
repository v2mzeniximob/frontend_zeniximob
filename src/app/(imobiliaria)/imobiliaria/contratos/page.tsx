'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { Plus, Edit, X, Loader2, FileText, Home, User, DollarSign, CalendarDays } from 'lucide-react';

export default function ContratosPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    type: 'Locação',
    propertyId: '',
    tenantId: '',
    startDate: '',
    endDate: '',
    rentValue: '',
    adminFeePercent: '10', // Padrão 10%
    readjustmentIndex: 'IGPM'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Busca os contratos, imóveis (para o select) e inquilinos (para o select)
      const [resContracts, resProperties, resTenants] = await Promise.all([
        api.get('/contracts'),
        api.get('/properties'), // Trazemos para poder escolher no formulário
        api.get('/tenants')     // Trazemos para vincular ao contrato
      ]);
      setContracts(resContracts.data);
      // Filtramos apenas imóveis vagos para novos contratos de locação
      setProperties(resProperties.data.filter((p: any) => p.rentStatus === 'Vago'));
      setTenants(resTenants.data);
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
      await api.post('/contracts', {
        ...form,
        rentValue: Number(form.rentValue),
        adminFeePercent: Number(form.adminFeePercent)
      });
      alert('Contrato gerado com sucesso! O imóvel agora está marcado como Alugado.');
      setIsModalOpen(false);
      setForm({ type: 'Locação', propertyId: '', tenantId: '', startDate: '', endDate: '', rentValue: '', adminFeePercent: '10', readjustmentIndex: 'IGPM' });
      fetchData(); // Recarrega tudo
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao gerar contrato.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEncerrar = async (id: string) => {
    if (!confirm('Tem a certeza que deseja encerrar este contrato? O imóvel voltará a ficar "Vago".')) return;
    try {
      await api.put(`/contracts/${id}`, { status: 'Encerrado' });
      fetchData();
    } catch (error) {
      alert('Erro ao encerrar contrato.');
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center text-slate-500"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <FileText className="text-blue-600" size={32} />
            Gestão de Contratos
          </h1>
          <p className="text-slate-500 mt-1">Crie e administre contratos de locação e as suas regras financeiras.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus size={18} /> Novo Contrato
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="py-4 px-6">Imóvel e Inquilino</th>
              <th className="py-4 px-6">Valores (Mensal)</th>
              <th className="py-4 px-6">Vigência</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {contracts.map(contract => (
              <tr key={contract.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6">
                  <p className="font-bold text-slate-800 flex items-center gap-2 mb-1">
                    <Home size={14} className="text-slate-400"/> {contract.property?.title}
                  </p>
                  {contract.tenant && (
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <User size={14} className="text-blue-400"/> {contract.tenant.name} (Inquilino)
                    </p>
                  )}
                  {contract.property?.owner && (
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <User size={14} className="text-amber-500"/> {contract.property.owner.name} (Proprietário)
                    </p>
                  )}
                </td>
                <td className="py-4 px-6">
                  <p className="font-bold text-emerald-600">R$ {Number(contract.rentValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs text-slate-500">Taxa Admin: {contract.adminFeePercent}%</p>
                </td>
                <td className="py-4 px-6">
                  <p className="flex items-center gap-2 text-slate-700"><CalendarDays size={14}/> Início: {new Date(contract.startDate).toLocaleDateString()}</p>
                  {contract.endDate && <p className="text-xs text-slate-500 mt-1">Fim: {new Date(contract.endDate).toLocaleDateString()}</p>}
                </td>
                <td className="py-4 px-6">
                  {contract.status === 'Ativo' ? (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Ativo</span>
                  ) : (
                    <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{contract.status}</span>
                  )}
                </td>
                <td className="py-4 px-6 text-right">
                  {contract.status === 'Ativo' && (
                    <button onClick={() => handleEncerrar(contract.id)} className="text-red-600 hover:text-red-800 font-medium bg-red-50 px-3 py-2 rounded-lg transition-colors text-xs">
                      Encerrar Contrato
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {contracts.length === 0 && (
              <tr><td colSpan={5} className="py-12 text-center text-slate-500">Nenhum contrato ativo no momento.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL NOVO CONTRATO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="text-blue-600" size={20}/> Gerar Novo Contrato
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6">
                <p className="text-sm text-blue-800 font-medium">Ao criar este contrato, o imóvel selecionado mudará automaticamente o status para "Alugado" na vitrine pública.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Selecionar Imóvel (Vagos)</label>
                  <select required value={form.propertyId} onChange={e => setForm({...form, propertyId: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white">
                    <option value="">Selecione um imóvel...</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.title} - R$ {p.price}</option>)}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Selecionar Inquilino</label>
                  <select required value={form.tenantId} onChange={e => setForm({...form, tenantId: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white">
                    <option value="">Selecione o inquilino...</option>
                    {tenants.map(t => <option key={t.id} value={t.id}>{t.name} (CPF: {t.cpf})</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Data de Início</label>
                  <input required type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Data de Término (Opcional)</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1"><DollarSign size={16}/> Valor do Aluguel (R$)</label>
                  <input required type="number" step="0.01" value={form.rentValue} onChange={e => setForm({...form, rentValue: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" placeholder="Ex: 2500.00" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Taxa Imobiliária (%)</label>
                  <input required type="number" step="0.1" value={form.adminFeePercent} onChange={e => setForm({...form, adminFeePercent: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" placeholder="Ex: 10" />
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2 transition-colors shadow-sm">
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Confirmar e Assinar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}