'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { Plus, Edit, X, CheckCircle2, XCircle, Loader2, User, Building, Landmark, Phone, Mail } from 'lucide-react';

export default function ProprietariosPage() {
  const [owners, setOwners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    name: '', cpfOrCnpj: '', email: '', phone: '', bankData: ''
  });

  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/owners');
      setOwners(response.data);
    } catch (error) {
      console.error('Erro ao buscar proprietários:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (owner?: any) => {
    if (owner) {
      setEditingId(owner.id);
      setForm({
        name: owner.name || '',
        cpfOrCnpj: owner.cpfOrCnpj || '',
        email: owner.email || '',
        phone: owner.phone || '',
        bankData: owner.bankData || ''
      });
    } else {
      setEditingId(null);
      setForm({ name: '', cpfOrCnpj: '', email: '', phone: '', bankData: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        await api.put(`/owners/${editingId}`, form);
        alert('Proprietário atualizado com sucesso!');
      } else {
        await api.post('/owners', form);
        alert('Proprietário cadastrado com sucesso!');
      }
      setIsModalOpen(false);
      fetchOwners();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar proprietário.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    if (!confirm('Deseja alterar o status deste proprietário?')) return;
    try {
      await api.patch(`/owners/${id}/status`);
      fetchOwners();
    } catch (error) {
      alert('Erro ao alterar status.');
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center text-slate-500"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Landmark className="text-blue-600" size={32} />
            Proprietários
          </h1>
          <p className="text-slate-500 mt-1">Gira os donos dos imóveis e os seus dados para repasses financeiros.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus size={18} /> Novo Proprietário
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="py-4 px-6">Nome / Documento</th>
              <th className="py-4 px-6">Contactos</th>
              <th className="py-4 px-6">Dados Bancários (Repasse)</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {owners.map(owner => (
              <tr key={owner.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      {owner.cpfOrCnpj.length > 14 ? <Building size={20} /> : <User size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{owner.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{owner.cpfOrCnpj}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="space-y-1">
                    {owner.phone && <p className="flex items-center gap-2 text-slate-600"><Phone size={14}/> {owner.phone}</p>}
                    {owner.email && <p className="flex items-center gap-2 text-slate-600"><Mail size={14}/> {owner.email}</p>}
                  </div>
                </td>
                <td className="py-4 px-6 max-w-xs">
                  <p className="text-xs text-slate-500 truncate" title={owner.bankData || 'Não informado'}>
                    {owner.bankData || <span className="text-amber-500 italic">Pendente preenchimento</span>}
                  </p>
                </td>
                <td className="py-4 px-6">
                  <button onClick={() => handleToggleStatus(owner.id)} className="focus:outline-none">
                    {owner.isActive 
                      ? <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle2 size={14}/> Ativo</span>
                      : <span className="bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1"><XCircle size={14}/> Inativo</span>
                    }
                  </button>
                </td>
                <td className="py-4 px-6 text-right">
                  <button onClick={() => handleOpenModal(owner)} className="text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ml-auto">
                    <Edit size={16} /> Editar
                  </button>
                </td>
              </tr>
            ))}
            {owners.length === 0 && (
              <tr><td colSpan={5} className="py-12 text-center text-slate-500">Nenhum proprietário cadastrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {editingId ? <Edit className="text-blue-600" size={20}/> : <Plus className="text-blue-600" size={20}/>}
                {editingId ? 'Editar Proprietário' : 'Novo Proprietário'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nome Completo / Razão Social</label>
                  <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">CPF ou CNPJ</label>
                  <input required type="text" value={form.cpfOrCnpj} onChange={e => setForm({...form, cpfOrCnpj: e.target.value})} disabled={!!editingId} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-100" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">E-mail</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                    <Landmark size={16} className="text-slate-500"/> Dados Bancários para Repasse
                  </label>
                  <textarea 
                    rows={3}
                    placeholder="Ex: Banco Itaú, Agência 0001, Conta 12345-6. Chave PIX: email@exemplo.com"
                    value={form.bankData} 
                    onChange={e => setForm({...form, bankData: e.target.value})} 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none" 
                  />
                  <p className="text-xs text-slate-500 mt-1">Estas informações serão usadas pelo módulo financeiro para os pagamentos automáticos.</p>
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2 transition-colors shadow-sm">
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} 
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Proprietário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}