'use client';

import { useState, useEffect } from 'react';
import { api } from '@/src/lib/api';
import { 
  KeyRound, FileText, CheckCircle2, Clock, Search, User, 
  ArrowRightLeft, Plus, X, Building2, FileSignature
} from 'lucide-react';

export default function ChavesPage() {
  const [activeTab, setActiveTab] = useState<'quadro' | 'termos'>('quadro');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados: Quadro de Chaves
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ clientName: '', reason: 'Visita', notes: '' });
  
  // Estados: Termos de Chaves
  const [terms, setTerms] = useState<any[]>([]);
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);
  const [termForm, setTermForm] = useState({ type: 'Entrega - Locação', propertyId: '', clientId: '', documentUrl: '' });
  
  // Dados de Apoio
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'quadro') {
        const resProps = await api.get('/keys');
        setProperties(resProps.data);
      } else {
        const [resTerms, resClients, resProps] = await Promise.all([
          api.get('/key-terms'),
          api.get('/clients'),
          api.get('/properties')
        ]);
        setTerms(resTerms.data);
        setClients(resClients.data);
        setProperties(resProps.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do quadro de chaves:', error);
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

  const handleWithdrawKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/keys/withdraw', { propertyId: selectedProperty.id, ...withdrawForm });
      setIsWithdrawModalOpen(false);
      setWithdrawForm({ clientName: '', reason: 'Visita', notes: '' });
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

  // Filtros
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
          <p className="text-slate-500 mt-2">Controle o quadro físico de chaves e gere os Termos de Entrega Oficiais.</p>
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
                          <input 
                            type="text" 
                            defaultValue={prop.keyCode || ''}
                            onBlur={(e) => { if(e.target.value !== prop.keyCode) handleUpdateKeyCode(prop.id, e.target.value) }}
                            placeholder="Ex: A-15"
                            className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-amber-400 focus:bg-white transition-all"
                          />
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
                                {activeMovement.broker?.name || activeMovement.realEstate?.tradeName || activeMovement.realEstate?.name || 'Sistema'}
                              </p>
                              <p className="text-[10px] text-slate-500">{activeMovement.reason} ({new Date(activeMovement.withdrawnAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})})</p>
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
                      <td className="p-4 pr-6 flex justify-end gap-2">
                        {term.documentUrl && (
                          <a href={term.documentUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5">
                            <FileText size={14}/> PDF
                          </a>
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

      {/* MODAL: RETIRAR CHAVE (VISITA/MANUTENÇÃO) */}
      {isWithdrawModalOpen && selectedProperty && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><KeyRound size={18} className="text-amber-600"/> Retirar Chave</h3>
              <button onClick={() => setIsWithdrawModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleWithdrawKey} className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Imóvel</p>
                <p className="font-bold text-slate-800">{selectedProperty.title}</p>
                <p className="text-xs text-slate-500 mt-1">Tag: <span className="font-bold bg-slate-100 px-2 py-0.5 rounded">{selectedProperty.keyCode || 'Sem tag'}</span></p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Motivo da Retirada</label>
                <select value={withdrawForm.reason} onChange={e => setWithdrawForm({...withdrawForm, reason: e.target.value})} className="w-full p-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500">
                  <option value="Visita">Visita com Cliente</option>
                  <option value="Vistoria">Vistoria</option>
                  <option value="Manutenção">Manutenção / Reparos</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Entregue para (Opcional)</label>
                <input type="text" placeholder="Nome do prestador ou cliente..." value={withdrawForm.clientName} onChange={e => setWithdrawForm({...withdrawForm, clientName: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <button type="submit" className="w-full py-3.5 mt-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors">
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
                <label className="block text-sm font-bold text-slate-700 mb-1">Link do Documento (PDF Gerado / ZapSign)</label>
                <input type="url" placeholder="https://..." value={termForm.documentUrl} onChange={e => setTermForm({...termForm, documentUrl: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-xs font-medium border border-blue-100 mt-4">
                <strong>Nota:</strong> Ao criar o termo, ele ficará como "Pendente". Quando você marcar como "Assinado", o sistema moverá a chave automaticamente no quadro físico.
              </div>

              <button type="submit" className="w-full py-3.5 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">
                Gerar Termo
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}