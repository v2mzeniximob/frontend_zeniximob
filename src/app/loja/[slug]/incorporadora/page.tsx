'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/src/lib/api';
import {
  Building2, MapPin, Compass, Layers, CheckCircle2, Sparkles,
  Calendar, HardHat, Eye, Send, Phone, ArrowLeft, Loader2, ShieldCheck, Calculator
} from 'lucide-react';
import Link from 'next/link';

export default function VitrinePublicaIncorporadoraPage() {
  const params = useParams();
  const slug = String(params?.slug || '');

  const [store, setStore] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [activeGalleryTab, setActiveGalleryTab] = useState<'fachada' | 'interiores' | 'plantas' | 'tour360'>('fachada');
  const [selectedKitIds, setSelectedKitIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Formulário de Lead integrado à Roleta
  const [leadForm, setLeadForm] = useState({ name: '', phone: '', email: '' });
  const [isSendingLead, setIsSendingLead] = useState(false);

  useEffect(() => {
    if (slug) fetchShowcase();
  }, [slug]);

  const fetchShowcase = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/public/stores/${slug}/incorporadora`);
      setStore(res.data.store);
      setProjects(res.data.projects || []);
      if (res.data.projects?.length > 0) {
        setSelectedProject(res.data.projects[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar vitrine da incorporadora:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const toggleKit = (id: string) => {
    setSelectedKitIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSendLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !selectedProject) return;
    setIsSendingLead(true);
    try {
      const chosenKits = (selectedProject.customizationOptions || [])
        .filter((o: any) => selectedKitIds.includes(o.id))
        .map((o: any) => o.title)
        .join(', ');

      await api.post('/public/leads', {
        realEstateId: store.id,
        name: leadForm.name,
        phone: leadForm.phone,
        email: leadForm.email,
        interest: `Incorporadora: ${selectedProject.name}`,
        notes: chosenKits
          ? `Interesse no empreendimento ${selectedProject.name} com simulação de Kit Personalização: ${chosenKits}`
          : `Interesse na tabela de vendas e condições do empreendimento ${selectedProject.name}.`
      });

      alert('Solicitação enviada com sucesso! Um especialista da nossa equipe entrará em contato em instantes.');
      setLeadForm({ name: '', phone: '', email: '' });
    } catch (err) {
      alert('Erro ao enviar solicitação.');
    } finally {
      setIsSendingLead(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  if (!store) {
    return <div className="p-12 text-center text-slate-600">Página da Incorporadora não encontrada.</div>;
  }

  const memorial = selectedProject?.visualMemorialJson || {};

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      
      {/* TOPBAR */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <Building2 className="text-blue-500" size={28} />
            <div>
              <span className="font-black text-lg tracking-tight">{store.tradeName}</span>
              <span className="block text-[10px] uppercase tracking-widest text-blue-400 font-bold">Divisão Incorporadora & Projetos</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/loja/${slug}/simulador-credito`} className="text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all shadow-md">
              <Calculator size={14} /> Simular Financiamento
            </Link>
            <Link href={`/loja/${slug}`} className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
              <ArrowLeft size={14} /> Voltar para a Vitrine
            </Link>
          </div>
        </div>
      </header>

      {projects.length === 0 ? (
        <div className="max-w-4xl mx-auto py-24 px-6 text-center space-y-4">
          <h2 className="text-2xl font-bold">Em breve novos lançamentos imobiliários</h2>
          <p className="text-slate-400 text-sm">Nossa incorporadora está preparando novos empreendimentos exclusivos.</p>
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-6 py-10 space-y-14">
          
          {/* SELETOR DE EMPREENDIMENTOS DA INCORPORADORA */}
          <div className="flex flex-wrap gap-3">
            {projects.map(proj => (
              <button
                key={proj.id}
                onClick={() => {
                  setSelectedProject(proj);
                  setSelectedKitIds([]);
                }}
                className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all border ${
                  selectedProject?.id === proj.id
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                🏢 {proj.name} ({proj.status})
              </button>
            ))}
          </div>

          {selectedProject && (
            <>
              {/* HERO DO EMPREENDIMENTO */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-gradient-to-br from-slate-900 to-slate-950 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                <div className="lg:col-span-7 space-y-4">
                  <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-extrabold px-3 py-1 rounded-full uppercase">
                    {selectedProject.status} • {selectedProject.overallProgressPct || 0}% Concluído
                  </span>
                  <h1 className="text-3xl md:text-5xl font-black leading-tight">
                    {selectedProject.customHeadline || selectedProject.name}
                  </h1>
                  <p className="text-slate-400 text-sm flex items-center gap-2">
                    <MapPin size={16} className="text-blue-500" /> {selectedProject.address} — {selectedProject.city}/{selectedProject.state}
                  </p>
                  <p className="text-slate-300 text-sm leading-relaxed pt-2">
                    {selectedProject.description || 'Empreendimento projetado com arquitetura autoral, compatibilização BIM integral e plantas personalizáveis pelo comprador.'}
                  </p>
                  <div className="pt-2">
                    <Link href={`/loja/${slug}/simulador-credito`} className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-5 py-3 rounded-xl shadow-lg transition-all">
                      <Calculator size={15} /> Simular Financiamento e Subsídio para esta Obra
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-slate-950/80 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="text-blue-400" size={18} /> Receber Tabela de Vendas & Plantas
                  </h3>
                  <form onSubmit={handleSendLead} className="space-y-3 text-xs">
                    <input required type="text" placeholder="Seu Nome Completo" value={leadForm.name} onChange={e => setLeadForm({ ...leadForm, name: e.target.value })} className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none" />
                    <input required type="text" placeholder="Seu WhatsApp com DDD" value={leadForm.phone} onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })} className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none" />
                    <input type="email" placeholder="Seu E-mail" value={leadForm.email} onChange={e => setLeadForm({ ...leadForm, email: e.target.value })} className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none" />
                    <button type="submit" disabled={isSendingLead} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2">
                      <Send size={15} /> {isSendingLead ? 'Enviando...' : 'Quero Atendimento Exclusivo'}
                    </button>
                  </form>
                </div>
              </section>

              {/* GALERIA VISUAL: FACHADA EXTERIOR, INTERIORES, PLANTAS E TOUR 360° */}
              <section className="space-y-6">
                <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
                  {[
                    { id: 'fachada', label: '🏢 Design Exterior & Fachada' },
                    { id: 'interiores', label: '🛋️ Design de Interiores & Decorado' },
                    { id: 'plantas', label: '📐 Plantas Baixas Humanizadas' },
                    { id: 'tour360', label: '🌐 Passeio Virtual 360°' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setActiveGalleryTab(t.id as any)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        activeGalleryTab === t.id ? 'bg-white text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {activeGalleryTab === 'fachada' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(selectedProject.facadeRendersUrls || []).length === 0 ? (
                      <p className="text-slate-500 text-xs col-span-3">Renders da fachada em atualização.</p>
                    ) : (
                      selectedProject.facadeRendersUrls.map((url: string, idx: number) => (
                        <img key={idx} src={url} alt="Fachada 3D" className="w-full h-72 object-cover rounded-2xl border border-slate-800" />
                      ))
                    )}
                  </div>
                )}

                {activeGalleryTab === 'interiores' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(selectedProject.interiorRendersUrls || []).length === 0 ? (
                      <p className="text-slate-500 text-xs col-span-3">Renders de interiores em atualização.</p>
                    ) : (
                      selectedProject.interiorRendersUrls.map((url: string, idx: number) => (
                        <img key={idx} src={url} alt="Interiores 3D" className="w-full h-72 object-cover rounded-2xl border border-slate-800" />
                      ))
                    )}
                  </div>
                )}

                {activeGalleryTab === 'plantas' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(selectedProject.floorPlansUrls || []).length === 0 ? (
                      <p className="text-slate-500 text-xs col-span-2">Plantas humanizadas em atualização.</p>
                    ) : (
                      selectedProject.floorPlansUrls.map((url: string, idx: number) => (
                        <img key={idx} src={url} alt="Planta Baixa" className="w-full h-96 object-contain bg-slate-900 p-4 rounded-2xl border border-slate-800" />
                      ))
                    )}
                  </div>
                )}

                {activeGalleryTab === 'tour360' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
                      <h4 className="font-bold text-sm text-blue-400">Tour 360° — Fachada & Áreas Comuns</h4>
                      {selectedProject.tour360ExteriorUrl ? (
                        <iframe src={selectedProject.tour360ExteriorUrl} className="w-full h-80 rounded-xl border border-slate-700" allowFullScreen />
                      ) : (
                        <p className="text-xs text-slate-500">Link de Tour 360° Exterior não informado.</p>
                      )}
                    </div>
                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
                      <h4 className="font-bold text-sm text-indigo-400">Tour 360° — Apartamento Decorado</h4>
                      {selectedProject.tour360DecoratedUrl ? (
                        <iframe src={selectedProject.tour360DecoratedUrl} className="w-full h-80 rounded-xl border border-slate-700" allowFullScreen />
                      ) : (
                        <p className="text-xs text-slate-500">Link de Tour 360° do Decorado não informado.</p>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* SIMULADOR DE PERSONALIZAÇÃO DE UNIDADE (KIT OPÇÕES) + MEMORIAL VISUAL */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-5">
                  <div>
                    <span className="text-xs font-bold uppercase text-blue-400">Customização antes das Chaves</span>
                    <h3 className="text-xl font-black mt-1">Personalize o Interior da sua Unidade (Kit Acabamentos)</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Selecione os upgrades de acabamento desejados e envie junto com a sua proposta comercial.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {(selectedProject.customizationOptions || []).length === 0 ? (
                      <p className="text-xs text-slate-500">Opções de personalização sob consulta com a equipe de arquitetura.</p>
                    ) : (
                      selectedProject.customizationOptions.map((kit: any) => {
                        const active = selectedKitIds.includes(kit.id);
                        return (
                          <div
                            key={kit.id}
                            onClick={() => toggleKit(kit.id)}
                            className={`p-4 rounded-2xl border cursor-pointer flex justify-between items-center transition-all ${
                              active ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div>
                              <span className="text-[10px] font-bold uppercase text-blue-400">{kit.category}</span>
                              <p className="font-bold text-sm text-white">{kit.title}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{kit.specification}</p>
                            </div>
                            <span className="font-black text-emerald-400 text-sm shrink-0 ml-4">
                              + {formatCurrency(kit.additionalPrice)}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Memorial Descritivo Visual e Evolução da Obra */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <HardHat className="text-emerald-400" size={18} /> Acompanhamento da Evolução da Obra
                    </h3>
                    {[
                      { label: 'Fundação', val: selectedProject.foundationPct || 0 },
                      { label: 'Estrutura', val: selectedProject.structurePct || 0 },
                      { label: 'Alvenaria', val: selectedProject.masonryPct || 0 },
                      { label: 'Instalações', val: selectedProject.installationsPct || 0 },
                      { label: 'Fachada / Exterior', val: selectedProject.facadePct || 0 },
                      { label: 'Acabamentos & Interiores', val: selectedProject.finishingPct || 0 },
                    ].map(st => (
                      <div key={st.label} className="space-y-1 text-xs">
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-300">{st.label}</span>
                          <span className="text-emerald-400">{st.val}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div style={{ width: `${st.val}%` }} className="h-full bg-emerald-500 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3 text-xs">
                    <h3 className="text-base font-bold text-white">Memorial Descritivo Visual</h3>
                    <p><strong className="text-blue-400">Fachada:</strong> {memorial.fachada || 'Revestimento nobre e iluminação em LED.'}</p>
                    <p><strong className="text-blue-400">Pisos:</strong> {memorial.piso || 'Porcelanato formato grande e piso vinílico.'}</p>
                    <p><strong className="text-blue-400">Esquadrias:</strong> {memorial.esquadrias || 'Alumínio com isolamento termoacústico.'}</p>
                    <p><strong className="text-blue-400">Louças e Metais:</strong> {memorial.loucas || 'Linha premium de alta durabilidade.'}</p>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      )}
    </div>
  );
}