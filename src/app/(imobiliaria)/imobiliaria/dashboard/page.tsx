'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { Home, Users, MessageSquare, TrendingUp, Loader2, Activity, ArrowUpRight, Edit } from 'lucide-react';
import { maskPhone } from '@/src/utils/mask';

export default function RealEstateDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalProperties: 0,
    activeProperties: 0,
    totalBrokers: 0,
    activeBrokers: 0,
    totalLeads: 0,
    newLeads: 0,
    recentLeads: [] as any[]
  });

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [propRes, brokerRes, leadsRes] = await Promise.all([
          api.get('/properties').catch(() => ({ data: [] })),
          api.get('/brokers').catch(() => ({ data: [] })),
          api.get('/leads').catch(() => ({ data: [] }))
        ]);

        const properties = propRes.data;
        const brokers = brokerRes.data;
        const leads = leadsRes.data;

        const activeProps = properties.filter((p: any) => p.isActive);
        const activeBrks = brokers.filter((b: any) => b.isActive);
        const newLds = leads.filter((l: any) => l.status === 'Novo');
        const recent = [...leads].reverse().slice(0, 5);

        setMetrics({
          totalProperties: properties.length,
          activeProperties: activeProps.length,
          totalBrokers: brokers.length,
          activeBrokers: activeBrks.length,
          totalLeads: leads.length,
          newLeads: newLds.length,
          recentLeads: recent
        });

      } catch (error) {
        console.error('Erro ao carregar métricas da imobiliária:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Loader2 size={32} className="animate-spin mb-4 text-emerald-600" />
        <p>A compilar dados da loja...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Painel da Imobiliária</h1>
        <p className="text-slate-500 text-sm">Resumo operacional das atividades e desempenho da sua loja.</p>
      </div>
      
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card Imóveis */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-emerald-100 transition-colors">
          <div className="absolute -right-6 -top-6 bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Home size={24} className="text-emerald-500 absolute bottom-6 left-6" />
          </div>
          <h3 className="text-slate-500 text-sm font-medium mb-1">Imóveis na Carteira</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-slate-800">{metrics.totalProperties}</p>
            <span className="text-sm text-slate-400 font-medium">total</span>
          </div>
          <div className="mt-4 flex items-center text-xs text-emerald-600 font-medium">
            <Activity size={14} className="mr-1" />
            {metrics.activeProperties} imóveis disponíveis
          </div>
        </div>

        {/* Card Corretores */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-emerald-100 transition-colors">
          <div className="absolute -right-6 -top-6 bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users size={24} className="text-blue-500 absolute bottom-6 left-6" />
          </div>
          <h3 className="text-slate-500 text-sm font-medium mb-1">Corretores da Equipe</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-slate-800">{metrics.totalBrokers}</p>
            <span className="text-sm text-slate-400 font-medium">total</span>
          </div>
          <div className="mt-4 flex items-center text-xs text-blue-600 font-medium">
            <ArrowUpRight size={14} className="mr-1" />
            {metrics.activeBrokers} corretores ativos
          </div>
        </div>

        {/* Card Leads */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-emerald-100 transition-colors">
          <div className="absolute -right-6 -top-6 bg-purple-50 w-24 h-24 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <MessageSquare size={24} className="text-purple-500 absolute bottom-6 left-6" />
          </div>
          <h3 className="text-slate-500 text-sm font-medium mb-1">Captação de Leads</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-slate-800">{metrics.totalLeads}</p>
            <span className="text-sm text-slate-400 font-medium">total</span>
          </div>
          <div className="mt-4 flex items-center text-xs text-purple-600 font-medium">
            <TrendingUp size={14} className="mr-1" />
            {metrics.newLeads} novos para atender
          </div>
        </div>

      </div>

      {/* Tabela de Leads Recentes */}
      <div className="mt-8 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Últimos Leads Registados</h2>
          <Link href="/imobiliaria/leads" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
            Ver todos &rarr;
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Telefone</th>
                <th className="px-6 py-4">Interesse</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {metrics.recentLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Nenhum lead registado recentemente.
                  </td>
                </tr>
              ) : (
                metrics.recentLeads.map((lead, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {lead.name}
                    </td>
                    <td className="px-6 py-4">{maskPhone(lead.phone)}</td>
                    <td className="px-6 py-4">{lead.interest}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        lead.status === 'Novo' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href="/imobiliaria/leads" className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors font-medium text-xs">
                        <Edit size={14} /> Atender
                      </Link>
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