'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { Plus, CheckCircle2, Loader2, Key, FileSignature, MessageCircle, ExternalLink, X, Home, User, DollarSign, Calendar, Edit, FileText, Trash2, Printer, UploadCloud } from 'lucide-react';

export default function ContratosPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

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
    endDate: '', // Fundamental para gerar as faturas
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
        setProperties(resProps.data);
        setForm({
          propertyId: contract.propertyId || '',
          tenantId: contract.tenantId || '',
          startDate: contract.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : '',
          endDate: contract.endDate ? new Date(contract.endDate).toISOString().split('T')[0] : '',
          rentValue: contract.rentValue?.toString() || '',
          adminFeePercent: contract.adminFeePercent?.toString() || '10',
          readjustmentIndex: contract.readjustmentIndex || 'IPCA'
        });
      } else {
        // Filtra para mostrar apenas imóveis vagos
        setProperties(resProps.data.filter((p: any) => p.rentStatus !== 'Alugado'));
        setForm({ propertyId: '', tenantId: '', startDate: '', endDate: '', rentValue: '', adminFeePercent: '10', readjustmentIndex: 'IPCA' });
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
        alert('Contrato criado com sucesso! As faturas do inquilino foram geradas no financeiro.');
      }
      
      setIsModalOpen(false);
      setEditingId(null);
      setForm({ propertyId: '', tenantId: '', startDate: '', endDate: '', rentValue: '', adminFeePercent: '10', readjustmentIndex: 'IPCA' });
      fetchContracts();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar o contrato.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelContract = async (contract: any) => {
    const confirm = window.confirm(`Tem certeza que deseja cancelar o contrato do imóvel "${contract.property?.title}"?\n\nAs faturas pendentes serão excluídas e o imóvel voltará a ficar Vago.`);
    if (!confirm) return;

    try {
      await api.delete(`/contracts/${contract.id}`);
      alert('Contrato cancelado com sucesso, faturas removidas e imóvel libertado!');
      fetchContracts();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao cancelar o contrato.');
    }
  };


  // 1. GERA PDF DO CONTRATO DE LOCAÇÃO (COM TEMPLATE DINÂMICO)
  const handlePrintContract = async (contract: any) => {
    try {
      const res = await api.get('/my-store');
      const store = res.data;

      let template = store.tenantContractTemplate;

      if (!template) {
        template = `
          <h2 style="text-align: center;">CONTRATO DE LOCAÇÃO</h2>
          <p><strong>INQUILINO:</strong> {{NOME_INQUILINO}}, CPF: {{CPF_INQUILINO}}.</p>
          <p><strong>IMÓVEL:</strong> {{ENDERECO_IMOVEL}}</p>
          <p><strong>ALUGUEL:</strong> {{VALOR_ALUGUEL}}</p>
          <br><br>
          <p><em>⚠️ Aviso ao Administrador: Vá a "Configurações da Loja" -> "Modelos de Contrato" para digitar as cláusulas oficiais deste contrato.</em></p>
        `;
      }

      const startDate = new Date(contract.startDate).toLocaleDateString('pt-BR');
      const endDate = contract.endDate ? new Date(contract.endDate).toLocaleDateString('pt-BR') : 'Prazo Indeterminado';
      const rentValue = Number(contract.rentValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      // Substituição das Variáveis
      template = template
        .replace(/{{NOME_INQUILINO}}/g, contract.tenant?.name || 'Não informado')
        .replace(/{{CPF_INQUILINO}}/g, contract.tenant?.cpf || 'Não informado')
        .replace(/{{ENDERECO_IMOVEL}}/g, contract.property?.address || 'Não informado')
        .replace(/{{DATA_INICIO}}/g, startDate)
        .replace(/{{DATA_FIM}}/g, endDate)
        .replace(/{{VALOR_ALUGUEL}}/g, rentValue)
        .replace(/{{INDICE_REAJUSTE}}/g, contract.readjustmentIndex || 'Não informado')
        .replace(/{{NOME_IMOBILIARIA}}/g, store.tradeName || store.corporateName || 'Imobiliária');

      const content = `
        <html>
          <head>
            <title>Contrato de Locação - ${contract.tenant?.name}</title>
            <style>
              body { font-family: 'Arial', sans-serif; padding: 40px; line-height: 1.6; max-width: 800px; margin: auto; text-align: justify; color: #333; }
              h2 { text-align: center; margin-bottom: 30px; font-size: 18px; text-transform: uppercase; }
              p { margin-bottom: 12px; font-size: 14px; }
            </style>
          </head>
          <body>
            ${template}
          </body>
        </html>
      `;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      alert('Erro ao buscar o modelo do contrato. Verifique a sua conexão.');
    }
  };
  // 2. ENVIA INSTRUÇÕES DO GOV.BR PELO WHATSAPP
  const handleWhatsAppGov = (contract: any) => {
    const tenant = contract.tenant;
    if (!tenant?.phone) {
      alert('Inquilino sem telefone cadastrado!');
      return;
    }

    let phoneNum = tenant.phone.replace(/\D/g, '');
    if (phoneNum.length === 10 || phoneNum.length === 11) {
      phoneNum = `55${phoneNum}`;
    }

    const text = `Olá, *${tenant.name}*! Tudo bem?\n\nEstou enviando o seu Contrato de Locação em PDF anexo a esta conversa.\n\nPara assinar com validade jurídica e de forma *100% gratuita*, acesse o portal oficial do Governo Federal:\n👉 https://assinador.iti.br/\n\nBasta fazer login com a sua conta Gov.br, anexar o PDF que enviei, clicar em assinar e devolver o arquivo final aqui no WhatsApp.\nQualquer dúvida, estamos à disposição!`;
    const url = `https://wa.me/${phoneNum}?text=${encodeURIComponent(text)}`;
    
    window.open(url, '_blank');
  };

  // 3. FAZ O UPLOAD DO CONTRATO ASSINADO
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, contractId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(contractId);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/contracts/${contractId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Contrato assinado anexado com sucesso!');
      fetchContracts();
    } catch (error) {
      alert('Erro ao enviar o ficheiro. Verifique se tem menos de 5MB.');
    } finally {
      setUploadingId(null);
      e.target.value = ''; // Limpa o input
    }
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
          <p className="text-slate-500 mt-1">Gerencie os contratos de locação e as assinaturas via Gov.br.</p>
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
                  {contract.documentUrl ? (
                    // CONTRATO JÁ ASSINADO E ANEXADO
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={14}/> Assinado via Gov.br
                      </span>
                      <a href={contract.documentUrl} target="_blank" rel="noreferrer" className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded flex items-center w-fit gap-1 hover:bg-emerald-100 transition-colors">
                        <FileText size={14}/> Visualizar Arquivo
                      </a>
                    </div>
                  ) : (
                    // FLUXO GOV.BR
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold text-orange-600 flex items-center gap-1 mb-1">
                        Pendente de Assinatura
                      </span>
                      
                      <div className="flex gap-2 flex-wrap max-w-[250px]">
                        <button onClick={() => handlePrintContract(contract)} className="text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-1.5 rounded flex items-center gap-1 hover:bg-slate-200 transition-colors">
                          <Printer size={12}/> 1. Gerar PDF
                        </button>
                        
                        <button onClick={() => handleWhatsAppGov(contract)} className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-1.5 rounded flex items-center gap-1 hover:bg-green-100 transition-colors">
                          <MessageCircle size={12}/> 2. Enviar
                        </button>

                        <label className={`text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1.5 rounded flex items-center gap-1 hover:bg-blue-100 transition-colors cursor-pointer ${uploadingId === contract.id ? 'opacity-50' : ''}`}>
                          {uploadingId === contract.id ? <Loader2 size={12} className="animate-spin" /> : <UploadCloud size={12}/>}
                          3. Anexar Assinado
                          <input 
                            type="file" 
                            accept="application/pdf" 
                            className="hidden" 
                            onChange={(e) => handleFileUpload(e, contract.id)}
                            disabled={uploadingId === contract.id}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </td>

                <td className="py-4 px-6 text-right">
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${contract.status === 'Ativo' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                      {contract.status}
                    </span>
                    <div className="flex gap-3">
                      <button onClick={() => handleOpenModal(contract)} className="text-[11px] font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
                        <Edit size={12}/> Editar
                      </button>
                      <button onClick={() => handleCancelContract(contract)} className="text-[11px] font-bold text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors">
                        <Trash2 size={12}/> Cancelar
                      </button>
                    </div>
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
                    <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1"><Calendar size={14}/> Data Final</label>
                    <input required type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" />
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