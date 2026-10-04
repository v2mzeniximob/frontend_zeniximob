'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { 
  Wrench, Search, Loader2, AlertCircle, Clock, 
  CheckCircle2, Home, User, Phone, CalendarClock, Filter
} from 'lucide-react';

export default function ManutencaoPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/tickets');
      setTickets(response.data);
    } catch (error) {
      console.error('Erro ao carregar manutenções:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      // Atualiza visualmente primeiro para dar uma resposta instantânea (Optimistic UI)
      setTickets(tickets.map(t => t.id === id ? { ...t, status: newStatus } : t));
      
      // Envia para o backend
      await api.patch(`/tickets/${id}/status`, { status: newStatus });
    } catch (error) {
      alert('Erro ao atualizar o status do chamado.');
      fetchTickets(); // Reverte em caso de erro
    }
  };

  // Cores dinâmicas para Urgência e Status
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'bg-red-50 text-red-700 border-red-200';
      case 'Média': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Concluído': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'Em Andamento': return <Clock size={16} className="text-blue-500" />;
      default: return <AlertCircle size={16} className="text-amber-500" />;
    }
  };

  // Filtragem
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.property?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'Todos' || t.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 max-w-[1600px] mx-auto font-sans animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Wrench className="text-blue-600 bg-blue-50 p-1.5 rounded-lg" size={36} />
            Gestão de Manutenções
          </h1>
          <p className="text-slate-500 mt-2 text-sm">Controle os chamados e pedidos de reparo enviados pelos inquilinos.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar chamado..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white appearance-none cursor-pointer font-medium text-slate-700"
            >
              <option value="Todos">Todos os Status</option>
              <option value="Pendente">Pendentes</option>
              <option value="Em Andamento">Em Andamento</option>
              <option value="Concluído">Concluídos</option>
            </select>
          </div>
        </div>
      </div>

      {/* QUADRO DE CHAMADOS (TICKETS) */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 text-slate-400">
          <Loader2 size={40} className="animate-spin mb-4 text-blue-500" />
          <p>Carregando chamados...</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-16 text-center shadow-sm">
          <Wrench size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-700">Nenhum chamado encontrado</h3>
          <p className="text-slate-500 mt-2">Você não possui pedidos de manutenção abertos no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTickets.map(ticket => (
            <div key={ticket.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
              
              {/* Cabeçalho do Card */}
              <div className="flex justify-between items-start mb-4">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${getPriorityColor(ticket.priority)}`}>
                  Urgência: {ticket.priority}
                </span>
                
                {/* SELECTOR DE STATUS MÁGICO */}
                <select 
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                  className={`text-xs font-bold px-3 py-1 rounded-full border outline-none cursor-pointer transition-colors ${
                    ticket.status === 'Concluído' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    ticket.status === 'Em Andamento' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Concluído">Concluído</option>
                </select>
              </div>

              {/* Título e Descrição */}
              <div className="mb-6 flex-1">
                <h3 className="font-black text-slate-800 text-lg mb-2 line-clamp-2" title={ticket.title}>{ticket.title}</h3>
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-3" title={ticket.description}>
                  {ticket.description}
                </p>
              </div>

              {/* Detalhes de Rodapé (Imóvel e Cliente) */}
              <div className="border-t border-slate-100 pt-4 space-y-2 mt-auto">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Home size={14} className="text-blue-500" />
                  <span className="font-medium truncate">{ticket.property?.title || 'Imóvel não identificado'}</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <User size={14} className="text-purple-500" />
                  <span className="font-medium truncate">{ticket.client?.name || 'Inquilino desconhecido'}</span>
                  {ticket.client?.phone && (
                    <>
                      <span className="text-slate-300">•</span>
                      <a href={`https://wa.me/55${ticket.client.phone.replace(/\D/g, '')}`} target="_blank" className="text-blue-600 hover:underline flex items-center gap-1">
                        <Phone size={12}/> Whats
                      </a>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">
                  <CalendarClock size={12}/>
                  Aberto em {new Date(ticket.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}