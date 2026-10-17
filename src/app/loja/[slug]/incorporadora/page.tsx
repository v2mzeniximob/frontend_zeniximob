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
      const res = await api
        .get(`/public/stores/${slug}/incorporadoras`)
        .catch(() => api.get(`/public/stores/${slug}/incorporadora`));
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (!store) {
    return <div className="p-12 text-center text-slate-600 bg-slate-50 min-h-screen">Página da Incorporadora não encontrada.</div>;
  }

  const memorial = selectedProject?.visualMemorialJson || {};

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
      
      {/* TOPBAR CLARA */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-xl border border-blue-100">
              <Building2 className="text-blue-600" size={26} />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-slate-900">{store.tradeName}</span>
              <span className="block text-[10px] uppercase tracking-widest text-blue-600 font-bold">Divisão Incorporadora & Projetos</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/loja/${slug}/simulador-credito`} className="text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all shadow-sm">
              <Calculator size={14} className="text-amber-600" /> Simular Financiamento
            </Link>
            <Link href={`/loja/${slug}`} className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl border border-slate-200 transition-colors">
              <ArrowLeft size={14} /> Voltar para a Vitrine
            </Link>
          </div>
        </div>
      </header>

      {projects.length === 0 ? (
        <div className="max-w-4xl mx-auto py-24 px-6 text-center space-y-4">
          <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm">
            <Building2 size={44} className="mx-auto text-blue-600 mb-3" />
            <h2 className="text-2xl font-bold text-slate-800">Em breve novos lançamentos imobiliários</h2>
            <p className="text-slate-500 text-sm mt-1">Nossa incorporadora está preparando novos empreendimentos exclusivos.</p>
          </div>
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-6 py-10 space-y-12">
          
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
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🏢 {proj.name} ({proj.status})
              </button>
            ))}
          </div>

          {selectedProject && (
            <>
              {/* HERO DO EMPREENDIMENTO (CLARO) */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="lg:col-span-7 space-y-4">
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-extrabold px-3 py-1 rounded-full uppercase inline-block">
                    {selectedProject.status} • {selectedProject.overallProgressPct || 0}% Concluído
                  </span>
                  <h1 className="text-3xl md:text-5xl font-black leading-tight text-slate-900">
                    {selectedProject.customHeadline || selectedProject.name}
                  </h1>
                  <p className="text-slate-500 text-sm flex items-center gap-2 font-medium">
                    <MapPin size={16} className="text-blue-600 shrink-0" /> {selectedProject.address} — {selectedProject.city}/{selectedProject.state}
                  </p>
                  <p className="text-slate-600 text-sm leading-relaxed pt-1">
                    {selectedProject.description || 'Empreendimento projetado com arquitetura autoral, compatibilização BIM integral e plantas personalizáveis pelo comprador.'}
                  </p>
                  <div className="pt-2">
                    <Link href={`/loja/${slug}/simulador-credito`} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3.5 rounded-xl shadow-sm transition-all">
                      <Calculator size={15} /> Simular Financiamento e Subsídio para esta Obra
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="text-blue-600" size={18} /> Receber Tabela de Vendas & Plantas
                  </h3>
                  <form onSubmit={handleSendLead} className="space-y-3 text-xs">
                    <input required type="text" placeholder="Seu Nome Completo" value={leadForm.name} onChange={e => setLeadForm({ ...leadForm, name: e.target.value })} className="w-full p-3 rounded-xl bg-white border border-slate-300 text-slate-800 outline-none focus:border-blue-500" />
                    <input required type="text" placeholder="Seu WhatsApp com DDD" value={leadForm.phone} onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })} className="w-full p-3 rounded-xl bg-white border border-slate-300 text-slate-800 outline-none focus:border-blue-500" />
                    <input type="email" placeholder="Seu E-mail" value={leadForm.email} onChange={e => setLeadForm({ ...leadForm, email: e.target.value })} className="w-full p-3 rounded-xl bg-white border border-slate-300 text-slate-800 outline-none focus:border-blue-500" />
                    <button type="submit" disabled={isSendingLead} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors">
                      <Send size={15} /> {isSendingLead ? 'Enviando...' : 'Quero Atendimento Exclusivo'}
                    </button>
                  </form>
                </div>
              </section>

              {/* GALERIA VISUAL: FACHADA EXTERIOR, INTERIORES, PLANTAS E TOUR 360° */}
              <section className="space-y-6">
                <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
                  {[
                    { id: 'fachada', label: '🏢 Design Exterior & Fachada' },
                    { id: 'interiores', label: '🛋️ Design de Interiores & Decorado' },
                    { id: 'plantas', label: '📐 Plantas Baixas Humanizadas' },
                    { id: 'tour360', label: '🌐 Passeio Virtual 360°' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setActiveGalleryTab(t.id as any)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        activeGalleryTab === t.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {activeGalleryTab === 'fachada' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(selectedProject.facadeRendersUrls || []).length === 0 ? (
                      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-slate-400 text-xs col-span-3 text-center">Renders da fachada em atualização.</div>
                    ) : (
                      selectedProject.facadeRendersUrls.map((url: string, idx: number) => (
                        <img key={idx} src={url} alt="Fachada 3D" className="w-full h-72 object-cover rounded-2xl border border-slate-200 shadow-sm bg-white" />
                      ))
                    )}
                  </div>
                )}

                {activeGalleryTab === 'interiores' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(selectedProject.interiorRendersUrls || []).length === 0 ? (
                      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-slate-400 text-xs col-span-3 text-center">Renders de interiores em atualização.</div>
                    ) : (
                      selectedProject.interiorRendersUrls.map((url: string, idx: number) => (
                        <img key={idx} src={url} alt="Interiores 3D" className="w-full h-72 object-cover rounded-2xl border border-slate-200 shadow-sm bg-white" />
                      ))
                    )}
                  </div>
                )}

                {activeGalleryTab === 'plantas' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(selectedProject.floorPlansUrls || []).length === 0 ? (
                      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-slate-400 text-xs col-span-2 text-center">Plantas humanizadas em atualização.</div>
                    ) : (
                      selectedProject.floorPlansUrls.map((url: string, idx: number) => (
                        <img key={idx} src={url} alt="Planta Baixa" className="w-full h-96 object-contain bg-white p-4 rounded-2xl border border-slate-200 shadow-sm" />
                      ))
                    )}
                  </div>
                )}

                {activeGalleryTab === 'tour360' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <h4 className="font-bold text-sm text-blue-600">Tour 360° — Fachada & Áreas Comuns</h4>
                      {selectedProject.tour360ExteriorUrl ? (
                        <iframe src={selectedProject.tour360ExteriorUrl} className="w-full h-80 rounded-xl border border-slate-200" allowFullScreen />
                      ) : (
                        <p className="text-xs text-slate-400">Link de Tour 360° Exterior não informado.</p>
                      )}
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <h4 className="font-bold text-sm text-indigo-600">Tour 360° — Apartamento Decorado</h4>
                      {selectedProject.tour360DecoratedUrl ? (
                        <iframe src={selectedProject.tour360DecoratedUrl} className="w-full h-80 rounded-xl border border-slate-200" allowFullScreen />
                      ) : (
                        <p className="text-xs text-slate-400">Link de Tour 360° do Decorado não informado.</p>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* SIMULADOR DE PERSONALIZAÇÃO DE UNIDADE (KIT OPÇÕES) + MEMORIAL VISUAL */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                  <div>
                    <span className="text-xs font-bold uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">Customização antes das Chaves</span>
                    <h3 className="text-xl font-black mt-2 text-slate-900">Personalize o Interior da sua Unidade (Kit Acabamentos)</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Selecione os upgrades de acabamento desejados e envie junto com a sua proposta comercial.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {(selectedProject.customizationOptions || []).length === 0 ? (
                      <p className="text-xs text-slate-400">Opções de personalização sob consulta com a equipe de arquitetura.</p>
                    ) : (
                      selectedProject.customizationOptions.map((kit: any) => {
                        const active = selectedKitIds.includes(kit.id);
                        return (
                          <div
                            key={kit.id}
                            onClick={() => toggleKit(kit.id)}
                            className={`p-4 rounded-2xl border cursor-pointer flex justify-between items-center transition-all ${
                              active ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                            }`}
                          >
                            <div>
                              <span className="text-[10px] font-bold uppercase text-blue-600">{kit.category}</span>
                              <p className="font-bold text-sm text-slate-800">{kit.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{kit.specification}</p>
                            </div>
                            <span className="font-black text-emerald-600 text-sm shrink-0 ml-4">
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
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <HardHat className="text-emerald-600" size={18} /> Acompanhamento da Evolução da Obra
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
                          <span className="text-slate-600">{st.label}</span>
                          <span className="text-emerald-600">{st.val}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div style={{ width: `${st.val}%` }} className="h-full bg-emerald-500 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 text-xs text-slate-600">
                    <h3 className="text-base font-bold text-slate-800">Memorial Descritivo Visual</h3>
                    <p><strong className="text-blue-600">Fachada:</strong> {memorial.fachada || 'Revestimento nobre e iluminação em LED.'}</p>
                    <p><strong className="text-blue-600">Pisos:</strong> {memorial.piso || 'Porcelanato formato grande e piso vinílico.'}</p>
                    <p><strong className="text-blue-600">Esquadrias:</strong> {memorial.esquadrias || 'Alumínio com isolamento termoacústico.'}</p>
                    <p><strong className="text-blue-600">Louças e Metais:</strong> {memorial.loucas || 'Linha premium de alta durabilidade.'}</p>
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