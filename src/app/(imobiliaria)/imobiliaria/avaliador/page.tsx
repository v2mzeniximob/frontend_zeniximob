'use client';

import { useState, useEffect } from 'react';
import { api } from '@/src/lib/api';
import { 
  TrendingUp, Search, Plus, Trash2, Printer, CheckCircle2, 
  Building2, MapPin, Ruler, Bed, Car, Sparkles, History, 
  FileText, Loader2, AlertCircle
} from 'lucide-react';

export default function AvaliadorImoveisPage() {
  const [activeTab, setActiveTab] = useState<'novo' | 'historico'>('novo');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [realEstate, setRealEstate] = useState<any>(null);
  const [savedValuations, setSavedValuations] = useState<any[]>([]);

  // Dados do Imóvel Avaliado
  const [form, setForm] = useState({
    ownerName: '',
    ownerPhone: '',
    propertyTitle: '',
    address: '',
    neighborhood: '',
    city: '',
    type: 'Apartamento',
    transaction: 'Venda',
    area: '',
    bedrooms: '2',
    bathrooms: '1',
    garage: '1',
    conservationState: 'Padrão', // Novo/Reformado (+8%), Padrão (0%), Precisa de Reforma (-10%)
    brokerName: '',
    brokerCreci: '',
    notes: 'Avaliação realizada segundo o Método Comparativo Direto de Dados de Mercado (ABNT NBR 14653), considerando a liquidez atual da região e o estado de conservação do imóvel.'
  });

  // Imóveis Comparáveis (Da base + Adicionados manualmente)
  const [comparables, setComparables] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal/Form rápido para adicionar amostra externa (ex: anúncio do Zap/VivaReal)
  const [externalComp, setExternalComp] = useState({
    title: '', neighborhood: '', area: '', price: '', bedrooms: '2'
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/valuations');
      setSavedValuations(res.data.valuations || []);
      setRealEstate(res.data.realEstate || null);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchComparables = async () => {
    if (!form.area || Number(form.area) <= 0) {
      alert('Preencha a Área (m²) do imóvel avaliado primeiro para calcularmos as métricas.');
      return;
    }
    setIsSearching(true);
    try {
      const res = await api.get('/valuations/comparables', {
        params: {
          type: form.type,
          transaction: form.transaction,
          neighborhood: form.neighborhood,
          city: form.city
        }
      });
      const list = res.data || [];
      setComparables(list);
      // Seleciona automaticamente os que são do mesmo bairro (ou os primeiros 5)
      const autoSelected = list
        .filter((item: any) => item.exactNeighborhoodMatch)
        .map((item: any) => item.id);
      
      setSelectedIds(autoSelected.length > 0 ? autoSelected : list.slice(0, 5).map((i: any) => i.id));
    } catch (error) {
      alert('Erro ao buscar imóveis comparáveis na base.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleAddExternalComparable = () => {
    if (!externalComp.title || !externalComp.area || !externalComp.price) {
      alert('Preencha Título, Área e Preço da amostra externa.');
      return;
    }
    const areaNum = Number(externalComp.area);
    const priceNum = Number(externalComp.price);
    const newId = `ext_${Date.now()}`;

    const newItem = {
      id: newId,
      title: `${externalComp.title} (Amostra de Mercado)`,
      neighborhood: externalComp.neighborhood || form.neighborhood,
      area: areaNum,
      price: priceNum,
      sqmPrice: priceNum / areaNum,
      bedrooms: Number(externalComp.bedrooms || 0),
      exactNeighborhoodMatch: true,
      isExternal: true
    };

    setComparables(prev => [newItem, ...prev]);
    setSelectedIds(prev => [...prev, newId]);
    setExternalComp({ title: '', neighborhood: '', area: '', price: '', bedrooms: '2' });
  };

  // ==========================================
  // CÁLCULO INTELIGENTE DE PRECIFICAÇÃO (PTAM)
  // ==========================================
  const activeComparables = comparables.filter(c => selectedIds.includes(c.id));
  
  const rawAvgSqmPrice = activeComparables.length > 0
    ? activeComparables.reduce((acc, cur) => acc + (cur.price / cur.area), 0) / activeComparables.length
    : 0;

  // Fator de Conservação
  const conservationMultiplier = 
    form.conservationState === 'Novo/Reformado' ? 1.08 :
    form.conservationState === 'Precisa de Reforma' ? 0.90 : 1.0;

  const adjustedSqmPrice = rawAvgSqmPrice * conservationMultiplier;
  const targetArea = Number(form.area) || 0;

  const estimatedPrice = adjustedSqmPrice * targetArea;
  const minPrice = estimatedPrice * 0.93; // -7% (Liquidez Rápida)
  const maxPrice = estimatedPrice * 1.07; // +7% (Teto de Negociação)

  // ==========================================
  // GERADOR DO PDF EXECUTIVO (PTAM / ACM)
  // ==========================================
  const openPtamPdf = (data: any) => {
    const comps = Array.isArray(data.comparablesJson) ? data.comparablesJson : [];
    const storeName = realEstate?.tradeName || 'Imobiliária';
    const storeLogo = realEstate?.logoUrl || '';
    const storePhone = realEstate?.phone || '';
    const storeEmail = realEstate?.email || '';
    const storeCnpj = realEstate?.cnpj || '';

    const formatBRL = (val: number) => Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Laudo PTAM - ${data.propertyTitle}</title>
        <style>
          * { box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          body { margin: 0; padding: 35px; color: #1e293b; background: #fff; line-height: 1.5; }
          .print-bar { background: #1e293b; color: white; padding: 14px 24px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
          .print-btn { background: #2563eb; color: white; border: none; padding: 10px 22px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px; }
          @media print { .print-bar { display: none !important; } body { padding: 15px; } }
          
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 25px; }
          .logo-box img { max-height: 65px; max-width: 200px; object-fit: contain; }
          .doc-title { text-align: right; }
          .doc-title h1 { margin: 0; font-size: 22px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
          .doc-title p { margin: 4px 0 0; font-size: 12px; color: #64748b; font-weight: 600; }

          .section-title { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #2563eb; font-weight: 800; margin: 25px 0 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
          
          .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 13px; }
          .info-item strong { display: block; font-size: 11px; color: #64748b; text-transform: uppercase; }

          .valuation-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
          .v-card { padding: 18px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0; }
          .v-card.highlight { background: #eff6ff; border: 2px solid #2563eb; }
          .v-card span { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 6px; }
          .v-card.highlight span { color: #1d4ed8; }
          .v-card strong { font-size: 22px; color: #0f172a; display: block; }
          .v-card.highlight strong { font-size: 26px; color: #1e40af; }
          .v-card small { font-size: 11px; color: #64748b; }

          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th { background: #0f172a; color: white; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; }
          td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) { background: #f8fafc; }

          .notes-box { background: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; border-radius: 0 8px 8px 0; font-size: 13px; color: #334155; margin-top: 15px; white-space: pre-wrap; }
          .signatures { display: flex; justify-content: space-around; margin-top: 65px; page-break-inside: avoid; }
          .sig-line { border-top: 1px solid #334155; width: 260px; text-align: center; padding-top: 8px; font-size: 12px; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="print-bar">
          <span>📄 <strong>Estudo de Mercado e Avaliação Imobiliária (PTAM / ACM)</strong> pronto para impressão.</span>
          <button class="print-btn" onclick="window.print()">🖨️ Imprimir / Salvar em PDF</button>
        </div>

        <div class="header">
          <div class="logo-box">
            ${storeLogo ? `<img src="${storeLogo}" alt="${storeName}" />` : `<h2 style="margin:0;color:#2563eb;">${storeName}</h2>`}
            <div style="font-size:11px; color:#64748b; margin-top:4px;">
              ${storeCnpj ? `CNPJ: ${storeCnpj} • ` : ''}${storePhone} ${storeEmail ? `• ${storeEmail}` : ''}
            </div>
          </div>
          <div class="doc-title">
            <h1>Parecer Técnico de Mercado</h1>
            <p>Estudo de Precificação Imobiliária (ACM / PTAM) • Data: ${new Date(data.createdAt || Date.now()).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        <div class="section-title">1. Identificação do Imóvel Avaliado</div>
        <div class="info-grid">
          <div class="info-item"><strong>Proprietário / Solicitante</strong>${data.ownerName} ${data.ownerPhone ? `(${data.ownerPhone})` : ''}</div>
          <div class="info-item"><strong>Imóvel / Referência</strong>${data.propertyTitle}</div>
          <div class="info-item"><strong>Finalidade & Tipo</strong>${data.transaction} • ${data.type}</div>
          <div class="info-item"><strong>Localização</strong>${data.address} - ${data.neighborhood}, ${data.city}</div>
          <div class="info-item"><strong>Dimensões e Tipologia</strong>${data.area} m² • ${data.bedrooms} Quartos • ${data.garage} Vagas</div>
          <div class="info-item"><strong>Estado de Conservação</strong>${data.conservationState}</div>
        </div>

        <div class="section-title">2. Conclusão de Valor de Mercado</div>
        <div class="valuation-cards">
          <div class="v-card">
            <span>Liquidez Rápida (-7%)</span>
            <strong>${formatBRL(data.minPrice)}</strong>
            <small>Atrai propostas imediatas</small>
          </div>
          <div class="v-card highlight">
            <span>Valor Justo Recomendado</span>
            <strong>${formatBRL(data.estimatedPrice)}</strong>
            <small>Valor médio ajustado: ${formatBRL(data.avgSqmPrice)} / m²</small>
          </div>
          <div class="v-card">
            <span>Teto de Mercado (+7%)</span>
            <strong>${formatBRL(data.maxPrice)}</strong>
            <small>Margem para negociação</small>
          </div>
        </div>

        <div class="section-title">3. Amostragem de Imóveis Comparáveis na Região (${comps.length} Imóveis)</div>
        <table>
          <thead>
            <tr>
              <th>Imóvel / Referência</th>
              <th>Bairro</th>
              <th>Área Útil</th>
              <th>Quartos</th>
              <th>Valor Anunciado</th>
              <th>Valor do m²</th>
            </tr>
          </thead>
          <tbody>
            ${comps.map((c: any) => `
              <tr>
                <td><strong>${c.title}</strong></td>
                <td>${c.neighborhood || '-'}</td>
                <td>${c.area} m²</td>
                <td>${c.bedrooms || '-'}</td>
                <td>${formatBRL(c.price)}</td>
                <td><strong>${formatBRL(c.price / c.area)}/m²</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="section-title">4. Parecer Técnico e Metodologia</div>
        <div class="notes-box">${data.notes || 'Estudo fundamentado no Método Comparativo Direto de Dados de Mercado.'}</div>

        <div class="signatures">
          <div class="sig-line">
            <strong>${data.brokerName || storeName}</strong><br/>
            ${data.brokerCreci ? `CRECI: ${data.brokerCreci}` : 'Consultor / Avaliador Imobiliário'}
          </div>
          <div class="sig-line">
            <strong>${data.ownerName}</strong><br/>
            Proprietário / Solicitante
          </div>
        </div>

        <div class="footer">
          Documento gerado eletronicamente pelo sistema de inteligência imobiliária ZenixImob • ${storeName}
        </div>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const handleSaveAndGeneratePDF = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeComparables.length === 0) {
      alert('Selecione pelo menos 1 imóvel comparável para embasar o Laudo PTAM.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...form,
        area: Number(form.area),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        garage: Number(form.garage),
        avgSqmPrice: adjustedSqmPrice,
        estimatedPrice,
        minPrice,
        maxPrice,
        comparablesJson: activeComparables
      };

      const res = await api.post('/valuations', payload);
      openPtamPdf(res.data);
      fetchHistory();
    } catch (error) {
      alert('Erro ao salvar o laudo de avaliação.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteValuation = async (id: string) => {
    if (!confirm('Deseja excluir este laudo do histórico?')) return;
    try {
      await api.delete(`/valuations/${id}`);
      fetchHistory();
    } catch (error) {
      alert('Erro ao excluir laudo.');
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-slate-400"><Loader2 className="animate-spin" size={40}/></div>;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto font-sans">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <TrendingUp className="text-blue-600 bg-blue-50 p-1.5 rounded-xl" size={36} />
            Avaliador Inteligente (Laudo PTAM / ACM)
          </h1>
          <p className="text-slate-500 mt-1">Calcule o valor real do m² da região e gere laudos executivos em PDF para convencer proprietários.</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button onClick={() => setActiveTab('novo')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'novo' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}>
            <Sparkles size={16}/> Nova Avaliação
          </button>
          <button onClick={() => setActiveTab('historico')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'historico' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}>
            <History size={16}/> Laudos Emitidos ({savedValuations.length})
          </button>
        </div>
      </div>

      {activeTab === 'novo' ? (
        <form onSubmit={handleSaveAndGeneratePDF} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COLUNA ESQUERDA: DADOS DO IMÓVEL AVALIADO */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
              <h2 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Building2 size={20} className="text-blue-600"/> 1. Dados do Imóvel do Proprietário
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nome do Proprietário *</label>
                  <input required type="text" placeholder="Ex: João da Silva" value={form.ownerName} onChange={e => setForm({...form, ownerName: e.target.value})} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Telefone / WhatsApp</label>
                  <input type="text" placeholder="(11) 99999-9999" value={form.ownerPhone} onChange={e => setForm({...form, ownerPhone: e.target.value})} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Título de Identificação do Imóvel *</label>
                <input required type="text" placeholder="Ex: Apartamento 3 Dorms - Edifício Solar" value={form.propertyTitle} onChange={e => setForm({...form, propertyTitle: e.target.value})} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Finalidade *</label>
                  <select value={form.transaction} onChange={e => setForm({...form, transaction: e.target.value})} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white outline-none">
                    <option value="Venda">Venda</option>
                    <option value="Aluguel">Aluguel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tipo de Imóvel *</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white outline-none">
                    <option value="Apartamento">Apartamento</option>
                    <option value="Casa">Casa</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Terreno">Terreno</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Bairro *</label>
                  <input required type="text" placeholder="Ex: Tatuapé" value={form.neighborhood} onChange={e => setForm({...form, neighborhood: e.target.value})} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Cidade *</label>
                  <input required type="text" placeholder="Ex: São Paulo" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Endereço Completo *</label>
                <input required type="text" placeholder="Rua, Número, Complemento" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Área (m²) *</label>
                  <input required type="number" step="0.01" placeholder="85" value={form.area} onChange={e => setForm({...form, area: e.target.value})} className="w-full px-3 py-2.5 border border-blue-400 bg-blue-50/40 font-bold rounded-xl text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Quartos</label>
                  <input type="number" value={form.bedrooms} onChange={e => setForm({...form, bedrooms: e.target.value})} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Banheiros</label>
                  <input type="number" value={form.bathrooms} onChange={e => setForm({...form, bathrooms: e.target.value})} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Vagas</label>
                  <input type="number" value={form.garage} onChange={e => setForm({...form, garage: e.target.value})} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Fator de Conservação do Imóvel</label>
                <select value={form.conservationState} onChange={e => setForm({...form, conservationState: e.target.value})} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white outline-none font-semibold">
                  <option value="Novo/Reformado">✨ Novo / Alto Padrão / Reformado (+8% no m²)</option>
                  <option value="Padrão">🏠 Estado Padrão de Conservação (Média exata)</option>
                  <option value="Precisa de Reforma">🛠️ Antigo / Precisa de Reforma (-10% no m²)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Avaliador / Corretor</label>
                  <input type="text" placeholder="Seu Nome" value={form.brokerName} onChange={e => setForm({...form, brokerName: e.target.value})} className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nº do CRECI</label>
                  <input type="text" placeholder="Ex: 123456-F" value={form.brokerCreci} onChange={e => setForm({...form, brokerCreci: e.target.value})} className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Observações Técnicas do Laudo</label>
                <textarea rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl text-xs outline-none resize-none" />
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: AMOSTRAGEM E RESULTADO EM TEMPO REAL */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* PAINEL DE RESULTADO EM TEMPO REAL */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs uppercase tracking-widest text-blue-400 font-bold">Resultado do Cálculo Mercadológico</span>
                <span className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-300">{activeComparables.length} imóveis na amostra</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                  <span className="text-xs text-slate-400 block">Liquidez Rápida (-7%)</span>
                  <strong className="text-lg font-bold text-emerald-400">
                    {minPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </strong>
                </div>
                <div className="bg-blue-600 p-4 rounded-2xl shadow-md transform md:scale-105">
                  <span className="text-xs text-blue-100 font-bold uppercase block">Valor Justo Recomendado</span>
                  <strong className="text-2xl font-black text-white">
                    {estimatedPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </strong>
                  <span className="text-[11px] text-blue-100 block mt-1">
                    Média ajustada: {adjustedSqmPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/m²
                  </span>
                </div>
                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                  <span className="text-xs text-slate-400 block">Teto de Mercado (+7%)</span>
                  <strong className="text-lg font-bold text-amber-400">
                    {maxPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </strong>
                </div>
              </div>

              <button type="submit" disabled={isSaving || activeComparables.length === 0} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-40">
                {isSaving ? <Loader2 size={20} className="animate-spin"/> : <Printer size={20}/>}
                Salvar Estudo & Gerar Laudo PTAM em PDF
              </button>
            </div>

            {/* BUSCA DE IMÓVEIS COMPARÁVEIS NA BASE */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">2. Imóveis Comparáveis (Amostragem)</h3>
                  <p className="text-xs text-slate-500">Busque imóveis da sua carteira ou adicione anúncios externos para compor a média do m².</p>
                </div>
                <button type="button" onClick={handleSearchComparables} disabled={isSearching} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all shadow-sm">
                  {isSearching ? <Loader2 size={16} className="animate-spin"/> : <Search size={16}/>}
                  Buscar Comparáveis na Base
                </button>
              </div>

              {/* ADICIONAR AMOSTRA EXTERNA (CONCORRÊNCIA/PORTAIS) */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 mb-4">
                <p className="text-xs font-bold text-slate-600 mb-2">➕ Adicionar Imóvel Comparável Externo (Ex: Anúncio do Zap / VivaReal)</p>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <input type="text" placeholder="Ex: Apto Rua X (Zap)" value={externalComp.title} onChange={e => setExternalComp({...externalComp, title: e.target.value})} className="sm:col-span-5 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white" />
                  <input type="number" placeholder="Área m²" value={externalComp.area} onChange={e => setExternalComp({...externalComp, area: e.target.value})} className="sm:col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white" />
                  <input type="number" placeholder="Valor R$" value={externalComp.price} onChange={e => setExternalComp({...externalComp, price: e.target.value})} className="sm:col-span-3 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white" />
                  <button type="button" onClick={handleAddExternalComparable} className="sm:col-span-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold py-2 flex items-center justify-center gap-1">
                    <Plus size={14}/> Incluir
                  </button>
                </div>
              </div>

              {/* LISTA DE COMPARÁVEIS */}
              {comparables.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <AlertCircle size={32} className="mx-auto mb-2 opacity-50"/>
                  <p className="text-sm font-medium">Nenhuma amostra carregada ainda.</p>
                  <p className="text-xs mt-1">Preencha a Área e o Bairro ao lado e clique em "Buscar Comparáveis na Base".</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {comparables.map(comp => {
                    const isSelected = selectedIds.includes(comp.id);
                    const sqm = comp.price / comp.area;
                    return (
                      <div key={comp.id} onClick={() => handleToggleSelect(comp.id)} className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-4 ${isSelected ? 'border-blue-600 bg-blue-50/40' : 'border-slate-200 hover:border-slate-300 bg-white opacity-70'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'border-2 border-slate-300'}`}>
                            {isSelected && <CheckCircle2 size={14}/>}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-800 text-sm">{comp.title}</h4>
                              {comp.exactNeighborhoodMatch && <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Mesmo Bairro</span>}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                              <span className="flex items-center gap-1"><MapPin size={12}/> {comp.neighborhood || 'Sem bairro'}</span>
                              <span className="flex items-center gap-1"><Ruler size={12}/> {comp.area} m²</span>
                              <span className="flex items-center gap-1"><Bed size={12}/> {comp.bedrooms} dorms</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <strong className="text-sm font-black text-slate-800 block">
                            {Number(comp.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </strong>
                          <span className="text-xs font-bold text-blue-600">
                            {sqm.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/m²
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </form>
      ) : (
        /* ABA DE HISTÓRICO DE LAUDOS EMITIDOS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedValuations.map(val => (
            <div key={val.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full">{val.transaction} • {val.type}</span>
                  <span className="text-xs text-slate-400">{new Date(val.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <h3 className="font-bold text-lg text-slate-800">{val.propertyTitle}</h3>
                <p className="text-xs text-slate-500 mt-1">Proprietário: <strong>{val.ownerName}</strong></p>
                <p className="text-xs text-slate-500">{val.neighborhood}, {val.city} • {val.area} m²</p>

                <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Valor Recomendado no Laudo</span>
                  <strong className="text-xl font-black text-blue-600">
                    {Number(val.estimatedPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </strong>
                  <span className="text-xs text-slate-500 block">
                    ({Number(val.avgSqmPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/m²)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100">
                <button onClick={() => openPtamPdf(val)} className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                  <FileText size={14}/> Reabrir Laudo PDF
                </button>
                <button onClick={() => handleDeleteValuation(val.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                  <Trash2 size={16}/>
                </button>
              </div>
            </div>
          ))}
          {savedValuations.length === 0 && (
            <div className="col-span-full text-center py-16 text-slate-400">
              Nenhum laudo PTAM emitido ainda.
            </div>
          )}
        </div>
      )}

    </div>
  );
}