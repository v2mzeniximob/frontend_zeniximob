'use client';

import Link from 'next/link';
import { 
  Building2, 
  Users, 
  DollarSign, 
  FileSignature, 
  Key, 
  LayoutDashboard, 
  ChevronRight, 
  CheckCircle2, 
  ShieldCheck,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200 selection:text-blue-900">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-600/20">
                Z
              </div>
              <span className="font-bold text-2xl text-slate-800 tracking-tight">Zenix<span className="text-blue-600">Imob</span></span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8 font-medium text-sm text-slate-600">
              <a href="#funcionalidades" className="hover:text-blue-600 transition-colors">Funcionalidades</a>
              <a href="#solucoes" className="hover:text-blue-600 transition-colors">Para Quem</a>
              <a href="#beneficios" className="hover:text-blue-600 transition-colors">Benefícios</a>
            </div>

            {/* CTA Login */}
            <div className="hidden md:flex">
              <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                Acessar Plataforma <ArrowRight size={18} />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden text-slate-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-100 p-4 flex flex-col gap-4 animate-in slide-in-from-top-2">
            <a href="#funcionalidades" onClick={() => setIsMobileMenuOpen(false)} className="font-medium text-slate-600 p-2">Funcionalidades</a>
            <a href="#solucoes" onClick={() => setIsMobileMenuOpen(false)} className="font-medium text-slate-600 p-2">Para Quem</a>
            <Link href="/login" className="bg-blue-600 text-white px-4 py-3 rounded-xl font-bold text-center mt-2">
              Acessar Plataforma
            </Link>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-30 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 blur-[100px] rounded-full mix-blend-multiply"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-bold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
            O Sistema de Gestão Imobiliária Definitivo
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-5 duration-700 leading-tight">
            Tudo o que a sua Imobiliária <br className="hidden md:block"/>
            precisa <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">num só lugar.</span>
          </h1>
          
          <p className="mt-4 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Escale as suas vendas, automatize as suas cobranças com PIX e gira contratos, corretores e proprietários com um ecossistema SaaS completo.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <Link href="/login" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-blue-600/30 hover:-translate-y-1 flex items-center justify-center gap-2">
              Entrar no Sistema
            </Link>
            <a href="#funcionalidades" className="w-full sm:w-auto bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:bg-slate-50 text-center">
              Conhecer Funcionalidades
            </a>
          </div>
        </div>

        {/* Dashboard Preview Fake */}
        <div className="max-w-6xl mx-auto mt-20 px-4 sm:px-6 relative animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          <div className="rounded-3xl border border-slate-200/60 bg-white/50 backdrop-blur-sm p-2 md:p-4 shadow-2xl">
            <div className="rounded-2xl border border-slate-100 bg-slate-100 aspect-[16/9] overflow-hidden relative flex items-center justify-center">
              {/* Aqui você pode colocar a imagem real do seu dashboard */}
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
              <LayoutDashboard size={64} className="text-slate-300" />
              <p className="absolute text-slate-400 font-bold mt-24 tracking-widest uppercase">Dashboard Zenix</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="funcionalidades" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">Desenvolvido para Máxima Performance</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">Módulos inteligentes que conectam todas as pontas da sua operação imobiliária, desde o primeiro atendimento até a assinatura do contrato.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1 group">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">CRM & Gestão de Leads</h3>
              <p className="text-slate-600">Acompanhe funis de vendas, agende visitas e não perca nenhum negócio. Gestão completa de inquilinos e proprietários.</p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1 group">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <DollarSign size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Financeiro Automatizado</h3>
              <p className="text-slate-600">Emissão de PIX e Boletos integrados nativamente com o Mercado Pago. Baixa automática e divisão de repasses.</p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1 group">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileSignature size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Contratos Inteligentes</h3>
              <p className="text-slate-600">Gere PDFs de contratos de locação e venda automaticamente com variáveis mágicas e integração para assinatura digital.</p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1 group">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Key size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Controle de Chaves</h3>
              <p className="text-slate-600">Saiba exatamente com quem está a chave de cada imóvel, imprima recibos de entrega e gira vistorias.</p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1 group">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Building2 size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Ecossistema de Franquias</h3>
              <p className="text-slate-600">Painel Master exclusivo. Gira múltiplos franqueados, planos SaaS e faturamento recorrente num ambiente centralizado.</p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1 group">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Painéis Individuais</h3>
              <p className="text-slate-600">Acesso seguro e restrito para Corretores, Inquilinos e Proprietários, garantindo transparência a todas as partes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="py-24 bg-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center text-white">
          <h2 className="text-3xl md:text-5xl font-black mb-6">Pronto para digitalizar a sua Imobiliária?</h2>
          <p className="text-blue-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Faça login na plataforma e junte-se ao ecossistema ZenixImob. Controle total, menos burocracia e mais vendas.
          </p>
          <Link href="/login" className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-2xl hover:scale-105">
            Acessar a Minha Conta <ChevronRight size={20} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white">
              Z
            </div>
            <span className="font-bold text-xl text-white tracking-tight">Zenix<span className="text-blue-500">Imob</span></span>
          </div>
          <p className="text-sm text-center md:text-left">
            © {new Date().getFullYear()} ZenixImob Software. Todos os direitos reservados.
          </p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Termos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <Link href="/login" className="hover:text-blue-400 font-bold transition-colors">Login</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}