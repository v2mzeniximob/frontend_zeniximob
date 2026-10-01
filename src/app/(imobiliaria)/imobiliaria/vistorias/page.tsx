'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { Camera, Plus, X, Loader2, Home, FileText, Calendar, Link as LinkIcon } from 'lucide-react';

export default function VistoriasAppPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    contractId: '',
    type: 'Entrada', // Entrada, Saída, Rotina
    date: new Date().toISOString().split('T')[0],
    reportUrl: '' // Link do Google Drive ou sistema de fotos
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Busca apenas contratos ativos para fazer vistorias
      const response = await api.get('/contracts?status=Ativo');
      setContracts(response.data);
    } catch (error) {
      console.error('Erro ao buscar contratos para vistoria:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post(`/contracts/${form.contractId}/inspections`, form);
      alert('Vistoria registada com sucesso!');
      setIsModalOpen(false);
      setForm({ contractId: '', type: 'Entrada', date: new Date().toISOString().split('T')[0], reportUrl: '' });
      fetchData(); // Recarrega para ver a vistoria na lista
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao registar vistoria.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex justify-center pt-20 text-slate-500"><Loader2 className="animate-spin" size={40}/></div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto font-sans bg-slate-50 min-h-screen">
      
      {/* Cabeçalho App */}
      <div className="bg-blue-600 rounded-2xl p-6 text-white mb-6 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Camera size={28} /> Vistorias
          </h1>
          <p className="text-blue-100 text-sm mt-1">Laudos fotográficos de imóveis.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-white text-blue-600 p-3 rounded-xl shadow-sm hover:scale-105 transition-transform">
          <Plus size={24} />
        </button>
      </div>

      {/* Lista de Contratos e Vistorias (Mobile Cards) */}
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

            {/* Vistorias Anexadas */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Laudos de Vistoria</h4>
              {contract.inspections && contract.inspections.length > 0 ? (
                contract.inspections.map((insp: any) => (
                  <a key={insp.id} href={insp.reportUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between bg-slate-50 p-3 rounded-lg hover:bg-slate-100 transition-colors border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Camera size={16} className={insp.type === 'Entrada' ? 'text-green-500' : insp.type === 'Saída' ? 'text-red-500' : 'text-blue-500'} />
                      <span className="text-sm font-bold text-slate-700">Vistoria de {insp.type}</span>
                    </div>
                    <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={12}/> {new Date(insp.date).toLocaleDateString()}</span>
                  </a>
                ))
              ) : (
                <p className="text-sm text-slate-400 italic">Nenhuma vistoria registada.</p>
              )}
            </div>
          </div>
        ))}
        {contracts.length === 0 && (
          <div className="text-center p-10 text-slate-400">Nenhum contrato ativo para vistoriar.</div>
        )}
      </div>

      {/* MODAL NOVA VISTORIA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Camera className="text-blue-600" size={20}/> Novo Laudo
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-200 p-1.5 rounded-full"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Imóvel Alugado</label>
                <select required value={form.contractId} onChange={e => setForm({...form, contractId: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none bg-white text-base">
                  <option value="">Selecione o imóvel...</option>
                  {contracts.map(c => <option key={c.id} value={c.id}>{c.property.title}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo</label>
                  <select required value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none bg-white text-base">
                    <option value="Entrada">Entrada</option>
                    <option value="Saída">Saída</option>
                    <option value="Rotina">Rotina</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Data</label>
                  <input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none text-base" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                  <LinkIcon size={16}/> Link das Fotos / Laudo em PDF
                </label>
                <input required type="url" placeholder="Ex: Link do Google Drive ou Dropbox" value={form.reportUrl} onChange={e => setForm({...form, reportUrl: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none text-base" />
                <p className="text-xs text-slate-500 mt-2">Os corretores podem colar aqui o link da pasta na nuvem contendo as fotos da vistoria.</p>
              </div>

              <button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 mt-4 shadow-md transition-colors">
                {isSaving ? <Loader2 size={24} className="animate-spin" /> : 'Salvar Vistoria'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}