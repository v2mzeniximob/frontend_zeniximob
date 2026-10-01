'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { Plus, Edit, X, CheckCircle2, Loader2, UserCircle, FileSignature, Copy, Send, MessageCircle, FileText, ExternalLink } from 'lucide-react';

export default function ProprietariosPage() {
  const [owners, setOwners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', cpfOrCnpj: '', email: '', phone: '', bankData: '', managementContractUrl: ''
  });

  const [selectedOwner, setSelectedOwner] = useState<any>(null);

  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/owners');
      setOwners(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (owner?: any) => {
    if (owner) {
      setEditingId(owner.id);
      setForm({
        name: owner.name,
        cpfOrCnpj: owner.cpfOrCnpj,
        email: owner.email || '',
        phone: owner.phone || '',
        bankData: owner.bankData || '',
        managementContractUrl: owner.managementContractUrl || ''
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
        alert('Proprietário atualizado!');
      } else {
        await api.post('/owners', form);
        alert('Proprietário cadastrado!');
      }
      setIsModalOpen(false);
      fetchOwners();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenContract = (owner: any) => {
    if (!owner.email) {
      alert('Por favor, edite o proprietário e adicione um E-mail antes de gerar o contrato.');
      return;
    }
    setSelectedOwner(owner);
    setIsContractModalOpen(true);
  };

  const handleSendContract = async () => {
    setIsProcessingId(selectedOwner.id);
    try {
      await api.post(`/owners/${selectedOwner.id}/send-contract`, {
        documentText: `CONTRATO DE GESTÃO - ${selectedOwner.name}` 
      });
      
      alert('Contrato gerado com sucesso via Clicksign!');
      setIsContractModalOpen(false);
      fetchOwners(); 
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao disparar contrato.');
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleWhatsApp = (owner: any) => {
    if (!owner.phone) {
      navigator.clipboard.writeText(owner.managementContractUrl);
      alert('Proprietário sem telefone! O link foi copiado para a área de transferência.');
      return;
    }

    let phoneNum = owner.phone.replace(/\D/g, '');
    if (phoneNum.length === 10 || phoneNum.length === 11) {
      phoneNum = `55${phoneNum}`;
    }

    const text = `Olá, *${owner.name}*! Tudo bem?\n\nSegue o link seguro para você assinar o seu Contrato de Gestão Imobiliária:\n${owner.managementContractUrl}\n\nQualquer dúvida, estamos à disposição!`;
    const url = `https://wa.me/${phoneNum}?text=${encodeURIComponent(text)}`;
    
    window.open(url, '_blank');
  };

  if (isLoading) return <div className="p-8 flex justify-center text-slate-500"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <UserCircle className="text-blue-600" size={32} />
            Gestão de Proprietários
          </h1>
          <p className="text-slate-500 mt-1">Cadastre os donos dos imóveis e faça a gestão contratual e financeira.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors">
          <Plus size={18} /> Novo Proprietário
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="py-4 px-6">Nome / Documento</th>
              <th className="py-4 px-6">Contatos</th>
              <th className="py-4 px-6">Imóveis Atrelados</th>
              <th className="py-4 px-6">Contrato de Gestão</th>
              <th className="py-4 px-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {owners.map(owner => (
              <tr key={owner.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6">
                  <p className="font-bold text-slate-800">{owner.name}</p>
                  <p className="text-xs text-slate-500 font-mono mt-1">CPF/CNPJ: {owner.cpfOrCnpj}</p>
                </td>
                <td className="py-4 px-6">
                  <p className="text-slate-700">{owner.email || <span className="text-red-400 text-xs">Sem e-mail</span>}</p>
                  <p className="text-xs text-slate-500 mt-1">{owner.phone || 'Sem telefone'}</p>
                </td>
                <td className="py-4 px-6">
                  <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">
                    {owner.properties?.length || 0} Imóveis
                  </span>
                </td>
                <td className="py-4 px-6">
                  {owner.managementContractUrl ? (
                    // Aqui entra a lógica inteligente: Se a URL tiver ".pdf", significa que foi assinada. Se tiver "app.clicksign", ainda está pendente.
                    owner.managementContractUrl.includes('.pdf') ? (
                       <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={14}/> Totalmente Assinado
                        </span>
                        <a href={owner.managementContractUrl} target="_blank" rel="noreferrer" className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded w-fit flex items-center justify-center gap-1 hover:bg-emerald-100 transition-colors">
                          <FileText size={14}/> Baixar PDF Assinado
                        </a>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                          <Loader2 size={14} className="animate-spin"/> Aguardando Assinatura
                        </span>
                        <div className="flex gap-2">
                          <a href={owner.managementContractUrl} target="_blank" rel="noreferrer" className="text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-1.5 rounded flex items-center gap-1 hover:bg-slate-200 transition-colors">
                            <ExternalLink size={14}/> Link
                          </a>
                          <button onClick={() => handleWhatsApp(owner)} className="text-[11px] font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-1.5 rounded flex items-center gap-1 hover:bg-green-100 transition-colors">
                            <MessageCircle size={14}/> WhatsApp
                          </button>
                        </div>
                      </div>
                    )
                  ) : (
                    <button 
                      onClick={() => handleOpenContract(owner)} 
                      disabled={isProcessingId === owner.id}
                      className="text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      {isProcessingId === owner.id ? <Loader2 size={14} className="animate-spin" /> : <FileSignature size={14}/>}
                      Disparar Clicksign
                    </button>
                  )}
                </td>
                <td className="py-4 px-6 text-right">
                  <button onClick={() => handleOpenModal(owner)} className="text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-2 rounded-lg">
                    <Edit size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {owners.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">Nenhum proprietário cadastrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {editingId ? <Edit size={20} className="text-blue-600"/> : <Plus size={20} className="text-blue-600"/>}
                {editingId ? 'Editar Proprietário' : 'Novo Proprietário'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nome Completo / Razão Social</label>
                  <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">CPF ou CNPJ</label>
                  <input required type="text" value={form.cpfOrCnpj} onChange={e => setForm({...form, cpfOrCnpj: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    E-mail <span className="text-[10px] text-blue-600 font-normal">Requerido p/ assinatura</span>
                  </label>
                  <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-blue-50/30" />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">WhatsApp / Telefone</label>
                  <input type="text" placeholder="(11) 99999-9999" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Dados Bancários (Para Repasse)</label>
                  <textarea rows={2} placeholder="Banco, Agência, Conta, Pix..." value={form.bankData} onChange={e => setForm({...form, bankData: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 resize-none" />
                </div>

                {/* VISUALIZAÇÃO DO LINK NO MODO EDIÇÃO */}
                {form.managementContractUrl && (
                  <div className="col-span-2 mt-2 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                      <FileSignature size={16} /> Link do Contrato Gerado:
                    </p>
                    <div className="flex gap-2">
                      <input type="text" readOnly value={form.managementContractUrl} className="flex-1 px-3 py-2 bg-white border border-slate-200 text-slate-500 rounded-lg text-xs outline-none" />
                      <a href={form.managementContractUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 whitespace-nowrap flex items-center gap-2">
                        Abrir Arquivo
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2">
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Salvar Dados'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE DISPARO DE CONTRATO */}
      {isContractModalOpen && selectedOwner && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileSignature size={20} className="text-blue-600"/> Contrato de Gestão e Administração
              </h2>
              <button onClick={() => setIsContractModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            
            <div className="p-6">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-6 text-sm text-slate-700 font-serif leading-relaxed h-64 overflow-y-auto">
                <p className="font-bold text-center mb-4">CONTRATO DE PRESTAÇÃO DE SERVIÇOS IMOBILIÁRIOS</p>
                <p><strong>CONTRATANTE (Proprietário):</strong> {selectedOwner.name}, inscrito no CPF/CNPJ sob nº {selectedOwner.cpfOrCnpj}, com e-mail {selectedOwner.email}.</p>
                <p className="mt-4"><strong>CLÁUSULA 1:</strong> O CONTRATANTE autoriza a CONTRATADA (Imobiliária) a promover, com exclusividade ou não, a divulgação e administração da locação ou venda de seus imóveis cadastrados na plataforma.</p>
                <p className="mt-4"><strong>CLÁUSULA 2:</strong> A CONTRATADA fará o repasse dos valores recebidos para a conta bancária informada: {selectedOwner.bankData || '[Conta não informada]'}.</p>
                <p className="mt-4 text-slate-400 italic">... (O documento completo será lido da Clicksign e enviado por e-mail) ...</p>
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-xs text-slate-500 font-medium">Ao clicar abaixo, a Clicksign enviará o contrato com força jurídica para <strong>{selectedOwner.email}</strong>.</p>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button onClick={() => setIsContractModalOpen(false)} className="px-5 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-lg">Cancelar</button>
                  <button onClick={handleSendContract} disabled={isProcessingId === selectedOwner.id} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-2 shadow-md">
                    {isProcessingId === selectedOwner.id ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18}/> Gerar & Disparar Clicksign</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}