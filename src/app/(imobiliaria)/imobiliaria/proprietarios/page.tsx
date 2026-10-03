'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { 
  Plus, Search, Edit, Power, Loader2, Home, UserCircle, 
  MapPin, Phone, Mail, CheckSquare, X, FileSignature, FolderOpen, FileDown, Landmark
} from 'lucide-react';
import { maskCpf, maskCnpj, maskPhone } from '@/src/utils/mask'; 

const initialForm = {
  name: '',
  cpfOrCnpj: '',
  email: '',
  phone: '',
  bankData: '',
  inspectionUrl: '',
  managementContractUrl: ''
};

export default function ProprietariosPage() {
  const [owners, setOwners] = useState<any[]>([]);
  const [storeData, setStoreData] = useState<any>(null); // Guardar as configurações para o PDF
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resOwners, resStore] = await Promise.all([
        api.get('/owners'),
        api.get('/my-store').catch(() => ({ data: {} }))
      ]);
      setOwners(resOwners.data);
      setStoreData(resStore.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (owner: any = null) => {
    if (owner) {
      setEditingId(owner.id);
      setFormData({
        ...initialForm,
        ...owner,
        cpfOrCnpj: owner.cpfOrCnpj.length > 14 ? maskCnpj(owner.cpfOrCnpj) : maskCpf(owner.cpfOrCnpj),
        phone: maskPhone(owner.phone || ''),
      });
    } else {
      setEditingId(null);
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { ...formData };
      payload.cpfOrCnpj = payload.cpfOrCnpj.replace(/\D/g, '');
      payload.phone = payload.phone.replace(/\D/g, '');

      if (editingId) {
        await api.put(`/owners/${editingId}`, payload);
      } else {
        await api.post('/owners', payload);
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar proprietário.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    if(!confirm('Deseja alterar o status deste proprietário?')) return;
    try {
      await api.patch(`/owners/${id}/status`);
      fetchData();
    } catch (error) {
      alert('Erro ao alterar status.');
    }
  };

  // =========================================================
  // GERAÇÃO DO CONTRATO DE GESTÃO (DONO) COM VARIÁVEIS REAIS
  // =========================================================
  const handleGenerateOwnerPDF = () => {
    const template = storeData?.ownerContractTemplate;
    
    if (!template) {
      alert('Modelo de PDF não configurado! Vá a "Configurações > Modelos e Termos" para criar o Contrato de Gestão.');
      return;
    }

    // A Mágica de Substituição: Troca as TAGS pelos valores do formulário
    let html = template
      .replace(/{{NOME_CLIENTE}}/g, formData.name || '_________________________')
      .replace(/{{CPF_CLIENTE}}/g, formData.cpfOrCnpj || '_________________________')
      .replace(/{{CPF_CNPJ}}/g, formData.cpfOrCnpj || '_________________________')
      .replace(/{{TELEFONE}}/g, formData.phone || '_________________________')
      .replace(/{{EMAIL}}/g, formData.email || '_________________________')
      .replace(/{{NOME_IMOBILIARIA}}/g, storeData?.tradeName || 'Imobiliária')
      .replace(/{{ENDERECO_IMOVEL}}/g, 'Imóveis confiados à gestão'); // Proprietário pode ter múltiplos imóveis.

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Contrato de Gestão - ${formData.name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            </style>
          </head>
          <body>
            ${html}
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const filteredOwners = owners.filter(o => 
    o.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.cpfOrCnpj?.includes(searchTerm.replace(/\D/g, ''))
  );

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <UserCircle className="text-blue-600 bg-blue-50 p-1.5 rounded-lg" size={36} />
            Proprietários (Donos)
          </h1>
          <p className="text-slate-500 mt-2 text-sm">Gira os donos dos imóveis, contratos de administração e repasses financeiros.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar Nome ou CPF/CNPJ..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
            />
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm whitespace-nowrap text-sm"
          >
            <Plus size={18} /> Novo Proprietário
          </button>
        </div>
      </div>

      {/* LISTAGEM DE PROPRIETÁRIOS */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="p-4">Proprietário</th>
                <th className="p-4">Contactos</th>
                <th className="p-4">Imóveis em Gestão</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2"/> Carregando proprietários...</td></tr>
              ) : filteredOwners.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-medium">Nenhum proprietário encontrado.</td></tr>
              ) : (
                filteredOwners.map((owner) => (
                  <tr key={owner.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 bg-blue-50 text-blue-600 border border-blue-100">
                          {owner.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{owner.name}</p>
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                            {owner.cpfOrCnpj.length > 11 ? maskCnpj(owner.cpfOrCnpj) : maskCpf(owner.cpfOrCnpj)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-700 flex items-center gap-2"><Phone size={14} className="text-slate-400"/> {maskPhone(owner.phone || '')}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-1"><Mail size={14} className="text-slate-400"/> {owner.email || 'Sem e-mail'}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Home size={16} className="text-slate-400"/>
                        <span className="font-bold text-slate-700">{owner.properties?.length || 0}</span>
                        <span className="text-xs text-slate-500">imóveis</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${owner.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${owner.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        {owner.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal(owner)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100" title="Editar">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleToggleStatus(owner.id)} className={`p-2 rounded-lg transition-colors border border-transparent ${owner.isActive ? 'text-red-500 hover:bg-red-50 hover:border-red-100' : 'text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100'}`} title={owner.isActive ? 'Desativar' : 'Ativar'}>
                          <Power size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl shrink-0">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {editingId ? <Edit className="text-blue-600" size={24}/> : <UserCircle className="text-blue-600" size={24}/>}
                {editingId ? 'Editar Proprietário' : 'Cadastrar Proprietário'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="ownerForm" onSubmit={handleSubmit} className="space-y-8">
                
                {/* DADOS PRINCIPAIS */}
                <section>
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <UserCircle size={16} className="text-blue-500"/> Dados Pessoais
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Nome Completo / Razão Social *</label>
                      <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">CPF ou CNPJ *</label>
                      <input required type="text" value={formData.cpfOrCnpj} onChange={(e) => setFormData({...formData, cpfOrCnpj: e.target.value.length > 14 ? maskCnpj(e.target.value) : maskCpf(e.target.value)})} placeholder="000.000.000-00" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Telefone / WhatsApp *</label>
                      <input required type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: maskPhone(e.target.value)})} placeholder="(00) 00000-0000" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">E-mail</label>
                      <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                  </div>
                </section>

                {/* FINANCEIRO */}
                <section>
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Landmark size={16} className="text-blue-500"/> Repasse Financeiro
                  </h3>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Dados Bancários ou Chave PIX</label>
                    <textarea value={formData.bankData} onChange={(e) => setFormData({...formData, bankData: e.target.value})} rows={3} placeholder="Ex: Banco Itaú, Ag: 0000, Conta: 00000-0, Chave PIX: email@email.com..." className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-y bg-slate-50"></textarea>
                  </div>
                </section>

                {/* DOCUMENTOS / VISTORIA / CONTRATO GESTÃO */}
                <section className="bg-blue-50 p-5 rounded-xl border border-blue-200">
                  <h3 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <FolderOpen size={16}/> Documentação e Vistoria
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-5">
                    {/* NOVO CAMPO: VISTORIA / GOOGLE DRIVE */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">Link de Vistoria / Fotos dos Imóveis (Google Drive)</label>
                      <input type="url" value={formData.inspectionUrl} onChange={e => setFormData({...formData, inspectionUrl: e.target.value})} placeholder="https://drive.google.com/..." className="w-full px-4 py-2.5 border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" />
                      <p className="text-[10px] text-blue-600 mt-1">Cole aqui o link da pasta contendo a vistoria, fotos e documentação dos imóveis sob gestão.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">Contrato de Administração Assinado (PDF/Drive)</label>
                      <input type="url" value={formData.managementContractUrl} onChange={e => setFormData({...formData, managementContractUrl: e.target.value})} placeholder="https://..." className="w-full px-4 py-2.5 border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" />
                    </div>

                    <div className="border-t border-blue-200 pt-4 mt-2">
                      <p className="text-xs text-slate-600 mb-2 font-medium">Ainda não gerou o contrato para o proprietário assinar?</p>
                      <button 
                        type="button" 
                        onClick={handleGenerateOwnerPDF}
                        className="w-full md:w-auto px-4 py-2.5 text-xs font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                      >
                        <FileDown size={16}/> Gerar e Imprimir Contrato de Gestão
                      </button>
                    </div>
                  </div>
                </section>

              </form>
            </div>

            {/* RODAPÉ DO MODAL (BOTÕES) */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
                Cancelar
              </button>
              <button type="submit" form="ownerForm" disabled={isSaving} className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-70">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckSquare size={16}/>}
                {editingId ? 'Salvar Alterações' : 'Cadastrar Proprietário'}
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}