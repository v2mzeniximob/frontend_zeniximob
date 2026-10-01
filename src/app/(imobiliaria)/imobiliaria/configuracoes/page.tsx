'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { Save, Store, Image as ImageIcon, Link as LinkIcon, FileText, Loader2, Upload } from 'lucide-react';

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<'dados' | 'aparencia'>('dados');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    tradeName: '', corporateName: '', cnpj: '', cep: '', address: '', phone: '', email: '',
    logoUrl: '', heroImageUrl: '', aboutText: '', footerText: '', 
    instagramUrl: '', facebookUrl: '', whatsappDisplay: ''
  });

  useEffect(() => {
    fetchMyStore();
  }, []);

  const fetchMyStore = async () => {
    try {
      const response = await api.get('/my-store');
      if (response.data) {
        setForm({
          tradeName: response.data.tradeName || '',
          corporateName: response.data.corporateName || '',
          cnpj: response.data.cnpj || '',
          cep: response.data.cep || '',
          address: response.data.address || '',
          phone: response.data.phone || '',
          email: response.data.email || '',
          logoUrl: response.data.logoUrl || '',
          heroImageUrl: response.data.heroImageUrl || '',
          aboutText: response.data.aboutText || '',
          footerText: response.data.footerText || '',
          instagramUrl: response.data.instagramUrl || '',
          facebookUrl: response.data.facebookUrl || '',
          whatsappDisplay: response.data.whatsappDisplay || ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para converter imagens em Base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'heroImageUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put('/my-store', form);
      alert('Configurações atualizadas com sucesso!');
    } catch (error) {
      alert('Erro ao salvar as configurações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center text-slate-500"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Configurações da Imobiliária</h1>
        <p className="text-slate-500">Faça a gestão dos dados e da aparência do seu site público.</p>
      </div>

      {/* TABS */}
      <div className="flex gap-4 border-b border-slate-200 mb-8">
        <button onClick={() => setActiveTab('dados')} className={`pb-4 px-2 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'dados' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><Store size={18} /> Dados Principais</button>
        <button onClick={() => setActiveTab('aparencia')} className={`pb-4 px-2 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'aparencia' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><ImageIcon size={18} /> Aparência do Site</button>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
        
        {/* ABA 1: DADOS CADASTRAIS */}
        {activeTab === 'dados' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Nome Fantasia (Aparece no Site)</label><input type="text" value={form.tradeName} onChange={e => setForm({...form, tradeName: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:border-blue-500" required /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Razão Social</label><input type="text" value={form.corporateName} onChange={e => setForm({...form, corporateName: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:border-blue-500" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label><input type="text" value={form.cnpj} onChange={e => setForm({...form, cnpj: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:border-blue-500" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">CEP</label><input type="text" value={form.cep} onChange={e => setForm({...form, cep: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:border-blue-500" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo</label><input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:border-blue-500" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Telefone Principal</label><input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:border-blue-500" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">E-mail de Contato</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:border-blue-500" /></div>
          </div>
        )}

        {/* ABA 2: APARÊNCIA DO SITE */}
        {activeTab === 'aparencia' && (
          <div className="space-y-8 animate-in fade-in">
            {/* Imagens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><ImageIcon size={16}/> Logótipo da Imobiliária</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
                  {form.logoUrl ? (
                    <img src={form.logoUrl} alt="Logo" className="h-20 mx-auto object-contain mb-4" />
                  ) : (
                    <div className="h-20 w-20 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4"><ImageIcon className="text-slate-400"/></div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoUrl')} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 w-full" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><ImageIcon size={16}/> Imagem de Fundo (Banner Principal)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
                  {form.heroImageUrl ? (
                    <img src={form.heroImageUrl} alt="Hero" className="h-20 w-full object-cover rounded-lg mb-4" />
                  ) : (
                    <div className="h-20 w-full bg-slate-100 rounded-lg flex items-center justify-center mb-4"><ImageIcon className="text-slate-400"/></div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'heroImageUrl')} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 w-full" />
                </div>
              </div>
            </div>

            {/* Textos Institucionais */}
            <div className="border-t border-slate-100 pt-8">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={20}/> Textos Institucionais</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Texto "Sobre a Imobiliária"</label>
                  <textarea value={form.aboutText} onChange={e => setForm({...form, aboutText: e.target.value})} rows={4} placeholder="Conte um pouco sobre a história e os valores da sua imobiliária..." className="w-full px-4 py-3 border rounded-lg outline-none focus:border-blue-500 resize-none"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Texto Curto do Rodapé</label>
                  <input type="text" value={form.footerText} onChange={e => setForm({...form, footerText: e.target.value})} placeholder="Ex: Ajudamos a encontrar o lar dos seus sonhos em São Paulo." className="w-full px-4 py-2 border rounded-lg outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>

            {/* Redes Sociais */}
            <div className="border-t border-slate-100 pt-8">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><LinkIcon size={20}/> Redes Sociais e Contactos</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp (Número Público)</label><input type="text" value={form.whatsappDisplay} onChange={e => setForm({...form, whatsappDisplay: e.target.value})} placeholder="Ex: 11999999999" className="w-full px-4 py-2 border rounded-lg outline-none focus:border-blue-500" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Link do Instagram</label><input type="url" value={form.instagramUrl} onChange={e => setForm({...form, instagramUrl: e.target.value})} placeholder="https://instagram.com/sua_loja" className="w-full px-4 py-2 border rounded-lg outline-none focus:border-blue-500" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Link do Facebook</label><input type="url" value={form.facebookUrl} onChange={e => setForm({...form, facebookUrl: e.target.value})} placeholder="https://facebook.com/sua_loja" className="w-full px-4 py-2 border rounded-lg outline-none focus:border-blue-500" /></div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
          <button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all">
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {isSaving ? 'A Salvar...' : 'Salvar Configurações'}
          </button>
        </div>
      </form>
    </div>
  );
}