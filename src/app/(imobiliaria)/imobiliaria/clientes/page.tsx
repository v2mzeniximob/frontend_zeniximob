'use client';

import { useState, useEffect, useMemo } from 'react';
import { api } from '../../../../lib/api';
import { Plus, Search, X, Loader2, Users, FileText, Home, Phone, Mail, MapPin, ShieldCheck, UserCheck } from 'lucide-react';

export default function ClientesPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal de Detalhes 360º
  const [selectedClient, setSelectedClient] = useState<any>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/tenants');
      setClients(response.data);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtro Inteligente (Nome, CPF ou Endereço)
  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    const lowerSearch = searchTerm.toLowerCase();
    return clients.filter(c => 
      c.name.toLowerCase().includes(lowerSearch) || 
      c.cpf.replace(/\D/g, '').includes(lowerSearch) || 
      c.currentAddress.toLowerCase().includes(lowerSearch)
    );
  }, [clients, searchTerm]);

  if (isLoading) return <div className="p-8 flex justify-center text-slate-500"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Users className="text-blue-600" size={32} />
            Clientes (Inquilinos)
          </h1>
          <p className="text-slate-500 mt-1">Consulte todos os dados, fiadores e contratos ativos dos seus clientes.</p>
        </div>
        
        {/* Barra de Pesquisa */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Pesquisar por nome, CPF ou endereço..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="py-4 px-6">Cliente / Documento</th>
              <th className="py-4 px-6">Contactos</th>
              <th className="py-4 px-6">Endereço de Cadastro</th>
              <th className="py-4 px-6">Status / Contratos</th>
              <th className="py-4 px-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredClients.map(client => {
              const activeContracts = client.contracts?.filter((c: any) => c.status === 'Ativo') || [];
              
              return (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-800">{client.name}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{client.cpf}</p>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <p className="flex items-center gap-2 text-slate-600"><Phone size={14}/> {client.phone}</p>
                      <p className="flex items-center gap-2 text-slate-600"><Mail size={14}/> {client.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 max-w-[200px] truncate">
                    <span className="flex items-center gap-1 text-slate-500" title={client.currentAddress}>
                      <MapPin size={14} className="shrink-0"/> {client.currentAddress}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    {activeContracts.length > 0 ? (
                      <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                        <Home size={14}/> {activeContracts.length} Imóvel Alugado
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                        Sem contrato ativo
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button onClick={() => setSelectedClient(client)} className="text-blue-600 hover:text-blue-800 font-bold bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2">
                      <UserCheck size={16} /> Ver Cliente
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredClients.length === 0 && (
              <tr><td colSpan={5} className="py-12 text-center text-slate-500 text-lg">Nenhum cliente encontrado com esses dados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: VISÃO 360 DO CLIENTE */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="text-blue-600" size={28}/> Ficha do Cliente
              </h2>
              <button onClick={() => setSelectedClient(null)} className="text-slate-400 hover:text-slate-600"><X size={28}/></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-8 bg-slate-50/50">
              
              {/* DADOS PESSOAIS */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Dados Pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><p className="text-sm text-slate-500 mb-1">Nome Completo</p><p className="font-bold text-slate-700">{selectedClient.name}</p></div>
                  <div><p className="text-sm text-slate-500 mb-1">CPF</p><p className="font-bold text-slate-700">{selectedClient.cpf}</p></div>
                  <div><p className="text-sm text-slate-500 mb-1">Telefone / WhatsApp</p><p className="font-bold text-slate-700">{selectedClient.phone}</p></div>
                  <div><p className="text-sm text-slate-500 mb-1">E-mail</p><p className="font-bold text-slate-700">{selectedClient.email}</p></div>
                  <div className="md:col-span-2"><p className="text-sm text-slate-500 mb-1">Endereço de Cadastro</p><p className="font-bold text-slate-700">{selectedClient.currentAddress}</p></div>
                  
                  {selectedClient.documentUrl && (
                    <div className="md:col-span-2 mt-2">
                      <a href={selectedClient.documentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg font-bold">
                        <FileText size={16}/> Ver Documento Anexado (CNH/RG)
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* DADOS DO FIADOR E CONJUGE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <ShieldCheck size={20} className="text-amber-500"/> Fiador (Garantia)
                  </h3>
                  {selectedClient.guarantorName ? (
                    <div className="space-y-3">
                      <div><p className="text-xs text-slate-500">Nome do Fiador</p><p className="font-bold text-slate-700">{selectedClient.guarantorName}</p></div>
                      <div><p className="text-xs text-slate-500">CPF do Fiador</p><p className="font-bold text-slate-700">{selectedClient.guarantorCpf}</p></div>
                      {selectedClient.guarantorDocUrl && (
                        <a href={selectedClient.guarantorDocUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 mt-2 font-bold">
                          <FileText size={14}/> Documento do Fiador
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">Nenhum fiador registado.</p>
                  )}
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Cônjuge (Estado Civil: {selectedClient.maritalStatus})</h3>
                  {selectedClient.spouseName ? (
                    <div className="space-y-3">
                      <div><p className="text-xs text-slate-500">Nome do Cônjuge</p><p className="font-bold text-slate-700">{selectedClient.spouseName}</p></div>
                      <div><p className="text-xs text-slate-500">CPF</p><p className="font-bold text-slate-700">{selectedClient.spouseCpf}</p></div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">Sem dados de cônjuge.</p>
                  )}
                </div>
              </div>

              {/* IMÓVEIS E CONTRATOS ATIVOS */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Home size={20} className="text-green-600"/> Contratos de Aluguel Vinculados
                </h3>
                
                {selectedClient.contracts && selectedClient.contracts.length > 0 ? (
                  <div className="space-y-4">
                    {selectedClient.contracts.map((contract: any) => (
                      <div key={contract.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                          <p className="font-bold text-slate-800 text-lg">{contract.property?.title}</p>
                          <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><MapPin size={14}/> {contract.property?.address}</p>
                          <div className="flex gap-4 mt-2 text-sm font-semibold">
                            <span className="text-green-700">Valor: R$ {Number(contract.rentValue).toLocaleString('pt-BR')}</span>
                            <span className="text-slate-500">Início: {new Date(contract.startDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 shrink-0">
                          <span className={`px-3 py-1 text-center rounded-lg text-xs font-bold ${contract.status === 'Ativo' ? 'bg-green-200 text-green-800' : 'bg-slate-200 text-slate-700'}`}>
                            Contrato {contract.status}
                          </span>
                          {contract.documentUrl && (
                            <a href={contract.documentUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
                              <FileText size={16}/> Ver PDF do Contrato
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-4">Este cliente não possui contratos vinculados neste momento.</p>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}