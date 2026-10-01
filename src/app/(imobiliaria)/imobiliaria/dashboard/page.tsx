'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { BarChart3, TrendingUp, Home, DollarSign, Users, Target, Loader2, Building2 } from 'lucide-react';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await api.get('/dashboard/metrics');
      setMetrics(response.data);
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-slate-500"><Loader2 className="animate-spin" size={40}/></div>;
  if (!metrics) return null;

  // Cálculos para as barras de progresso
  const vacanciaPercent = metrics.properties.total > 0 
    ? Math.round((metrics.properties.vacant / metrics.properties.total) * 100) 
    : 0;

  const alugadosPercent = metrics.properties.total > 0 
    ? Math.round((metrics.properties.rented / metrics.properties.total) * 100) 
    : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <BarChart3 className="text-blue-600" size={32} />
          Visão Executiva
        </h1>
        <p className="text-slate-500 mt-1">Acompanhe a saúde financeira e o desempenho da sua imobiliária em tempo real.</p>
      </div>

      {/* CARDS SUPERIORES - DESTAQUES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 text-blue-600 p-4 rounded-xl"><DollarSign size={24}/></div>
          <div>
            <p className="text-sm font-bold text-slate-500">Volume Movimentado</p>
            <p className="text-2xl font-bold text-slate-800">R$ {metrics.contracts.totalVolume.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-100 text-emerald-600 p-4 rounded-xl"><TrendingUp size={24}/></div>
          <div>
            <p className="text-sm font-bold text-slate-500">Receita Prevista (Taxas)</p>
            <p className="text-2xl font-bold text-emerald-600">R$ {metrics.contracts.expectedRevenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-purple-100 text-purple-600 p-4 rounded-xl"><Home size={24}/></div>
          <div>
            <p className="text-sm font-bold text-slate-500">Contratos Ativos</p>
            <p className="text-2xl font-bold text-slate-800">{metrics.contracts.totalActive}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-amber-100 text-amber-600 p-4 rounded-xl"><Users size={24}/></div>
          <div>
            <p className="text-sm font-bold text-slate-500">Leads no CRM</p>
            <p className="text-2xl font-bold text-slate-800">{metrics.leads.total}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* GRÁFICO 1: TAXA DE VACÂNCIA (IMÓVEIS) */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Building2 className="text-blue-600" size={20}/> Ocupação da Carteira (Vacância)
          </h2>
          
          <div className="flex justify-between items-end mb-2">
            <span className="text-3xl font-bold text-slate-800">{metrics.properties.total} <span className="text-sm text-slate-500 font-medium">imóveis ativos</span></span>
          </div>

          {/* Barra de Progresso Visual */}
          <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden flex my-6">
            <div style={{ width: `${alugadosPercent}%` }} className="h-full bg-emerald-500 transition-all duration-1000"></div>
            <div style={{ width: `${vacanciaPercent}%` }} className="h-full bg-amber-400 transition-all duration-1000"></div>
          </div>

          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="font-bold text-slate-700">Alugados: {metrics.properties.rented} ({alugadosPercent}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <span className="font-bold text-slate-700">Vagos: {metrics.properties.vacant} ({vacanciaPercent}%)</span>
            </div>
          </div>
        </div>

        {/* GRÁFICO 2: FUNIL DE VENDAS */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Target className="text-purple-600" size={20}/> Funil de Oportunidades (CRM)
          </h2>
          
          <div className="space-y-4">
            {['Novo', 'Atendimento', 'Visita', 'Proposta', 'Negociação', 'Fechado'].map((stage, index) => {
              const count = metrics.leads.byStage[stage] || 0;
              const maxLeads = metrics.leads.total > 0 ? metrics.leads.total : 1;
              const barWidth = Math.max((count / maxLeads) * 100, 2); // mínimo 2% para ficar visível se for 0
              
              return (
                <div key={stage} className="flex items-center gap-4">
                  <div className="w-24 text-right text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">{stage}</div>
                  <div className="flex-1 bg-slate-100 h-6 rounded-full overflow-hidden flex items-center">
                    <div 
                      style={{ width: `${barWidth}%` }} 
                      className={`h-full flex items-center justify-end pr-2 text-[10px] font-bold text-white transition-all duration-1000
                        ${index === 0 ? 'bg-slate-400' : index === 5 ? 'bg-green-500' : 'bg-purple-500'}`}
                    >
                      {count > 0 && count}
                    </div>
                  </div>
                  <div className="w-8 font-bold text-slate-700 text-sm">{count}</div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  );
}