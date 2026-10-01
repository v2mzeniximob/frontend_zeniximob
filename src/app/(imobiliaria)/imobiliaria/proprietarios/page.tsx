'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { Plus, Edit, X, CheckCircle2, XCircle, Loader2, User, Building, Landmark, Phone, Mail, Link as LinkIcon, FileText, Home, Camera } from 'lucide-react';

export default function ProprietariosPage() {
  const [owners, setOwners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal de Visão 360 (Imóveis do Proprietário)
  const [selectedOwnerProperties, setSelectedOwnerProperties] = useState<any>(null);

  const [form, setForm] = useState({
    name: '', cpfOrCnpj: '', email: '', phone: '', bankData: '', managementContractUrl: ''
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
        name: owner.name || '', cpfOrCnpj: owner.cpfOrCnpj || '', email: owner.email || '', 
        phone: owner.phone || '', bankData: owner.bankData || '', managementContractUrl: owner.managementContractUrl || ''
      });
    } else {
      setEditingId(null);
      setForm({ name: '', cpfOrCnpj: '', email: '', phone: '', bankData: '', managementContractUrl: '' });
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
    if (!confirm('Deseja alterar o status?')) return;
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
          <p className="text-slate-500 mt-1">Gira os donos dos imóveis, contratos de administração e veja os repasses.</p>
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
              <th className="py-4 px-6">Contrato c/ Imobiliária</th>
              <th className="py-4 px-6">Imóveis</th>
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
                <td className="py-4 px-6">
                  {owner.managementContractUrl ? (
                    <a href={owner.managementContractUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                      <FileText size={14}/> Ver Contrato
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Sem contrato anexado</span>
                  )}
                </td>
                <td className="py-4 px-6">
                  <button onClick={() => setSelectedOwnerProperties(owner)} className="text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2">
                    <Home size={14}/> {owner.properties?.length || 0} Imóveis
                  </button>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleToggleStatus(owner.id)} title={owner.isActive ? "Desativar" : "Ativar"} className="text-slate-400 hover:text-slate-600">
                      {owner.isActive ? <CheckCircle2 className="text-green-500" size={18}/> : <XCircle className="text-red-500" size={18}/>}
                    </button>
                    <button onClick={() => handleOpenModal(owner)} className="text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-2">
                      <Edit size={16} /> Editar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL: DETALHES DOS IMÓVEIS (VISÃO 360º) */}
      {selectedOwnerProperties && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Home className="text-blue-600" size={24}/> Imóveis de {selectedOwnerProperties.name}
              </h2>
              <button onClick={() => setSelectedOwnerProperties(null)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {selectedOwnerProperties.properties?.map((prop: any) => (
                <div key={prop.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-800">{prop.title}</h3>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-bold rounded-md ${prop.rentStatus === 'Alugado' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {prop.rentStatus}
                      </span>
                    </div>
                    {/* Vistoria Inicial de Captação */}
                    {prop.inspectionUrl && (
                      <a href={prop.inspectionUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-bold">
                        <Camera size={14} className="text-slate-500"/> Vistoria Inicial
                      </a>
                    )}
                  </div>

                  {/* Mostra o contrato do Inquilino se o imóvel estiver alugado */}
                  {prop.contracts && prop.contracts.length > 0 && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <p className="text-xs font-bold text-blue-800 mb-2 uppercase tracking-wide">Contrato de Aluguel Ativo</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-900 font-medium flex items-center gap-2">
                          <User size={16}/> Inquilino: {prop.contracts[0].tenant?.name}
                        </span>
                        {prop.contracts[0].documentUrl && (
                          <a href={prop.contracts[0].documentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs bg-white text-blue-600 border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-bold">
                            <FileText size={14}/> Ver Contrato Inquilino
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {(!selectedOwnerProperties.properties || selectedOwnerProperties.properties.length === 0) && (
                <p className="text-center text-slate-500 py-8">Este proprietário ainda não possui imóveis cadastrados.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRO/EDIÇÃO */}
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
                  <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">CPF ou CNPJ</label>
                  <input required type="text" value={form.cpfOrCnpj} onChange={e => setForm({...form, cpfOrCnpj: e.target.value})} disabled={!!editingId} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 disabled:bg-slate-100" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                </div>
                
                {/* NOVO: CONTRATO DE ADMINISTRAÇÃO */}
                <div className="md:col-span-2 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                  <label className="block text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
                    <FileText size={16} className="text-blue-600"/> Contrato de Administração (Imobiliária & Proprietário)
                  </label>
                  <input 
                    type="url" 
                    placeholder="Ex: https://drive.google.com/..."
                    value={form.managementContractUrl} 
                    onChange={e => setForm({...form, managementContractUrl: e.target.value})} 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 mt-2" 
                  />
                  <p className="text-xs text-slate-500 mt-1">Cole aqui o link do contrato assinado com o proprietário para captação do imóvel.</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                    <Landmark size={16} className="text-slate-500"/> Dados Bancários para Repasse
                  </label>
                  <textarea 
                    rows={2}
                    placeholder="Ex: Banco Itaú, Agência 0001, Conta 12345-6. PIX: email@exemplo.com"
                    value={form.bankData} 
                    onChange={e => setForm({...form, bankData: e.target.value})} 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 resize-none" 
                  />
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