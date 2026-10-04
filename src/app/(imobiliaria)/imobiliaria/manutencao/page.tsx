'use client';

import { useState, useEffect } from 'react';
import { 
  Wrench, Clock, CheckCircle, AlertCircle, 
  MapPin, User, Loader2, Filter, MessageSquare,
  X, Send
} from 'lucide-react';
import { api } from '@/src/lib/api';

export default function ManutencaoPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('Abertos');
  
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modal Interação
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/tickets');
      setTickets(response.data);
    } catch (error) {
      console.error('Erro ao carregar chamados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    setUpdatingId(ticketId);
    try {
      await api.patch(`/tickets/${ticketId}/status`, { status: newStatus });
      // Atualiza a lista e o modal se estiver aberto
      setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (error) {
      alert('Ocorreu um erro ao atualizar o status do chamado.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket) return;
    
    setIsSendingMessage(true);
    try {
      const response = await api.post(`/tickets/${selectedTicket.id}/messages`, {
        message: newMessage
      });
      // Atualiza localmente para exibir na hora
      const updatedTicket = {
        ...selectedTicket,
        messages: [...(selectedTicket.messages || []), response.data]
      };
      setSelectedTicket(updatedTicket);
      setTickets(tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));
      setNewMessage('');
    } catch (error) {
      alert('Erro ao enviar mensagem.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filterStatus === 'Todos') return true;
    if (filterStatus === 'Abertos') return ticket.status !== 'Concluído';
    return ticket.status === filterStatus;
  });

  if (isLoading) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 size={40} className="animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-medium">A carregar chamados de manutenção...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-slate-50 min-h-screen pb-20">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Wrench className="text-blue-600" /> Gestão de Manutenção
          </h1>
          <p className="text-slate-500 mt-1">Gira os chamados abertos por inquilinos e proprietários.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
          <Filter size={16} className="text-slate-400 ml-2" />
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-transparent border-none text-sm font-medium text-slate-700 outline-none pr-2 py-1.5 cursor-pointer"
          >
            <option value="Todos">Todos os Chamados</option>
            <option value="Abertos">Apenas Abertos / Em Andamento</option>
            <option value="Concluído">Concluídos</option>
          </select>
        </div>
      </div>

      {/* LISTA DE CHAMADOS */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-12 text-center flex flex-col items-center justify-center">
          <CheckCircle size={48} className="text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-700">Tudo tranquilo por aqui!</h3>
          <p className="text-slate-500 mt-1">Não há chamados de manutenção correspondentes a este filtro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTickets.map(ticket => {
            const isCompleted = ticket.status === 'Concluído';
            const isOngoing = ticket.status === 'Em Andamento';
            
            return (
              <div 
                key={ticket.id} 
                onClick={() => setSelectedTicket(ticket)}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-all group"
              >
                
                <div className={`px-6 py-4 border-b flex justify-between items-start ${
                  isCompleted ? 'bg-emerald-50/50 border-emerald-100' : 
                  isOngoing ? 'bg-blue-50/50 border-blue-100' : 
                  'bg-amber-50/50 border-amber-100'
                }`}>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{ticket.title}</h3>
                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-1">
                      <Clock size={12}/> Aberto a {new Date(ticket.createdAt).toLocaleDateString('pt-PT')}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm border ${
                      ticket.priority === 'Alta' ? 'bg-red-100 text-red-700 border-red-200' :
                      ticket.priority === 'Média' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                      'bg-blue-100 text-blue-700 border-blue-200'
                    }`}>
                      Urgência {ticket.priority}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{ticket.status}</span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <p className="text-slate-600 text-sm mb-6 flex-1 line-clamp-2">
                    {ticket.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Imóvel</p>
                      <p className="font-medium text-slate-700 truncate">{ticket.property?.title || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Solicitante</p>
                      <p className="font-medium text-slate-700 truncate">{ticket.client?.name ? ticket.client.name : 'Proprietário'}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-end text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                    Ver e Interagir <MessageSquare size={14}/>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* =================================================================================== */}
      {/* MODAL DE INTERAÇÃO E GESTÃO DO CHAMADO (CRM ADMIN)                                  */}
      {/* =================================================================================== */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* CABEÇALHO DO MODAL */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="font-bold text-slate-800 text-lg line-clamp-1">{selectedTicket.title}</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase border bg-white text-slate-500">
                    {selectedTicket.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-2">
                  <MapPin size={12}/> {selectedTicket.property?.title || 'Imóvel N/A'} • <User size={12}/> {selectedTicket.client?.name || 'Proprietário'}
                </p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-200/50 rounded-full shrink-0"><X size={18} /></button>
            </div>

            {/* ÁREA DE CONTEÚDO (MENSAGENS) */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 flex flex-col gap-5">
              
              {/* O Chamado Original (Visto como mensagem da Esquerda) */}
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-bold text-slate-400 mb-1 ml-1">Relato Original do Cliente</span>
                <div className="p-4 rounded-2xl rounded-tl-sm text-sm shadow-sm max-w-[85%] bg-white border border-slate-200 text-slate-700 whitespace-pre-wrap">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Loop de Mensagens */}
              {selectedTicket.messages && selectedTicket.messages.map((msg: any) => {
                const isAdmin = msg.sender === 'ADMIN';
                return (
                  <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                    <span className={`text-[10px] font-bold text-slate-400 mb-1 ${isAdmin ? 'mr-1' : 'ml-1'}`}>
                      {isAdmin ? 'Você (Imobiliária)' : 'Cliente'} • {new Date(msg.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <div className={`p-4 rounded-2xl text-sm shadow-sm max-w-[85%] whitespace-pre-wrap ${
                      isAdmin 
                        ? 'bg-blue-600 text-white rounded-tr-sm' 
                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* RODAPÉ DO MODAL (INPUT DE TEXTO E BOTÕES DE STATUS) */}
            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
              
              {/* Envio de Mensagem */}
              {selectedTicket.status !== 'Concluído' ? (
                <form onSubmit={handleSendMessage} className="flex gap-2 mb-4">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Responda ao cliente e atualize o andamento..." 
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                  <button 
                    type="submit" 
                    disabled={isSendingMessage || !newMessage.trim()}
                    className="px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center transition-all disabled:opacity-50"
                  >
                    {isSendingMessage ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </form>
              ) : (
                <div className="text-center p-3 mb-4 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-500">
                  Chamado Concluído. Nenhuma nova interação pode ser feita.
                </div>
              )}

              {/* Botões de Ação Rápida (Mudança de Status) */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ações do Chamado</span>
                <div className="flex items-center gap-2">
                  {updatingId === selectedTicket.id ? (
                     <div className="text-sm font-medium text-blue-600 flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Atualizando...</div>
                  ) : (
                    <>
                      {selectedTicket.status !== 'Aberto' && (
                        <button onClick={() => handleUpdateStatus(selectedTicket.id, 'Aberto')} className="px-4 py-2 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">Reabrir</button>
                      )}
                      {selectedTicket.status !== 'Em Andamento' && selectedTicket.status !== 'Concluído' && (
                        <button onClick={() => handleUpdateStatus(selectedTicket.id, 'Em Andamento')} className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors">Iniciar Atendimento</button>
                      )}
                      {selectedTicket.status !== 'Concluído' && (
                        <button onClick={() => handleUpdateStatus(selectedTicket.id, 'Concluído')} className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors flex items-center gap-1.5"><CheckCircle size={14}/> Resolver Chamado</button>
                      )}
                    </>
                  )}
                </div>
              </div>
              
            </div>

          </div>
        </div>
      )}

    </div>
  );
}