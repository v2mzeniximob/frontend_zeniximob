'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Globe, Smartphone, Key, DollarSign, 
  MessageSquare, Grid, GraduationCap, CheckCircle2, RefreshCw, 
  Plus, Users, Sparkles, Building2, ShieldCheck, ArrowUpRight, X, Loader2, MapPin, AlertCircle, Search
} from 'lucide-react';
import { api } from '@/src/lib/api';

export default function ModuloTemporadaPage() {
  const [activeTab, setActiveTab] = useState<'pms' | 'channels' | 'direct_booking' | 'operations' | 'guest_panel' | 'pricing' | 'messaging' | 'app_center' | 'academy'>('pms');

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Dados Reais do Backend
  const [properties, setProperties] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  // Modal Nova Reserva
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [isSavingBooking, setIsSavingBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    propertyId: '',
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    checkIn: '',
    checkOut: '',
    totalAmount: '',
    notes: ''
  });

  // Formulário iCal para Channel Manager
  const [icalForm, setIcalForm] = useState<{ airbnbIcalUrl: string; bookingIcalUrl: string; vrboIcalUrl: string }>({
    airbnbIcalUrl: '', bookingIcalUrl: '', vrboIcalUrl: ''
  });
  const [isSavingIcal, setIsSavingIcal] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // 1. Busca os imóveis da imobiliária
      const propsRes = await api.get('/properties');
      const propsList = propsRes.data || [];
      setProperties(propsList);

      if (propsList.length > 0) {
        const firstId = propsList[0].id;
        setSelectedPropertyId(firstId);
        setBookingForm(prev => ({ ...prev, propertyId: firstId }));
        updateIcalFormState(propsList[0]);
        
        // 2. Busca as reservas do primeiro imóvel
        fetchBookings(firstId);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de temporada:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBookings = async (propertyId: string) => {
    if (!propertyId) return;
    try {
      const res = await api.get(`/properties/${propertyId}/season-bookings`);
      setBookings(res.data || []);
    } catch (error) {
      console.error('Erro ao carregar reservas:', error);
    }
  };

  const updateIcalFormState = (property: any) => {
    if (!property) return;
    setIcalForm({
      airbnbIcalUrl: property.airbnbIcalUrl || '',
      bookingIcalUrl: property.bookingIcalUrl || '',
      vrboIcalUrl: property.vrboIcalUrl || ''
    });
  };

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    const prop = properties.find(p => p.id === propertyId);
    updateIcalFormState(prop);
    fetchBookings(propertyId);
  };

  // Botão Sincronizar OTAs
  const handleSyncAllOtas = async () => {
    setIsSyncing(true);
    try {
      if (selectedPropertyId) {
        await api.put(`/properties/${selectedPropertyId}/ical-links`, icalForm);
      }
      await fetchBookings(selectedPropertyId);
      alert('Sincronização de calendários com Airbnb e Booking concluída!');
    } catch (error) {
      alert('Erro ao sincronizar com as OTAs.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Salvar Links iCal do Channel Manager
  const handleSaveIcalLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId) return;
    setIsSavingIcal(true);
    try {
      await api.put(`/properties/${selectedPropertyId}/ical-links`, icalForm);
      alert('Links de integração iCal atualizados e sincronizados com sucesso!');
      fetchBookings(selectedPropertyId);
      // Atualiza lista local de imóveis
      setProperties(prev => prev.map(p => p.id === selectedPropertyId ? { ...p, ...icalForm } : p));
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar links iCal.');
    } finally {
      setIsSavingIcal(false);
    }
  };

  // Criar Nova Reserva Direta
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBooking(true);
    try {
      await api.post('/public/season-bookings', bookingForm);
      alert('Reserva Direta cadastrada com sucesso!');
      setIsNewBookingModalOpen(false);
      setBookingForm({
        propertyId: selectedPropertyId,
        guestName: '',
        guestPhone: '',
        guestEmail: '',
        checkIn: '',
        checkOut: '',
        totalAmount: '',
        notes: ''
      });
      fetchBookings(selectedPropertyId);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao criar reserva.');
    } finally {
      setIsSavingBooking(false);
    }
  };

  const formatCurrency = (val: any) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  // Métricas Calculadas
  const totalBookings = bookings.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCheckIns = bookings.filter(b => b.checkIn && new Date(b.checkIn).toISOString().split('T')[0] === todayStr).length;
  const todayCheckOuts = bookings.filter(b => b.checkOut && new Date(b.checkOut).toISOString().split('T')[0] === todayStr).length;
  
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <Loader2 size={40} className="animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-bold text-sm">A carregar módulo de temporada...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 font-sans">
      
      {/* CABEÇALHO DO MÓDULO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-100 text-amber-800 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={12} /> Gestão de Short-Stay
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-2">Aluguel por Temporada</h1>
          <p className="text-slate-500 text-sm mt-1">
            PMS completo, Channel Manager sincronizado e motor de reservas diretas em um só lugar.
          </p>
        </div>

        {/* SELEÇÃO DO IMÓVEL + BOTÕES DE AÇÃO */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {properties.length > 0 && (
            <select 
              value={selectedPropertyId} 
              onChange={(e) => handlePropertyChange(e.target.value)}
              className="bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 max-w-xs"
            >
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          )}

          <button 
            onClick={handleSyncAllOtas}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl transition-all text-sm disabled:opacity-50"
          >
            <RefreshCw size={16} className={isSyncing ? "animate-spin text-blue-600" : ""} /> 
            {isSyncing ? 'Sincronizando...' : 'Sincronizar OTAs'}
          </button>

          <button 
            onClick={() => setIsNewBookingModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 text-sm"
          >
            <Plus size={18} /> Nova Reserva Direta
          </button>
        </div>
      </div>

      {/* NAVEGAÇÃO POR ABAS */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200">
        {[
          { id: 'pms', label: 'PMS & Calendário', icon: CalendarIcon },
          { id: 'channels', label: 'Channel Manager', icon: Globe },
          { id: 'direct_booking', label: 'Reservas Diretas', icon: Building2 },
          { id: 'operations', label: 'Operacional & Limpeza', icon: Key },
          { id: 'guest_panel', label: 'Portal do Hóspede', icon: Smartphone },
          { id: 'pricing', label: 'Precificação & Yield', icon: DollarSign },
          { id: 'messaging', label: 'Automação de Mensagens', icon: MessageSquare },
          { id: 'app_center', label: 'App Center (+30)', icon: Grid },
          { id: 'academy', label: 'Academy', icon: GraduationCap },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-blue-400' : 'text-slate-400'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* CONTEÚDO DAS ABAS */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[500px]">
        
        {/* ABA 1: PMS & CALENDÁRIO */}
        {activeTab === 'pms' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* CARDS DE MÉTRICAS REAIS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase">Total de Reservas</span>
                <p className="text-2xl font-black text-slate-800 mt-1">{totalBookings}</p>
                <span className="text-[11px] text-blue-600 font-semibold">Cadastradas no Imóvel</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase">Check-ins Hoje</span>
                <p className="text-2xl font-black text-blue-600 mt-1">{todayCheckIns} Hóspedes</p>
                <span className="text-[11px] text-slate-500 font-medium">Entradas Previstas</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase">Check-outs Hoje</span>
                <p className="text-2xl font-black text-amber-600 mt-1">{todayCheckOuts} Hóspedes</p>
                <span className="text-[11px] text-slate-500 font-medium">Saídas Previstas</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase">Valor Diária Médio</span>
                <p className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(selectedProperty?.price || 0)}</p>
                <span className="text-[11px] text-slate-500 font-medium">Tarifa Base</span>
              </div>
            </div>

            {/* TABELA REAL DE RESERVAS DO BANCO */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <CalendarIcon size={16} className="text-blue-600"/> Reservas & Ocupação de Calendário
                </h3>
                <span className="text-xs text-slate-500 font-medium">{bookings.length} registro(s) encontrado(s)</span>
              </div>

              {bookings.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <CalendarIcon size={40} className="mx-auto mb-3 opacity-30"/>
                  <p className="font-bold text-slate-700">Nenhuma reserva registrada para este imóvel.</p>
                  <p className="text-xs text-slate-400 mt-1">Sincronize com o Airbnb/Booking ou crie uma nova reserva direta.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Hóspede</th>
                        <th className="p-3.5">Origem / Canal</th>
                        <th className="p-3.5">Check-in</th>
                        <th className="p-3.5">Check-out</th>
                        <th className="p-3.5">Valor Total</th>
                        <th className="p-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {bookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900">{b.guestName || 'Hóspede Temporada'}</td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                              b.source === 'AIRBNB' ? 'bg-red-100 text-red-700' :
                              b.source === 'BOOKING' ? 'bg-blue-100 text-blue-800' :
                              'bg-emerald-100 text-emerald-800'
                            }`}>
                              {b.source}
                            </span>
                          </td>
                          <td className="p-3.5">{new Date(b.checkIn).toLocaleDateString('pt-BR')}</td>
                          <td className="p-3.5">{new Date(b.checkOut).toLocaleDateString('pt-BR')}</td>
                          <td className="p-3.5 font-bold text-slate-900">{formatCurrency(b.totalAmount)}</td>
                          <td className="p-3.5">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA 2: CHANNEL MANAGER */}
        {activeTab === 'channels' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">Channel Manager & Sincronização iCal</h2>
              <p className="text-sm text-slate-500">Conecte os links iCal do Airbnb e Booking.com para bloqueio automático bidirecional.</p>
            </div>

            {selectedProperty && (
              <form onSubmit={handleSaveIcalLinks} className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                {/* EXPORTAÇÃO */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    1. Seu Link iCal do ZenixImob (Cole no Airbnb / Booking)
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={`${process.env.NEXT_PUBLIC_API_URL || 'https://backend-zeniximob.onrender.com'}/public/properties/${selectedProperty.id}/ical/${selectedProperty.icalExportToken || 'token'}.ics`}
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-600 select-all"
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_API_URL || 'https://backend-zeniximob.onrender.com'}/public/properties/${selectedProperty.id}/ical/${selectedProperty.icalExportToken || 'token'}.ics`);
                        alert('Link copiado!');
                      }}
                      className="bg-slate-900 text-white font-bold text-xs px-5 py-3 rounded-xl whitespace-nowrap hover:bg-slate-800"
                    >
                      Copiar Link
                    </button>
                  </div>
                </div>

                {/* IMPORTAÇÃO */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    2. Cole aqui os links de exportação do Airbnb e Booking.com
                  </label>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Link iCal do Airbnb (.ics)</label>
                    <input 
                      type="text" 
                      placeholder="https://www.airbnb.com.br/calendar/ical/..."
                      value={icalForm.airbnbIcalUrl}
                      onChange={(e) => setIcalForm({ ...icalForm, airbnbIcalUrl: e.target.value })}
                      className="w-full p-3 border border-slate-300 rounded-xl text-xs bg-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Link iCal do Booking.com (.ics)</label>
                    <input 
                      type="text" 
                      placeholder="https://admin.booking.com/hotel/hoteladmin/ical.ics?..."
                      value={icalForm.bookingIcalUrl}
                      onChange={(e) => setIcalForm({ ...icalForm, bookingIcalUrl: e.target.value })}
                      className="w-full p-3 border border-slate-300 rounded-xl text-xs bg-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Link iCal do VRBO / Outros (.ics)</label>
                    <input 
                      type="text" 
                      placeholder="https://www.vrbo.com/ical/..."
                      value={icalForm.vrboIcalUrl}
                      onChange={(e) => setIcalForm({ ...icalForm, vrboIcalUrl: e.target.value })}
                      className="w-full p-3 border border-slate-300 rounded-xl text-xs bg-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSavingIcal}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSavingIcal ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    Salvar e Sincronizar Canais
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ABA 3: RESERVAS DIRETAS */}
        {activeTab === 'direct_booking' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Motor de Reservas Diretas</h2>
                <p className="text-sm text-slate-500">Reservas recebidas sem comissão através do site próprio da imobiliária.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Reservas Diretas</span>
                <p className="text-lg font-bold text-slate-800">{bookings.filter(b => b.source === 'DIRECT').length} confirmadas</p>
              </div>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Pagamento</span>
                <p className="text-sm font-semibold text-emerald-600">PIX Instantâneo e Cartão Ativos</p>
              </div>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Taxas Adicionais</span>
                <p className="text-sm font-semibold text-slate-800">Taxa de Limpeza Incluída</p>
              </div>
            </div>
          </div>
        )}

        {/* ABA 4: OPERACIONAL */}
        {activeTab === 'operations' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">Gestão de Operações & Limpeza</h2>
              <p className="text-sm text-slate-500">Acompanhamento das tarefas de governança pós check-out.</p>
            </div>
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
              <Key size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-700 font-bold">Módulo de Operações de Limpeza Ativo</p>
              <p className="text-xs text-slate-400 mt-1">Os avisos automáticos de check-out avisam a equipe de governança.</p>
            </div>
          </div>
        )}

        {/* ABA 5: PORTAL DO HÓSPEDE */}
        {activeTab === 'guest_panel' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">Portal & WebApp do Hóspede</h2>
              <p className="text-sm text-slate-500">Acesso às instruções de check-in, contrato e senhas.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
                <ShieldCheck size={28} className="text-blue-600" />
                <h3 className="font-bold text-slate-800">Pré Check-in Digital</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Coleta de documentos do hóspede enviada automaticamente via link do WhatsApp.
                </p>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <Key size={28} className="text-amber-600" />
                <h3 className="font-bold text-slate-800">Senha da Fechadura</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Liberada no Portal do Hóspede exatamente no horário do check-in.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ABA 6: PRECIFICAÇÃO */}
        {activeTab === 'pricing' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">Precificação Dinâmica</h2>
              <p className="text-sm text-slate-500">Valores de diária por temporada alta/baixa.</p>
            </div>
            <p className="text-sm text-slate-600">A taxa base atual do imóvel selecionado é de <strong className="text-emerald-600">{formatCurrency(selectedProperty?.price || 0)}</strong>/noite.</p>
          </div>
        )}

        {/* ABA 7: MENSAGENS */}
        {activeTab === 'messaging' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">Gatilhos de Automação WhatsApp</h2>
              <p className="text-sm text-slate-500">Disparos automáticos configurados no sistema.</p>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">1. Envio do Link de Pré-Check-in ao confirmar reserva</span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-bold">Ativo</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">2. Envio das instruções de chegada no dia do Check-in</span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-bold">Ativo</span>
              </div>
            </div>
          </div>
        )}

        {/* ABA 8: APP CENTER */}
        {activeTab === 'app_center' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">App Center & Conectores</h2>
              <p className="text-sm text-slate-500">Integrações ativas no ecossistema.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {['Tuya Smart', 'Intelbras Izy', 'Stripe', 'Mercado Pago', 'PriceLabs', 'Beyond Pricing', 'ZapSign', 'Evolution WhatsApp'].map(app => (
                <div key={app} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-700">
                  {app}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 9: ACADEMY */}
        {activeTab === 'academy' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">Zenix Academy Short-Stay</h2>
              <p className="text-sm text-slate-500">Treinamentos e certificações da equipe.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 border border-slate-200 rounded-2xl bg-white">
                <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded uppercase">Curso</span>
                <h4 className="font-bold text-slate-800 mt-2">Como Tornar seu Anúncio Superhost no Airbnb</h4>
                <p className="text-xs text-slate-500 mt-1">Duração: 45 minutos • Certificado incluso</p>
              </div>
              <div className="p-5 border border-slate-200 rounded-2xl bg-white">
                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded uppercase">Curso</span>
                <h4 className="font-bold text-slate-800 mt-2">Estratégias de Revenue Management para Temporada</h4>
                <p className="text-xs text-slate-500 mt-1">Duração: 60 minutos • Certificado incluso</p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL DE NOVA RESERVA DIRETA */}
      {isNewBookingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <Plus size={18} className="text-blue-600"/> Cadastrar Nova Reserva Direta
              </h2>
              <button onClick={() => setIsNewBookingModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-200/50 rounded-full">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Qual Imóvel?</label>
                <select 
                  required 
                  value={bookingForm.propertyId} 
                  onChange={e => setBookingForm({ ...bookingForm, propertyId: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs bg-white font-medium outline-none focus:border-blue-500"
                >
                  {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nome do Hóspede</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Carlos Silva"
                  value={bookingForm.guestName}
                  onChange={e => setBookingForm({ ...bookingForm, guestName: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Telefone / WhatsApp</label>
                  <input 
                    type="text" 
                    placeholder="(00) 00000-0000"
                    value={bookingForm.guestPhone}
                    onChange={e => setBookingForm({ ...bookingForm, guestPhone: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">E-mail</label>
                  <input 
                    type="email" 
                    placeholder="hospede@email.com"
                    value={bookingForm.guestEmail}
                    onChange={e => setBookingForm({ ...bookingForm, guestEmail: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Data Check-in</label>
                  <input 
                    type="date" 
                    required
                    value={bookingForm.checkIn}
                    onChange={e => setBookingForm({ ...bookingForm, checkIn: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-500 font-medium bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Data Check-out</label>
                  <input 
                    type="date" 
                    required
                    value={bookingForm.checkOut}
                    onChange={e => setBookingForm({ ...bookingForm, checkOut: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-500 font-medium bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Valor Total (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  value={bookingForm.totalAmount}
                  onChange={e => setBookingForm({ ...bookingForm, totalAmount: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Observações / Notas</label>
                <textarea 
                  rows={2}
                  placeholder="Ex: Hóspede solicitou berço adicional..."
                  value={bookingForm.notes}
                  onChange={e => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-500 font-medium resize-none"
                />
              </div>

              <button 
                type="submit" 
                disabled={isSavingBooking}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isSavingBooking ? <Loader2 size={16} className="animate-spin" /> : 'Confirmar e Gravar Reserva'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}