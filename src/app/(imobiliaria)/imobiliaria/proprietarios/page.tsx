'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '../../../../lib/api';
import { Plus, Edit, X, CheckCircle2, Loader2, UserCircle, FileSignature, MessageCircle, FileText, Printer, UploadCloud } from 'lucide-react';

export default function ProprietariosPage() {
  const [owners, setOwners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Referência para o input de ficheiro (escondido)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

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

  
 // 1. GERA O PDF DO CONTRATO DE GESTÃO (COM TEMPLATE DINÂMICO)
  const handlePrintContract = async (owner: any) => {
    try {
      // Busca as configurações da loja
      const res = await api.get('/my-store');
      const store = res.data;

      // Pega o template guardado pelo administrador (ou usa um texto de aviso se estiver vazio)
      let template = store.ownerContractTemplate;

      if (!template) {
        template = `
          <h2 style="text-align: center;">CONTRATO DE GESTÃO BÁSICO</h2>
          <p><strong>CONTRATANTE:</strong> {{NOME_PROPRIETARIO}}, CPF/CNPJ: {{CPF_CNPJ}}, Tel: {{TELEFONE}}.</p>
          <p><strong>CONTRATADA:</strong> {{NOME_IMOBILIARIA}}, CNPJ: {{CNPJ_IMOBILIARIA}}.</p>
          <br><br>
          <p><em>⚠️ Aviso ao Administrador: Vá a "Configurações da Loja" -> "Modelos de Contrato" para digitar as cláusulas oficiais deste contrato.</em></p>
        `;
      }

      // O MOTOR MÁGICO: Substitui as tags pelas variáveis reais
      template = template
        .replace(/{{NOME_PROPRIETARIO}}/g, owner.name || 'Não informado')
        .replace(/{{CPF_CNPJ}}/g, owner.cpfOrCnpj || 'Não informado')
        .replace(/{{TELEFONE}}/g, owner.phone || 'Não informado')
        .replace(/{{BANCO}}/g, owner.bankData || 'Não informado')
        .replace(/{{NOME_IMOBILIARIA}}/g, store.tradeName || store.corporateName || 'Imobiliária')
        .replace(/{{CNPJ_IMOBILIARIA}}/g, store.cnpj || 'Não informado');

      // Monta a página final
      const content = `
        <html>
          <head>
            <title>Contrato de Gestão - ${owner.name}</title>
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

  // 2. DISPARO INTELIGENTE COM INSTRUÇÕES GOV.BR
  const handleWhatsAppGov = (owner: any) => {
    if (!owner.phone) {
      alert('Proprietário sem telefone cadastrado!');
      return;
    }

    let phoneNum = owner.phone.replace(/\D/g, '');
    if (phoneNum.length === 10 || phoneNum.length === 11) {
      phoneNum = `55${phoneNum}`;
    }

    const text = `Olá, *${owner.name}*! Tudo bem?\n\nEstou a enviar o seu Contrato de Gestão em PDF anexo a esta conversa.\n\nPara assinar com validade jurídica e de forma *100% gratuita*, por favor aceda ao portal oficial do Governo Federal:\n👉 https://assinador.iti.br/\n\nBasta fazer login com a sua conta Gov.br, anexar o PDF que lhe enviei, clicar em assinar e devolver-me o ficheiro final.\nQualquer dúvida, estou à disposição!`;
    const url = `https://wa.me/${phoneNum}?text=${encodeURIComponent(text)}`;
    
    window.open(url, '_blank');
  };

  // 3. UPLOAD DO CONTRATO ASSINADO
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, ownerId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(ownerId);
    
    // Como ainda não temos uma rota de upload de ficheiros no backend, 
    // enviamos o ficheiro como FormData. (Nota: precisaremos de criar a rota no Backend a seguir).
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Exemplo da chamada à API (a rota /owners/:id/upload terá de ser criada no Node.js)
      // await api.post(`/owners/${ownerId}/upload`, formData, {
      //   headers: { 'Content-Type': 'multipart/form-data' }
      // });
      
      // Simulando sucesso para a interface
      alert('Ficheiro enviado com sucesso! (Requer configuração da rota no backend)');
      fetchOwners();
    } catch (error) {
      alert('Erro ao enviar o ficheiro.');
    } finally {
      setUploadingId(null);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Limpa o input
    }
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
          <p className="text-slate-500 mt-1">Cadastre os donos dos imóveis e faça a gestão contratual via Gov.br.</p>
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
              <th className="py-4 px-6">Contrato (Gov.br)</th>
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
                    // SE O CONTRATO JÁ FOI DEVOLVIDO E ANEXADO
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={14}/> Assinado via Gov.br
                      </span>
                      <a href={owner.managementContractUrl} target="_blank" rel="noreferrer" className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded w-fit flex items-center justify-center gap-1 hover:bg-emerald-100 transition-colors">
                        <FileText size={14}/> Visualizar Arquivo
                      </a>
                    </div>
                  ) : (
                    // FLUXO DE ASSINATURA MANUAL
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold text-orange-600 flex items-center gap-1 mb-1">
                        Pendente de Assinatura
                      </span>
                      
                      <div className="flex gap-2 flex-wrap max-w-[250px]">
                        {/* 1. Gerar PDF */}
                        <button onClick={() => handlePrintContract(owner)} className="text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-1.5 rounded flex items-center gap-1 hover:bg-slate-200 transition-colors">
                          <Printer size={12}/> 1. Gerar PDF
                        </button>
                        
                        {/* 2. Enviar WhatsApp */}
                        <button onClick={() => handleWhatsAppGov(owner)} className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-1.5 rounded flex items-center gap-1 hover:bg-green-100 transition-colors">
                          <MessageCircle size={12}/> 2. Enviar
                        </button>

                        {/* 3. Subir Assinado */}
                        <label className={`text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1.5 rounded flex items-center gap-1 hover:bg-blue-100 transition-colors cursor-pointer ${uploadingId === owner.id ? 'opacity-50' : ''}`}>
                          {uploadingId === owner.id ? <Loader2 size={12} className="animate-spin" /> : <UploadCloud size={12}/>}
                          3. Anexar Assinado
                          <input 
                            type="file" 
                            accept="application/pdf" 
                            className="hidden" 
                            onChange={(e) => handleFileUpload(e, owner.id)}
                            disabled={uploadingId === owner.id}
                          />
                        </label>
                      </div>
                    </div>
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
              {/* Campos do formulário (Nome, CPF, Email, Telefone, Banco) mantidos idênticos... */}
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
                    E-mail
                  </label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white" />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">WhatsApp / Telefone</label>
                  <input type="text" placeholder="(11) 99999-9999" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Dados Bancários (Para Repasse)</label>
                  <textarea rows={2} placeholder="Banco, Agência, Conta, Pix..." value={form.bankData} onChange={e => setForm({...form, bankData: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 resize-none" />
                </div>

                {/* VISUALIZAÇÃO DO LINK NO MODO EDIÇÃO (Caso queira colocar um link do Google Drive manualmente) */}
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Link do Contrato Assinado (Opcional)</label>
                  <input type="text" placeholder="https://drive.google.com/..." value={form.managementContractUrl} onChange={e => setForm({...form, managementContractUrl: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                  <p className="text-[10px] text-slate-500 mt-1">Cole aqui o link caso prefira armazenar o PDF na nuvem (Google Drive, OneDrive).</p>
                </div>
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
    </div>
  );
}