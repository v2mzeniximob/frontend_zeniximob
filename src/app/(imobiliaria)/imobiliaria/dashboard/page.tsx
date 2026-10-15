'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { 
  BarChart3, TrendingUp, DollarSign, Target, Loader2, Building2, 
  AlertTriangle, ArrowRightLeft, Clock, CheckCircle2, Briefcase,
  CalendarDays, Download, FileSpreadsheet, FileText, Filter,
  TrendingDown
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [agencyExpenses, setAgencyExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados dos Filtros de Data (Padrão: Mês Atual)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [resMetrics, resContracts, resExpenses] = await Promise.all([
        api.get('/dashboard/metrics'),
        api.get('/contracts?include=invoices'),
        api.get('/agency-expenses').catch(() => ({ data: [] }))
      ]);

      setMetrics(resMetrics.data);
      setAgencyExpenses(resExpenses.data || []);

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
  // CÁLCULOS DRE & FINANCEIROS (BASEADOS NO PERÍODO)
  // ==========================================
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T23:59:59');
  const now = new Date();

  // 1. Receita Realizada (Taxas Adm / Comissões recebidas no período)
  const paidInPeriod = invoices.filter(inv => {
    if (inv.status !== 'Pago' || !inv.paidDate) return false;
    const paidDate = new Date(inv.paidDate);
    return paidDate >= start && paidDate <= end;
  });
  const realizedRevenue = paidInPeriod.reduce((acc, inv) => acc + (inv.realEstateFee > 0 ? inv.realEstateFee : inv.totalAmount), 0);

  // 2. Despesas Operacionais Pagas no Período (DRE)
  const paidExpensesInPeriod = agencyExpenses.filter(exp => {
    if (exp.status !== 'Pago' || !exp.paidDate) return false;
    const paidDate = new Date(exp.paidDate);
    return paidDate >= start && paidDate <= end;
  });
  const totalExpensesAmount = paidExpensesInPeriod.reduce((acc, exp) => acc + Number(exp.amount || 0), 0);

  // 3. Lucro Líquido Operacional (EBITDA / DRE Simplificado)
  const netOperatingProfit = realizedRevenue - totalExpensesAmount;

  // 4. Inadimplência
  const overdueInPeriod = invoices.filter(inv => {
    const dueDate = new Date(inv.dueDate);
    return dueDate >= start && dueDate <= end && inv.status !== 'Pago' && dueDate < now;
  });
  const totalOverdueAmount = overdueInPeriod.reduce((acc, inv) => acc + inv.totalAmount, 0);

  // 5. Repasses Pendentes (Geral)
  const pendingTransfers = invoices.filter(inv => 
    inv.status === 'Pago' && inv.ownerAmount > 0 && inv.transferStatus !== 'Repassado'
  );
  const totalPendingTransferAmount = pendingTransfers.reduce((acc, inv) => acc + inv.ownerAmount, 0);

  const totalExpectedInPeriod = invoices.filter(inv => {
    const dueDate = new Date(inv.dueDate);
    return dueDate >= start && dueDate <= end;
  }).reduce((acc, inv) => acc + inv.totalAmount, 0);
  const defaultRatePercent = totalExpectedInPeriod > 0 ? ((totalOverdueAmount / totalExpectedInPeriod) * 100).toFixed(1) : 0;

  const vacanciaPercent = metrics.properties.total > 0 ? Math.round((metrics.properties.vacant / metrics.properties.total) * 100) : 0;
  const alugadosPercent = metrics.properties.total > 0 ? Math.round((metrics.properties.rented / metrics.properties.total) * 100) : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  // ==========================================
  // FUNÇÕES DE EXPORTAÇÃO
  // ==========================================
  const handleExportPDF = () => {
    window.print();
  };

  const handleExportExcel = () => {
    let csv = "Categoria;Referência / Descrição;Data;Valor (R$);Status\n";
    
    paidInPeriod.forEach(inv => {
      const valor = inv.realEstateFee > 0 ? inv.realEstateFee : inv.totalAmount;
      csv += `Receita (Taxa Adm);${inv.contract?.property?.title || 'Imóvel'} - ${inv.description || ''};${new Date(inv.paidDate).toLocaleDateString('pt-BR')};${valor};Recebido\n`;
    });

    paidExpensesInPeriod.forEach(exp => {
      csv += `Despesa Operacional (DRE);${exp.description} (${exp.category});${new Date(exp.paidDate).toLocaleDateString('pt-BR')};${exp.amount};Pago\n`;
    });

    overdueInPeriod.forEach(inv => {
      csv += `Inadimplência;${inv.contract?.property?.title || 'Imóvel'} - ${inv.description || ''};${new Date(inv.dueDate).toLocaleDateString('pt-BR')};${inv.totalAmount};Atrasado\n`;
    });

    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Relatorio_DRE_ZenixImob_${startDate}_a_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto font-sans animate-in fade-in duration-500 pb-20 print:p-0 print:m-0">
      
      {/* CABEÇALHO */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <BarChart3 className="text-blue-600 bg-blue-50 p-1.5 rounded-lg" size={36} />
            Business Intelligence & DRE Gerencial
          </h1>
          <p className="text-slate-500 mt-2">Demonstrativo de Resultado do Exercício, receitas, despesas e saúde financeira em tempo real.</p>
        </div>
      </div>

      {/* BARRA DE FILTROS E EXPORTAÇÃO */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-8 flex flex-col xl:flex-row justify-between items-center gap-4 print:hidden">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
            <Filter size={16} className="text-slate-400"/> Filtrar Período:
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-4 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium w-full sm:w-auto" />
            <span className="text-slate-400 font-bold">até</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-4 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium w-full sm:w-auto" />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto">
          <button onClick={handleExportExcel} className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold transition-colors">
            <FileSpreadsheet size={16}/> Exportar Excel (CSV)
          </button>
          <button onClick={handleExportPDF} className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-sm font-bold transition-colors">
            <FileText size={16}/> Salvar em PDF / Imprimir
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* LINHA 1: DRE SIMPLIFICADO & CAIXA          */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        
        {/* RECEITA REALIZADA */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden">
          <p className="text-xs font-bold text-emerald-200 uppercase tracking-wider mb-1 flex items-center gap-1.5"><TrendingUp size={14}/> (+) Receita Realizada</p>
          <p className="text-3xl font-black mb-2">{formatCurrency(realizedRevenue)}</p>
          <p className="text-[11px] text-emerald-100 font-medium bg-emerald-700/50 inline-block px-2.5 py-0.5 rounded-lg">Taxas e comissões recebidas</p>
        </div>

        {/* DESPESAS OPERACIONAIS */}
        <div className="bg-gradient-to-br from-rose-600 to-rose-800 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden">
          <p className="text-xs font-bold text-rose-200 uppercase tracking-wider mb-1 flex items-center gap-1.5"><TrendingDown size={14}/> (-) Despesas Operacionais</p>
          <p className="text-3xl font-black mb-2">{formatCurrency(totalExpensesAmount)}</p>
          <p className="text-[11px] text-rose-100 font-medium bg-rose-700/50 inline-block px-2.5 py-0.5 rounded-lg">Contas a pagar quitadas</p>
        </div>

        {/* LUCRO LÍQUIDO (DRE) */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden">
          <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1 flex items-center gap-1.5"><DollarSign size={14}/> (=) Resultado Líquido (DRE)</p>
          <p className="text-3xl font-black mb-2">{formatCurrency(netOperatingProfit)}</p>
          <p className="text-[11px] text-blue-100 font-medium bg-blue-700/50 inline-block px-2.5 py-0.5 rounded-lg">Receita menos Despesas</p>
        </div>

        {/* INADIMPLÊNCIA */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><AlertTriangle className="text-red-500" size={14}/> Inadimplência</p>
            <p className="text-2xl font-black text-slate-800 mb-2">{formatCurrency(totalOverdueAmount)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${Number(defaultRatePercent) > 10 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{defaultRatePercent}% do previsto</span>
            <span className="text-[11px] text-slate-500 font-medium">{overdueInPeriod.length} faturas atrasadas</span>
          </div>
        </div>

      </div>

      {/* ========================================== */}
      {/* LINHA 2: GRÁFICOS DE OCUPAÇÃO E CRM         */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* OCUPAÇÃO DA CARTEIRA */}
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
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="font-bold text-slate-700">Alugados: {metrics.properties.rented}</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-400"></div><span className="font-bold text-slate-700">Vagos: {metrics.properties.vacant}</span></div>
          </div>
        </div>

        {/* FUNIL DE VENDAS */}
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
                  <div className="w-24 text-right text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">{stage}</div>
                  <div className="flex-1 bg-slate-50 h-7 rounded-full overflow-hidden flex items-center border border-slate-100">
                    <div style={{ width: `${barWidth}%` }} className={`h-full flex items-center justify-end pr-3 text-xs font-bold text-white transition-all duration-1000 shadow-inner ${index === 0 ? 'bg-slate-400' : index === 5 ? 'bg-emerald-500' : 'bg-gradient-to-r from-purple-400 to-purple-600'}`}>
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
      {/* LINHA 3: TABELA RÁPIDA - REPASSES PENDENTES*/}
      {/* ========================================== */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Briefcase size={18} className="text-blue-600"/> Ação Necessária: Repasses Pendentes</h3>
            <p className="text-xs text-slate-500 mt-1">Imóveis onde o inquilino já pagou, mas o proprietário ainda não recebeu.</p>
          </div>
          <Link href="/imobiliaria/financeiro" className="text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors print:hidden">
            Ir para o Financeiro
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white text-slate-500 border-b border-slate-100">
              <tr>
                <th className="p-4 pl-6 font-bold uppercase tracking-wider text-xs">Imóvel</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs">Pagamento Inquilino</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs">Valor a Repassar</th>
                <th className="p-4 pr-6 font-bold uppercase tracking-wider text-xs text-right print:hidden">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pendingTransfers.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400 font-medium">Tudo em dia! Nenhum repasse pendente.</td></tr>
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
                    <td className="p-4 pr-6 text-right print:hidden">
                      <Link href="/imobiliaria/financeiro" className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
                        Efetuar Repasse
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:m-0 { margin: 0 !important; }
        }
      `}} />

    </div>
  );
}