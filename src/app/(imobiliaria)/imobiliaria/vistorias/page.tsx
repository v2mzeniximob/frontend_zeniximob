'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { 
  Camera, Plus, X, Loader2, Home, FileText, Calendar, 
  Link as LinkIcon, Smartphone, FileUp, ChevronLeft, 
  ImagePlus, Trash2, CheckCircle2, Download
} from 'lucide-react';

export default function VistoriasAppPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Controle de Navegação da Tela
  const [viewMode, setViewMode] = useState<'list' | 'choose_type' | 'modal_manual' | 'app_digital'>('list');
  const [isSaving, setIsSaving] = useState(false);

  // Estados: MODO MANUAL
  const [manualForm, setManualForm] = useState({
    contractId: '', type: 'Entrada', date: new Date().toISOString().split('T')[0], reportUrl: ''
  });

  // Estados: MODO DIGITAL (App Vistoriador)
  const [digitalForm, setDigitalForm] = useState({
    contractId: '', type: 'Entrada', date: new Date().toISOString().split('T')[0],
    rooms: [] as { id: string, name: string, items: { id: string, note: string, photo: string }[] }[]
  });
  
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [obsForm, setObsForm] = useState({ photo: '', note: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/contracts?status=Ativo');
      setContracts(response.data);
    } catch (error) {
      console.error('Erro ao buscar contratos para vistoria:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post(`/contracts/${manualForm.contractId}/inspections`, manualForm);
      alert('Vistoria anexada com sucesso!');
      setViewMode('list');
      setManualForm({ contractId: '', type: 'Entrada', date: new Date().toISOString().split('T')[0], reportUrl: '' });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao registar vistoria.');
    } finally {
      setIsSaving(false);
    }
  };

  // Lógica do App Digital
  const handleAddRoom = () => {
    const name = window.prompt('Qual o nome do cômodo? (Ex: Sala de Estar, Quarto Principal)');
    if (name && name.trim() !== '') {
      setDigitalForm(prev => ({
        ...prev,
        rooms: [...prev.rooms, { id: Date.now().toString(), name, items: [] }]
      }));
    }
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setObsForm(prev => ({ ...prev, photo: ev.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveObservation = () => {
    if (!obsForm.photo && !obsForm.note) {
      alert('Adicione uma foto ou uma anotação.');
      return;
    }
    
    setDigitalForm(prev => ({
      ...prev,
      rooms: prev.rooms.map(room => {
        if (room.id === activeRoomId) {
          return { 
            ...room, 
            items: [...room.items, { id: Date.now().toString(), photo: obsForm.photo, note: obsForm.note }] 
          };
        }
        return room;
      })
    }));

    setObsForm({ photo: '', note: '' });
    setActiveRoomId(null);
  };

  const handleRemoveObservation = (roomId: string, itemId: string) => {
    if (!confirm('Excluir esta observação?')) return;
    setDigitalForm(prev => ({
      ...prev,
      rooms: prev.rooms.map(room => {
        if (room.id === roomId) {
          return { ...room, items: room.items.filter(item => item.id !== itemId) };
        }
        return room;
      })
    }));
  };

  // GERAR PDF E SALVAR DIGITAL
  const handleGenerateDigitalReport = async () => {
    if (!digitalForm.contractId) {
      alert('Selecione o imóvel alugado no topo da tela.');
      return;
    }
    if (digitalForm.rooms.length === 0) {
      alert('Adicione pelo menos um cômodo à vistoria.');
      return;
    }

    setIsSaving(true);
    try {
      const contract = contracts.find(c => c.id === digitalForm.contractId);
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Laudo de Vistoria - ${contract?.property?.title}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; color: #333; line-height: 1.5; }
              .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
              h1 { color: #2563eb; margin: 0 0 10px 0; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; text-align: left; gap: 10px; background: #f8fafc; padding: 15px; border-radius: 8px; }
              .room { margin-top: 30px; page-break-inside: auto; }
              .room-title { background: #1e293b; color: white; padding: 12px 15px; font-size: 18px; font-weight: bold; border-radius: 6px 6px 0 0; }
              .items-grid { border: 1px solid #e2e8f0; border-top: none; padding: 15px; border-radius: 0 0 6px 6px; }
              .item { display: flex; gap: 20px; margin-bottom: 20px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 20px; page-break-inside: avoid; }
              .item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
              .item img { width: 250px; height: 180px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1; }
              .no-photo { width: 250px; height: 180px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 12px; border-radius: 8px; border: 1px solid #cbd5e1; text-align: center; }
              .item-content { flex: 1; }
              .item-note { background: #f8fafc; padding: 15px; border-radius: 8px; font-size: 14px; min-height: 100px; border-left: 4px solid #3b82f6; }
              .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; }
              .signatures { display: flex; justify-content: space-around; margin-top: 80px; page-break-inside: avoid; }
              .sig-line { border-top: 1px solid #333; width: 300px; text-align: center; padding-top: 10px; font-size: 14px; font-weight: bold; }
              
              /* Botão de impressão (não sai no PDF) */
              @media print { .print-btn { display: none !important; } }
              .print-btn { background: #2563eb; color: white; padding: 15px 30px; text-align: center; font-size: 18px; font-weight: bold; border: none; border-radius: 8px; cursor: pointer; display: block; margin: 0 auto 30px auto; width: 100%; max-width: 400px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .print-btn:hover { background: #1d4ed8; }
            </style>
          </head>
          <body>
            <button class="print-btn" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
            <div class="header">
              <h1>Laudo Oficial de Vistoria - ${digitalForm.type}</h1>
              <div class="info-grid">
                <div><strong>Imóvel:</strong> ${contract?.property?.title}</div>
                <div><strong>Endereço:</strong> ${contract?.property?.address}</div>
                <div><strong>Inquilino:</strong> ${contract?.tenant?.name}</div>
                <div><strong>Data da Vistoria:</strong> ${new Date(digitalForm.date).toLocaleDateString('pt-BR')}</div>
              </div>
            </div>

            ${digitalForm.rooms.map(r => `
              <div class="room">
                <div class="room-title">${r.name}</div>
                <div class="items-grid">
                  ${r.items.map(i => `
                    <div class="item">
                      ${i.photo ? `<img src="${i.photo}" />` : `<div class="no-photo">Sem Registo<br/>Fotográfico</div>`}
                      <div class="item-content">
                        <div class="item-note"><strong>Anotações do Vistoriador:</strong><br/><br/>${i.note || 'Nenhuma observação reportada.'}</div>
                      </div>
                    </div>
                  `).join('')}
                  ${r.items.length === 0 ? '<p style="color:#64748b; font-size:14px;">Nenhum detalhe registado neste cômodo.</p>' : ''}
                </div>
              </div>
            `).join('')}

            <div class="signatures">
              <div class="sig-line">Assinatura do Vistoriador / Imobiliária</div>
              <div class="sig-line">Assinatura do Inquilino</div>
            </div>

            <div class="footer">
              Laudo fotográfico gerado automaticamente por ZenixImob em ${new Date().toLocaleString('pt-BR')}.
            </div>
          </body>
        </html>
      `;

      // Salva no banco de dados que a vistoria foi feita
      const response = await api.post(`/contracts/${digitalForm.contractId}/inspections`, {
        type: digitalForm.type,
        date: digitalForm.date,
        reportUrl: 'Gerado no App ZenixImob'
      });

      // NOVIDADE: Guarda o HTML completo na Cache do navegador para poder reabrir depois!
      const inspectionId = response.data?.id || `temp_${Date.now()}`;
      localStorage.setItem(`laudo_zenix_${inspectionId}`, html);

      // Abre a janela de impressão automaticamente
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      }

      alert('Laudo gerado e salvo com sucesso! Já pode ver na lista.');
      setViewMode('list');
      setDigitalForm({ contractId: '', type: 'Entrada', date: new Date().toISOString().split('T')[0], rooms: [] });
      fetchData();

    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar a vistoria digital.');
    } finally {
      setIsSaving(false);
    }
  };

  // NOVIDADE: Função que recupera o PDF da memória cache e abre
  const handleOpenLocalPDF = (inspectionId: string) => {
    const html = localStorage.getItem(`laudo_zenix_${inspectionId}`);
    if (html) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      }
    } else {
      alert('⚠️ Este laudo foi gerado noutro dispositivo (ou a cache foi limpa). Como as fotos não são enviadas para a nuvem para economizar espaço, o PDF só pode ser reaberto no telemóvel/computador que fez a vistoria.');
    }
  };

  if (isLoading) return <div className="min-h-screen flex justify-center pt-20 text-slate-500"><Loader2 className="animate-spin" size={40}/></div>;

  return (
    <div className={`mx-auto font-sans bg-slate-50 min-h-screen ${viewMode === 'app_digital' ? 'p-0 max-w-full' : 'p-4 md:p-8 max-w-4xl'}`}>
      
      {/* ========================================== */}
      {/* VIEW 1: LISTA PRINCIPAL                    */}
      {/* ========================================== */}
      {viewMode === 'list' && (
        <>
          <div className="bg-blue-600 rounded-2xl p-6 text-white mb-6 shadow-md flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Camera size={28} /> Vistorias
              </h1>
              <p className="text-blue-100 text-sm mt-1">Laudos fotográficos de imóveis.</p>
            </div>
            <button onClick={() => setViewMode('choose_type')} className="bg-white text-blue-600 p-3 rounded-xl shadow-sm hover:scale-105 transition-transform">
              <Plus size={24} />
            </button>
          </div>

          <div className="space-y-4">
            {contracts.map(contract => (
              <div key={contract.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start gap-3 border-b border-slate-100 pb-4 mb-4">
                  <div className="bg-slate-100 p-3 rounded-full text-slate-600 shrink-0">
                    <Home size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 leading-tight">{contract.property?.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">Inquilino: {contract.tenant?.name}</p>
                    {contract.documentUrl && (
                      <a href={contract.documentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mt-2 font-medium">
                        <FileText size={12}/> Contrato Assinado
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Laudos de Vistoria Anexados</h4>
                  {contract.inspections && contract.inspections.length > 0 ? (
                    contract.inspections.map((insp: any) => (
                      <div key={insp.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100 gap-2">
                        <div className="flex items-center gap-2">
                          <Camera size={16} className={insp.type === 'Entrada' ? 'text-green-500' : insp.type === 'Saída' ? 'text-red-500' : 'text-blue-500'} />
                          <span className="text-sm font-bold text-slate-700">Vistoria de {insp.type}</span>
                          <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-500 flex items-center gap-1"><Calendar size={10}/> {new Date(insp.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        
                        {/* NOVIDADE: Botões Inteligentes (Abrir URL Externa ou Abrir PDF Gerado Local) */}
                        {insp.reportUrl?.includes('http') ? (
                          <a href={insp.reportUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                            <LinkIcon size={12}/> Ver Laudo
                          </a>
                        ) : (
                          <button onClick={() => handleOpenLocalPDF(insp.id)} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
                            <Download size={14}/> Abrir PDF
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 italic">Nenhuma vistoria registada neste contrato.</p>
                  )}
                </div>
              </div>
            ))}
            {contracts.length === 0 && (
              <div className="text-center p-10 text-slate-400">Nenhum contrato ativo para vistoriar.</div>
            )}
          </div>
        </>
      )}

      {/* ========================================== */}
      {/* OVERLAY: ESCOLHA DO TIPO DE VISTORIA       */}
      {/* ========================================== */}
      {viewMode === 'choose_type' && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Nova Vistoria</h2>
              <button onClick={() => setViewMode('list')} className="text-slate-400 hover:text-slate-600 bg-slate-200 p-1.5 rounded-full"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <button onClick={() => setViewMode('app_digital')} className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-blue-100 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-all text-left group">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><Smartphone size={24}/></div>
                <div>
                  <h3 className="font-bold text-blue-900 text-lg">Fazer Vistoria Digital</h3>
                  <p className="text-xs text-blue-700 mt-1">Use a câmara do telemóvel agora para tirar fotos aos cômodos e gerar o laudo em PDF.</p>
                </div>
              </button>
              
              <div className="text-center text-xs font-bold text-slate-300 uppercase tracking-widest my-2">Ou</div>

              <button onClick={() => setViewMode('modal_manual')} className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-left group">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><FileUp size={24}/></div>
                <div>
                  <h3 className="font-bold text-slate-700 text-lg">Anexar Link / PDF</h3>
                  <p className="text-xs text-slate-500 mt-1">Já tenho o laudo pronto (Google Drive, Dropbox ou sistema externo).</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL MANUAL (Upload Link)                 */}
      {/* ========================================== */}
      {viewMode === 'modal_manual' && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><LinkIcon className="text-slate-600" size={20}/> Anexar Laudo</h2>
              <button onClick={() => setViewMode('list')} className="text-slate-400 hover:text-slate-600 bg-slate-200 p-1.5 rounded-full"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSaveManual} className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Imóvel Alugado</label>
                <select required value={manualForm.contractId} onChange={e => setManualForm({...manualForm, contractId: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none bg-white text-base">
                  <option value="">Selecione o imóvel...</option>
                  {contracts.map(c => <option key={c.id} value={c.id}>{c.property.title}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo</label>
                  <select required value={manualForm.type} onChange={e => setManualForm({...manualForm, type: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none bg-white text-base">
                    <option value="Entrada">Entrada</option>
                    <option value="Saída">Saída</option>
                    <option value="Rotina">Rotina</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Data</label>
                  <input required type="date" value={manualForm.date} onChange={e => setManualForm({...manualForm, date: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none text-base" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Link do PDF ou Pasta (Drive)</label>
                <input required type="url" placeholder="https://..." value={manualForm.reportUrl} onChange={e => setManualForm({...manualForm, reportUrl: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none text-base" />
              </div>

              <button type="submit" disabled={isSaving} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 mt-4 transition-colors">
                {isSaving ? <Loader2 size={24} className="animate-spin" /> : 'Salvar Vistoria'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* APP DIGITAL (Mobile-First UI Fullscreen)   */}
      {/* ========================================== */}
      {viewMode === 'app_digital' && (
        <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
          
          <div className="bg-blue-600 text-white p-4 flex items-center justify-between shadow-md shrink-0 pt-safe-top">
            <button onClick={() => setViewMode('list')} className="p-2 hover:bg-blue-700 rounded-full transition-colors"><ChevronLeft size={24}/></button>
            <h2 className="font-bold text-lg">App Vistoriador</h2>
            <div className="w-10"></div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 pb-32">
            
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 space-y-4">
              <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-2">1. Detalhes da Vistoria</h3>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Imóvel e Inquilino *</label>
                <select value={digitalForm.contractId} onChange={e => setDigitalForm({...digitalForm, contractId: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl outline-none bg-white text-sm font-semibold text-slate-800">
                  <option value="">Selecione...</option>
                  {contracts.map(c => <option key={c.id} value={c.id}>{c.property.title} - {c.tenant.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Tipo *</label>
                  <select value={digitalForm.type} onChange={e => setDigitalForm({...digitalForm, type: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl outline-none bg-white text-sm font-semibold text-slate-800">
                    <option value="Entrada">Entrada</option>
                    <option value="Saída">Saída</option>
                    <option value="Rotina">Rotina</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Data *</label>
                  <input type="date" value={digitalForm.date} onChange={e => setDigitalForm({...digitalForm, date: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl outline-none text-sm font-semibold text-slate-800" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800">2. Cômodos & Fotos</h3>
                <button onClick={handleAddRoom} className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform">
                  <Plus size={14}/> Add Cômodo
                </button>
              </div>

              {digitalForm.rooms.length === 0 ? (
                <div className="text-center p-8 bg-white border border-slate-200 border-dashed rounded-2xl text-slate-400">
                  <Camera size={32} className="mx-auto mb-2 opacity-50"/>
                  <p className="text-sm font-medium">Nenhum cômodo adicionado.</p>
                  <p className="text-xs mt-1">Clique acima para começar (Ex: Sala, Cozinha).</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {digitalForm.rooms.map(room => (
                    <div key={room.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="bg-slate-800 text-white p-3 px-4 font-bold flex justify-between items-center">
                        {room.name}
                        <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full">{room.items.length} Itens</span>
                      </div>
                      
                      <div className="p-4 space-y-4">
                        {room.items.map(item => (
                          <div key={item.id} className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 relative group">
                            {item.photo ? (
                              <img src={item.photo} alt="Foto" className="w-20 h-20 object-cover rounded-lg border border-slate-200 shrink-0" />
                            ) : (
                              <div className="w-20 h-20 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 shrink-0 border border-slate-300"><Camera size={20}/></div>
                            )}
                            <div className="flex-1">
                              <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.note || <span className="italic text-slate-400">Sem nota escrita.</span>}</p>
                            </div>
                            <button onClick={() => handleRemoveObservation(room.id, item.id)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full shadow-sm hover:bg-red-200"><Trash2 size={12}/></button>
                          </div>
                        ))}

                        <button onClick={() => setActiveRoomId(room.id)} className="w-full py-3 border-2 border-dashed border-blue-200 text-blue-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-blue-50/50 active:bg-blue-100 transition-colors">
                          <ImagePlus size={18}/> Tirar Foto / Adicionar Anotação
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pb-safe-bottom">
            <button onClick={handleGenerateDigitalReport} disabled={isSaving || digitalForm.rooms.length === 0} className="w-full bg-emerald-600 active:bg-emerald-700 text-white font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100">
              {isSaving ? <Loader2 size={24} className="animate-spin" /> : <CheckCircle2 size={24}/>} 
              Finalizar e Gerar Laudo PDF
            </button>
          </div>
          
          {activeRoomId && (
            <div className="absolute inset-0 bg-black/80 z-[60] flex flex-col">
              <div className="bg-white rounded-t-3xl mt-auto p-5 animate-in slide-in-from-bottom-full duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 text-lg">Nova Observação</h3>
                  <button onClick={() => { setActiveRoomId(null); setObsForm({photo:'', note:''}); }} className="bg-slate-100 text-slate-500 p-2 rounded-full"><X size={20}/></button>
                </div>
                
                <div className="space-y-4">
                  <div className="relative">
                    {obsForm.photo ? (
                      <div className="relative rounded-2xl overflow-hidden shadow-sm border border-slate-200 aspect-video bg-black flex items-center justify-center">
                        <img src={obsForm.photo} alt="Preview" className="max-w-full max-h-full object-contain" />
                        <button onClick={() => setObsForm({...obsForm, photo: ''})} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-md"><Trash2 size={16}/></button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-40 w-full border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 text-slate-500 cursor-pointer active:bg-slate-100 transition-colors">
                        <Camera size={32} className="mb-2"/>
                        <span className="font-bold text-sm">Abrir Câmera</span>
                        <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} className="hidden" />
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Anotação (Opcional se houver foto)</label>
                    <textarea 
                      rows={4} placeholder="Ex: Parede com pintura descascada próxima ao rodapé..." 
                      value={obsForm.note} onChange={e => setObsForm({...obsForm, note: e.target.value})}
                      className="w-full p-4 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 resize-none"
                    ></textarea>
                  </div>

                  <button onClick={handleSaveObservation} className="w-full bg-blue-600 active:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-sm">
                    <CheckCircle2 size={20}/> Salvar neste Cômodo
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}