'use client';

import { useState } from 'react';
import { 
  Calendar as CalendarIcon, Globe, Smartphone, Key, DollarSign, 
  MessageSquare, Grid, GraduationCap, CheckCircle2, RefreshCw, 
  Plus, Users, Sparkles, Building2, ShieldCheck, ArrowUpRight
} from 'lucide-react';

export default function ModuloTemporadaPage() {
  const [activeTab, setActiveTab] = useState<'pms' | 'channels' | 'direct_booking' | 'operations' | 'guest_panel' | 'pricing' | 'messaging' | 'app_center' | 'academy'>('pms');

  return (
    <div className="p-6 md:p-8 space-y-6 font-sans">
      
      {/* CABEÇALHO DO MÓDULO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
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

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl transition-all text-sm">
            <RefreshCw size={16} /> Sincronizar OTAs
          </button>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 text-sm">
            <Plus size={18} /> Nova Reserva Direta
          </button>
        </div>
      </div>

      {/* NAVEGAÇÃO POR ABAS (Ajustado para flex-wrap para evitar scroll lateral forçado) */}
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
        
        {activeTab === 'pms' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase">Ocupação Atual</span>
                <p className="text-2xl font-black text-slate-800 mt-1">78.5%</p>
                <span className="text-[11px] text-emerald-600 font-semibold">+12% vs mês anterior</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase">Check-ins Hoje</span>
                <p className="text-2xl font-black text-blue-600 mt-1">4 Hóspedes</p>
                <span className="text-[11px] text-slate-500 font-medium">2 pré-check-ins concluídos</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase">Check-outs Hoje</span>
                <p className="text-2xl font-black text-amber-600 mt-1">3 Hóspedes</p>
                <span className="text-[11px] text-slate-500 font-medium">Equipe de limpeza avisada</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase">Diária Média (ADR)</span>
                <p className="text-2xl font-black text-emerald-600 mt-1">R$ 485,00</p>
                <span className="text-[11px] text-slate-500 font-medium">Temporada Ativa</span>
              </div>
            </div>

            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-3">
              <CalendarIcon size={40} className="mx-auto text-slate-300" />
              <h3 className="text-lg font-bold text-slate-800">Calendário Multi-Imóvel Unificado</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Aqui você visualiza todas as reservas do Airbnb, Booking e Venda Direta organizadas em uma única timeline de ocupação.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'channels' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">Canais de Venda Conectados (OTAs)</h2>
              <p className="text-sm text-slate-500">Sincronização instantânea de tarifas, disponibilidade e bloqueios de calendário.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-extrabold text-red-500">Airbnb</h3>
                    <p className="text-xs text-slate-500">API Oficial Conectada</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={12}/> Ativo
                  </span>
                </div>
                <p className="text-xs text-slate-600">14 anúncios vinculados e sincronizados em tempo real.</p>
                <button className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors">
                  Gerenciar Mapeamento
                </button>
              </div>

              <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-extrabold text-blue-800">Booking.com</h3>
                    <p className="text-xs text-slate-500">API XML Bidirecional</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={12}/> Ativo
                  </span>
                </div>
                <p className="text-xs text-slate-600">12 acomodações recebendo reservas e envios de tarifas.</p>
                <button className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors">
                  Gerenciar Mapeamento
                </button>
              </div>

              <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-extrabold text-indigo-600">VRBO / Abritel</h3>
                    <p className="text-xs text-slate-500">Sincronização por iCal / API</p>
                  </div>
                  <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full">
                    Pendente
                  </span>
                </div>
                <p className="text-xs text-slate-600">Conecte sua conta para expor seus imóveis no grupo Expedia.</p>
                <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors">
                  Conectar VRBO
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'direct_booking' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Motor de Reservas Diretas</h2>
                <p className="text-sm text-slate-500">Seu canal próprio sem comissão de plataformas terceiras.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Regras de Caução</span>
                <p className="text-sm font-semibold text-slate-800">Pré-autorização automática no Cartão</p>
              </div>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Gateway de Pagamento</span>
                <p className="text-sm font-semibold text-emerald-600">PIX Instantâneo + Cartão em até 12x</p>
              </div>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Taxas Adicionais</span>
                <p className="text-sm font-semibold text-slate-800">Taxa de Limpeza e Taxa de Pet configuradas</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'operations' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">Gestão de Operações, Vistorias e Limpeza</h2>
              <p className="text-sm text-slate-500">Atribuição de tarefas para governança e controle de fechaduras eletrônicas.</p>
            </div>
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
              <Key size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-600 font-bold">Escala de Governantes e Limpeza</p>
              <p className="text-xs text-slate-400 mt-1">Crie checklist de vistoria e rotas automatizadas pós check-out.</p>
            </div>
          </div>
        )}

        {activeTab === 'guest_panel' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">Portal & WebApp do Hóspede</h2>
              <p className="text-sm text-slate-500">Web app sem necessidade de download para o hóspede acessar durante a estadia.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
                <ShieldCheck size={28} className="text-blue-600" />
                <h3 className="font-bold text-slate-800">Pré Check-in Digital</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Coleta fotos de documentos de todos os acompanhantes e assina o termo de responsabilidade digitalmente antes da chegada.
                </p>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <Key size={28} className="text-amber-600" />
                <h3 className="font-bold text-slate-800">Guia da Casa & Senha de Acesso</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Exibe a senha da fechadura no horário exato do check-in, senha do Wi-Fi e regras do condomínio.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">Precificação Dinâmica & Revenue Management</h2>
              <p className="text-sm text-slate-500">Ajuste automático de valores por sazonalidade e taxa de ocupação.</p>
            </div>
            <p className="text-sm text-slate-600">Regras de precificação configuráveis por imóvel ou grupo de propriedades.</p>
          </div>
        )}

        {activeTab === 'messaging' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">Gatilhos de Comunicação WhatsApp / E-mail</h2>
              <p className="text-sm text-slate-500">Envio automático de instruções nos momentos certos do fluxo do hóspede.</p>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">1. Reserva Confirmada: Enviar link do Pré-Check-in</span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-bold">WhatsApp Ativo</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">2. No dia do Check-in (10h): Enviar senha da fechadura e instruções de chegada</span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-bold">WhatsApp Ativo</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">3. Dia do Check-out (08h): Lembrete de horário e envio de avaliação</span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-bold">WhatsApp Ativo</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'app_center' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">App Center & Conectores</h2>
              <p className="text-sm text-slate-500">Conecte fechaduras inteligentes, gateways financeiros e ferramentas analíticas.</p>
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

        {activeTab === 'academy' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">Zenix Academy Short-Stay</h2>
              <p className="text-sm text-slate-500">Treinamentos e certificações para corretores e equipes de atendimento.</p>
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
    </div>
  );
}