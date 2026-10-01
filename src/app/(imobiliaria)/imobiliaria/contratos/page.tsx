'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { Plus, CheckCircle2, Loader2, Key, FileSignature, Copy, MessageCircle, ExternalLink } from 'lucide-react';

export default function ContratosPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

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

  // Dispara a ZapSign para o Inquilino
  const handleSendToZapSign = async (contract: any) => {
    if (!contract.tenant?.email) {
      alert('O inquilino deste contrato não possui e-mail cadastrado. Edite o cadastro do inquilino primeiro.');
      return;
    }
    
    setIsProcessingId(contract.id);
    try {
      await api.post(`/contracts/${contract.id}/send-signature`);
      alert('Contrato enviado com sucesso para o e-mail do inquilino!');
      fetchContracts(); // Atualiza a lista para mostrar o link gerado
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao disparar contrato para ZapSign.');
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
        {/* Futuramente pode abrir o modal de criar contrato manual aqui */}
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors">
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
                  {contract.signUrl ? (
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                        <CheckCircle2 size={14}/> Aguardando Assinatura
                      </span>
                      <div className="flex gap-2">
                        <a href={contract.signUrl} target="_blank" rel="noreferrer" className="text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-1.5 rounded flex items-center gap-1 hover:bg-slate-200 transition-colors">
                          <ExternalLink size={14}/> Consultar
                        </a>
                        <button onClick={() => handleWhatsApp(contract)} className="text-[11px] font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-1.5 rounded flex items-center gap-1 hover:bg-green-100 transition-colors">
                          <MessageCircle size={14}/> WhatsApp
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleSendToZapSign(contract)} 
                      disabled={isProcessingId === contract.id}
                      className="text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      {isProcessingId === contract.id ? <Loader2 size={14} className="animate-spin" /> : <FileSignature size={14}/>}
                      Disparar ZapSign
                    </button>
                  )}
                </td>

                <td className="py-4 px-6 text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${contract.status === 'Ativo' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                    {contract.status}
                  </span>
                </td>
              </tr>
            ))}
            {contracts.length === 0 && (
              <tr><td colSpan={4} className="py-8 text-center text-slate-500">Nenhum contrato gerado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}