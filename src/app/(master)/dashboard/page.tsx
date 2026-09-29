'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { 
  Building2, 
  Users, 
  CreditCard, 
  TrendingUp, 
  Loader2, 
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { maskCnpj } from '@/src/utils/mask';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRealEstates: 0,
    activeRealEstates: 0,
    totalFranchisees: 0,
    activePlans: 0,
    estimatedMRR: 0,
    recentRealEstates: [] as any[]
  });

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Busca os dados de todas as rotas simultaneamente para calcular as métricas
        const [reRes, franRes, plansRes] = await Promise.all([
          api.get('/real-estates'),
          api.get('/franchisees'),
          api.get('/plans')
        ]);

        const realEstates = reRes.data;
        const franchisees = franRes.data;
        const plans = plansRes.data;

        // Cálculos de B.I.
        const activeRE = realEstates.filter((re: any) => re.isActive);
        
        // Calcula a Receita Recorrente (MRR) somando o preço do plano de cada imobiliária ativa
        const mrr = activeRE.reduce((acc: number, re: any) => {
          const plan = plans.find((p: any) => p.id === re.planId);
          return acc + (plan ? Number(plan.price) : 0);
        }, 0);

        // Pega as 5 imobiliárias mais recentes (assumindo que as últimas cadastradas vêm no fim ou início do array)
        // Se a API não ordenar, ordenamos localmente (simulação rápida)
        const recent = [...realEstates].reverse().slice(0, 5);

        setMetrics({
          totalRealEstates: realEstates.length,
          activeRealEstates: activeRE.length,
          totalFranchisees: franchisees.length,
          activePlans: plans.filter((p: any) => p.isActive).length,
          estimatedMRR: mrr,
          recentRealEstates: recent
        });

      } catch (error) {
        console.error('Erro ao carregar métricas:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Loader2 size={32} className="animate-spin mb-4 text-blue-600" />
        <p>A compilar métricas do sistema...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard de B.I.</h1>
        <p className="text-slate-500 text-sm">Visão geral do ecossistema ZenixImob em tempo real.</p>
      </div>
      
      {/* Cards de Métricas (Top Level) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card MRR */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-blue-100 transition-colors">
          <div className="absolute -right-6 -top-6 bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingUp size={24} className="text-blue-500 absolute bottom-6 left-6" />
          </div>
          <h3 className="text-slate-500 text-sm font-medium mb-1">Receita Estimada (MRR)</h3>
          <p className="text-3xl font-bold text-slate-800">{formatCurrency(metrics.estimatedMRR)}</p>
          <div className="mt-4 flex items-center text-xs text-green-600 font-medium">
            <ArrowUpRight size={14} className="mr-1" />
            Lojas ativas a rentabilizar
          </div>
        </div>

        {/* Card Imobiliárias */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-blue-100 transition-colors">
          <div className="absolute -right-6 -top-6 bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Building2 size={24} className="text-emerald-500 absolute bottom-6 left-6" />
          </div>
          <h3 className="text-slate-500 text-sm font-medium mb-1">Imobiliárias (Lojas)</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-slate-800">{metrics.totalRealEstates}</p>
            <span className="text-sm text-slate-400 font-medium">total</span>
          </div>
          <div className="mt-4 flex items-center text-xs text-emerald-600 font-medium">
            <Activity size={14} className="mr-1" />
            {metrics.activeRealEstates} unidades ativas
          </div>
        </div>

        {/* Card Franqueados */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-blue-100 transition-colors">
          <div className="absolute -right-6 -top-6 bg-purple-50 w-24 h-24 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users size={24} className="text-purple-500 absolute bottom-6 left-6" />
          </div>
          <h3 className="text-slate-500 text-sm font-medium mb-1">Rede de Franquias</h3>
          <p className="text-3xl font-bold text-slate-800">{metrics.totalFranchisees}</p>
          <div className="mt-4 flex items-center text-xs text-purple-600 font-medium">
            <Users size={14} className="mr-1" />
            Master & Franqueados
          </div>
        </div>

        {/* Card Planos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-blue-100 transition-colors">
          <div className="absolute -right-6 -top-6 bg-orange-50 w-24 h-24 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <CreditCard size={24} className="text-orange-500 absolute bottom-6 left-6" />
          </div>
          <h3 className="text-slate-500 text-sm font-medium mb-1">Planos Ativos</h3>
          <p className="text-3xl font-bold text-slate-800">{metrics.activePlans}</p>
          <div className="mt-4 flex items-center text-xs text-orange-600 font-medium">
            <CreditCard size={14} className="mr-1" />
            Pacotes comercializáveis
          </div>
        </div>

      </div>

      {/* Tabela de Atividade Recente */}
      <div className="mt-8 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Últimas Imobiliárias Cadastradas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Imobiliária</th>
                <th className="px-6 py-4">CNPJ</th>
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4 text-center">Status Inicial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {metrics.recentRealEstates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    Nenhuma imobiliária cadastrada recentemente.
                  </td>
                </tr>
              ) : (
                metrics.recentRealEstates.map((re, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <Building2 size={16} />
                      </div>
                      {re.tradeName}
                    </td>
                    <td className="px-6 py-4">{maskCnpj(re.cnpj)}</td>
                    <td className="px-6 py-4">{re.email}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        re.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {re.isActive ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}