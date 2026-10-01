'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { Users, Plus, Edit, X, Search, CheckCircle2, XCircle, Loader2, UserCircle } from 'lucide-react';

export default function CorretoresPage() {
  const [brokers, setBrokers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', cpf: '', creci: '', phone: '', password: '', profileImageUrl: ''
  });

  useEffect(() => {
    fetchBrokers();
  }, []);

  const fetchBrokers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/brokers');
      setBrokers(response.data);
    } catch (error) {
      console.error('Erro ao buscar corretores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, profileImageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenModal = (broker?: any) => {
    if (broker) {
      setEditingId(broker.id);
      setForm({
        name: broker.name, email: broker.email, cpf: broker.cpf, creci: broker.creci, 
        phone: broker.phone, password: '', profileImageUrl: broker.profileImageUrl || ''
      });
    } else {
      setEditingId(null);
      setForm({ name: '', email: '', cpf: '', creci: '', phone: '', password: '', profileImageUrl: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        await api.put(`/brokers/${editingId}`, form);
        alert('Corretor atualizado com sucesso!');
      } else {
        await api.post('/brokers', form);
        alert('Corretor cadastrado com sucesso!');
      }
      setIsModalOpen(false);
      fetchBrokers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar corretor.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    if (!confirm('Deseja alterar o status deste corretor?')) return;
    try {
      await api.patch(`/brokers/${id}/status`);
      fetchBrokers();
    } catch (error) {
      alert('Erro ao alterar status.');
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center text-slate-500"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Meus Corretores</h1>
          <p className="text-slate-500">Faça a gestão da sua equipa de vendas e perfil público no site.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
          <Plus size={18} /> Novo Corretor
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="py-4 px-6 w-16">Foto</th>
              <th className="py-4 px-6">Nome / CRECI</th>
              <th className="py-4 px-6">Contactos</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {brokers.map(broker => (
              <tr key={broker.id} className="hover:bg-slate-50">
                <td className="py-3 px-6">
                  {broker.profileImageUrl ? (
                    <img src={broker.profileImageUrl} alt={broker.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400"><UserCircle size={24} /></div>
                  )}
                </td>
                <td className="py-3 px-6">
                  <p className="font-bold text-slate-800">{broker.name}</p>
                  <p className="text-xs text-slate-500">CRECI: {broker.creci}</p>
                </td>
                <td className="py-3 px-6">
                  <p>{broker.email}</p>
                  <p className="text-xs text-slate-500">{broker.phone}</p>
                </td>
                <td className="py-3 px-6">
                  <button onClick={() => handleToggleStatus(broker.id)} className="focus:outline-none">
                    {broker.isActive 
                      ? <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle2 size={12}/> Ativo</span>
                      : <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><XCircle size={12}/> Inativo</span>
                    }
                  </button>
                </td>
                <td className="py-3 px-6 text-right">
                  <button onClick={() => handleOpenModal(broker)} className="text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1.5 rounded-lg">Editar</button>
                </td>
              </tr>
            ))}
            {brokers.length === 0 && (
              <tr><td colSpan={5} className="py-12 text-center text-slate-500">Nenhum corretor cadastrado na sua loja.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-800">{editingId ? 'Editar Corretor' : 'Novo Corretor'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              {/* Foto de Perfil */}
              <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                {form.profileImageUrl ? (
                  <img src={form.profileImageUrl} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-sm" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-sm text-slate-400"><UserCircle size={40}/></div>
                )}
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Foto de Perfil (Site Público)</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm mb-1 text-slate-600">Nome Completo</label><input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm mb-1 text-slate-600">CRECI</label><input required type="text" value={form.creci} onChange={e => setForm({...form, creci: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm mb-1 text-slate-600">CPF</label><input required type="text" value={form.cpf} onChange={e => setForm({...form, cpf: e.target.value})} disabled={!!editingId} className="w-full px-3 py-2 border rounded-lg bg-slate-50" /></div>
                <div><label className="block text-sm mb-1 text-slate-600">Telefone / WhatsApp</label><input required type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm mb-1 text-slate-600">E-mail (Acesso ao painel)</label><input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div>
                  <label className="block text-sm mb-1 text-slate-600">Palavra-passe {editingId && <span className="text-xs text-slate-400">(Deixe em branco para não alterar)</span>}</label>
                  <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required={!editingId} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg flex items-center gap-2">
                  {isSaving && <Loader2 size={16} className="animate-spin" />} Salvar Corretor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}