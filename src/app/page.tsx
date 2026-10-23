'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/src/lib/api';
import {
  Building2, Users, DollarSign, FileSignature, Key, LayoutDashboard,
  ChevronRight, CheckCircle2, ShieldCheck, ArrowRight, Menu, X,
  HardHat, Sparkles, Compass, Layers, Calculator, MessageSquare,
  Palette, Rss, Calendar, Camera, Wrench, Globe, Video, Shuffle,
  Receipt, HelpCircle, ChevronDown, PhoneCall, ExternalLink
} from 'lucide-react';

export const DEFAULT_LANDING_CONFIG = {
  brand: {
    nameFirst: 'ZENIX',
    nameHighlight: 'IMOB',
    logoUrl: '/logo._navebar_.png', // 1º Logo (Navbar fixa)
    whatsappNumber: '5511999999999',
    whatsappButtonText: 'Falar com Especialista',
    loginButtonText: 'Acessar Plataforma'
  },
  hero: {
    topBannerUrl: '/IMob.svg', // 2º Logo Maior sem fundo (aceita /IMob.svg, /IMob.jpg ou URL externa)
    badgeText: 'Ecossistema SaaS Completo • Imobiliárias, Incorporadoras & Temporada',
    titleLine1: 'Tudo o que a sua Imobiliária e Incorporadora',
    titleHighlight: 'precisam num só lugar.',
    subtitle:
      'Do CRM com Roleta Automática, Google Meet e Robô IA no WhatsApp até à Gestão de Obras (Curva ABC, BIM e Kits de Personalização), Locação, Temporada (Airbnb/Booking), DIMOB e Emissão de NFSe.',
    primaryButtonText: 'Entrar no Sistema',
    secondaryButtonText: 'Agendar Demonstração',
    dashboardPreviewUrl:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop',
    dashboardCaption: 'Painel Executivo com DRE em Tempo Real, Funil Kanban, Engenharia e Vitrine White-Label'
  },
  stats: [
    { value: '23+', label: 'Módulos Integrados num Único Ecossistema' },
    { value: '100%', label: 'Automatizado (Boletos, PIX, NFSe, DIMOB e iCal)' },
    { value: '24/7', label: 'Robô de Atendimento IA no WhatsApp & Meta Ads' },
    { value: '360°', label: 'Vitrine Pública, Simulador MCMV e Portal do Cliente' }
  ],
  pillars: [
    {
      id: 'imobiliaria',
      tabLabel: '🏠 Imobiliária (Venda & Locação)',
      badge: 'GESTÃO IMOBILIÁRIA 360°',
      title: 'Catálogo Inteligente, Contratos, Repasses, Vistorias e Portais XML',
      description:
        'Gerencie todo o ciclo de locação e vendas sem planilhas paralelas. Da captação com Parecer Técnico (PTAM) e criação de artes para o Instagram até ao repasse automático aos proprietários e entrega da DIMOB.',
      imageUrl:
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1600&auto=format&fit=crop',
      bullets: [
        'Catálogo de Imóveis com redação de anúncios por Inteligência Artificial e Feed XML (Zap, VivaReal, OLX).',
        'Estúdio Gráfico Nativo: gere artes prontas para Feed (1080x1080) e Stories (1080x1920) do Instagram em 1 clique.',
        'Gestão de Contratos (IGPM/IPCA/INCC), Boletos/PIX, Baixa e Repasse líquido ao proprietário.',
        'Vistorias Mobile-First com fotos por cômodo, Claviculário Digital de Chaves e Arquivo DIMOB (.txt Receita Federal).'
      ]
    },
    {
      id: 'incorporadora',
      tabLabel: '🏗️ Incorporadora, Engenharia & BIM',
      badge: 'ERP CONSTRUÇÃO CIVIL & INCORPORAÇÃO',
      title: 'Múltiplas SPEs, Land Bank, Curva ABC, Medições, BIM e Kits de Personalização',
      description:
        'Desenvolvido para construtoras, loteadoras e incorporadoras. Estude a viabilidade financeira de terrenos antes da compra, acompanhe o avanço físico-financeiro da obra e permita que o comprador personalize os acabamentos online.',
      imageUrl:
        'https://images.unsplash.com/photo-1541888946425-d09bb18086f6?q=80&w=1600&auto=format&fit=crop',
      bullets: [
        'Suporte a Múltiplos CNPJs (SPEs com Património de Afetação / RET) e Simulador de Viabilidade de Terrenos (Land Bank).',
        'Orçamento Executivo (SINAPI) com recálculo automático da Curva ABC (Classes A, B e C) e Controle de Estoque no Canteiro.',
        'Medições de Empreiteiros com retenção contratual (caução) e lançamento automático de despesas no DRE.',
        'Repositório Central BIM (.IFC, Revit, SketchUp, DWG), Diário de Obra (RDO) e Simulador Caixa (MCMV / SBPE).',
        'Venda de Kits de Personalização de Unidades: gera o Aditivo Financeiro no contrato e emite a Ordem de Serviço (OS) para o engenheiro.'
      ]
    },
    {
      id: 'crm_ia',
      tabLabel: '🎯 CRM, Roleta SLA, Google Meet & IA',
      badge: 'MÁQUINA DE VENDAS & ATENDIMENTO',
      title: 'Roleta com Repescagem Automática, Radar de Matchmaking e Google Meet no Card',
      description:
        'Não perca nenhum lead por demora no atendimento. O ZenixImob distribui os clientes em fila circular entre os corretores, monitora o tempo de resposta e cruza o perfil do comprador com todo o estoque.',
      imageUrl:
        'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1600&auto=format&fit=crop',
      bullets: [
        'Roleta de Leads com Cronómetro SLA: se o corretor não atender em X minutos, o sistema repesca o lead para o próximo da fila.',
        'Central Google Meet integrada ao Card do Lead: crie a sala de vídeo, agende no Google Calendar e envie o convite no WhatsApp em 1 clique.',
        'Radar Inteligente de Matchmaking: calcula a percentagem de compatibilidade (0 a 100% Match) entre o cliente e os imóveis.',
        'Integração nativa com Meta Lead Ads (Facebook/Instagram) e Robô IA no WhatsApp 24 horas por dia.'
      ]
    },
    {
      id: 'temporada_portal',
      tabLabel: '🏖️ Temporada (Airbnb) & Portal do Cliente',
      badge: 'SHORT-STAY & AUTOATENDIMENTO',
      title: 'Sincronização Bidirecional iCal (Airbnb/Booking) e Portal Polimórfico do Cliente',
      description:
        'Unifique a gestão de aluguéis por temporada evitando overbooking e ofereça um Portal exclusivo para Inquilinos, Proprietários e Compradores na Planta.',
      imageUrl:
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1600&auto=format&fit=crop',
      bullets: [
        'Sincronização iCal (.ics) com Airbnb, Booking.com e VRBO + Motor de Reservas Diretas no site da imobiliária.',
        'Portal do Inquilino: 2ª via de boletos, pagamento PIX Copia e Cola e abertura de Chamados de Manutenção com chat.',
        'Portal do Comprador na Planta: acompanha os % de evolução da obra, lê o Diário de Obra, vê Tours 360° e contrata Kits de Acabamento.',
        'Portal do Proprietário: extrato transparente de repasses, status de ocupação da carteira e gestão de calendário de temporada.'
      ]
    }
  ],
  features: [
    {
      title: 'CRM, Roleta SLA & Google Meet',
      description: 'Distribuição circular de leads, repescagem automática por atraso, Radar de Matchmaking e criação de reuniões Google Meet.',
      badge: 'Comercial'
    },
    {
      title: 'ERP Incorporadora & Land Bank',
      description: 'Gestão de múltiplas SPEs (RET), estudo de viabilidade de terrenos, tabela de vendas com INCC e simulador Caixa/MCMV.',
      badge: 'Incorporação'
    },
    {
      title: 'Engenharia, Curva ABC & BIM',
      description: 'Cronograma físico de 6 etapas, orçamento com Curva ABC automática, medições integradas ao DRE, estoque, RDO e ficheiros BIM.',
      badge: 'Engenharia'
    },
    {
      title: 'Kits de Personalização + OS',
      description: 'O comprador escolhe upgrades de acabamento; o sistema gera a fatura do aditivo contratual e emite a Ordem de Serviço para o canteiro.',
      badge: 'Pós-Venda'
    },
    {
      title: 'DRE Gerencial, Boletos & PIX',
      description: 'Dashboard com apuração em tempo real de Receitas vs Despesas Operacionais (DRE), repasses a proprietários e exportação Excel/PDF.',
      badge: 'Financeiro'
    },
    {
      title: 'Estúdio Instagram & Feed XML',
      description: 'Gerador nativo de artes para Feed e Stories do Instagram, redator de anúncios com IA e exportação seletiva XML para Zap/VivaReal.',
      badge: 'Marketing'
    },
    {
      title: 'Temporada (Airbnb & Booking)',
      description: 'Sincronização automática de agendas via links iCal (.ics) com Airbnb, Booking.com e VRBO para eliminar qualquer risco de overbooking.',
      badge: 'Temporada'
    },
    {
      title: 'Fiscal (NFSe) & Arquivo DIMOB',
      description: 'Upload de certificado digital e-CNPJ A1 (.pfx), emissão automática de NFSe (Focus NFe), regras de retenção e geração do TXT da DIMOB.',
      badge: 'Fiscal'
    },
    {
      title: 'Vistorias Mobile, Chaves & SAC',
      description: 'Checklist fotográfico de vistorias pelo telemóvel, controle de claviculário, parecer PTAM de avaliação e Help Desk de manutenção.',
      badge: 'Operação'
    }
  ],
  screensGallery: [
    {
      title: 'Dashboard Executivo & DRE em Tempo Real',
      subtitle: 'Filtros por período, Receita Realizada, Despesas Operacionais, Inadimplência e exportação direta para Excel e PDF.',
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1400&auto=format&fit=crop'
    },
    {
      title: 'ERP Incorporadora, Curva ABC & Repositório BIM',
      subtitle: 'Controle total de SPEs, Land Bank, medições de empreiteiros, Diário de Obra e Kits de Personalização.',
      imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1400&auto=format&fit=crop'
    },
    {
      title: 'Vitrine Pública White-Label, Tour 360° & Simulador MCMV',
      subtitle: 'Cada imobiliária recebe o seu próprio site, landing page de lançamentos com passeio virtual 360° e simulador habitacional.',
      imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1400&auto=format&fit=crop'
    }
  ],
  faqs: [
    {
      question: 'Posso liberar apenas alguns módulos para cada plano de assinatura?',
      answer:
        'Sim! Através do Painel Master, você cria quantos planos desejar e marca exatamente quais dos 23 módulos (como Incorporadoras, Condomínios, Temporada, DIMOB, Fiscal, WhatsApp IA, etc.) ficam visíveis na barra lateral de cada imobiliária.'
    },
    {
      question: 'Como funciona a Vitrine Pública e o Portal do Cliente de cada imobiliária?',
      answer:
        'Cada imobiliária cadastrada ganha automaticamente o seu site público (/loja/slug), uma vitrine exclusiva para os lançamentos da Incorporadora (/loja/slug/incorporadora), um Simulador Público de Financiamento (/loja/slug/simulador-credito) e o Portal do Cliente para Inquilinos, Proprietários e Compradores.'
    },
    {
      question: 'O Módulo Incorporadora integra com o Financeiro e os Contratos da Imobiliária?',
      answer:
        '100% integrado. Quando você aprova uma medição de empreiteiro, ela pode ser lançada direto como despesa paga no DRE. E quando um comprador escolhe um Kit de Personalização de acabamento, o sistema gera a fatura do aditivo no contrato dele e emite a Ordem de Serviço para a engenharia.'
    },
    {
      question: 'Posso editar todos os textos, números e imagens desta página inicial?',
      answer:
        'Sim! Basta aceder ao Painel Master na opção "Configurações > Landing Page (Site)" para alterar títulos, imagens, estatísticas, funcionalidades, perguntas frequentes e número de WhatsApp sem tocar numa única linha de código.'
    }
  ],
  ctaBottom: {
    title: 'Pronto para elevar a sua Imobiliária ou Incorporadora ao próximo nível?',
    subtitle:
      'Substitua 6 ferramentas desconectadas por um único ecossistema inteligente. Mais velocidade para os corretores, precisão para a engenharia e transparência para os clientes.',
    buttonText: 'Acessar a Minha Conta Agora'
  },
  footer: {
    copyrightText: 'Todos os direitos reservados. Sistema de Gestão Imobiliária e Rede de Franquias.',
    contactEmail: 'contato@zeniximob.com.br',
    instagramUrl: 'https://instagram.com'
  }
};

// SVG completo idêntico ao 2º Logo (ZENIXIMOB - SISTEMA DE GESTÃO IMOBILIÁRIA E REDE DE FRANQUIAS) sem fundo
function SecondLogoFullSvg({ className = 'w-full max-w-2xl h-auto' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 920 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="ZENIXIMOB - Sistema de Gestão Imobiliária e Rede de Franquias"
    >
      <defs>
        <linearGradient id="hexGradMain" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#092969" />
          <stop offset="50%" stopColor="#0e5b8e" />
          <stop offset="100%" stopColor="#1497a8" />
        </linearGradient>
        <linearGradient id="textGradMain" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#072b66" />
          <stop offset="55%" stopColor="#0f3c7d" />
          <stop offset="100%" stopColor="#2b5f9e" />
        </linearGradient>
      </defs>

      {/* Ícone Hexagonal Z Tecnológico */}
      <g transform="translate(35, 18) scale(1.6)">
        <path d="M60 6L96 27L83 35L60 21L24 42V56L11 63V34L60 6Z" fill="url(#hexGradMain)" />
        <path d="M60 124L24 103L37 95L60 109L96 88V74L109 67V96L60 124Z" fill="url(#hexGradMain)" />
        <path
          d="M22 39H96L109 47V61L54 94H98L109 87V100L96 108H18L11 100V83L66 50H22V39Z"
          fill="url(#hexGradMain)"
        />
        <circle cx="52" cy="58" r="8.5" fill="url(#hexGradMain)" />
        <circle cx="68" cy="72" r="8.5" fill="url(#hexGradMain)" />
      </g>

      {/* Tipografia Principal: ZENIXIMOB */}
      <text
        x="265"
        y="138"
        fill="url(#textGradMain)"
        fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
        fontSize="86"
        fontWeight="800"
        letterSpacing="4"
      >
        ZENIX<tspan fontWeight="500" fill="#255a99">IMOB</tspan>
      </text>

      {/* Subtítulo: SISTEMA DE GESTÃO IMOBILIÁRIA E REDE DE FRANQUIAS */}
      <text
        x="270"
        y="175"
        fill="#64748b"
        fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
        fontSize="17.5"
        fontWeight="500"
        letterSpacing="3.4"
      >
        SISTEMA DE GESTÃO IMOBILIÁRIA E REDE DE FRANQUIAS
      </text>
    </svg>
  );
}

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [config, setConfig] = useState<any>(DEFAULT_LANDING_CONFIG);
  const [activePillarId, setActivePillarId] = useState<string>('imobiliaria');
  const [plans, setPlans] = useState<any[]>([]);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Controle de carregamento do 1º logo (Navbar) e do 2º logo maior (Hero)
  const [navLogoError, setNavLogoError] = useState(false);
  const [secondLogoCandidateIndex, setSecondLogoCandidateIndex] = useState(0);

  useEffect(() => {
    const cached = localStorage.getItem('@ZenixImob:landingConfig');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setConfig((prev: any) => ({
          ...prev,
          ...parsed,
          brand: { ...prev.brand, ...(parsed.brand || {}) },
          hero: { ...prev.hero, ...(parsed.hero || {}) }
        }));
      } catch {}
    }

    api
      .get('/public/landing-page')
      .then((res) => {
        if (res.data?.config) {
          setConfig((prev: any) => ({
            ...prev,
            ...res.data.config,
            brand: { ...prev.brand, ...(res.data.config.brand || {}) },
            hero: { ...prev.hero, ...(res.data.config.hero || {}) }
          }));
          localStorage.setItem('@ZenixImob:landingConfig', JSON.stringify(res.data.config));
        }
        if (Array.isArray(res.data?.plans)) {
          setPlans(res.data.plans);
        }
      })
      .catch(() => {});
  }, []);

  const activePillar =
    (config.pillars || []).find((p: any) => p.id === activePillarId) ||
    (config.pillars || [])[0] ||
    DEFAULT_LANDING_CONFIG.pillars[0];

  const whatsappUrl = `https://wa.me/${String(config.brand?.whatsappNumber || '').replace(/\D/g, '')}?text=${encodeURIComponent(
    'Olá! Gostaria de conhecer melhor a plataforma ZenixImob.'
  )}`;

  const navLogoSrc = config.brand?.logoUrl || '/logo_navbar.png';

  // Lista de caminhos possíveis para o 2º logo (SVG ou JPG sem fundo) na pasta public/
  const secondLogoCandidates = [
    config.hero?.topBannerUrl && config.hero.topBannerUrl !== '/3.jpg' ? config.hero.topBannerUrl : '/IMob.svg',
    '/IMob.svg',
    '/IMob.jpg',
    '/IMob.png'
  ].filter(Boolean);

  const currentSecondLogoSrc =
    secondLogoCandidateIndex < secondLogoCandidates.length
      ? secondLogoCandidates[secondLogoCandidateIndex]
      : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-200 selection:text-blue-900">
      
      {/* ================================================================= */}
      {/* 1. NAVBAR FIXA                                                    */}
      {/* ================================================================= */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 z-50 transition-all shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3 focus:outline-none">
              {!navLogoError && navLogoSrc ? (
                <img
                  src={navLogoSrc}
                  alt="ZENIX IMOB"
                  onError={() => setNavLogoError(true)}
                  className="h-12 md:h-14 w-auto object-contain mix-blend-multiply"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white">
                    Z
                  </div>
                  <span className="font-black text-2xl text-[#0b2447]">
                    ZENIX<span className="font-normal text-[#1b4b79] ml-1">IMOB</span>
                  </span>
                </div>
              )}
            </Link>

            {/* Menu Desktop */}
            <div className="hidden lg:flex items-center gap-7 font-semibold text-sm text-slate-600">
              <a href="#ecossistema" className="hover:text-blue-600 transition-colors">Ecossistema</a>
              <a href="#funcionalidades" className="hover:text-blue-600 transition-colors">23 Módulos</a>
              <a href="#telas" className="hover:text-blue-600 transition-colors">Telas do Sistema</a>
              {plans.length > 0 && (
                <a href="#planos" className="hover:text-blue-600 transition-colors">Planos</a>
              )}
              <a href="#faq" className="hover:text-blue-600 transition-colors">Dúvidas</a>
            </div>

            {/* CTAs Desktop */}
            <div className="hidden md:flex items-center gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-4 py-2.5 rounded-full border border-slate-200 transition-all flex items-center gap-1.5"
              >
                <PhoneCall size={14} className="text-emerald-600" />
                {config.brand?.whatsappButtonText || 'Falar com Especialista'}
              </a>
              <Link
                href="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                {config.brand?.loginButtonText || 'Acessar Plataforma'} <ArrowRight size={16} />
              </Link>
            </div>

            {/* Botão Mobile */}
            <button
              className="md:hidden text-slate-600 p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Dropdown Mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-4 flex flex-col gap-3 animate-in slide-in-from-top-2">
            <a href="#ecossistema" onClick={() => setIsMobileMenuOpen(false)} className="font-semibold text-slate-700 p-2">Ecossistema</a>
            <a href="#funcionalidades" onClick={() => setIsMobileMenuOpen(false)} className="font-semibold text-slate-700 p-2">Módulos</a>
            <a href="#telas" onClick={() => setIsMobileMenuOpen(false)} className="font-semibold text-slate-700 p-2">Telas do Sistema</a>
            <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="font-semibold text-slate-700 p-2">Dúvidas</a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-3 rounded-xl font-bold text-center"
            >
              {config.brand?.whatsappButtonText || 'Falar no WhatsApp'}
            </a>
            <Link
              href="/login"
              className="bg-blue-600 text-white px-4 py-3 rounded-xl font-bold text-center"
            >
              {config.brand?.loginButtonText || 'Acessar Plataforma'}
            </Link>
          </div>
        )}
      </nav>

      {/* ================================================================= */}
      {/* 2. ESPAÇO DO 2º LOGO MAIOR (SEM FUNDO / SVG) ENTRE A NAVBAR FIXA  */}
      {/* ================================================================= */}
     <section className="relative pt-32 pb-20 lg:pt-36 lg:pb-28 overflow-hidden bg-slate-50">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 blur-[110px] rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* LOGO MAIOR AMPLIADO */}
          <div className="w-full max-w-4xl mx-auto mb-12 pt-4 pb-6 flex items-center justify-center px-4">
            {currentSecondLogoSrc ? (
              <img
                src={currentSecondLogoSrc}
                alt="ZENIXIMOB - Sistema de Gestão Imobiliária e Rede de Franquias"
                onError={() => setSecondLogoCandidateIndex((prev) => prev + 1)}
                className="w-full max-w-4xl max-h-[320px] sm:max-h-[380px] md:max-h-[450px] object-contain mx-auto mix-blend-multiply"
              />
            ) : (
              <SecondLogoFullSvg className="w-full max-w-4xl h-auto mx-auto" />
            )}
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs sm:text-sm font-extrabold mb-6 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
            {config.hero?.badgeText}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight mb-6 leading-tight max-w-5xl mx-auto">
            {config.hero?.titleLine1}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              {config.hero?.titleHighlight}
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            {config.hero?.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-base transition-all shadow-xl shadow-blue-600/25 hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {config.hero?.primaryButtonText || 'Entrar no Sistema'} <ArrowRight size={18} />
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto bg-white border-2 border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:bg-slate-50 flex items-center justify-center gap-2"
            >
              <PhoneCall size={18} className="text-emerald-600" />
              {config.hero?.secondaryButtonText || 'Agendar Demonstração'}
            </a>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mt-14">
            {(config.stats || []).map((st: any, idx: number) => (
              <div
                key={idx}
                className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-slate-200 shadow-sm text-center"
              >
                <span className="block text-3xl md:text-4xl font-black text-blue-600">{st.value}</span>
                <span className="text-xs font-bold text-slate-500 mt-1 block">{st.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-14 px-4 sm:px-6 relative">
          <div className="rounded-3xl border border-slate-200 bg-white p-3 md:p-4 shadow-2xl">
            <div className="rounded-2xl border border-slate-200 bg-slate-100 aspect-[16/9] overflow-hidden relative flex items-center justify-center">
              {config.hero?.dashboardPreviewUrl ? (
                <img
                  src={config.hero.dashboardPreviewUrl}
                  alt="Preview do Sistema ZenixImob"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <LayoutDashboard size={64} />
                  <span className="font-bold mt-3 uppercase tracking-widest text-xs">Dashboard ZenixImob</span>
                </div>
              )}
            </div>
            {config.hero?.dashboardCaption && (
              <p className="text-center text-xs font-bold text-slate-500 mt-3">
                {config.hero.dashboardCaption}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* PILARES DO ECOSSISTEMA (ABAS INTERATIVAS)                         */}
      {/* ================================================================= */}
      <section id="ecossistema" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              4 Soluções num Único Software
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mt-3">
              Uma Plataforma Moldada para Toda a Operação Imobiliária
            </h2>
            <p className="text-slate-500 text-base mt-2">
              Alterne entre os pilares abaixo e veja como o ZenixImob atende desde imobiliárias tradicionais até incorporadoras e gestores de temporada.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2.5">
            {(config.pillars || []).map((pillar: any) => {
              const isActive = activePillar?.id === pillar.id;
              return (
                <button
                  key={pillar.id}
                  onClick={() => setActivePillarId(pillar.id)}
                  className={`px-5 py-3.5 rounded-2xl font-bold text-xs sm:text-sm transition-all border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pillar.tabLabel}
                </button>
              );
            })}
          </div>

          {activePillar && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-50 p-6 md:p-10 rounded-3xl border border-slate-200 shadow-sm">
              <div className="lg:col-span-7 space-y-5">
                <span className="inline-block bg-blue-100 text-blue-800 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  {activePillar.badge}
                </span>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                  {activePillar.title}
                </h3>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  {activePillar.description}
                </p>

                <ul className="space-y-3 pt-2">
                  {(activePillar.bullets || []).map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 font-medium">
                      <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4 flex flex-wrap gap-3">
                  <Link
                    href="/login"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-xl shadow-sm flex items-center gap-2"
                  >
                    Experimentar Agora <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-white aspect-[4/3]">
                  <img
                    src={
                      activePillar.imageUrl ||
                      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop'
                    }
                    alt={activePillar.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================= */}
      {/* GRADE COMPLETA DE FUNCIONALIDADES / MÓDULOS EDITÁVEIS             */}
      {/* ================================================================= */}
      <section id="funcionalidades" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              23 Módulos Nativos
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mt-3 mb-4">
              Desenvolvido para Máxima Performance
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-base">
              Módulos integrados que conectam todas as pontas da sua operação: captação, vendas, locação, engenharia, temporada, fiscal e portal do cliente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(config.features || []).map((feat: any, index: number) => (
              <div
                key={index}
                className="p-7 rounded-3xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-5">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 font-black">
                      {index + 1 < 10 ? `0${index + 1}` : index + 1}
                    </div>
                    {feat.badge && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                        {feat.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">{feat.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{feat.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* GALERIA DE VITRINES E TELAS DO SISTEMA (IMAGENS EDITÁVEIS)        */}
      {/* ================================================================= */}
      <section id="telas" className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Visual Moderno &amp; Intuitivo
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mt-3">
              Conheça a Experiência Visual do Sistema
            </h2>
            <p className="text-slate-500 text-base mt-2">
              Interfaces claras, rápidas e projetadas para facilitar o dia a dia do corretor, do financeiro, do engenheiro e do cliente final.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(config.screensGallery || []).map((scr: any, idx: number) => (
              <div
                key={idx}
                className="bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col"
              >
                <div className="aspect-[16/10] bg-slate-200 overflow-hidden">
                  <img
                    src={scr.imageUrl}
                    alt={scr.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{scr.title}</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{scr.subtitle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* PLANOS DE ASSINATURA DINÂMICOS                                    */}
      {/* ================================================================= */}
      {plans.length > 0 && (
        <section id="planos" className="py-24 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Planos &amp; Pacotes SaaS
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mt-3">
                Escolha o Plano Ideal para a sua Operação
              </h2>
              <p className="text-slate-500 text-base mt-2">
                Planos modulares que acompanham o crescimento da sua imobiliária ou incorporadora.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {plans.map((plan: any) => (
                <div
                  key={plan.id}
                  className="bg-white rounded-3xl border-2 border-slate-200 hover:border-blue-500 p-8 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{plan.name}</h3>
                    <div className="flex items-end gap-1 my-6">
                      <span className="text-sm font-bold text-slate-400 mb-1">R$</span>
                      <span className="text-4xl font-black text-blue-600">
                        {Number(plan.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-sm font-bold text-slate-400 mb-1">/mês</span>
                    </div>

                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Módulos Inclusos ({plan.modules?.length || 0}):
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {(plan.modules || []).map((m: string, i: number) => (
                        <span
                          key={i}
                          className="text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-lg capitalize"
                        >
                          ✓ {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-center text-sm shadow-md transition-colors"
                  >
                    Contratar {plan.name}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================================================================= */}
      {/* FAQ — PERGUNTAS FREQUENTES EDITÁVEIS                              */}
      {/* ================================================================= */}
      <section id="faq" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center">
            <h2 className="text-3xl font-black text-slate-900">Perguntas Frequentes</h2>
            <p className="text-slate-500 text-sm mt-2">
              Tire as suas principais dúvidas sobre o funcionamento do ecossistema ZenixImob.
            </p>
          </div>

          <div className="space-y-3">
            {(config.faqs || []).map((faq: any, i: number) => {
              const isOpen = openFaqIndex === i;
              return (
                <div
                  key={i}
                  className="border border-slate-200 rounded-2xl bg-slate-50 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                    className="w-full p-5 text-left flex justify-between items-center gap-4 font-bold text-slate-800 text-sm sm:text-base hover:bg-slate-100/70 transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      size={18}
                      className={`text-blue-600 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3 bg-white">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* CALL TO ACTION FINAL                                              */}
      {/* ================================================================= */}
      <section className="py-24 bg-blue-600 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center text-white">
          <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
            {config.ctaBottom?.title}
          </h2>
          <p className="text-blue-100 text-base md:text-xl mb-10 max-w-2xl mx-auto">
            {config.ctaBottom?.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-8 py-4 rounded-2xl font-bold text-base transition-all shadow-2xl"
            >
              {config.ctaBottom?.buttonText || 'Acessar a Minha Conta'} <ChevronRight size={20} />
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white border border-blue-400/40 px-8 py-4 rounded-2xl font-bold text-base transition-all"
            >
              <PhoneCall size={18} /> Falar com Consultor
            </a>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* RODAPÉ                                                            */}
      {/* ================================================================= */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white">
              Z
            </div>
            <span className="font-bold text-xl text-white tracking-tight">
              {config.brand?.nameFirst || 'ZENIX'}
              <span className="text-blue-500">{config.brand?.nameHighlight || 'IMOB'}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-center md:text-left">
            © {new Date().getFullYear()} {config.brand?.nameFirst}
            {config.brand?.nameHighlight}. {config.footer?.copyrightText}
          </p>
          <div className="flex items-center gap-5 text-xs sm:text-sm">
            {config.footer?.contactEmail && (
              <a href={`mailto:${config.footer.contactEmail}`} className="hover:text-white transition-colors">
                {config.footer.contactEmail}
              </a>
            )}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
              Login da Plataforma
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}