'use client';

import { useState, useEffect } from 'react';
import { api } from '@/src/lib/api';
import { DEFAULT_LANDING_CONFIG } from '@/src/app/page';
import {
  Globe, Save, RotateCcw, Plus, Trash2, Image as ImageIcon,
  Layout, Sparkles, HelpCircle, PhoneCall, ExternalLink, Loader2, CheckCircle2, Layers
} from 'lucide-react';
import Link from 'next/link';

export default function MasterLandingPageEditor() {
  const [config, setConfig] = useState<any>(DEFAULT_LANDING_CONFIG);
  const [activeTab, setActiveTab] = useState<'hero' | 'pilares' | 'modulos' | 'telas' | 'faq' | 'contato'>('hero');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/public/landing-page');
      if (res.data?.config) {
        setConfig({ ...DEFAULT_LANDING_CONFIG, ...res.data.config });
      }
    } catch {
      const cached = localStorage.getItem('@ZenixImob:landingConfig');
      if (cached) setConfig(JSON.parse(cached));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      localStorage.setItem('@ZenixImob:landingConfig', JSON.stringify(config));
      await api.put('/master/landing-page', { config });
      alert('✅ Landing Page oficial atualizada com sucesso!');
    } catch (error) {
      alert('Configuração salva localmente no navegador! Verifique se a rota PUT /master/landing-page já foi adicionada no backend.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (!confirm('Deseja restaurar todos os textos e imagens padrão de fábrica da Landing Page?')) return;
    setConfig(DEFAULT_LANDING_CONFIG);
    localStorage.setItem('@ZenixImob:landingConfig', JSON.stringify(DEFAULT_LANDING_CONFIG));
  };

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center text-slate-500">
        <Loader2 className="animate-spin" size={36} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[1500px] mx-auto font-sans space-y-6 pb-20">
      
      {/* CABEÇALHO DO EDITOR MASTER */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <span className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Zenix Master • CMS da Página Inicial
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 mt-2 flex items-center gap-3">
            <Globe className="text-indigo-600" size={32} />
            Editor Visual da Landing Page do Software
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Personalize textos, imagens do sistema, estatísticas, funcionalidades, perguntas frequentes e WhatsApp comercial da página inicial.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-3 rounded-xl border border-slate-200 flex items-center gap-2"
          >
            Ver Site Público <ExternalLink size={14} />
          </Link>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs px-4 py-3 rounded-xl flex items-center gap-1.5"
          >
            <RotateCcw size={14} /> Restaurar Padrão
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md flex items-center gap-2"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Publicar Alterações no Site
          </button>
        </div>
      </div>

      {/* NAVEGAÇÃO DE ABAS DO EDITOR */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'hero', label: '1. Topo (Hero), Imagem Principal & Números', icon: Layout },
          { id: 'pilares', label: '2. Os 4 Pilares Interativos & Fotos', icon: Layers },
          { id: 'modulos', label: '3. Cards de Funcionalidades (Módulos)', icon: Sparkles },
          { id: 'telas', label: '4. Galeria de Telas do Sistema', icon: ImageIcon },
          { id: 'faq', label: '5. Perguntas Frequentes (FAQ)', icon: HelpCircle },
          { id: 'contato', label: '6. Marca, WhatsApp, CTA & Rodapé', icon: PhoneCall },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                active
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* ABA 1: HERO, IMAGEM PRINCIPAL E ESTATÍSTICAS */}
        {activeTab === 'hero' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-xs">
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
              Banner Principal (Hero) &amp; Imagem de Destaque do Sistema
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Texto do Selo Superior (Badge)</label>
                <input
                  type="text"
                  value={config.hero?.badgeText || ''}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, badgeText: e.target.value } })}
                  className="w-full p-3 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Título Principal (Linha 1)</label>
                <input
                  type="text"
                  value={config.hero?.titleLine1 || ''}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, titleLine1: e.target.value } })}
                  className="w-full p-3 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-indigo-700 mb-1">Texto em Destaque Azul/Degradê</label>
                <input
                  type="text"
                  value={config.hero?.titleHighlight || ''}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, titleHighlight: e.target.value } })}
                  className="w-full p-3 border border-indigo-300 rounded-xl font-bold bg-indigo-50/30"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Subtítulo Explicativo</label>
                <textarea
                  rows={3}
                  value={config.hero?.subtitle || ''}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, subtitle: e.target.value } })}
                  className="w-full p-3 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL da Imagem Principal (Print do Dashboard)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={config.hero?.dashboardPreviewUrl || ''}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, dashboardPreviewUrl: e.target.value } })}
                  className="w-full p-3 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Legenda abaixo da Imagem Principal</label>
                <input
                  type="text"
                  value={config.hero?.dashboardCaption || ''}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, dashboardCaption: e.target.value } })}
                  className="w-full p-3 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h3 className="font-bold text-sm text-slate-800">4 Cartões de Números / Estatísticas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(config.stats || []).map((st: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <label className="block font-bold text-slate-500">Número #{idx + 1}</label>
                    <input
                      type="text"
                      value={st.value}
                      onChange={(e) => {
                        const updated = [...config.stats];
                        updated[idx].value = e.target.value;
                        setConfig({ ...config, stats: updated });
                      }}
                      className="w-full p-2 border border-slate-300 rounded-lg font-black text-blue-600"
                    />
                    <input
                      type="text"
                      value={st.label}
                      onChange={(e) => {
                        const updated = [...config.stats];
                        updated[idx].label = e.target.value;
                        setConfig({ ...config, stats: updated });
                      }}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: OS 4 PILARES DO ECOSSISTEMA */}
        {activeTab === 'pilares' && (
          <div className="space-y-4 text-xs">
            {(config.pillars || []).map((pillar: any, idx: number) => (
              <div key={pillar.id || idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-black text-sm text-indigo-700 border-b border-slate-100 pb-2">
                  Pilar #{idx + 1}: {pillar.tabLabel}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Nome do Botão da Aba</label>
                    <input
                      type="text"
                      value={pillar.tabLabel}
                      onChange={(e) => {
                        const updated = [...config.pillars];
                        updated[idx].tabLabel = e.target.value;
                        setConfig({ ...config, pillars: updated });
                      }}
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Selo (Badge)</label>
                    <input
                      type="text"
                      value={pillar.badge}
                      onChange={(e) => {
                        const updated = [...config.pillars];
                        updated[idx].badge = e.target.value;
                        setConfig({ ...config, pillars: updated });
                      }}
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">URL da Foto / Print deste Pilar</label>
                    <input
                      type="url"
                      value={pillar.imageUrl}
                      onChange={(e) => {
                        const updated = [...config.pillars];
                        updated[idx].imageUrl = e.target.value;
                        setConfig({ ...config, pillars: updated });
                      }}
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block font-bold text-slate-600 mb-1">Título do Pilar</label>
                    <input
                      type="text"
                      value={pillar.title}
                      onChange={(e) => {
                        const updated = [...config.pillars];
                        updated[idx].title = e.target.value;
                        setConfig({ ...config, pillars: updated });
                      }}
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block font-bold text-slate-600 mb-1">Descrição</label>
                    <textarea
                      rows={2}
                      value={pillar.description}
                      onChange={(e) => {
                        const updated = [...config.pillars];
                        updated[idx].description = e.target.value;
                        setConfig({ ...config, pillars: updated });
                      }}
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block font-bold text-slate-600 mb-1">
                      Tópicos de Destaque (1 tópico por linha)
                    </label>
                    <textarea
                      rows={4}
                      value={(pillar.bullets || []).join('\n')}
                      onChange={(e) => {
                        const updated = [...config.pillars];
                        updated[idx].bullets = e.target.value.split('\n');
                        setConfig({ ...config, pillars: updated });
                      }}
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ABA 3: CARDS DE FUNCIONALIDADES / MÓDULOS */}
        {activeTab === 'modulos' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-800">
                Cards de Funcionalidades ({config.features?.length || 0})
              </h2>
              <button
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    features: [
                      ...(config.features || []),
                      { title: 'Novo Módulo', description: 'Descrição da funcionalidade...', badge: 'Novo' }
                    ]
                  })
                }
                className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"
              >
                <Plus size={14} /> Adicionar Card
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(config.features || []).map((feat: any, idx: number) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-indigo-600">Card #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = config.features.filter((_: any, i: number) => i !== idx);
                        setConfig({ ...config, features: updated });
                      }}
                      className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Selo (ex: Comercial, Engenharia)"
                    value={feat.badge || ''}
                    onChange={(e) => {
                      const updated = [...config.features];
                      updated[idx].badge = e.target.value;
                      setConfig({ ...config, features: updated });
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Título da Funcionalidade"
                    value={feat.title || ''}
                    onChange={(e) => {
                      const updated = [...config.features];
                      updated[idx].title = e.target.value;
                      setConfig({ ...config, features: updated });
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold"
                  />
                  <textarea
                    rows={3}
                    placeholder="Explicação da funcionalidade"
                    value={feat.description || ''}
                    onChange={(e) => {
                      const updated = [...config.features];
                      updated[idx].description = e.target.value;
                      setConfig({ ...config, features: updated });
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 4: GALERIA DE TELAS DO SISTEMA */}
        {activeTab === 'telas' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-800">Galeria de Imagens / Telas do Sistema</h2>
              <button
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    screensGallery: [
                      ...(config.screensGallery || []),
                      {
                        title: 'Nova Tela do Sistema',
                        subtitle: 'Descrição da tela...',
                        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1400&auto=format&fit=crop'
                      }
                    ]
                  })
                }
                className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"
              >
                <Plus size={14} /> Adicionar Tela
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(config.screensGallery || []).map((scr: any, idx: number) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700">Tela #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = config.screensGallery.filter((_: any, i: number) => i !== idx);
                        setConfig({ ...config, screensGallery: updated });
                      }}
                      className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Título da Tela"
                    value={scr.title || ''}
                    onChange={(e) => {
                      const updated = [...config.screensGallery];
                      updated[idx].title = e.target.value;
                      setConfig({ ...config, screensGallery: updated });
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold"
                  />
                  <input
                    type="url"
                    placeholder="URL da Imagem / Print"
                    value={scr.imageUrl || ''}
                    onChange={(e) => {
                      const updated = [...config.screensGallery];
                      updated[idx].imageUrl = e.target.value;
                      setConfig({ ...config, screensGallery: updated });
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  />
                  <textarea
                    rows={2}
                    placeholder="Descrição curta"
                    value={scr.subtitle || ''}
                    onChange={(e) => {
                      const updated = [...config.screensGallery];
                      updated[idx].subtitle = e.target.value;
                      setConfig({ ...config, screensGallery: updated });
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 5: PERGUNTAS FREQUENTES (FAQ) */}
        {activeTab === 'faq' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-800">Perguntas Frequentes (FAQ)</h2>
              <button
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    faqs: [...(config.faqs || []), { question: 'Nova pergunta?', answer: 'Resposta detalhada...' }]
                  })
                }
                className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"
              >
                <Plus size={14} /> Nova Pergunta
              </button>
            </div>

            <div className="space-y-3">
              {(config.faqs || []).map((faq: any, idx: number) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-indigo-600">Pergunta #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = config.faqs.filter((_: any, i: number) => i !== idx);
                        setConfig({ ...config, faqs: updated });
                      }}
                      className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => {
                      const updated = [...config.faqs];
                      updated[idx].question = e.target.value;
                      setConfig({ ...config, faqs: updated });
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold"
                  />
                  <textarea
                    rows={2}
                    value={faq.answer}
                    onChange={(e) => {
                      const updated = [...config.faqs];
                      updated[idx].answer = e.target.value;
                      setConfig({ ...config, faqs: updated });
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 6: MARCA, WHATSAPP COMERCIAL, CTA FINAL E RODAPÉ */}
        {activeTab === 'contato' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-xs">
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
              Identidade da Marca, WhatsApp Comercial &amp; Rodapé
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome da Marca (Parte 1)</label>
                <input
                  type="text"
                  value={config.brand?.nameFirst || ''}
                  onChange={(e) => setConfig({ ...config, brand: { ...config.brand, nameFirst: e.target.value } })}
                  className="w-full p-3 border border-slate-300 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-blue-600 mb-1">Nome da Marca (Destaque Azul)</label>
                <input
                  type="text"
                  value={config.brand?.nameHighlight || ''}
                  onChange={(e) => setConfig({ ...config, brand: { ...config.brand, nameHighlight: e.target.value } })}
                  className="w-full p-3 border border-blue-300 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-emerald-700 mb-1">WhatsApp Comercial (com DDI 55 + DDD)</label>
                <input
                  type="text"
                  placeholder="5511999999999"
                  value={config.brand?.whatsappNumber || ''}
                  onChange={(e) => setConfig({ ...config, brand: { ...config.brand, whatsappNumber: e.target.value } })}
                  className="w-full p-3 border border-emerald-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL de Logotipo Customizado (Opcional)</label>
                <input
                  type="url"
                  placeholder="Deixe vazio para usar o ícone Z padrão"
                  value={config.brand?.logoUrl || ''}
                  onChange={(e) => setConfig({ ...config, brand: { ...config.brand, logoUrl: e.target.value } })}
                  className="w-full p-3 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">E-mail Comercial no Rodapé</label>
                <input
                  type="email"
                  value={config.footer?.contactEmail || ''}
                  onChange={(e) => setConfig({ ...config, footer: { ...config.footer, contactEmail: e.target.value } })}
                  className="w-full p-3 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Texto de Direitos Reservados (Rodapé)</label>
                <input
                  type="text"
                  value={config.footer?.copyrightText || ''}
                  onChange={(e) => setConfig({ ...config, footer: { ...config.footer, copyrightText: e.target.value } })}
                  className="w-full p-3 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título da Chamada Final (Fundo Azul)</label>
                <input
                  type="text"
                  value={config.ctaBottom?.title || ''}
                  onChange={(e) => setConfig({ ...config, ctaBottom: { ...config.ctaBottom, title: e.target.value } })}
                  className="w-full p-3 border border-slate-300 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subtítulo da Chamada Final</label>
                <input
                  type="text"
                  value={config.ctaBottom?.subtitle || ''}
                  onChange={(e) => setConfig({ ...config, ctaBottom: { ...config.ctaBottom, subtitle: e.target.value } })}
                  className="w-full p-3 border border-slate-300 rounded-xl"
                />
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}