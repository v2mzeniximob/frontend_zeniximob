'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { 
  LogOut, Home, FileText, Wrench, DollarSign, AlertCircle, 
  CheckCircle, Clock, Plus, Building, User, FileDown, Loader2, X,
  MapPin
} from 'lucide-react';
import { api } from '@/src/lib/api';

export default function PortalDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string; // <-- Pegamos o slug
  
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dados do Inquilino
  const [contracts, setContracts] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  
  // Dados do Proprietário
  const [properties, setProperties] = useState<any[]>([]);

  // Controle de Abas
  const [activeTab, setActiveTab] = useState<'resumo' | 'boletos' | 'manutencao'>('resumo');

  // Modal de Novo Chamado (Ticket)
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isSavingTicket, setIsSavingTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    title: '', description: '', priority: 'Média', propertyId: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('@ZenixPortal:token');
    const userData = localStorage.getItem('@ZenixPortal:user');

    if (!token || !userData) {
      router.push(`/loja/${slug}/portal-cliente/login`); // <-- Redireciona para o login da loja certa!
      return;
    }

    setUser(JSON.parse(userData));
    api.defaults.headers.authorization = `Bearer ${token}`;
    
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/portal/dashboard');
      if (response.data.contracts) setContracts(response.data.contracts);
      if (response.data.tickets) setTickets(response.data.tickets);
      if (response.data.properties) setProperties(response.data.properties);

      if (response.data.contracts && response.data.contracts.length === 1) {
        setTicketForm(prev => ({ ...prev, propertyId: response.data.contracts[0].propertyId }));
      }
    } catch (error) {
      console.error('Erro ao buscar dados do portal', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('@ZenixPortal:token');
    localStorage.removeItem('@ZenixPortal:user');
    router.push(`/loja/${slug}/portal-cliente/login`); 
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTicket(true);
    try {
      await api.post('/portal/tickets', {
        ...ticketForm,
        clientId: user.id
      });
      setIsTicketModalOpen(false);
      setTicketForm({ title: '', description: '', priority: 'Média', propertyId: ticketForm.propertyId });
      fetchDashboardData();
    } catch (error) {
      alert('Erro ao abrir chamado de manutenção.');
    } finally {
      setIsSavingTicket(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 size={40} className="animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-medium">Carregando o seu portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      
      {/* NAVBAR */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${user?.role === 'CLIENT' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{user?.role === 'CLIENT' ? 'Área do Inquilino' : 'Área do Proprietário'}</p>
                <p className="font-bold text-slate-800 line-clamp-1">Olá, {user?.name}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 p-2 transition-colors rounded-lg hover:bg-red-50" title="Sair">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 animate-in fade-in duration-500">
        
        {/* ========================================================================= */}
        {/* VISÃO DO INQUILINO (CLIENT)                                               */}
        {/* ========================================================================= */}
        {user?.role === 'CLIENT' && (
          <div className="space-y-6">
            
            {/* ABAS MOBILE & DESKTOP */}
            <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
              <button onClick={() => setActiveTab('resumo')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'resumo' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
                <Home size={16}/> Meu Aluguel
              </button>
              <button onClick={() => setActiveTab('boletos')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'boletos' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
                <DollarSign size={16}/> Boletos
              </button>
              <button onClick={() => setActiveTab('manutencao')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'manutencao' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
                <Wrench size={16}/> Manutenção
              </button>
            </div>

            {/* ABA 1: RESUMO DO ALUGUEL */}
            {activeTab === 'resumo' && (
              <div className="space-y-4">
                {contracts.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 shadow-sm">
                    <AlertCircle size={40} className="mx-auto text-slate-300 mb-3" />
                    <h3 className="font-bold text-slate-700">Nenhum contrato ativo</h3>
                    <p className="text-sm text-slate-500">Você ainda não possui contratos de locação vinculados.</p>
                  </div>
                ) : (
                  contracts.map(contract => (
                    <div key={contract.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="h-32 bg-slate-200 relative">
                        {contract.property.coverImage ? (
                          <img src={contract.property.coverImage} alt="Imóvel" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-300"><Building size={40}/></div>
                        )}
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-700 shadow-sm">
                          Contrato Ativo
                        </div>
                      </div>
                      <div className="p-6">
                        <h2 className="text-lg font-black text-slate-800">{contract.property.title}</h2>
                        <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1"><MapPin size={14}/> {contract.property.address}</p>
                        
                        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Valor do Aluguel</p>
                            <p className="text-lg font-black text-blue-600">{formatCurrency(contract.rentValue)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Vencimento</p>
                            <p className="text-lg font-black text-slate-700">Dia {contract.dueDate || '10'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ABA 2: BOLETOS */}
            {activeTab === 'boletos' && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800">Meus Boletos</h3>
                {contracts.flatMap(c => c.invoices).length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum boleto gerado no momento.</p>
                ) : (
                  contracts.flatMap(c => c.invoices).map((invoice: any) => {
                    const isPaid = invoice.status === 'Pago';
                    const isLate = invoice.status === 'Atrasado';
                    return (
                      <div key={invoice.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isPaid ? 'bg-emerald-50 text-emerald-600' : isLate ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                            {isPaid ? <CheckCircle size={24}/> : isLate ? <AlertCircle size={24}/> : <Clock size={24}/>}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">Vencimento: {new Date(invoice.dueDate).toLocaleDateString('pt-BR')}</p>
                            <p className="text-sm text-slate-500">{invoice.description || 'Aluguel Mensal'}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                          <p className="font-black text-lg text-slate-800">{formatCurrency(invoice.value)}</p>
                          {!isPaid && (
                            <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-1.5">
                              <DollarSign size={14}/> Pagar
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* ABA 3: MANUTENÇÃO (TICKETS) */}
            {activeTab === 'manutencao' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Chamados Abertos</h3>
                  <button onClick={() => setIsTicketModalOpen(true)} className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm hover:bg-blue-700 transition-all">
                    <Plus size={14}/> Novo Chamado
                  </button>
                </div>
                
                {tickets.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 border-dashed">
                    <Wrench size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-sm font-medium text-slate-500">Você não possui chamados de manutenção abertos.</p>
                  </div>
                ) : (
                  tickets.map(ticket => (
                    <div key={ticket.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-800">{ticket.title}</h4>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          ticket.status === 'Concluído' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          ticket.status === 'Em Andamento' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {ticket.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{ticket.description}</p>
                      <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                        <Clock size={12}/> Aberto em {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VISÃO DO PROPRIETÁRIO (OWNER)                                             */}
        {/* ========================================================================= */}
        {user?.role === 'OWNER' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Home size={24} className="text-emerald-600"/> Meus Imóveis</h2>
            
            {properties.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 shadow-sm">
                <AlertCircle size={40} className="mx-auto text-slate-300 mb-3" />
                <h3 className="font-bold text-slate-700">Nenhum imóvel vinculado</h3>
                <p className="text-sm text-slate-500">A sua imobiliária ainda não vinculou imóveis ao seu perfil.</p>
              </div>
            ) : (
              properties.map(property => {
                const isRented = property.rentStatus === 'Alugado';
                return (
                  <div key={property.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-black text-slate-800">{property.title}</h3>
                          <p className="text-sm text-slate-500 mt-1">{property.address}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider ${
                          isRented ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {isRented ? 'Alugado' : 'Vago'}
                        </span>
                      </div>

                      {/* Repasses (Se estiver alugado e tiver contratos ativos) */}
                      {isRented && property.contracts && property.contracts.length > 0 && (
                        <div className="mt-6 pt-5 border-t border-slate-100">
                          <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5"><FileText size={16}/> Extrato de Repasses</h4>
                          <div className="space-y-3">
                            {property.contracts[0].invoices?.slice(0, 3).map((invoice: any) => (
                              <div key={invoice.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${invoice.status === 'Pago' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                    {invoice.status === 'Pago' ? <CheckCircle size={16}/> : <Clock size={16}/>}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-700">Ref. {new Date(invoice.dueDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric'})}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{invoice.status === 'Pago' ? 'Repasse Realizado' : 'Aguardando Pagamento'}</p>
                                  </div>
                                </div>
                                <p className="font-bold text-slate-800">{formatCurrency(invoice.value)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

      </main>

      {/* MODAL: NOVO CHAMADO DE MANUTENÇÃO */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2"><Wrench size={20} className="text-blue-600"/> Abrir Chamado</h2>
              <button onClick={() => setIsTicketModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-200/50 rounded-full"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              
              {contracts.length > 1 && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Qual Imóvel?</label>
                  <select required value={ticketForm.propertyId} onChange={e => setTicketForm({...ticketForm, propertyId: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                    <option value="">Selecione o imóvel...</option>
                    {contracts.map(c => <option key={c.propertyId} value={c.propertyId}>{c.property.title}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Resumo do Problema (Título)</label>
                <input required type="text" value={ticketForm.title} onChange={e => setTicketForm({...ticketForm, title: e.target.value})} placeholder="Ex: Infiltração no teto do banheiro" className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Descrição Detalhada</label>
                <textarea required rows={4} value={ticketForm.description} onChange={e => setTicketForm({...ticketForm, description: e.target.value})} placeholder="Descreva o que está acontecendo..." className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Urgência</label>
                <select value={ticketForm.priority} onChange={e => setTicketForm({...ticketForm, priority: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                  <option value="Baixa">Baixa (Pode esperar alguns dias)</option>
                  <option value="Média">Média (Atrapalha o dia a dia)</option>
                  <option value="Alta">Alta (Emergência / Vazamento grave)</option>
                </select>
              </div>

              <button type="submit" disabled={isSavingTicket || !ticketForm.propertyId} className="w-full mt-4 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-sm transition-all disabled:opacity-50 flex justify-center items-center gap-2">
                {isSavingTicket ? <Loader2 size={18} className="animate-spin"/> : 'Enviar Chamado à Imobiliária'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}