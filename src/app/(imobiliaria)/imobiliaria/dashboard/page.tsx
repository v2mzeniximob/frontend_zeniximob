'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { 
  BarChart3, TrendingUp, Home, DollarSign, Users, Target, Loader2, Building2, 
  AlertTriangle, ArrowRightLeft, Clock, CheckCircle2, Briefcase
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [resMetrics, resContracts] = await Promise.all([
        api.get('/dashboard/metrics'),
        api.get('/contracts?include=invoices')
      ]);

      setMetrics(resMetrics.data);

      // Processamento Financeiro para o Dashboard
      // Extrair todas as faturas de todos os contratos para análise
      const allInvoices = resContracts.data.flatMap((c: any) => 
        (c.invoices || []).map((inv: any) => ({ ...inv, contract: c }))
      );
      setInvoices(allInvoices);

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-slate-500"><Loader2 className="animate-spin" size={40}/></div>;
  if (!metrics) return null;

  // ==========================================
  // CÁLCULOS FINANCEIROS AVANÇADOS (B.I.)
  // ==========================================
  const now = new Date();
  
  // 1. INADIMPLÊNCIA (Faturas vencidas e não pagas)
  const overdueInvoices = invoices.filter(inv => 
    new Date(inv.dueDate) < now && inv.status !== 'Pago'
  );
  const totalOverdueAmount = overdueInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);

  // 2. RECEITA LÍQUIDA REALIZADA (Faturas pagas no mês atual)
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const paidThisMonth = invoices.filter(inv => {
    if (inv.status !== 'Pago' || !inv.paidDate) return false;
    const paidDate = new Date(inv.paidDate);
    return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
  });

  // A Receita da imobiliária é apenas a "Taxa de Admin" + "Aluguéis da própria imobiliária"
  const realizedRevenue = paidThisMonth.reduce((acc, inv) => acc + (inv.realEstateFee > 0 ? inv.realEstateFee : inv.totalAmount), 0);

  // 3. REPASSES PENDENTES (Faturas pagas pelo inquilino, mas dinheiro retido na imobiliária)
  const pendingTransfers = invoices.filter(inv => 
    inv.status === 'Pago' && 
    inv.ownerAmount > 0 && 
    inv.transferStatus !== 'Repassado'
  );
  const totalPendingTransferAmount = pendingTransfers.reduce((acc, inv) => acc + inv.ownerAmount, 0);


  // Cálculos visuais (Barras)
  const vacanciaPercent = metrics.properties.total > 0 ? Math.round((metrics.properties.vacant / metrics.properties.total) * 100) : 0;
  const alugadosPercent = metrics.properties.total > 0 ? Math.round((metrics.properties.rented / metrics.properties.total) * 100) : 0;
  
  // Saúde Financeira (Inadimplência vs Total Esperado)
  const totalExpectedThisMonth = invoices.filter(inv => new Date(inv.dueDate).getMonth() === currentMonth).reduce((acc, inv) => acc + inv.totalAmount, 0);
  const defaultRatePercent = totalExpectedThisMonth > 0 ? ((totalOverdueAmount / totalExpectedThisMonth) * 100).toFixed(1) : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto font-sans animate-in fade-in duration-500 pb-20">
      
      {/* CABEÇALHO */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <BarChart3 className="text-blue-600 bg-blue-50 p-1.5 rounded-lg" size={36} />
            Business Intelligence
          </h1>
          <p className="text-slate-500 mt-2">Visão estratégica e saúde financeira da imobiliária em tempo real.</p>
        </div>
        <div className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <Clock className="text-slate-400" size={18}/>
          <span className="text-sm font-bold text-slate-600">
            {now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase())}
          </span>
        </div>
      </div>

      {/* ========================================== */}
      {/* LINHA 1: DESTAQUES FINANCEIROS CRÍTICOS */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* RECEITA REALIZADA (CAIXA DA IMOBILIÁRIA) */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden">
          <TrendingUp size={100} className="absolute -right-6 -bottom-6 text-emerald-400/20" />
          <div className="relative z-10">
            <p className="text-sm font-bold text-emerald-200 uppercase tracking-wider mb-1 flex items-center gap-2"><DollarSign size={16}/> Receita Realizada (Mês)</p>
            <p className="text-4xl font-black mb-2">{formatCurrency(realizedRevenue)}</p>
            <p className="text-xs text-emerald-100 font-medium bg-emerald-700/50 inline-block px-3 py-1 rounded-lg">
              Comissões e Taxas Adm recebidas
            </p>
          </div>
        </div>

        {/* ALERTA DE INADIMPLÊNCIA */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle size={80} className="text-red-500"/>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2"><AlertTriangle className="text-red-500" size={16}/> Inadimplência Total</p>
            <p className="text-3xl font-black text-slate-800 mb-2">{formatCurrency(totalOverdueAmount)}</p>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${Number(defaultRatePercent) > 10 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                {defaultRatePercent}% do Previsto
              </span>
              <span className="text-xs text-slate-500 font-medium">{overdueInvoices.length} faturas atrasadas</span>
            </div>
          </div>
        </div>

        {/* ALERTA DE REPASSES PENDENTES (DINHEIRO DE TERCEIROS) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <ArrowRightLeft size={80} className="text-blue-500"/>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2"><ArrowRightLeft className="text-blue-600" size={16}/> Repasses Pendentes</p>
            <p className="text-3xl font-black text-slate-800 mb-2">{formatCurrency(totalPendingTransferAmount)}</p>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700">
                Capital Retido
              </span>
              <span className="text-xs text-slate-500 font-medium">{pendingTransfers.length} proprietários aguardam</span>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================== */}
      {/* LINHA 2: GRÁFICOS DE OPERAÇÃO (IMÓVEIS E CRM) */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* GRÁFICO 1: TAXA DE VACÂNCIA (IMÓVEIS) */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Building2 className="text-blue-600" size={20}/> Ocupação da Carteira (Vacância)
          </h2>
          
          <div className="flex justify-between items-end mb-2">
            <span className="text-3xl font-bold text-slate-800">{metrics.properties.total} <span className="text-sm text-slate-500 font-medium">imóveis ativos</span></span>
          </div>

          <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden flex my-6 border border-slate-200 shadow-inner">
            <div style={{ width: `${alugadosPercent}%` }} className="h-full bg-emerald-500 transition-all duration-1000 relative">
              {alugadosPercent > 10 && <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">{alugadosPercent}%</span>}
            </div>
            <div style={{ width: `${vacanciaPercent}%` }} className="h-full bg-amber-400 transition-all duration-1000 relative">
              {vacanciaPercent > 10 && <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-amber-900">{vacanciaPercent}%</span>}
            </div>
          </div>

          <div className="flex justify-between text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="font-bold text-slate-700">Alugados: {metrics.properties.rented}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <span className="font-bold text-slate-700">Vagos: {metrics.properties.vacant}</span>
            </div>
          </div>
        </div>

        {/* GRÁFICO 2: FUNIL DE VENDAS */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Target className="text-purple-600" size={20}/> Taxa de Conversão (CRM)
          </h2>
          
          <div className="space-y-4">
            {['Novo', 'Atendimento', 'Visita', 'Proposta', 'Negociação', 'Fechado'].map((stage, index) => {
              const count = metrics.leads.byStage[stage] || 0;
              const maxLeads = metrics.leads.total > 0 ? metrics.leads.total : 1;
              const barWidth = Math.max((count / maxLeads) * 100, 2); 
              
              return (
                <div key={stage} className="flex items-center gap-4 group">
                  <div className="w-24 text-right text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 group-hover:text-purple-700 transition-colors">{stage}</div>
                  <div className="flex-1 bg-slate-50 h-7 rounded-full overflow-hidden flex items-center border border-slate-100">
                    <div 
                      style={{ width: `${barWidth}%` }} 
                      className={`h-full flex items-center justify-end pr-3 text-xs font-bold text-white transition-all duration-1000 shadow-inner
                        ${index === 0 ? 'bg-slate-400' : index === 5 ? 'bg-emerald-500' : 'bg-gradient-to-r from-purple-400 to-purple-600'}`}
                    >
                      {count > 0 && count}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* ========================================== */}
      {/* LINHA 3: TABELA RÁPIDA - REPASSES PENDENTES */}
      {/* ========================================== */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Briefcase size={18} className="text-blue-600"/> Ação Necessária: Repasses Pendentes</h3>
            <p className="text-xs text-slate-500 mt-1">Imóveis onde o inquilino já pagou, mas o proprietário ainda não recebeu.</p>
          </div>
          <Link href="/imobiliaria/financeiro" className="text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors">
            Ir para o Financeiro
          </Link>
        </div>
        
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white text-slate-500 border-b border-slate-100">
              <tr>
                <th className="p-4 pl-6 font-bold uppercase tracking-wider text-xs">Imóvel</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs">Pagamento Inquilino</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs">Valor a Repassar</th>
                <th className="p-4 pr-6 font-bold uppercase tracking-wider text-xs text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pendingTransfers.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400 font-medium flex items-center justify-center gap-2"><CheckCircle2 size={18} className="text-emerald-500"/> Tudo em dia! Nenhum repasse pendente.</td></tr>
              ) : (
                pendingTransfers.slice(0, 5).map((inv) => (
                  <tr key={inv.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      <p className="font-bold text-slate-800">{inv.contract?.property?.title || 'Imóvel'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{inv.description}</p>
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 w-fit">
                        <CheckCircle2 size={14}/> Pago em {new Date(inv.paidDate).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-black text-slate-800 text-base">{formatCurrency(inv.ownerAmount)}</p>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <Link href="/imobiliaria/financeiro" className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
                        Efetuar Repasse
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {pendingTransfers.length > 5 && (
            <div className="p-4 text-center border-t border-slate-100 bg-slate-50">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">E mais {pendingTransfers.length - 5} repasses aguardando...</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}