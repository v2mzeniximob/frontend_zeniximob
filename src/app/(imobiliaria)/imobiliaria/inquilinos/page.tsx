'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { Users, Plus, Edit, X, CheckCircle2, Loader2, Phone, Mail, FileText, Paperclip } from 'lucide-react';

export default function InquilinosPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    name: '', cpf: '', email: '', phone: '', currentAddress: '', documentUrl: '',
    maritalStatus: 'Solteiro(a)', spouseName: '', spouseCpf: '', spouseDocUrl: '',
    guarantorName: '', guarantorCpf: '', guarantorDocUrl: ''
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/tenants');
      setTenants(response.data);
    } catch (error) {
      console.error('Erro ao buscar inquilinos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (tenant?: any) => {
    if (tenant) {
      setEditingId(tenant.id);
      setForm({
        name: tenant.name || '',
        cpf: tenant.document || '',
        email: tenant.email || '',
        phone: tenant.phone || '',
        currentAddress: tenant.street || '',
        documentUrl: tenant.documentUrl || '',
        maritalStatus: tenant.maritalStatus || 'Solteiro(a)',
        spouseName: tenant.spouseName || '',
        spouseCpf: tenant.spouseCpf || '',
        spouseDocUrl: tenant.spouseDocUrl || '',
        guarantorName: tenant.guarantorName || '',
        guarantorCpf: tenant.guarantorCpf || '',
        guarantorDocUrl: tenant.guarantorDocUrl || ''
      });
    } else {
      setEditingId(null);
      setForm({
        name: '', cpf: '', email: '', phone: '', currentAddress: '', documentUrl: '',
        maritalStatus: 'Solteiro(a)', spouseName: '', spouseCpf: '', spouseDocUrl: '',
        guarantorName: '', guarantorCpf: '', guarantorDocUrl: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        await api.put(`/tenants/${editingId}`, form);
        alert('Inquilino atualizado com sucesso!');
      } else {
        await api.post('/tenants', form);
        alert('Inquilino cadastrado com sucesso!');
      }
      setIsModalOpen(false);
      fetchTenants();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar inquilino.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center text-slate-500"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Users className="text-blue-600 bg-blue-50 p-1.5 rounded-lg" size={32} />
            Gestão de Inquilinos
          </h1>
          <p className="text-slate-500 mt-2 text-sm">Esta lista exibe apenas os clientes classificados como Inquilinos.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm">
          <Plus size={18} /> Novo Inquilino Rápido
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-4 px-6">Nome / Documento</th>
              <th className="py-4 px-6">Contatos</th>
              <th className="py-4 px-6">Estado Civil / Fiador</th>
              <th className="py-4 px-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {tenants.map(tenant => (
              <tr key={tenant.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6">
                  <p className="font-bold text-slate-800 text-base">{tenant.name}</p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                    <FileText size={12}/> CPF/CNPJ: {tenant.document}
                  </p>
                  {tenant.documentUrl && (
                    <a href={tenant.documentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors">
                      <Paperclip size={10}/> Ver Documentos
                    </a>
                  )}
                </td>
                
                <td className="py-4 px-6 space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2"><Mail size={14} className="text-slate-400"/> {tenant.email || 'Não informado'}</p>
                  <p className="text-sm flex items-center gap-2"><Phone size={14} className="text-slate-400"/> {tenant.phone}</p>
                </td>
                
                <td className="py-4 px-6">
                  <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-1 rounded">{tenant.maritalStatus || 'Não informado'}</span>
                  {tenant.guarantorName && (
                    <p className="text-xs text-slate-500 mt-2"><strong>Fiador:</strong> {tenant.guarantorName}</p>
                  )}
                </td>

                <td className="py-4 px-6 text-right">
                  <button onClick={() => handleOpenModal(tenant)} className="text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ml-auto">
                    <Edit size={16} /> Editar
                  </button>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr><td colSpan={4} className="py-12 text-center text-slate-500 text-base font-medium">Nenhum inquilino cadastrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE CADASTRO/EDIÇÃO RÁPIDO DE INQUILINO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="text-blue-600" size={24}/>
                {editingId ? 'Editar Inquilino' : 'Cadastrar Inquilino Rápido'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-lg transition-colors"><X size={20}/></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="tenant-form" onSubmit={handleSave} className="space-y-6">
                
                {/* DADOS PESSOAIS */}
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">1. Dados Pessoais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Nome Completo</label>
                      <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">CPF</label>
                      <input required type="text" value={form.cpf} onChange={e => setForm({...form, cpf: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">E-mail (Para assinar contrato)</label>
                      <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Telefone / WhatsApp</label>
                      <input required type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Endereço Atual</label>
                      <input required type="text" value={form.currentAddress} onChange={e => setForm({...form, currentAddress: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1"><Paperclip size={12}/> Link dos Documentos (RG/CPF)</label>
                      <input type="url" value={form.documentUrl} onChange={e => setForm({...form, documentUrl: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-blue-50/50" placeholder="Ex: Link do Google Drive" />
                    </div>
                  </div>
                </div>

                {/* ESTADO CIVIL E CÔNJUGE */}
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">2. Estado Civil e Cônjuge</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    <div className="md:col-span-1">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Estado Civil</label>
                      <select value={form.maritalStatus} onChange={e => setForm({...form, maritalStatus: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                        <option value="Solteiro(a)">Solteiro(a)</option>
                        <option value="Casado(a)">Casado(a)</option>
                        <option value="Divorciado(a)">Divorciado(a)</option>
                        <option value="Viúvo(a)">Viúvo(a)</option>
                      </select>
                    </div>
                    
                    {form.maritalStatus === 'Casado(a)' && (
                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="md:col-span-2">
                          <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Dados do Cônjuge</p>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Nome do Cônjuge</label>
                          <input type="text" value={form.spouseName} onChange={e => setForm({...form, spouseName: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">CPF do Cônjuge</label>
                          <input type="text" value={form.spouseCpf} onChange={e => setForm({...form, spouseCpf: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1"><Paperclip size={12}/> Link dos Docs do Cônjuge</label>
                          <input type="url" value={form.spouseDocUrl} onChange={e => setForm({...form, spouseDocUrl: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" placeholder="Ex: Link do Google Drive" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* FIADOR (Opcional) */}
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">3. Dados do Fiador (Opcional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Nome do Fiador</label>
                      <input type="text" value={form.guarantorName} onChange={e => setForm({...form, guarantorName: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Opcional..." />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">CPF do Fiador</label>
                      <input type="text" value={form.guarantorCpf} onChange={e => setForm({...form, guarantorCpf: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Opcional..." />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1"><Paperclip size={12}/> Docs do Fiador</label>
                      <input type="url" value={form.guarantorDocUrl} onChange={e => setForm({...form, guarantorDocUrl: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Ex: Link do Google Drive" />
                    </div>
                  </div>
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0 rounded-b-2xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors text-sm">
                Cancelar
              </button>
              <button form="tenant-form" type="submit" disabled={isSaving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm text-sm">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} 
                {editingId ? 'Salvar Alterações' : 'Cadastrar Inquilino'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}