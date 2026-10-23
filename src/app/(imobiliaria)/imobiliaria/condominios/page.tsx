'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { 
  Building2, Plus, Edit, X, CheckCircle2, Loader2, Home, 
  MapPin, DollarSign, Users, Calendar, AlertTriangle, FileText, Send, Zap, Calculator, Power
} from 'lucide-react';
import { maskCep, maskCnpj, maskPhone } from '@/src/utils/mask';

export default function CondominiosPage() {
  const [condominiums, setCondominiums] = useState<any[]>([]);
  const [ownersList, setOwnersList] = useState<any[]>([]);
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados dos Modais
  const [isCondoModalOpen, setIsCondoModalOpen] = useState(false);
  const [editingCondoId, setEditingCondoId] = useState<string | null>(null);
  const [isSavingCondo, setIsSavingCondo] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const [condoForm, setCondoForm] = useState({
    cnpj: '', name: '', cep: '', address: '', neighborhood: '', city: '', state: '', type: 'Vertical',
    adminName: '', managerName: '', email: '', phone: '', towerOrBlock: '', privateArea: '', 
    hasGarage: false, hasCoveredGarage: false
  });

  // Modal de Detalhes / Gestão Avançada do Condomínio
  const [selectedCondo, setSelectedCondo] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'unidades' | 'rateio' | 'boletos' | 'consumo' | 'acordos' | 'reservas' | 'ocorrencias' | 'assembleias' | 'config'>('unidades');

  // Estados para cadastros internos
  const [unitForm, setUnitForm] = useState({ unitNumber: '', block: '', floor: '', fractionIdeal: '1.0', ownerId: '', clientId: '' });
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', dueDate: '', category: 'Manutenção' });
  const [billGenForm, setBillGenForm] = useState({ referenceMonth: '10/2026', dueDate: '', baseAmount: '' });
  const [consumptionForm, setConsumptionForm] = useState({ unitId: '', utilityType: 'Água', previousValue: '', currentValue: '', unitPrice: '', referenceMonth: '10/2026', photoUrl: '' });
  const [agreementForm, setAgreementForm] = useState({ unitId: '', totalDebt: '', installments: '3' });
  const [settingsForm, setSettingsForm] = useState({ finePercent: 2.0, interestPercent: 1.0, calcType: 'PRO_RATA' });

  // Agendamento com seletor unificado de Proprietários + Inquilinos
  const [reservationForm, setReservationForm] = useState({ areaName: 'Salão de Festas', reservedBy: '', reservationDate: '', notes: '' });
  const [occurrenceForm, setOccurrenceForm] = useState({ title: '', description: '', reportedBy: '', priority: 'Normal' });
  const [assemblyForm, setAssemblyForm] = useState({ title: '', assemblyDate: '', description: '', status: 'Agendada', minutesUrl: '' });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [condoRes, ownersRes, clientsRes] = await Promise.all([
        api.get('/condominiums'),
        api.get('/owners').catch(() => ({ data: [] })),
        api.get('/clients').catch(() => ({ data: [] }))
      ]);

      setCondominiums(condoRes.data || []);
      setOwnersList(ownersRes.data || []);
      setClientsList(clientsRes.data || []);

      if (selectedCondo) {
        const updated = condoRes.data.find((c: any) => c.id === selectedCondo.id);
        if (updated) {
          setSelectedCondo(updated);
          if (updated.settings) {
            setSettingsForm({
              finePercent: updated.settings.finePercent ?? 2.0,
              interestPercent: updated.settings.interestPercent ?? 1.0,
              calcType: updated.settings.calcType ?? 'PRO_RATA'
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCep(e.target.value);
    setCondoForm(prev => ({ ...prev, cep: masked }));

    if (masked.length === 9) {
      setIsFetchingCep(true);
      try {
        const rawCep = masked.replace(/\D/g, '');
        const response = await api.get(`/integrations/cep/${rawCep}`);
        const data = response.data;
        setCondoForm(prev => ({
          ...prev,
          address: data.street || prev.address,
          neighborhood: data.neighborhood || prev.neighborhood,
          city: data.city || prev.city,
          state: data.state || prev.state
        }));
      } catch (error) {
        console.log('CEP não encontrado.');
      } finally {
        setIsFetchingCep(false);
      }
    }
  };

  const handleOpenCondoModal = (condo?: any) => {
    if (condo) {
      setEditingCondoId(condo.id);
      setCondoForm({
        cnpj: condo.cnpj ? maskCnpj(condo.cnpj) : '',
        name: condo.name || '',
        cep: condo.cep ? maskCep(condo.cep) : '',
        address: condo.address || '',
        neighborhood: condo.neighborhood || '',
        city: condo.city || '',
        state: condo.state || '',
        type: condo.type || 'Vertical',
        adminName: condo.adminName || '',
        managerName: condo.managerName || '',
        email: condo.email || '',
        phone: condo.phone ? maskPhone(condo.phone) : '',
        towerOrBlock: condo.towerOrBlock || '',
        privateArea: condo.privateArea || '',
        hasGarage: condo.hasGarage || false,
        hasCoveredGarage: condo.hasCoveredGarage || false
      });
    } else {
      setEditingCondoId(null);
      setCondoForm({
        cnpj: '', name: '', cep: '', address: '', neighborhood: '', city: '', state: '', type: 'Vertical',
        adminName: '', managerName: '', email: '', phone: '', towerOrBlock: '', privateArea: '', hasGarage: false, hasCoveredGarage: false
      });
    }
    setIsCondoModalOpen(true);
  };

  const handleSaveCondominium = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCondo(true);
    try {
      const payload = {
        ...condoForm,
        cnpj: condoForm.cnpj ? condoForm.cnpj.replace(/\D/g, '') : '',
        cep: condoForm.cep ? condoForm.cep.replace(/\D/g, '') : '',
        phone: condoForm.phone ? condoForm.phone.replace(/\D/g, '') : '',
        privateArea: condoForm.privateArea ? Number(condoForm.privateArea) : null
      };

      if (editingCondoId) {
        await api.put(`/condominiums/${editingCondoId}`, payload);
        alert('Condomínio atualizado com sucesso!');
      } else {
        await api.post('/condominiums', payload);
        alert('Condomínio cadastrado com sucesso!');
      }
      setIsCondoModalOpen(false);
      fetchInitialData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar condomínio.');
    } finally {
      setIsSavingCondo(false);
    }
  };

  const handleToggleCondoStatus = async (id: string) => {
    try {
      await api.patch(`/condominiums/${id}/status`);
      fetchInitialData();
    } catch (err) { alert('Erro ao alterar status do condomínio.'); }
  };

  // Funções de Cadastro
  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/condominiums/${selectedCondo.id}/units`, unitForm);
      setUnitForm({ unitNumber: '', block: '', floor: '', fractionIdeal: '1.0', ownerId: '', clientId: '' });
      fetchInitialData();
    } catch (err) { alert('Erro ao cadastrar unidade.'); }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/condominiums/${selectedCondo.id}/expenses`, expenseForm);
      setExpenseForm({ description: '', amount: '', dueDate: '', category: 'Manutenção' });
      fetchInitialData();
    } catch (err) { alert('Erro ao lançar despesa.'); }
  };

  const handleGenerateBills = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/condominiums/${selectedCondo.id}/bills/generate`, billGenForm);
      alert('Boletos mensais gerados com sucesso por rateio!');
      setBillGenForm({ referenceMonth: '10/2026', dueDate: '', baseAmount: '' });
      fetchInitialData();
    } catch (err) { alert('Erro ao gerar cobranças mensais.'); }
  };

  const handlePayBill = async (billId: string) => {
    try {
      await api.patch(`/condominiums/bills/${billId}/pay`, { paymentMethod: 'Baixa Manual' });
      fetchInitialData();
    } catch (err) { alert('Erro ao dar baixa no boleto.'); }
  };

  const handleAddConsumption = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/condominiums/${selectedCondo.id}/consumption`, consumptionForm);
      alert('Leitura registrada com sucesso!');
      setConsumptionForm({ unitId: '', utilityType: 'Água', previousValue: '', currentValue: '', unitPrice: '', referenceMonth: '10/2026', photoUrl: '' });
      fetchInitialData();
    } catch (err) { alert('Erro ao registrar leitura de consumo.'); }
  };

  const handleCreateAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/condominiums/${selectedCondo.id}/agreements`, agreementForm);
      alert('Acordo formalizado e parcelas geradas!');
      setAgreementForm({ unitId: '', totalDebt: '', installments: '3' });
      fetchInitialData();
    } catch (err) { alert('Erro ao registrar acordo.'); }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/condominiums/${selectedCondo.id}/settings`, settingsForm);
      alert('Configurações de juros e multa atualizadas!');
      fetchInitialData();
    } catch (err) { alert('Erro ao salvar configurações.'); }
  };

  const handleAddReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/condominiums/${selectedCondo.id}/reservations`, reservationForm);
      alert('Reserva agendada com sucesso!');
      setReservationForm({ areaName: 'Salão de Festas', reservedBy: '', reservationDate: '', notes: '' });
      fetchInitialData();
    } catch (err) { alert('Erro ao registrar reserva.'); }
  };

  const handleAddOccurrence = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/condominiums/${selectedCondo.id}/occurrences`, occurrenceForm);
      alert('Ocorrência registrada!');
      setOccurrenceForm({ title: '', description: '', reportedBy: '', priority: 'Normal' });
      fetchInitialData();
    } catch (err) { alert('Erro ao registrar ocorrência.'); }
  };

  const handleAddAssembly = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/condominiums/${selectedCondo.id}/assemblies`, assemblyForm);
      alert('Assembleia / Reunião cadastrada e publicada no portal!');
      setAssemblyForm({ title: '', assemblyDate: '', description: '', status: 'Agendada', minutesUrl: '' });
      fetchInitialData();
    } catch (err) { alert('Erro ao cadastrar assembleia.'); }
  };

  if (isLoading) {
    return <div className="p-12 flex justify-center text-slate-500"><Loader2 className="animate-spin" size={32} /></div>;
  }

  // Lista unificada para o campo Solicitante (Proprietários + Inquilinos)
  const allResidents = [
    ...ownersList.map((o: any) => ({ id: o.id, name: `${o.name} (Proprietário)` })),
    ...clientsList.map((c: any) => ({ id: c.id, name: `${c.name} (Inquilino)` }))
  ];

  return (
    <div className="p-8 max-w-[1600px] mx-auto font-sans">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Building2 className="text-indigo-600 bg-indigo-50 p-2 rounded-xl" size={40} />
            Administração Condominial Avançada
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Gestão completa de condomínios, boletos, rateios por fração ideal, leitura por IA e acordos de inadimplência.</p>
        </div>
        <button onClick={() => handleOpenCondoModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm text-sm">
          <Plus size={18} /> Novo Condomínio
        </button>
      </div>

      {/* LISTA DE CONDOMÍNIOS */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-xs tracking-wider">
            <tr>
              <th className="p-4">Condomínio / CNPJ</th>
              <th className="p-4">Endereço</th>
              <th className="p-4">Administração / Síndico</th>
              <th className="p-4 text-center">Unidades</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Gestão Completa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {condominiums.length === 0 ? (
              <tr><td colSpan={6} className="p-12 text-center text-slate-400">Nenhum condomínio cadastrado.</td></tr>
            ) : (
              condominiums.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{c.name}</p>
                    {c.cnpj && <p className="text-xs text-slate-500 mt-0.5">{maskCnpj(c.cnpj)}</p>}
                  </td>
                  <td className="p-4">
                    <p className="text-slate-700">{c.neighborhood}, {c.city} - {c.state}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{c.type}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-slate-700">{c.adminName || 'Admin não informada'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Síndico: {c.managerName || 'Não informado'}</p>
                  </td>
                  <td className="p-4 text-center">
                    <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
                      {c.units?.length || 0} Unidades
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleToggleCondoStatus(c.id)} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border transition-all ${c.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'}`}>
                      <Power size={10}/> {c.isActive ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => {
                        setSelectedCondo(c);
                        if (c.settings) {
                          setSettingsForm({
                            finePercent: c.settings.finePercent ?? 2.0,
                            interestPercent: c.settings.interestPercent ?? 1.0,
                            calcType: c.settings.calcType ?? 'PRO_RATA'
                          });
                        }
                      }} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors flex items-center gap-1.5">
                        <Building2 size={14}/> Abrir Painel
                      </button>
                      <button onClick={() => handleOpenCondoModal(c)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Editar">
                        <Edit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================= */}
      {/* MODAL: PAINEL DE GESTÃO DO CONDOMÍNIO (ABAS COMPLETAS)     */}
      {/* ========================================================= */}
      {selectedCondo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
            
            {/* Header do Painel */}
            <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Painel do Síndico & Administradora</span>
                <h2 className="text-xl font-black mt-0.5">{selectedCondo.name}</h2>
              </div>
              <button onClick={() => setSelectedCondo(null)} className="p-2 text-slate-400 hover:text-white rounded-lg"><X size={22}/></button>
            </div>

            {/* Abas do Condomínio */}
            <div className="flex gap-2 px-8 border-b border-slate-200 bg-slate-50 shrink-0 overflow-x-auto">
              {[
                { id: 'unidades', label: `Unidades (${selectedCondo.units?.length || 0})`, icon: Home },
                { id: 'rateio', label: `Despesas (${selectedCondo.expenses?.length || 0})`, icon: DollarSign },
                { id: 'boletos', label: `Boletos & Rateio (${selectedCondo.bills?.length || 0})`, icon: FileText },
                { id: 'consumo', label: `Consumo IA`, icon: Zap },
                { id: 'acordos', label: `Acordos`, icon: Calculator },
                { id: 'reservas', label: `Áreas Comuns`, icon: Calendar },
                { id: 'ocorrencias', label: `Ocorrências`, icon: AlertTriangle },
                { id: 'assembleias', label: `Reuniões & Atas`, icon: Users },
                { id: 'config', label: `Juros & Multas`, icon: Edit },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-3 font-bold text-xs flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${isActive ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                    <Icon size={15}/> {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Conteúdo das Abas */}
            <div className="p-8 overflow-y-auto flex-1 bg-slate-50/50">
              
              {/* ABA 1: UNIDADES */}
              {activeTab === 'unidades' && (
                <div className="space-y-6">
                  <form onSubmit={handleAddUnit} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Nº Unidade</label>
                      <input required type="text" placeholder="Ex: Apt 101" value={unitForm.unitNumber} onChange={e => setUnitForm({...unitForm, unitNumber: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Bloco / Torre</label>
                      <input type="text" placeholder="Ex: Bloco A" value={unitForm.block} onChange={e => setUnitForm({...unitForm, block: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Fração Ideal</label>
                      <input type="number" step="0.01" value={unitForm.fractionIdeal} onChange={e => setUnitForm({...unitForm, fractionIdeal: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Proprietário</label>
                      <select value={unitForm.ownerId} onChange={e => setUnitForm({...unitForm, ownerId: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white">
                        <option value="">Selecione proprietário</option>
                        {ownersList.map((o: any) => (
                          <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Inquilino</label>
                      <select value={unitForm.clientId} onChange={e => setUnitForm({...unitForm, clientId: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white">
                        <option value="">Selecione inquilino</option>
                        {clientsList.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2">
                        <Plus size={16}/> Adicionar
                      </button>
                    </div>
                  </form>

                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="p-3.5">Unidade</th>
                          <th className="p-3.5">Fração Ideal</th>
                          <th className="p-3.5">Proprietário</th>
                          <th className="p-3.5">Inquilino</th>
                          <th className="p-3.5 text-center">Status</th>
                          <th className="p-3.5 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {(selectedCondo.units || []).length === 0 ? (
                          <tr><td colSpan={6} className="p-8 text-center text-slate-400">Nenhuma unidade cadastrada.</td></tr>
                        ) : (
                          (selectedCondo.units || []).map((u: any) => (
                            <tr key={u.id}>
                              <td className="p-3.5 font-bold text-slate-900">{u.unitNumber} {u.block ? `(${u.block})` : ''}</td>
                              <td className="p-3.5">{u.fractionIdeal}</td>
                              <td className="p-3.5">{u.owner?.name || u.ownerName || 'Não vinculado'}</td>
                              <td className="p-3.5">{u.client?.name || u.tenantName || 'Nenhum'}</td>
                              <td className="p-3.5 text-center">
                                <button onClick={() => alert('Alterar status da unidade')} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border bg-emerald-50 text-emerald-700 border-emerald-200">
                                  Ativo
                                </button>
                              </td>
                              <td className="p-3.5 text-right flex items-center justify-end gap-2">
                                <button onClick={() => alert('Editar unidade')} className="text-indigo-600 font-bold hover:underline">Editar</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ABA 2: DESPESAS */}
              {activeTab === 'rateio' && (
                <div className="space-y-6">
                  <form onSubmit={handleAddExpense} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Descrição</label>
                      <input required type="text" placeholder="Ex: Manutenção de Elevadores" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Valor (R$)</label>
                      <input required type="number" step="0.01" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Vencimento</label>
                      <input required type="date" value={expenseForm.dueDate} onChange={e => setExpenseForm({...expenseForm, dueDate: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                    </div>
                    <div>
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2">
                        <Plus size={16}/> Lançar Despesa
                      </button>
                    </div>
                  </form>

                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="p-3.5">Descrição</th>
                          <th className="p-3.5">Categoria</th>
                          <th className="p-3.5">Vencimento</th>
                          <th className="p-3.5">Valor</th>
                          <th className="p-3.5 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {(selectedCondo.expenses || []).length === 0 ? (
                          <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhuma despesa lançada.</td></tr>
                        ) : (
                          (selectedCondo.expenses || []).map((exp: any) => (
                            <tr key={exp.id}>
                              <td className="p-3.5 font-bold text-slate-900">{exp.description}</td>
                              <td className="p-3.5"><span className="bg-slate-100 px-2 py-0.5 rounded font-bold">{exp.category}</span></td>
                              <td className="p-3.5">{new Date(exp.dueDate).toLocaleDateString('pt-BR')}</td>
                              <td className="p-3.5 font-bold text-indigo-600">R$ {Number(exp.amount).toFixed(2)}</td>
                              <td className="p-3.5 text-right flex items-center justify-end gap-2">
                                <button onClick={() => alert('Editar despesa')} className="text-indigo-600 font-bold hover:underline">Editar</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ABA 3: BOLETOS & RATEIO AUTOMÁTICO */}
              {activeTab === 'boletos' && (
                <div className="space-y-6">
                  <form onSubmit={handleGenerateBills} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Mês de Referência</label>
                      <input required type="text" placeholder="Ex: 10/2026" value={billGenForm.referenceMonth} onChange={e => setBillGenForm({...billGenForm, referenceMonth: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Vencimento dos Boletos</label>
                      <input required type="date" value={billGenForm.dueDate} onChange={e => setBillGenForm({...billGenForm, dueDate: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Valor Total a Ratear (R$)</label>
                      <input required type="number" step="0.01" placeholder="Ex: 15000.00" value={billGenForm.baseAmount} onChange={e => setBillGenForm({...billGenForm, baseAmount: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                    </div>
                    <div>
                      <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2">
                        <DollarSign size={16}/> Gerar Boletos por Rateio
                      </button>
                    </div>
                  </form>

                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="p-3.5">Unidade</th>
                          <th className="p-3.5">Referência</th>
                          <th className="p-3.5">Vencimento</th>
                          <th className="p-3.5">Valor</th>
                          <th className="p-3.5 text-center">Status</th>
                          <th className="p-3.5 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {(selectedCondo.bills || []).length === 0 ? (
                          <tr><td colSpan={6} className="p-8 text-center text-slate-400">Nenhum boleto gerado.</td></tr>
                        ) : (
                          (selectedCondo.bills || []).map((bill: any) => (
                            <tr key={bill.id}>
                              <td className="p-3.5 font-bold text-slate-900">{bill.unit?.unitNumber}</td>
                              <td className="p-3.5">{bill.referenceMonth}</td>
                              <td className="p-3.5">{new Date(bill.dueDate).toLocaleDateString('pt-BR')}</td>
                              <td className="p-3.5 font-bold text-indigo-600">R$ {Number(bill.amount).toFixed(2)}</td>
                              <td className="p-3.5 text-center">
                                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${bill.status === 'Pago' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                  {bill.status}
                                </span>
                              </td>
                              <td className="p-3.5 text-right flex items-center justify-end gap-2">
                                {bill.status !== 'Pago' && (
                                  <button onClick={() => handlePayBill(bill.id)} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg font-bold text-xs">
                                    Baixa Manual
                                  </button>
                                )}
                                <button onClick={() => alert('Editar boleto')} className="text-indigo-600 font-bold hover:underline">Editar</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ABA 4: CONSUMO COM IA */}
              {activeTab === 'consumo' && (
                <div className="space-y-6">
                  <form onSubmit={handleAddConsumption} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Unidade</label>
                      <select required value={consumptionForm.unitId} onChange={e => setConsumptionForm({...consumptionForm, unitId: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white">
                        <option value="">Selecione a unidade</option>
                        {(selectedCondo.units || []).map((u: any) => (
                          <option key={u.id} value={u.id}>{u.unitNumber}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Tipo</label>
                      <select value={consumptionForm.utilityType} onChange={e => setConsumptionForm({...consumptionForm, utilityType: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white">
                        <option value="Água">Água</option>
                        <option value="Gás">Gás</option>
                        <option value="Energia">Energia</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Leitura Anterior</label>
                      <input required type="number" step="0.01" value={consumptionForm.previousValue} onChange={e => setConsumptionForm({...consumptionForm, previousValue: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Leitura Atual</label>
                      <input required type="number" step="0.01" value={consumptionForm.currentValue} onChange={e => setConsumptionForm({...consumptionForm, currentValue: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Valor por m³ / kWh (R$)</label>
                      <input required type="number" step="0.01" value={consumptionForm.unitPrice} onChange={e => setConsumptionForm({...consumptionForm, unitPrice: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Foto do Hidrômetro (Leitura por IA)</label>
                      <input type="text" placeholder="URL da foto ou anexo" value={consumptionForm.photoUrl} onChange={e => setConsumptionForm({...consumptionForm, photoUrl: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                    </div>
                    <div>
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2">
                        <Zap size={16}/> Registrar Consumo
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ABA 5: ACORDOS */}
              {activeTab === 'acordos' && (
                <div className="space-y-6">
                  <form onSubmit={handleCreateAgreement} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Unidade Inadimplente</label>
                      <select required value={agreementForm.unitId} onChange={e => setAgreementForm({...agreementForm, unitId: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white">
                        <option value="">Selecione a unidade</option>
                        {(selectedCondo.units || []).map((u: any) => (
                          <option key={u.id} value={u.id}>{u.unitNumber}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Valor Total da Dívida (R$)</label>
                      <input required type="number" step="0.01" value={agreementForm.totalDebt} onChange={e => setAgreementForm({...agreementForm, totalDebt: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Nº de Parcelas</label>
                      <input required type="number" min="1" max="24" value={agreementForm.installments} onChange={e => setAgreementForm({...agreementForm, installments: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                    </div>
                    <div>
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2">
                        <Calculator size={16}/> Formalizar Acordo
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ABA 6: RESERVAS (COM SELETOR DE PROPRIETÁRIOS E INQUILINOS) */}
              {activeTab === 'reservas' && (
                <div className="space-y-6">
                  <form onSubmit={handleAddReservation} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Área Comum</label>
                      <select value={reservationForm.areaName} onChange={e => setReservationForm({...reservationForm, areaName: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white font-medium">
                        <option value="Salão de Festas">Salão de Festas</option>
                        <option value="Churrasqueira">Churrasqueira</option>
                        <option value="Quadra Esportiva">Quadra Esportiva</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Solicitante (Prop./Inq.)</label>
                      <select required value={reservationForm.reservedBy} onChange={e => setReservationForm({...reservationForm, reservedBy: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white font-medium">
                        <option value="">Selecione o solicitante</option>
                        {allResidents.map((res: any) => (
                          <option key={res.id} value={res.name}>{res.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Data & Hora</label>
                      <input required type="datetime-local" value={reservationForm.reservationDate} onChange={e => setReservationForm({...reservationForm, reservationDate: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Observações</label>
                      <input type="text" value={reservationForm.notes} onChange={e => setReservationForm({...reservationForm, notes: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                    </div>
                    <div>
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2">
                        <Plus size={16}/> Agendar
                      </button>
                    </div>
                  </form>

                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="p-3.5">Área</th>
                          <th className="p-3.5">Solicitante</th>
                          <th className="p-3.5">Data</th>
                          <th className="p-3.5 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {(selectedCondo.reservations || []).length === 0 ? (
                          <tr><td colSpan={4} className="p-8 text-center text-slate-400">Nenhuma reserva registrada.</td></tr>
                        ) : (
                          (selectedCondo.reservations || []).map((resv: any) => (
                            <tr key={resv.id}>
                              <td className="p-3.5 font-bold text-slate-900">{resv.areaName}</td>
                              <td className="p-3.5">{resv.reservedBy}</td>
                              <td className="p-3.5">{new Date(resv.reservationDate).toLocaleString('pt-BR')}</td>
                              <td className="p-3.5 text-right">
                                <button onClick={() => alert('Editar reserva')} className="text-indigo-600 font-bold hover:underline">Editar</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ABA 7: OCORRÊNCIAS */}
              {activeTab === 'ocorrencias' && (
                <div className="space-y-6">
                  <form onSubmit={handleAddOccurrence} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Assunto</label>
                      <input required type="text" value={occurrenceForm.title} onChange={e => setOccurrenceForm({...occurrenceForm, title: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Descrição</label>
                      <input required type="text" value={occurrenceForm.description} onChange={e => setOccurrenceForm({...occurrenceForm, description: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Reportado Por</label>
                      <select required value={occurrenceForm.reportedBy} onChange={e => setOccurrenceForm({...occurrenceForm, reportedBy: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white font-medium">
                        <option value="">Selecione o morador</option>
                        {allResidents.map((res: any) => (
                          <option key={res.id} value={res.name}>{res.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2">
                        <Plus size={16}/> Registrar
                      </button>
                    </div>
                  </form>

                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="p-3.5">Assunto</th>
                          <th className="p-3.5">Descrição</th>
                          <th className="p-3.5">Reportado Por</th>
                          <th className="p-3.5 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {(selectedCondo.occurrences || []).length === 0 ? (
                          <tr><td colSpan={4} className="p-8 text-center text-slate-400">Nenhuma ocorrência registrada.</td></tr>
                        ) : (
                          (selectedCondo.occurrences || []).map((occ: any) => (
                            <tr key={occ.id}>
                              <td className="p-3.5 font-bold text-slate-900">{occ.title}</td>
                              <td className="p-3.5 text-slate-600">{occ.description}</td>
                              <td className="p-3.5">{occ.reportedBy}</td>
                              <td className="p-3.5 text-right">
                                <button onClick={() => alert('Editar ocorrência')} className="text-indigo-600 font-bold hover:underline">Editar</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ABA 8: REUNIÕES & ATAS */}
              {activeTab === 'assembleias' && (
                <div className="space-y-6">
                  <form onSubmit={handleAddAssembly} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Título / Reunião</label>
                      <input required type="text" placeholder="Ex: Assembleia Geral 2026" value={assemblyForm.title} onChange={e => setAssemblyForm({...assemblyForm, title: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Data & Hora</label>
                      <input required type="datetime-local" value={assemblyForm.assemblyDate} onChange={e => setAssemblyForm({...assemblyForm, assemblyDate: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Status</label>
                      <select value={assemblyForm.status} onChange={e => setAssemblyForm({...assemblyForm, status: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white font-medium">
                        <option value="Agendada">Agendada</option>
                        <option value="Em Andamento">Em Andamento</option>
                        <option value="Encerrada">Encerrada (Com Ata)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Link da Ata (PDF/Drive)</label>
                      <input type="text" placeholder="https://... (Ata da reunião)" value={assemblyForm.minutesUrl} onChange={e => setAssemblyForm({...assemblyForm, minutesUrl: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                    </div>
                    <div>
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2">
                        <Plus size={16}/> Publicar Reunião
                      </button>
                    </div>
                    <div className="sm:col-span-5">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Descrição / Pauta</label>
                      <input required type="text" placeholder="Pautas a serem discutidas na assembleia..." value={assemblyForm.description} onChange={e => setAssemblyForm({...assemblyForm, description: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                    </div>
                  </form>

                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="p-3.5">Reunião / Assembleia</th>
                          <th className="p-3.5">Data</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5 text-right">Ata</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {(selectedCondo.assemblies || []).length === 0 ? (
                          <tr><td colSpan={4} className="p-8 text-center text-slate-400">Nenhuma reunião ou assembleia cadastrada.</td></tr>
                        ) : (
                          (selectedCondo.assemblies || []).map((asm: any) => (
                            <tr key={asm.id}>
                              <td className="p-3.5 font-bold text-slate-900">
                                {asm.title}
                                <p className="text-[11px] text-slate-500 font-normal mt-0.5">{asm.description}</p>
                              </td>
                              <td className="p-3.5">{new Date(asm.assemblyDate).toLocaleString('pt-BR')}</td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${asm.status === 'Encerrada' ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-800'}`}>
                                  {asm.status}
                                </span>
                              </td>
                              <td className="p-3.5 text-right flex items-center justify-end gap-3">
                                {asm.minutesUrl ? (
                                  <a href={asm.minutesUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-bold">
                                    Ver Ata
                                  </a>
                                ) : (
                                  <span className="text-slate-400">Pendente</span>
                                )}
                                <button onClick={() => alert('Editar assembleia')} className="text-indigo-600 font-bold hover:underline">Editar</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ABA 9: CONFIGURAÇÕES DE JUROS E MULTAS */}
              {activeTab === 'config' && (
                <div className="space-y-6 max-w-xl">
                  <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm">Parâmetros de Inadimplência & Cobrança</h3>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Multa por Atraso (%)</label>
                      <input type="number" step="0.01" value={settingsForm.finePercent} onChange={e => setSettingsForm({...settingsForm, finePercent: Number(e.target.value)})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Juros ao Mês (%)</label>
                      <input type="number" step="0.01" value={settingsForm.interestPercent} onChange={e => setSettingsForm({...settingsForm, interestPercent: Number(e.target.value)})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Tipo de Cálculo</label>
                      <select value={settingsForm.calcType} onChange={e => setSettingsForm({...settingsForm, calcType: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white">
                        <option value="PRO_RATA">Pro-rata (Proporcional Diário)</option>
                        <option value="FIXO">Fixo Mensal</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2">
                      <CheckCircle2 size={16}/> Salvar Configurações
                    </button>
                  </form>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CADASTRO / EDIÇÃO DE CONDOMÍNIO                     */}
      {/* ========================================================= */}
      {isCondoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-indigo-50 px-6 py-4 flex justify-between items-center border-b border-indigo-100 shrink-0">
              <h3 className="font-bold text-indigo-900 flex items-center gap-2 text-lg"><Building2 size={22}/> {editingCondoId ? 'Editar Condomínio' : 'Novo Condomínio'}</h3>
              <button onClick={() => setIsCondoModalOpen(false)} className="text-indigo-400 hover:text-indigo-700 bg-white p-1 rounded-md"><X size={20}/></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="condo-form" onSubmit={handleSaveCondominium} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">CNPJ</label>
                    <input type="text" value={condoForm.cnpj} onChange={e => setCondoForm({...condoForm, cnpj: maskCnpj(e.target.value)})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" placeholder="00.000.000/0000-00"/>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nome do Condomínio *</label>
                    <input required type="text" value={condoForm.name} onChange={e => setCondoForm({...condoForm, name: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" placeholder="Ex: Condomínio Edifício Bella Vista"/>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 mb-1">CEP {isFetchingCep && <Loader2 size={12} className="animate-spin text-indigo-500" />}</label>
                    <input type="text" value={condoForm.cep} onChange={handleCepChange} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" placeholder="00000-000" />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Endereço Completo</label>
                    <input type="text" value={condoForm.address} onChange={e => setCondoForm({...condoForm, address: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Bairro</label>
                    <input type="text" value={condoForm.neighborhood} onChange={e => setCondoForm({...condoForm, neighborhood: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Cidade</label>
                    <input type="text" value={condoForm.city} onChange={e => setCondoForm({...condoForm, city: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Estado (UF)</label>
                    <input type="text" maxLength={2} value={condoForm.state} onChange={e => setCondoForm({...condoForm, state: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs uppercase" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Tipo</label>
                    <select value={condoForm.type} onChange={e => setCondoForm({...condoForm, type: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white">
                      <option value="Vertical">Vertical (Prédios)</option>
                      <option value="Horizontal">Horizontal (Casas)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Administradora</label>
                    <input type="text" value={condoForm.adminName} onChange={e => setCondoForm({...condoForm, adminName: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Síndico Atual</label>
                    <input type="text" value={condoForm.managerName} onChange={e => setCondoForm({...condoForm, managerName: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl text-xs" />
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setIsCondoModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl text-xs transition-colors">Cancelar</button>
              <button form="condo-form" type="submit" disabled={isSavingCondo} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm text-xs disabled:opacity-70">
                {isSavingCondo ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} 
                {editingCondoId ? 'Salvar Alterações' : 'Cadastrar Condomínio'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}