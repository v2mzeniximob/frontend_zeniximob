'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '../../../../lib/api';
import { 
  Plus, Edit, X, CheckCircle2, XCircle, Loader2, Home, 
  MapPin, DollarSign, Camera, User, UserCheck, FileSignature, 
  Key, Sparkles, Rss, Building2, Play, Compass, Palette, 
  Download, Copy, Upload, Image as ImageIcon, Hash
} from 'lucide-react';
import { maskCep, maskCnpj, maskPhone } from '@/src/utils/mask';

const AVAILABLE_AMENITIES = [
  'Piscina', 'Churrasqueira', 'Elevador', 'Academia', 
  'Quadra Poliesportiva', 'Varanda', 'Ar Condicionado', 
  'Móveis Planejados', 'Portaria 24h', 'Salão de Festas'
];

const maskCepInput = (value: string) => {
  return value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{3})\d+?$/, '$1');
};

export default function ImoveisPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [brokers, setBrokers] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [condominiums, setCondominiums] = useState<any[]>([]);
  const [storeSlug, setStoreSlug] = useState<string>('');
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
   
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // =========================================================
  // ESTADOS DO ESTÚDIO DE MARKETING (INSTAGRAM)
  // =========================================================
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [studioProperty, setStudioProperty] = useState<any>(null);
  const [studioConfig, setStudioConfig] = useState({
    format: 'feed' as 'feed' | 'stories',
    theme: 'dark' as 'dark' | 'clean' | 'gold',
    accentColor: '#2563eb',
    badgeText: 'OPORTUNIDADE',
    headline: '',
    locationText: '',
    priceText: '',
    footerText: '',
    selectedPhotoUrl: '',
    showSpecs: true
  });
  const [loadedImageObj, setLoadedImageObj] = useState<HTMLImageElement | null>(null);
  const [imageCorsError, setImageCorsError] = useState(false);

  // Estado: Formulário de Imóvel com Código e demais campos
  const [form, setForm] = useState({
    code: '', title: '', type: 'Casa', category: 'Residencial', transaction: 'Locação',
    price: '', condoFee: '', iptu: '', area: '', bedrooms: '', bathrooms: '', garage: '', yearBuilt: '',
    cep: '', address: '', neighborhood: '', city: '', state: '',
    description: '', imageUrls: '', brokerId: '', ownerId: '', inspectionUrl: '',
    rentProposalUrl: '', saleProposalUrl: '', keyTermUrl: '', exportToPortals: false,
    condominiumId: '', iptuRegistration: '', 
     
    acceptsFinancing: false, acceptsExchange: false, exchangeDetails: '',
    videoUrl: '', tour360Url: '',
    exclusive: false, exclusiveUntil: '', captatorId: '',

    amenities: [] as string[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resProps, resBrokers, resOwners, resCondos, resStore] = await Promise.all([
        api.get('/properties'),
        api.get('/brokers'),
        api.get('/owners'),
        api.get('/condominiums'),
        api.get('/my-store').catch(() => ({ data: {} }))
      ]);
      setProperties(resProps.data);
      setBrokers(resBrokers.data);
      setOwners(resOwners.data);
      setCondominiums(resCondos.data);
      setStoreInfo(resStore.data || {});
      if(resStore.data.slug) setStoreSlug(resStore.data.slug);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================
  // LÓGICA DO ESTÚDIO DE MARKETING (CANVAS INSTAGRAM)
  // =========================================================
  const handleOpenStudioModal = (prop: any) => {
    const firstPhoto = prop.imageUrls && prop.imageUrls.length > 0 ? prop.imageUrls[0] : '';
    const storeName = storeInfo?.tradeName || 'Consulte-nos';
    const storePhone = storeInfo?.whatsappDisplay || storeInfo?.phone || '';
    const formattedPrice = `R$ ${Number(prop.price || 0).toLocaleString('pt-BR')}${prop.transaction === 'Locação' ? '/mês' : ''}`;

    setStudioProperty(prop);
    setStudioConfig({
      format: 'feed',
      theme: 'dark',
      accentColor: prop.transaction === 'Venda' ? '#2563eb' : '#059669',
      badgeText: prop.transaction === 'Venda' ? 'VENDE-SE' : 'ALUGA-SE',
      headline: prop.title || `${prop.type} em ${prop.neighborhood}`,
      locationText: `${prop.neighborhood || ''}${prop.city ? ` • ${prop.city}` : ''}`,
      priceText: formattedPrice,
      footerText: `${storeName}${storePhone ? ` • WhatsApp: ${maskPhone(storePhone)}` : ''}`,
      selectedPhotoUrl: firstPhoto,
      showSpecs: true
    });
  };

  useEffect(() => {
    if (!studioProperty) return;
    if (!studioConfig.selectedPhotoUrl) {
      setLoadedImageObj(null);
      setImageCorsError(false);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setLoadedImageObj(img);
      setImageCorsError(false);
    };
    img.onerror = () => {
      setLoadedImageObj(null);
      setImageCorsError(true);
    };
    img.src = studioConfig.selectedPhotoUrl;
  }, [studioConfig.selectedPhotoUrl, studioProperty]);

  useEffect(() => {
    if (!studioProperty || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1080;
    const height = studioConfig.format === 'feed' ? 1080 : 1920;
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    if (loadedImageObj) {
      const imgRatio = loadedImageObj.width / loadedImageObj.height;
      const canvasRatio = width / height;
      let drawWidth = width;
      let drawHeight = height;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > canvasRatio) {
        drawWidth = height * imgRatio;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawHeight = width / imgRatio;
        offsetY = (height - drawHeight) / 2;
      }
      ctx.drawImage(loadedImageObj, offsetX, offsetY, drawWidth, drawHeight);
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#1e293b');
      bgGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);
    }

    const topGrad = ctx.createLinearGradient(0, 0, 0, 320);
    topGrad.addColorStop(0, 'rgba(0,0,0,0.65)');
    topGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, width, 320);

    const bottomStart = studioConfig.format === 'feed' ? height * 0.38 : height * 0.45;
    const bottomGrad = ctx.createLinearGradient(0, bottomStart, 0, height);
    bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
    bottomGrad.addColorStop(0.55, studioConfig.theme === 'clean' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(10, 15, 29, 0.92)');
    bottomGrad.addColorStop(1, studioConfig.theme === 'clean' ? 'rgba(15, 23, 42, 0.98)' : 'rgba(5, 8, 18, 0.99)');
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(0, bottomStart, width, height - bottomStart);

    const badgeColor = studioConfig.theme === 'gold' ? '#d97706' : studioConfig.accentColor;
    ctx.font = '900 30px Arial, sans-serif';
    const badgePaddingX = 36;
    const badgeTextWidth = ctx.measureText(studioConfig.badgeText.toUpperCase()).width;
    const badgeWidth = badgeTextWidth + badgePaddingX * 2;
    const badgeHeight = 68;
    const badgeX = 70;
    const badgeY = studioConfig.format === 'feed' ? 65 : 130;

    ctx.fillStyle = badgeColor;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 16);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(studioConfig.badgeText.toUpperCase(), badgeX + badgePaddingX, badgeY + badgeHeight / 2 + 2);

    if (studioProperty.type) {
      ctx.font = 'bold 26px Arial, sans-serif';
      const typeText = studioProperty.type.toUpperCase();
      const typeW = ctx.measureText(typeText).width + 50;
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.roundRect(width - typeW - 70, badgeY, typeW, badgeHeight, 16);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(typeText, width - typeW - 45, badgeY + badgeHeight / 2 + 2);
    }

    const baseBottomY = studioConfig.format === 'feed' ? height - 70 : height - 120;

    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = 'bold 26px Arial, sans-serif';
    ctx.fillText(studioConfig.footerText, 70, baseBottomY);

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(70, baseBottomY - 45);
    ctx.lineTo(width - 70, baseBottomY - 45);
    ctx.stroke();

    ctx.font = '900 62px Arial, sans-serif';
    const priceText = studioConfig.priceText;
    const priceY = baseBottomY - 125;

    ctx.fillStyle = studioConfig.theme === 'gold' ? '#fbbf24' : '#38bdf8';
    ctx.fillText(priceText, 70, priceY);

    let specsOffsetY = priceY - 85;
    if (studioConfig.showSpecs) {
      const specs: string[] = [];
      if (studioProperty.area) specs.push(`📐 ${studioProperty.area} m²`);
      if (studioProperty.bedrooms) specs.push(`🛏️ ${studioProperty.bedrooms} Quartos`);
      if (studioProperty.bathrooms) specs.push(`🚿 ${studioProperty.bathrooms} Banh.`);
      if (studioProperty.garage) specs.push(`🚗 ${studioProperty.garage} Vagas`);

      if (specs.length > 0) {
        const specsLine = specs.join('    •    ');
        ctx.font = 'bold 28px Arial, sans-serif';
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(specsLine, 70, specsOffsetY);
        specsOffsetY -= 70;
      }
    }

    ctx.font = '900 48px Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    const words = (studioConfig.headline || '').split(' ');
    const maxTextWidth = width - 140;
    let line1 = '';
    let line2 = '';

    for (const word of words) {
      const testLine = line1 ? `${line1} ${word}` : word;
      if (ctx.measureText(testLine).width <= maxTextWidth) {
        line1 = testLine;
      } else {
        line2 = line2 ? `${line2} ${word}` : word;
      }
    }

    if (line2) {
      ctx.fillText(line2, 70, specsOffsetY);
      ctx.fillText(line1, 70, specsOffsetY - 60);
      specsOffsetY -= 125;
    } else {
      ctx.fillText(line1, 70, specsOffsetY);
      specsOffsetY -= 65;
    }

    if (studioConfig.locationText) {
      ctx.font = 'bold 28px Arial, sans-serif';
      ctx.fillStyle = studioConfig.theme === 'gold' ? '#fcd34d' : '#93c5fd';
      ctx.fillText(`📍 ${studioConfig.locationText.toUpperCase()}`, 70, specsOffsetY);
    }

  }, [studioConfig, loadedImageObj, studioProperty]);

  const handleUploadLocalStudioPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setStudioConfig(prev => ({ ...prev, selectedPhotoUrl: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadInstagramImage = () => {
    if (!canvasRef.current || !studioProperty) return;
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      const safeName = studioProperty.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `post_${studioConfig.format}_${safeName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      alert('Este link de imagem externo bloqueia exportação direta por segurança do navegador (CORS). Clique em "Subir Foto do PC/Telemóvel" ao lado para usar uma foto local!');
    }
  };

  const generateInstagramCaption = () => {
    if (!studioProperty) return '';
    const storeName = storeInfo?.tradeName || 'Nossa Imobiliária';
    const storePhone = storeInfo?.whatsappDisplay || storeInfo?.phone || '';
    const bairroTag = (studioProperty.neighborhood || 'imoveis').replace(/\s+/g, '').toLowerCase();
    const cidadeTag = (studioProperty.city || 'brasil').replace(/\s+/g, '').toLowerCase();

    return `✨ ${studioConfig.badgeText}: ${studioConfig.headline}!\n\n` +
      `📍 Localização: ${studioProperty.neighborhood}, ${studioProperty.city}\n` +
      `💰 Valor: ${studioConfig.priceText}\n\n` +
      `Destaques do Imóvel:\n` +
      `• Área: ${studioProperty.area} m²\n` +
      (studioProperty.bedrooms ? `• ${studioProperty.bedrooms} Dormitório(s)\n` : '') +
      (studioProperty.bathrooms ? `• ${studioProperty.bathrooms} Banheiro(s)\n` : '') +
      (studioProperty.garage ? `• ${studioProperty.garage} Vaga(s) de garagem\n` : '') +
      (studioProperty.acceptsFinancing ? `✅ Aceita Financiamento!\n` : '') +
      `\n📲 Agende a sua visita agora mesmo com a ${storeName}!\n` +
      (storePhone ? `WhatsApp: ${maskPhone(storePhone)}\n\n` : '\n') +
      `#imoveis #${bairroTag} #${cidadeTag} #mercadoimobiliario #${studioProperty.type?.toLowerCase() || 'imovel'}`;
  };

  const handleCopyCaption = () => {
    const caption = generateInstagramCaption();
    navigator.clipboard.writeText(caption);
    alert('Legenda copiada com sucesso! Agora é só colar no Instagram.');
  };

  // =========================================================
  // FUNÇÕES DO IMÓVEL
  // =========================================================
  const handleOpenPropertyModal = (property?: any) => {
    if (property) {
      setEditingId(property.id);
      setForm({
        code: property.code || '', title: property.title || '', type: property.type || 'Casa', category: property.category || 'Residencial', transaction: property.transaction || 'Locação',
        price: property.price || '', condoFee: property.condoFee || '', iptu: property.iptu || '',
        area: property.area || '', bedrooms: property.bedrooms || '', bathrooms: property.bathrooms || '',
        garage: property.garage || '', yearBuilt: property.yearBuilt || '', cep: property.cep || '',
        address: property.address || '', neighborhood: property.neighborhood || '', city: property.city || '',
        state: property.state || '', description: property.description || '', imageUrls: property.imageUrls ? property.imageUrls.join(', ') : '',
        brokerId: property.brokerId || '', ownerId: property.ownerId || '', inspectionUrl: property.inspectionUrl || '',
        rentProposalUrl: property.rentProposalUrl || '', saleProposalUrl: property.saleProposalUrl || '',
        keyTermUrl: property.keyTermUrl || '', exportToPortals: property.exportToPortals || false,
        condominiumId: property.condominiumId || '', iptuRegistration: property.iptuRegistration || '', 
         
        acceptsFinancing: property.acceptsFinancing || false,
        acceptsExchange: property.acceptsExchange || false,
        exchangeDetails: property.exchangeDetails || '',
        videoUrl: property.videoUrl || '',
        tour360Url: property.tour360Url || '',
        exclusive: property.exclusive || false,
        exclusiveUntil: property.exclusiveUntil ? new Date(property.exclusiveUntil).toISOString().split('T')[0] : '',
        captatorId: property.captatorId || '',

        amenities: property.amenities || []
      });
    } else {
      setEditingId(null);
      setForm({
        code: '', title: '', type: 'Casa', category: 'Residencial', transaction: 'Locação',
        price: '', condoFee: '', iptu: '', area: '', bedrooms: '', bathrooms: '', garage: '', yearBuilt: '',
        cep: '', address: '', neighborhood: '', city: '', state: '', description: '', imageUrls: '', brokerId: '', ownerId: '', inspectionUrl: '',
        rentProposalUrl: '', saleProposalUrl: '', keyTermUrl: '', exportToPortals: false,
        condominiumId: '', iptuRegistration: '', 
        acceptsFinancing: false, acceptsExchange: false, exchangeDetails: '', videoUrl: '', tour360Url: '', exclusive: false, exclusiveUntil: '', captatorId: '',
        amenities: []
      });
    }
    setIsPropertyModalOpen(true);
  };

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
     
    const urlsArray = form.imageUrls.split(',').map(url => url.trim()).filter(url => url !== '');
    const dataToSend = { ...form, imageUrls: urlsArray };

    try {
      if (editingId) {
        await api.put(`/properties/${editingId}`, dataToSend);
        alert('Imóvel atualizado com sucesso!');
      } else {
        await api.post('/properties', dataToSend);
        alert('Imóvel cadastrado com sucesso!');
      }
      setIsPropertyModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar imóvel.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    if (!confirm('Deseja alterar o status de visibilidade deste imóvel?')) return;
    try {
      await api.patch(`/properties/${id}/status`);
      fetchData();
    } catch (error) {
      alert('Erro ao alterar status.');
    }
  };

  const handleToggleAmenity = (amenity: string) => {
    setForm(prev => {
      const isSelected = prev.amenities.includes(amenity);
      if (isSelected) {
        return { ...prev, amenities: prev.amenities.filter(a => a !== amenity) };
      } else {
        return { ...prev, amenities: [...prev.amenities, amenity] };
      }
    });
  };

  const handleGenerateAiDescription = async () => {
    if (!form.type || !form.neighborhood || !form.price) {
      alert('Preencha pelo menos o Tipo, Bairro e Valor antes de pedir à IA para gerar o texto.');
      return;
    }
    setIsGeneratingAi(true);
    try {
      const response = await api.post('/ai/generate-description', {
        type: form.type, transaction: form.transaction, neighborhood: form.neighborhood,
        city: form.city, bedrooms: form.bedrooms || '0', suites: '0', garage: form.garage || '0',
        price: form.price, features: form.amenities.join(', ')
      });
      setForm(prev => ({ ...prev, description: response.data.description }));
      alert('✨ Descrição gerada com sucesso!');
    } catch (error: any) {
      alert('Erro ao contactar a IA.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleCopyXmlLink = () => {
    if (!storeSlug) { alert('Erro: O slug da sua loja não está configurado.'); return; }
    const xmlUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'}/public/xml/${storeSlug}`;
    navigator.clipboard.writeText(xmlUrl);
    alert(`Link do Feed XML copiado!\n\nCole este link no painel do Zap Imóveis ou VivaReal:\n${xmlUrl}`);
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCepInput(e.target.value);
    setForm({ ...form, cep: masked });

    if (masked.length === 9) {
      setIsFetchingCep(true);
      try {
        const rawCep = masked.replace(/\D/g, '');
        const response = await api.get(`/integrations/cep/${rawCep}`);
        const data = response.data;
        setForm(prev => ({ ...prev, address: data.street || prev.address, neighborhood: data.neighborhood || prev.neighborhood, city: data.city || prev.city, state: data.state || prev.state }));
      } catch (error) {
        console.log('CEP não encontrado.');
      } finally {
        setIsFetchingCep(false);
      }
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center text-slate-500"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 max-w-[1600px] mx-auto font-sans">
      
      {/* CABEÇALHO DA PÁGINA */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Home className="text-blue-600" size={32} />
            Catálogo de Imóveis
          </h1>
          <p className="text-slate-500 mt-1">Gira os seus imóveis, artes para redes sociais e integrações com portais.</p>
        </div>
      </div>

      <div className="flex justify-end gap-3 mb-6">
        <button onClick={handleCopyXmlLink} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors border border-slate-300 text-sm">
          <Rss size={18} className="text-orange-500"/> Link Feed XML
        </button>
        <button onClick={() => handleOpenPropertyModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-sm text-sm">
          <Plus size={18} /> Novo Imóvel
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="py-4 px-6">Imóvel & Localização</th>
              <th className="py-4 px-6">Transação & Valor</th>
              <th className="py-4 px-6">Equipa & Captação</th>
              <th className="py-4 px-6">Status (Site & Portais)</th>
              <th className="py-4 px-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {properties.map(prop => {
              const displayCode = prop.code || prop.id?.substring(0, 6)?.toUpperCase();
              return (
                <tr key={prop.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800 text-base">{prop.title}</p>
                      <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                        <Hash size={10} /> {displayCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin size={12}/> {prop.neighborhood}, {prop.city}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${prop.rentStatus === 'Alugado' ? 'bg-amber-100 text-amber-700' : prop.rentStatus === 'Vendido' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {prop.rentStatus ? prop.rentStatus.toUpperCase() : 'VAGO'}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">{prop.type}</span>
                      {prop.condominium && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold border border-indigo-100 line-clamp-1 max-w-[120px]" title={prop.condominium.name}>{prop.condominium.name}</span>}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col items-start gap-1.5">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${prop.transaction === 'Venda' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {prop.transaction}
                      </span>
                      <p className="font-bold text-slate-800 text-lg">R$ {Number(prop.price).toLocaleString('pt-BR')}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <UserCheck size={14} className="text-slate-400" />
                      <span className="font-medium text-slate-700">Corretor:</span> 
                      {prop.broker ? <span className="text-blue-600 font-bold">{prop.broker.name}</span> : <span className="text-slate-400 italic">Nenhum</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <User size={14} className="text-slate-400" />
                      <span className="font-medium text-slate-700">Angariador:</span> 
                      {prop.captator ? <span className="text-slate-600">{prop.captator.name}</span> : <span className="text-slate-400 italic">Nenhum</span>}
                    </div>
                    {prop.exclusive && <span className="inline-block mt-1 bg-yellow-100 text-yellow-800 border border-yellow-200 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Exclusividade</span>}
                  </td>
                  <td className="py-4 px-6 space-y-2">
                    <button onClick={() => handleToggleStatus(prop.id)} className="focus:outline-none block">
                      {prop.isActive 
                        ? <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle2 size={14}/> Site Oficial</span>
                        : <span className="bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><XCircle size={14}/> Oculto Site</span>
                      }
                    </button>
                    <div className="block">
                      {prop.exportToPortals 
                        ? <span className="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Rss size={14}/> Exporta XML</span>
                        : <span className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><XCircle size={14}/> Não Exporta</span>
                      }
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenStudioModal(prop)} 
                        className="text-pink-600 hover:text-pink-800 font-bold bg-pink-50 hover:bg-pink-100 border border-pink-200 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs"
                        title="Abrir Estúdio de Marketing (Gerar Post para Feed e Stories)"
                      >
                        <Palette size={16} /> Arte Insta
                      </button>
                      <button onClick={() => handleOpenPropertyModal(prop)} className="text-blue-600 hover:text-blue-800 font-bold bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs">
                        <Edit size={16} /> Editar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {properties.length === 0 && (
              <tr><td colSpan={5} className="py-12 text-center text-slate-500 text-lg">Nenhum imóvel cadastrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================= */}
      {/* MODAL: ESTÚDIO DE MARKETING (GERADOR DE POSTS INSTAGRAM)  */}
      {/* ========================================================= */}
      {studioProperty && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
             
            {/* Header do Estúdio */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 p-2 rounded-xl">
                  <Palette size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Estúdio de Marketing — Criador de Posts para Instagram</h2>
                  <p className="text-xs text-slate-400">Gere artes em alta definição (Feed 1080x1080 ou Stories 1080x1920) com 1 clique.</p>
                </div>
              </div>
              <button onClick={() => setStudioProperty(null)} className="text-slate-400 hover:text-white p-2 rounded-lg"><X size={22}/></button>
            </div>

            {/* Corpo do Estúdio */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 bg-slate-50">
               
              {/* COLUNA ESQUERDA: PREVIEW DO CANVAS AO VIVO */}
              <div className="lg:col-span-6 flex flex-col items-center justify-center bg-slate-900/95 rounded-2xl p-6 border border-slate-800">
                <div className="flex items-center justify-between w-full mb-4 text-xs text-slate-400">
                  <span className="font-bold uppercase tracking-wider text-pink-400">Pré-visualização em Tempo Real</span>
                  <span>Resolução Nativa: {studioConfig.format === 'feed' ? '1080 x 1080 px' : '1080 x 1920 px'}</span>
                </div>

                <div className="flex items-center justify-center w-full overflow-hidden">
                  <canvas 
                    ref={canvasRef} 
                    className={`rounded-xl shadow-2xl border border-slate-700 bg-slate-950 ${studioConfig.format === 'feed' ? 'w-full max-w-[400px] aspect-square' : 'h-[460px] w-auto aspect-[9/16]'}`}
                  />
                </div>

                {imageCorsError && (
                  <p className="text-xs text-amber-300 bg-amber-950/60 border border-amber-700/50 rounded-lg p-2.5 mt-4 text-center">
                    ⚠️ O servidor onde esta foto está hospedada bloqueia edição direta. Use o botão <strong>"Subir Foto do PC/Telemóvel"</strong> ao lado para inserir a foto na arte!
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-6">
                  <button 
                    type="button" 
                    onClick={handleDownloadInstagramImage} 
                    className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all text-sm"
                  >
                    <Download size={18}/> Baixar Imagem (.PNG)
                  </button>
                  <button 
                    type="button" 
                    onClick={handleCopyCaption} 
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-all text-sm"
                  >
                    <Copy size={18}/> Copiar Legenda Pronta
                  </button>
                </div>
              </div>

              {/* COLUNA DIREITA: CONTROLES DE PERSONALIZAÇÃO */}
              <div className="lg:col-span-6 space-y-5">
                 
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Formato & Estilo Visual</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setStudioConfig({...studioConfig, format: 'feed'})}
                      className={`py-2.5 px-4 rounded-xl font-bold text-xs border-2 transition-all ${studioConfig.format === 'feed' ? 'border-pink-600 bg-pink-50 text-pink-700' : 'border-slate-200 text-slate-600'}`}
                    >
                      ⬛ Feed Quadrado (1:1)
                    </button>
                    <button 
                      type="button"
                      onClick={() => setStudioConfig({...studioConfig, format: 'stories'})}
                      className={`py-2.5 px-4 rounded-xl font-bold text-xs border-2 transition-all ${studioConfig.format === 'stories' ? 'border-pink-600 bg-pink-50 text-pink-700' : 'border-slate-200 text-slate-600'}`}
                    >
                      📱 Stories / Reels (9:16)
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <button type="button" onClick={() => setStudioConfig({...studioConfig, theme: 'dark'})} className={`py-2 px-3 rounded-lg text-xs font-bold border ${studioConfig.theme === 'dark' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>
                      Luxury Dark
                    </button>
                    <button type="button" onClick={() => setStudioConfig({...studioConfig, theme: 'clean'})} className={`py-2 px-3 rounded-lg text-xs font-bold border ${studioConfig.theme === 'clean' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                      Corporativo
                    </button>
                    <button type="button" onClick={() => setStudioConfig({...studioConfig, theme: 'gold'})} className={`py-2 px-3 rounded-lg text-xs font-bold border ${studioConfig.theme === 'gold' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                      Alto Padrão Gold
                    </button>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">2. Foto de Fundo</h3>
                    <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
                      <Upload size={14}/> Subir Foto do PC/Telemóvel
                      <input type="file" accept="image/*" onChange={handleUploadLocalStudioPhoto} className="hidden" />
                    </label>
                  </div>

                  {studioProperty.imageUrls && studioProperty.imageUrls.length > 0 ? (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {studioProperty.imageUrls.map((url: string, idx: number) => (
                        <button 
                          key={idx} 
                          type="button" 
                          onClick={() => setStudioConfig({...studioConfig, selectedPhotoUrl: url})}
                          className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${studioConfig.selectedPhotoUrl === url ? 'border-pink-600 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        >
                          <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic flex items-center gap-1.5"><ImageIcon size={14}/> Nenhuma foto cadastrada no imóvel.</p>
                  )}
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">3. Textos & Chamadas da Arte</h3>
                   
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Selo do Topo</label>
                      <input type="text" value={studioConfig.badgeText} onChange={e => setStudioConfig({...studioConfig, badgeText: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Cor</label>
                      <input type="color" value={studioConfig.accentColor} onChange={e => setStudioConfig({...studioConfig, accentColor: e.target.value})} className="w-full h-9 rounded-lg cursor-pointer border border-slate-300" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Título Principal</label>
                    <input type="text" value={studioConfig.headline} onChange={e => setStudioConfig({...studioConfig, headline: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Localização</label>
                      <input type="text" value={studioConfig.locationText} onChange={e => setStudioConfig({...studioConfig, locationText: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Preço</label>
                      <input type="text" value={studioConfig.priceText} onChange={e => setStudioConfig({...studioConfig, priceText: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Rodapé</label>
                    <input type="text" value={studioConfig.footerText} onChange={e => setStudioConfig({...studioConfig, footerText: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" />
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CADASTRO E EDIÇÃO DO IMÓVEL (COM CONDOMÍNIO)       */}
      {/* ========================================================= */}
      {isPropertyModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
             
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {editingId ? <Edit className="text-blue-600" size={20}/> : <Plus className="text-blue-600" size={20}/>}
                {editingId ? 'Editar Imóvel' : 'Cadastrar Imóvel'}
              </h2>
              <button onClick={() => setIsPropertyModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
            </div>
             
            <div className="p-6 overflow-y-auto flex-1">
              <form id="property-form" onSubmit={handleSaveProperty} className="space-y-8">
                 
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">1. Informações Básicas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Título do Anúncio</label>
                      <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" placeholder="Ex: Lindo Apartamento..." />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Código (Ref.)</label>
                      <input type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm uppercase" placeholder="Ex: AP1023" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Transação</label>
                      <select value={form.transaction} onChange={e => setForm({...form, transaction: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white text-sm">
                        <option value="Locação">Locação</option>
                        <option value="Venda">Venda</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Tipo</label>
                      <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white text-sm">
                        <option value="Casa">Casa</option>
                        <option value="Apartamento">Apartamento</option>
                        <option value="Comercial">Comercial</option>
                        <option value="Terreno">Terreno</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">2. Valores, Áreas & Condições</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Valor (R$)</label>
                      <input required type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Condomínio (R$)</label>
                      <input type="number" value={form.condoFee} onChange={e => setForm({...form, condoFee: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">IPTU (R$)</label>
                      <input type="number" value={form.iptu} onChange={e => setForm({...form, iptu: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Área (m²)</label>
                      <input required type="number" value={form.area} onChange={e => setForm({...form, area: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Quartos</label>
                      <input type="number" value={form.bedrooms} onChange={e => setForm({...form, bedrooms: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Banheiros</label>
                      <input type="number" value={form.bathrooms} onChange={e => setForm({...form, bathrooms: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Vagas</label>
                      <input type="number" value={form.garage} onChange={e => setForm({...form, garage: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">3. Localização & Condomínio</h3>
                  
                  {/* SELEÇÃO DO CONDOMÍNIO CADASTRADO */}
                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mb-4">
                    <label className="block text-xs font-bold text-indigo-800 mb-1 flex items-center gap-1"><Building2 size={14}/> Vincular a um Condomínio Cadastrado</label>
                    <select value={form.condominiumId} onChange={e => setForm({...form, condominiumId: e.target.value})} className="w-full md:w-1/2 px-4 py-2 border border-indigo-200 rounded-lg outline-none focus:border-indigo-500 bg-white text-sm font-medium">
                      <option value="">Não pertence a um condomínio / Não vincular</option>
                      {condominiums.map(c => <option key={c.id} value={c.id}>{c.name} ({c.city})</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-600 mb-1">CEP {isFetchingCep && <Loader2 size={12} className="animate-spin text-blue-500" />}</label>
                      <input required type="text" value={form.cep} onChange={handleCepChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" placeholder="00000-000" />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Endereço Completo</label>
                      <input required type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Bairro</label>
                      <input required type="text" value={form.neighborhood} onChange={e => setForm({...form, neighborhood: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Cidade</label>
                      <input required type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Estado (UF)</label>
                      <input required type="text" maxLength={2} value={form.state} onChange={e => setForm({...form, state: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm uppercase" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">4. Características & Comodidades</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {AVAILABLE_AMENITIES.map(amenity => (
                      <label key={amenity} className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" checked={form.amenities.includes(amenity)} onChange={() => handleToggleAmenity(amenity)} />
                        <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                  <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4 border-b border-blue-200 pb-2 flex items-center gap-2">
                    <UserCheck size={18}/> 5. Equipe, Captação & Portais
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Proprietário (Dono)</label>
                      <select value={form.ownerId} onChange={e => setForm({...form, ownerId: e.target.value})} className="w-full px-4 py-2 border border-blue-200 rounded-lg outline-none bg-white text-sm">
                        <option value="">Selecione o proprietário...</option>
                        {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Corretor Responsável</label>
                      <select value={form.brokerId} onChange={e => setForm({...form, brokerId: e.target.value})} className="w-full px-4 py-2 border border-blue-200 rounded-lg outline-none bg-white text-sm">
                        <option value="">Nenhum</option>
                        {brokers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-xs font-bold text-slate-600">Descrição Comercial</label>
                    <button type="button" onClick={handleGenerateAiDescription} disabled={isGeneratingAi} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                      {isGeneratingAi ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Gerar com IA
                    </button>
                  </div>
                  <textarea rows={5} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none text-sm bg-slate-50" placeholder="Escreva ou gere com IA..." />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Links das Imagens (Separados por vírgula)</label>
                  <textarea rows={2} value={form.imageUrls} onChange={e => setForm({...form, imageUrls: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none text-sm" placeholder="https://..." />
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setIsPropertyModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-lg text-sm">Cancelar</button>
              <button form="property-form" type="submit" disabled={isSaving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-2 shadow-sm text-sm">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} {editingId ? 'Salvar Alterações' : 'Cadastrar Imóvel'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}