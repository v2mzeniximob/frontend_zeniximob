'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/src/lib/api';
import { 
  KeyRound, FileText, CheckCircle2, Clock, Search, User, 
  ArrowRightLeft, Plus, X, Building2, FileSignature, FileDown, Link as LinkIcon, QrCode, PenTool
} from 'lucide-react';

export default function ChavesPage() {
  const [activeTab, setActiveTab] = useState<'quadro' | 'termos'>('quadro');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados: Quadro de Chaves
  const [properties, setProperties] = useState<any[]>([]);
  const [brokers, setBrokers] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  
  // Novo estado de retirada com SLA e Assinatura
  const [withdrawForm, setWithdrawForm] = useState({ 
    clientName: '', 
    reason: 'Visita', 
    notes: '', 
    brokerId: '',
    expectedReturnAt: '' 
  });

  // Referência para o Canvas de Assinatura Digital
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  
  // Estados: Termos de Chaves
  const [terms, setTerms] = useState<any[]>([]);
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);
  const [termForm, setTermForm] = useState({ type: 'Entrega - Locação', propertyId: '', clientId: '', documentUrl: '' });
  
  // Estados: Anexar Link
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [attachForm, setAttachForm] = useState({ id: '', documentUrl: '', type: '', propertyId: '', clientId: '' });

  // Dados de Apoio
  const [clients, setClients] = useState<any[]>([]);
  const [storeData, setStoreData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'quadro') {
        const [resProps, resBrokers] = await Promise.all([
          api.get('/keys'),
          api.get('/brokers').catch(() => ({ data: [] }))
        ]);
        setProperties(resProps.data);
        setBrokers(resBrokers.data);
      } else {
        const [resTerms, resClients, resProps, resStore] = await Promise.all([
          api.get('/key-terms'),
          api.get('/clients'),
          api.get('/properties'),
          api.get('/my-store').catch(() => ({ data: {} }))
        ]);
        setTerms(resTerms.data);
        setClients(resClients.data);
        setProperties(resProps.data);
        setStoreData(resStore.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // AÇÕES: QUADRO DE CHAVES (FISICO)
  // ==========================================
  const handleUpdateKeyCode = async (propertyId: string, newCode: string) => {
    try {
      await api.patch(`/keys/${propertyId}/code`, { keyCode: newCode });
      fetchData();
    } catch (error) {
      alert('Erro ao atualizar tag da chave.');
    }
  };

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleWithdrawKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let digitalSignatureUrl = null;
      if (canvasRef.current && hasSignature) {
        digitalSignatureUrl = canvasRef.current.toDataURL('image/png');
      }

      await api.post('/keys/withdraw', { 
        propertyId: selectedProperty.id, 
        ...withdrawForm,
        digitalSignatureUrl 
      });

      setIsWithdrawModalOpen(false);
      setWithdrawForm({ clientName: '', reason: 'Visita', notes: '', brokerId: '', expectedReturnAt: '' });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao retirar chave.');
    }
  };

  const handleReturnKey = async (movementId: string) => {
    if (!confirm('Confirmar devolução desta chave ao quadro?')) return;
    try {
      await api.patch(`/keys/${movementId}/return`);
      fetchData();
    } catch (error) {
      alert('Erro ao devolver chave.');
    }
  };

  // IMPRESSÃO DE ETIQUETA QR CODE
  const handlePrintQrLabel = (prop: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Etiqueta QR Code - ${prop.title}</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
              .label-box { border: 2px dashed #333; width: 300px; margin: 0 auto; padding: 20px; border-radius: 12px; }
              h2 { margin: 5px 0; font-size: 18px; }
              p { margin: 5px 0; font-size: 14px; color: #555; }
              .tag { font-size: 24px; font-weight: bold; background: #eee; display: inline-block; padding: 5px 15px; border-radius: 6px; margin: 10px 0; }
              .hash { font-size: 10px; color: #888; font-family: monospace; }
            </style>
          </head>
          <body>
            <div class="label-box">
              <p><strong>${storeData?.tradeName || 'ZenixImob'}</strong></p>
              <h2>${prop.title}</h2>
              <p>${prop.address || ''}</p>
              <div class="tag">TAG: ${prop.keyCode || 'S/TAG'}</div>
              <p><strong>QR Code ID:</strong></p>
              <p class="hash">${prop.qrCodeHash || 'N/A'}</p>
            </div>
            <script>window.onload = function() { window.print(); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // ==========================================
  // AÇÕES: TERMOS (DOCUMENTAL)
  // ==========================================
  const handleCreateTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/key-terms', termForm);
      setIsTermModalOpen(false);
      setTermForm({ type: 'Entrega - Locação', propertyId: '', clientId: '', documentUrl: '' });
      fetchData();
    } catch (error) {
      alert('Erro ao gerar termo.');
    }
  };

  const handleMarkTermAsSigned = async (termId: string) => {
    if (!confirm('Marcar este termo como Assinado? Isso atualizará o quadro de chaves automaticamente.')) return;
    try {
      await api.patch(`/key-terms/${termId}/status`, { status: 'Assinado' });
      fetchData();
      alert('Termo assinado! O quadro de chaves foi atualizado.');
    } catch (error) {
      alert('Erro ao atualizar termo.');
    }
  };

  const handleGenerateTermPDF = (term: any) => {
    const template = storeData?.keyTermTemplate;
    
    if (!template) {
      alert('O modelo "Termo de Chaves" não está configurado. Vá a Configurações > Modelos e Termos para configurá-lo com as variáveis.');
      return;
    }

    const clienteNome = term.client?.clientType === 'PJ' ? term.client?.corporateName : term.client?.name;
    const documento = term.client?.document || '_________________________';
    const endereco = term.property?.neighborhood ? `${term.property?.address}, ${term.property?.neighborhood}` : term.property?.address;
    const dataCriacao = new Date(term.createdAt).toLocaleDateString('pt-BR');

    const html = template
      .replace(/{{NOME_CLIENTE}}/g, clienteNome || '_________________________')
      .replace(/{{CPF_CNPJ}}/g, documento)
      .replace(/{{ENDERECO_IMOVEL}}/g, endereco || '_________________________')
      .replace(/{{TIPO_TERMO}}/g, term.type)
      .replace(/{{DATA_CRIACAO}}/g, dataCriacao)
      .replace(/{{NOME_IMOBILIARIA}}/g, storeData?.tradeName || 'Imobiliária');

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Termo de Chaves - ${clienteNome}</title>
            <style>body { font-family: Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }</style>
          </head>
          <body>
            ${html}
            <script>window.onload = function() { window.print(); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const openAttachModal = (term: any) => {
    setAttachForm({
      id: term.id,
      documentUrl: term.documentUrl || '',
      type: term.type,
      propertyId: term.propertyId,
      clientId: term.clientId
    });
    setIsAttachModalOpen(true);
  };

  const handleAttachSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/key-terms/${attachForm.id}`, attachForm);
      setIsAttachModalOpen(false);
      fetchData();
      alert('Link do documento anexado com sucesso!');
    } catch (error) {
      alert('Erro ao anexar link.');
    }
  };

  const filteredProperties = properties.filter(p => p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || p.keyCode?.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredTerms = terms.filter(t => t.property?.title?.toLowerCase().includes(searchTerm.toLowerCase()) || t.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-8 max-w-[1600px] mx-auto font-sans animate-in fade-in duration-300 pb-20">
      
      {/* CABEÇALHO E ABAS */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <KeyRound className="text-amber-600 bg-amber-50 p-1.5 rounded-lg" size={36} />
            Portaria & Chaves
          </h1>
          <p className="text-slate-500 mt-2">Controle o quadro físico de chaves, etiquetas QR Code e os Termos de Entrega Oficiais.</p>
        </div>
        
        <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 w-full md:w-auto">
          <button onClick={() => setActiveTab('quadro')} className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'quadro' ? 'bg-amber-50 text-amber-700' : 'text-slate-500 hover:text-slate-700'}`}>
            <ArrowRightLeft size={16}/> Quadro Físico
          </button>
          <button onClick={() => setActiveTab('termos')} className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'termos' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
            <FileSignature size={16}/> Termos Oficiais
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden min-h-[600px]">
        
        {/* BARRA DE BUSCA E AÇÕES */}
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" placeholder={activeTab === 'quadro' ? "Buscar imóvel ou código da chave..." : "Buscar por inquilino ou imóvel..."} 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm shadow-sm"
            />
          </div>
          
          {activeTab === 'termos' && (
            <button onClick={() => setIsTermModalOpen(true)} className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm">
              <Plus size={18}/> Novo Termo de Chave
            </button>
          )}
        </div>

        {/* ========================================================= */}
        {/* ABA: QUADRO DE CHAVES */}
        {/* ========================================================= */}
        {activeTab === 'quadro' && (
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="p-4 pl-6 font-bold uppercase tracking-wider text-xs">Imóvel</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs">Tag / Claviculário</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs">Status da Chave</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs">Responsável Atual</th>
                  <th className="p-4 pr-6 font-bold uppercase tracking-wider text-xs text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400">Carregando...</td></tr>
                ) : filteredProperties.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhum imóvel encontrado.</td></tr>
                ) : (
                  filteredProperties.map((prop) => {
                    const isWithdrawn = prop.keyStatus === 'Retirada';
                    const isDelivered = prop.keyStatus === 'Entregue';
                    const activeMovement = prop.keyMovements?.[0];

                    return (
                      <tr key={prop.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                              <Building2 size={18}/>
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{prop.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5 max-w-[250px] truncate">{prop.address}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <input 
                              type="text" 
                              defaultValue={prop.keyCode || ''}
                              onBlur={(e) => { if(e.target.value !== prop.keyCode) handleUpdateKeyCode(prop.id, e.target.value) }}
                              placeholder="Ex: A-15"
                              className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-amber-400 focus:bg-white transition-all"
                            />
                            {/* BOTÃO PARA IMPRIMIR ETIQUETA QR CODE */}
                            <button onClick={() => handlePrintQrLabel(prop)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Imprimir Etiqueta com QR Code">
                              <QrCode size={16}/>
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                            isWithdrawn ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            isDelivered ? 'bg-slate-100 text-slate-600 border-slate-200' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {isWithdrawn ? <Clock size={12}/> : isDelivered ? <User size={12}/> : <CheckCircle2 size={12}/>}
                            {prop.keyStatus || 'Disponível'}
                          </span>
                        </td>
                        <td className="p-4">
                          {isWithdrawn && activeMovement ? (
                            <div>
                              <p className="font-bold text-slate-700 text-xs">
                                {activeMovement.broker?.name || activeMovement.clientName || 'Sistema'}
                              </p>
                              <p className="text-[10px] text-slate-500">{activeMovement.reason} {activeMovement.expectedReturnAt ? `• Devolver até: ${new Date(activeMovement.expectedReturnAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}` : ''}</p>
                            </div>
                          ) : isDelivered ? (
                            <span className="text-xs text-slate-400 font-medium">Com Inquilino/Dono</span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No Quadro</span>
                          )}
                        </td>
                        <td className="p-4 pr-6 text-right">
                          {!isDelivered && (
                            isWithdrawn ? (
                              <button onClick={() => handleReturnKey(activeMovement.id)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors">
                                Devolver Chave
                              </button>
                            ) : (
                              <button onClick={() => { setSelectedProperty(prop); setIsWithdrawModalOpen(true); }} className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold rounded-lg transition-colors">
                                Retirar para Visita
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA: TERMOS OFICIAIS */}
        {/* ========================================================= */}
        {activeTab === 'termos' && (
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="p-4 pl-6 font-bold uppercase tracking-wider text-xs">Tipo de Termo</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs">Imóvel & Cliente</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs">Status</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs">Data Criação</th>
                  <th className="p-4 pr-6 font-bold uppercase tracking-wider text-xs text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400">Carregando...</td></tr>
                ) : filteredTerms.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhum termo encontrado.</td></tr>
                ) : (
                  filteredTerms.map((term) => (
                    <tr key={term.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 pl-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${term.type.includes('Devolução') ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                          {term.type}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{term.property?.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{term.client?.name}</p>
                      </td>
                      <td className="p-4">
                        {term.status === 'Assinado' ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600"><CheckCircle2 size={14}/> Assinado</span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-orange-600"><Clock size={14}/> Pendente</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-500 text-xs">
                        {new Date(term.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4 pr-6 flex justify-end items-center gap-2">
                        <button onClick={() => handleGenerateTermPDF(term)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5" title="Gerar e Imprimir Documento">
                          <FileDown size={14}/> Gerar PDF
                        </button>
                        {term.documentUrl ? (
                          <a href={term.documentUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5">
                            <FileText size={14}/> Ver Doc
                          </a>
                        ) : (
                          <button onClick={() => openAttachModal(term)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5">
                            <LinkIcon size={14}/> Anexar Link
                          </button>
                        )}
                        {term.status === 'Pendente' && (
                          <button onClick={() => handleMarkTermAsSigned(term.id)} className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5">
                            <CheckCircle2 size={14}/> Marcar Assinado
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: RETIRAR CHAVE (COM SLA E ASSINATURA DIGITAL) */}
      {isWithdrawModalOpen && selectedProperty && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><KeyRound size={18} className="text-amber-600"/> Retirar Chave (Check-out)</h3>
              <button onClick={() => setIsWithdrawModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleWithdrawKey} className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Imóvel</p>
                <p className="font-bold text-slate-800">{selectedProperty.title}</p>
                <p className="text-xs text-slate-500 mt-1">Tag: <span className="font-bold bg-slate-100 px-2 py-0.5 rounded">{selectedProperty.keyCode || 'Sem tag'}</span></p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Motivo da Retirada</label>
                  <select value={withdrawForm.reason} onChange={e => setWithdrawForm({...withdrawForm, reason: e.target.value})} className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-sm">
                    <option value="Visita">Visita com Cliente</option>
                    <option value="Vistoria">Vistoria</option>
                    <option value="Manutenção">Manutenção / Reparos</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Prazo Limite (SLA Devolução)</label>
                  <input type="datetime-local" value={withdrawForm.expectedReturnAt} onChange={e => setWithdrawForm({...withdrawForm, expectedReturnAt: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Corretor Responsável</label>
                <select 
                  value={withdrawForm.brokerId} 
                  onChange={e => setWithdrawForm({...withdrawForm, brokerId: e.target.value, clientName: ''})} 
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                >
                  <option value="">Nenhum (Entregue a terceiros)</option>
                  {brokers.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {!withdrawForm.brokerId && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Entregue para (Nome do Prestador/Cliente)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: João (Encanador)..." 
                    value={withdrawForm.clientName} 
                    onChange={e => setWithdrawForm({...withdrawForm, clientName: e.target.value})} 
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-sm" 
                  />
                </div>
              )}

              {/* BLOCO DE ASSINATURA DIGITAL (CANVAS) */}
              <div className="pt-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                    <PenTool size={14}/> Assinatura Digital do Responsável
                  </label>
                  <button type="button" onClick={clearSignature} className="text-xs text-red-500 hover:underline">Limpar</button>
                </div>
                <div className="border border-slate-300 rounded-xl bg-slate-50 overflow-hidden touch-none">
                  <canvas 
                    ref={canvasRef}
                    width={440}
                    height={140}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full cursor-crosshair bg-white"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Assine no espaço acima com o dedo ou o rato para confirmar a retirada.</p>
              </div>

              <button type="submit" className="w-full py-3.5 mt-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors shadow-sm">
                Registrar Saída da Chave
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO TERMO DE CHAVES */}
      {isTermModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileSignature size={18} className="text-blue-600"/> Gerar Termo Oficial</h3>
              <button onClick={() => setIsTermModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateTerm} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Termo</label>
                <select required value={termForm.type} onChange={e => setTermForm({...termForm, type: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Entrega - Locação">Entrega de Chaves (Locação)</option>
                  <option value="Entrega - Venda">Entrega de Chaves (Venda)</option>
                  <option value="Devolução - Locação">Devolução de Chaves (Fim do Contrato)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Selecione o Imóvel</label>
                <select required value={termForm.propertyId} onChange={e => setTermForm({...termForm, propertyId: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Selecione...</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.title} ({p.keyCode || 'S/ Tag'})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Cliente (Inquilino/Comprador)</label>
                <select required value={termForm.clientId} onChange={e => setTermForm({...termForm, clientId: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Selecione...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.document})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Link do Documento (Opcional - ZapSign/Drive)</label>
                <input type="url" placeholder="https://..." value={termForm.documentUrl} onChange={e => setTermForm({...termForm, documentUrl: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-xs font-medium border border-blue-100 mt-4">
                <strong>Nota:</strong> Ao criar o termo, ele ficará "Pendente". Poderá gerar o PDF para assinar fisicamente na hora, ou adicionar um link externo depois.
              </div>

              <button type="submit" className="w-full py-3.5 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">
                Criar Termo
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ANEXAR LINK DO DOCUMENTO */}
      {isAttachModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><LinkIcon size={18} className="text-blue-600"/> Anexar Documento</h3>
              <button onClick={() => setIsAttachModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleAttachSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Link do Termo Assinado (PDF/ZapSign)</label>
                <input 
                  required
                  type="url" 
                  placeholder="https://..." 
                  value={attachForm.documentUrl} 
                  onChange={e => setAttachForm({...attachForm, documentUrl: e.target.value})} 
                  className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                />
              </div>
              <button type="submit" className="w-full py-3.5 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">
                Salvar Anexo
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}