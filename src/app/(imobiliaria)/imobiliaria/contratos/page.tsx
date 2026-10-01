'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { Plus, CheckCircle2, Loader2, Key, FileSignature, MessageCircle, ExternalLink, X, Home, User, DollarSign, Calendar, Edit, FileText } from 'lucide-react';

export default function ContratosPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  // Estados para o Modal de Contrato (Novo / Editar)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [properties, setProperties] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  
  const [form, setForm] = useState({
    propertyId: '',
    tenantId: '',
    startDate: '',
    rentValue: '',
    adminFeePercent: '10',
    readjustmentIndex: 'IPCA'
  });

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/contracts');
      setContracts(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = async (contract: any = null) => {
    setIsModalOpen(true);
    setEditingId(contract ? contract.id : null);

    try {
      const [resProps, resTenants] = await Promise.all([
        api.get('/properties'),
        api.get('/tenants')
      ]);
      
      setTenants(resTenants.data);

      if (contract) {
        // Modo Edição: Mostra todos os imóveis (inclusive o que já está vinculado)
        setProperties(resProps.data);
        setForm({
          propertyId: contract.propertyId || '',
          tenantId: contract.tenantId || '',
          startDate: contract.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : '',
          rentValue: contract.rentValue?.toString() || '',
          adminFeePercent: contract.adminFeePercent?.toString() || '10',
          readjustmentIndex: contract.readjustmentIndex || 'IPCA'
        });
      } else {
        // Modo Novo: Filtra para mostrar apenas imóveis vagos
        setProperties(resProps.data.filter((p: any) => p.rentStatus !== 'Alugado'));
        setForm({ propertyId: '', tenantId: '', startDate: '', rentValue: '', adminFeePercent: '10', readjustmentIndex: 'IPCA' });
      }
    } catch (error) {
      console.error('Erro ao buscar dados para o formulário:', error);
    }
  };

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        await api.put(`/contracts/${editingId}`, form);
        alert('Contrato atualizado com sucesso!');
      } else {
        await api.post('/contracts', form);
        alert('Contrato criado com sucesso! Agora você já pode disparar a assinatura.');
      }
      
      setIsModalOpen(false);
      setEditingId(null);
      setForm({ propertyId: '', tenantId: '', startDate: '', rentValue: '', adminFeePercent: '10', readjustmentIndex: 'IPCA' });
      fetchContracts();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar o contrato.');
    } finally {
      setIsSaving(false);
    }
  };

  // Dispara a Clicksign para o Inquilino
  const handleSendToClicksign = async (contract: any) => {
    if (!contract.tenant?.email) {
      alert('O inquilino deste contrato não possui e-mail cadastrado. Edite o cadastro primeiro.');
      return;
    }
    
    setIsProcessingId(contract.id);
    try {
      await api.post(`/contracts/${contract.id}/send-contract`);
      alert('Contrato enviado com sucesso para assinatura!');
      fetchContracts(); 
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao disparar contrato.');
    } finally {
      setIsProcessingId(null);
    }
  };

  // Botão Inteligente do WhatsApp
  const handleWhatsApp = (contract: any) => {
    const tenant = contract.tenant;
    if (!tenant?.phone) {
      navigator.clipboard.writeText(contract.signUrl);
      alert('Inquilino sem telefone! Link copiado para a área de transferência.');
      return;
    }

    let phoneNum = tenant.phone.replace(/\D/g, '');
    if (phoneNum.length === 10 || phoneNum.length === 11) {
      phoneNum = `55${phoneNum}`;
    }

    const text = `Olá, *${tenant.name}*! Tudo bem?\n\nAqui está o link seguro para assinatura do seu Contrato de Locação:\n${contract.signUrl}\n\nQualquer dúvida, a imobiliária está à disposição!`;
    const url = `https://wa.me/${phoneNum}?text=${encodeURIComponent(text)}`;
    
    window.open(url, '_blank');
  };

  if (isLoading) return <div className="p-8 flex justify-center text-slate-500"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Key className="text-blue-600" size={32} />
            Gestão de Contratos
          </h1>
          <p className="text-slate-500 mt-1">Gerencie os contratos de locação, assinaturas digitais e andamento.</p>
        </div>
        
        <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors">
          <Plus size={18} /> Novo Contrato
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="py-4 px-6">Imóvel e Inquilino</th>
              <th className="py-4 px-6">Valores</th>
              <th className="py-4 px-6">Status / Assinatura</th>
              <th className="py-4 px-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {contracts.map(contract => (
              <tr key={contract.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6">
                  <p className="font-bold text-slate-800">{contract.property?.title || 'Imóvel Excluído'}</p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    👤 {contract.tenant?.name || 'Inquilino não definido'}
                  </p>
                </td>
                
                <td className="py-4 px-6">
                  <p className="font-bold text-emerald-700">R$ {Number(contract.rentValue).toFixed(2)}</p>
                  <p className="text-xs text-slate-500 mt-1">Taxa Adm: {contract.adminFeePercent}%</p>
                </td>

                <td className="py-4 px-6">
                  {/* Se o contrato tiver o PDF assinado salvo */}
                  {contract.documentUrl ? (
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={14}/> Totalmente Assinado
                      </span>
                      <a href={contract.documentUrl} target="_blank" rel="noreferrer" className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded flex items-center justify-center gap-1 hover:bg-emerald-100 transition-colors">
                        <FileText size={14}/> Baixar PDF
                      </a>
                    </div>
                  ) : contract.signUrl ? (
                    /* Se foi disparado, mas ainda falta assinar */
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                        <Loader2 size={14} className="animate-spin"/> Aguardando
                      </span>
                      <div className="flex gap-2">
                        <a href={contract.signUrl} target="_blank" rel="noreferrer" className="text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-1.5 rounded flex items-center gap-1 hover:bg-slate-200 transition-colors">
                          <ExternalLink size={14}/> Link
                        </a>
                        <button onClick={() => handleWhatsApp(contract)} className="text-[11px] font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-1.5 rounded flex items-center gap-1 hover:bg-green-100 transition-colors">
                          <MessageCircle size={14}/> Whats
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Se ainda não foi disparado */
                    <button 
                      onClick={() => handleSendToClicksign(contract)} 
                      disabled={isProcessingId === contract.id}
                      className="text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      {isProcessingId === contract.id ? <Loader2 size={14} className="animate-spin" /> : <FileSignature size={14}/>}
                      Disparar Clicksign
                    </button>
                  )}
                </td>

                <td className="py-4 px-6 text-right">
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${contract.status === 'Ativo' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                      {contract.status}
                    </span>
                    <button onClick={() => handleOpenModal(contract)} className="text-[11px] font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
                      <Edit size={12}/> Editar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {contracts.length === 0 && (
              <tr><td colSpan={4} className="py-8 text-center text-slate-500">Nenhum contrato gerado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE NOVO / EDITAR CONTRATO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileSignature className="text-blue-600" size={20}/>
                {editingId ? 'Editar Contrato de Locação' : 'Gerar Novo Contrato'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
            </div>
            
            <div className="p-6">
              <form id="contract-form" onSubmit={handleSaveContract} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1"><Home size={14}/> Imóvel</label>
                    <select required value={form.propertyId} onChange={e => setForm({...form, propertyId: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white text-sm">
                      <option value="">Selecione o imóvel...</option>
                      {properties.map(p => <option key={p.id} value={p.id}>{p.title} - {p.address}</option>)}
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1"><User size={14}/> Inquilino (Locatário)</label>
                    <select required value={form.tenantId} onChange={e => setForm({...form, tenantId: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white text-sm">
                      <option value="">Selecione o inquilino...</option>
                      {tenants.map(t => <option key={t.id} value={t.id}>{t.name} ({t.cpf})</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1"><Calendar size={14}/> Data de Início</label>
                    <input required type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1"><DollarSign size={14}/> Valor do Aluguel (R$)</label>
                    <input required type="number" value={form.rentValue} onChange={e => setForm({...form, rentValue: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" placeholder="Ex: 1500" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Taxa de Administração (%)</label>
                    <input required type="number" value={form.adminFeePercent} onChange={e => setForm({...form, adminFeePercent: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" placeholder="Ex: 10" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Índice de Reajuste</label>
                    <select value={form.readjustmentIndex} onChange={e => setForm({...form, readjustmentIndex: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white text-sm">
                      <option value="IPCA">IPCA</option>
                      <option value="IGP-M">IGP-M</option>
                      <option value="INPC">INPC</option>
                    </select>
                  </div>
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors text-sm">
                Cancelar
              </button>
              <button form="contract-form" type="submit" disabled={isSaving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} 
                {editingId ? 'Atualizar Contrato' : 'Salvar Contrato'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}