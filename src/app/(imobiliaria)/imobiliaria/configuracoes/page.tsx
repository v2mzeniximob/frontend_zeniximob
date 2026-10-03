'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../../../lib/api';
import { 
  Loader2, Save, Store, MapPin, Lock, Globe,
  Image as ImageIcon, Link as LinkIcon, FileText, Building2, FileSignature, DollarSign, Key
} from 'lucide-react';
import { maskCep, maskPhone } from '@/src/utils/mask';

const maskCnpj = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})/, '$1-$2')                 .replace(/(-\d{2})\d+?$/, '$1');
};

const settingsSchema = z.object({
  tradeName: z.string().min(3, 'Nome fantasia obrigatório'),
  corporateName: z.string().min(3, 'Razão social obrigatória'),
  cnpj: z.string().optional(),
  stateRegistration: z.string().optional(),
  municipalRegistration: z.string().optional(),
  
  phone: z.string().min(14, 'Telefone incompleto'),
  email: z.string().email('E-mail inválido'),
  cep: z.string().min(9, 'CEP incompleto'),
  address: z.string().min(5, 'Endereço obrigatório'),
  
  slug: z.string().min(3, 'Slug da vitrine obrigatório').regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hifens (sem espaços)'),
  password: z.string().optional(),
  
  logoUrl: z.string().optional(),
  heroImageUrl: z.string().optional(),
  aboutText: z.string().optional(),
  footerText: z.string().optional(),
  instagramUrl: z.string().optional(),
  facebookUrl: z.string().optional(),
  whatsappDisplay: z.string().optional(),

  // Modelos de Contrato e Termos
  ownerContractTemplate: z.string().optional(),
  tenantContractTemplate: z.string().optional(),
  saleProposalTemplate: z.string().optional(),
  rentProposalTemplate: z.string().optional(),
  keyTermTemplate: z.string().optional(),

  mpAccessToken: z.string().optional(),
  mpPublicKey: z.string().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function ConfiguracoesLojaPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'dados' | 'aparencia' | 'contratos' | 'financeiro'>('dados');

  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema)
  });

  const currentSlug = watch('slug');
  const currentLogo = watch('logoUrl');
  const currentHero = watch('heroImageUrl');

  async function fetchMyStoreData() {
    try {
      const response = await api.get('/my-store');
      const data = response.data;
      reset({
        tradeName: data.tradeName || '',
        corporateName: data.corporateName || '',
        cnpj: data.cnpj ? maskCnpj(data.cnpj) : '',
        stateRegistration: data.stateRegistration || '',
        municipalRegistration: data.municipalRegistration || '',
        slug: data.slug || '',
        phone: maskPhone(data.phone) || '',
        email: data.email || '',
        cep: maskCep(data.cep) || '',
        address: data.address || '',
        password: '', 
        logoUrl: data.logoUrl || '',
        heroImageUrl: data.heroImageUrl || '',
        aboutText: data.aboutText || '',
        footerText: data.footerText || '',
        instagramUrl: data.instagramUrl || '',
        facebookUrl: data.facebookUrl || '',
        whatsappDisplay: data.whatsappDisplay || '',
        ownerContractTemplate: data.ownerContractTemplate || '',
        tenantContractTemplate: data.tenantContractTemplate || '',
        saleProposalTemplate: data.saleProposalTemplate || '',
        rentProposalTemplate: data.rentProposalTemplate || '',
        keyTermTemplate: data.keyTermTemplate || '',
        mpAccessToken: data.mpAccessToken || '',
        mpPublicKey: data.mpPublicKey || '',
      });
    } catch (error) {
      console.error('Erro ao carregar dados da loja:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchMyStoreData();
  }, []);

  async function handleCepManualChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = maskCep(e.target.value);
    setValue('cep', masked, { shouldValidate: true });

    if (masked.length === 9) {
      setIsFetchingCep(true);
      try {
        const rawCep = masked.replace(/\D/g, '');
        const response = await api.get(`/integrations/cep/${rawCep}`);
        const data = response.data;
        const fullAddress = `${data.street}, ${data.neighborhood}, ${data.city} - ${data.state}`;
        setValue('address', fullAddress, { shouldValidate: true });
      } catch (error) {
        console.log('CEP não encontrado.');
      } finally {
        setIsFetchingCep(false);
      }
    }
  }

  async function onSubmit(data: SettingsForm) {
    setIsSubmitting(true);
    try {
      const payload = { ...data };
      if (!payload.password) delete payload.password;

      await api.put('/my-store', payload);
      alert('Configurações salvas com sucesso!');
      setValue('password', '');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar as configurações.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300 max-w-5xl pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configurações da Loja</h1>
        <p className="text-slate-500 text-sm">Atualize os dados cadastrais e a vitrine pública da sua imobiliária.</p>
      </div>

      <div className="flex flex-wrap gap-4 border-b border-slate-200">
        <button type="button" onClick={() => setActiveTab('dados')} className={`pb-4 px-2 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'dados' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><Building2 size={18} /> Dados da Imobiliária</button>
        <button type="button" onClick={() => setActiveTab('aparencia')} className={`pb-4 px-2 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'aparencia' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><ImageIcon size={18} /> Aparência do Site</button>
        <button type="button" onClick={() => setActiveTab('contratos')} className={`pb-4 px-2 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'contratos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><FileSignature size={18} /> Modelos e Termos</button>
        <button type="button" onClick={() => setActiveTab('financeiro')} className={`pb-4 px-2 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'financeiro' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><DollarSign size={18} /> Financeiro / Gateway</button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* ABA 1: DADOS CADASTRAIS */}
        <div className={activeTab === 'dados' ? 'space-y-6 animate-in fade-in slide-in-from-left-2' : 'hidden'}>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 text-blue-600 mb-6 border-b border-slate-100 pb-2">
              <Building2 size={20} />
              <h2 className="font-semibold text-lg">Dados Cadastrais, Contato e Endereço</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Razão Social</label><input type="text" {...register('corporateName')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />{errors.corporateName && <span className="text-red-500 text-xs">{errors.corporateName.message}</span>}</div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Nome Fantasia</label><input type="text" {...register('tradeName')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />{errors.tradeName && <span className="text-red-500 text-xs">{errors.tradeName.message}</span>}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-6 border-b border-slate-50">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label><input type="text" {...register('cnpj')} onChange={(e) => setValue('cnpj', maskCnpj(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Inscrição Estadual</label><input type="text" {...register('stateRegistration')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Inscrição Municipal</label><input type="text" {...register('municipalRegistration')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-slate-50">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">E-mail de Contato (Público)</label><input type="email" {...register('email')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />{errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}</div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Telefone / WhatsApp da Loja</label><input type="text" {...register('phone')} onChange={(e) => setValue('phone', maskPhone(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />{errors.phone && <span className="text-red-500 text-xs">{errors.phone.message}</span>}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div><label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">CEP {isFetchingCep && <Loader2 size={14} className="animate-spin text-blue-500" />}</label><input type="text" {...register('cep')} onChange={handleCepManualChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />{errors.cep && <span className="text-red-500 text-xs">{errors.cep.message}</span>}</div>
              <div className="md:col-span-3"><label className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo</label><input type="text" {...register('address')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" />{errors.address && <span className="text-red-500 text-xs">{errors.address.message}</span>}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 text-blue-600 mb-4 border-b border-slate-100 pb-2">
              <Globe size={20} />
              <h2 className="font-semibold text-lg">Perfil e Vitrine</h2>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">Link da sua Vitrine (Slug)</label>
              <div className="flex items-center">
                <span className="bg-slate-200 text-slate-600 px-3 py-2 rounded-l-lg border border-r-0 border-slate-300 text-sm hidden sm:block">zeniximob.vercel.app/loja/</span>
                <input type="text" {...register('slug')} className="w-full px-3 py-2 border border-slate-300 rounded-r-lg sm:rounded-l-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-blue-600" />
              </div>
              {errors.slug && <span className="text-red-500 text-xs block mt-1">{errors.slug.message}</span>}
              <p className="text-xs text-slate-500 mt-2">Este será o link que enviará para os seus clientes verem os seus imóveis. Ex: https://zeniximob.vercel.app/loja/<b>{currentSlug || 'sua-loja'}</b></p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 text-slate-600 mb-4 border-b border-slate-100 pb-2">
              <Lock size={20} />
              <h2 className="font-semibold text-lg">Segurança</h2>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Alterar Senha de Acesso</label>
              <input type="password" {...register('password')} placeholder="Digite apenas se quiser alterar a senha atual..." className="w-full md:w-1/2 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              <p className="text-xs text-slate-400 mt-1">Deixe em branco para manter a senha atual.</p>
            </div>
          </div>
        </div>

        {/* ABA 2: APARÊNCIA DO SITE */}
        <div className={activeTab === 'aparencia' ? 'space-y-6 animate-in fade-in slide-in-from-right-2' : 'hidden'}>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 text-blue-600 mb-6 border-b border-slate-100 pb-2"><ImageIcon size={20} /><h2 className="font-semibold text-lg">Imagens do Site Público (Links)</h2></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Link do Logótipo (URL)</label>
                <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <input type="url" {...register('logoUrl')} placeholder="https://exemplo.com/logo.png" className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                  {currentLogo && <img src={currentLogo} alt="Preview Logo" className="h-16 object-contain self-start bg-white border border-slate-200 p-1 rounded" />}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Link do Banner Principal (URL)</label>
                <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <input type="url" {...register('heroImageUrl')} placeholder="https://exemplo.com/fundo.jpg" className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                  {currentHero && <img src={currentHero} alt="Preview Banner" className="h-16 w-full object-cover border border-slate-200 rounded" />}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 text-blue-600 mb-4 border-b border-slate-100 pb-2"><FileText size={20} /><h2 className="font-semibold text-lg">Textos Institucionais</h2></div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Texto "Sobre Nós"</label><textarea {...register('aboutText')} rows={4} className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Slogan do Rodapé</label><input type="text" {...register('footerText')} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 text-blue-600 mb-4 border-b border-slate-100 pb-2"><LinkIcon size={20} /><h2 className="font-semibold text-lg">Redes Sociais e Contactos</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp (Apenas Números)</label><input type="text" {...register('whatsappDisplay')} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Link Instagram</label><input type="url" {...register('instagramUrl')} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Link Facebook</label><input type="url" {...register('facebookUrl')} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
            </div>
          </div>
        </div>

        {/* ABA 3: MODELOS DE CONTRATOS, PROPOSTAS E TERMOS */}
        <div className={activeTab === 'contratos' ? 'space-y-6 animate-in fade-in slide-in-from-right-2' : 'hidden'}>
          
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-sm">
            <p className="font-semibold">Variáveis Universais</p>
            <p>Use estas variáveis (exatamente como estão escritas) dentro dos seus textos. O sistema vai substituí-las pelos dados reais do cliente e do imóvel quando for gerar o documento.</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <code className="text-[10px] font-bold bg-white text-blue-700 px-2 py-1 rounded border border-blue-200">{`{{NOME_CLIENTE}}`}</code>
              <code className="text-[10px] font-bold bg-white text-blue-700 px-2 py-1 rounded border border-blue-200">{`{{CPF_CNPJ}}`}</code>
              <code className="text-[10px] font-bold bg-white text-blue-700 px-2 py-1 rounded border border-blue-200">{`{{TELEFONE}}`}</code>
              <code className="text-[10px] font-bold bg-white text-blue-700 px-2 py-1 rounded border border-blue-200">{`{{ENDERECO_IMOVEL}}`}</code>
              <code className="text-[10px] font-bold bg-white text-blue-700 px-2 py-1 rounded border border-blue-200">{`{{VALOR}}`}</code>
              <code className="text-[10px] font-bold bg-white text-blue-700 px-2 py-1 rounded border border-blue-200">{`{{NOME_IMOBILIARIA}}`}</code>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contrato Locação */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 text-emerald-600 mb-4 border-b border-slate-100 pb-2">
                <FileText size={20} /><h2 className="font-semibold">Contrato de Locação</h2>
              </div>
              <textarea {...register('tenantContractTemplate')} rows={8} placeholder="Pelo presente instrumento..." className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs resize-y"></textarea>
            </div>

            {/* Contrato Gestão (Proprietário) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 text-blue-600 mb-4 border-b border-slate-100 pb-2">
                <FileSignature size={20} /><h2 className="font-semibold">Contrato de Gestão (Dono)</h2>
              </div>
              <textarea {...register('ownerContractTemplate')} rows={8} placeholder="Autorizo a imobiliária..." className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs resize-y"></textarea>
            </div>

            {/* Proposta Venda */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 text-indigo-600 mb-4 border-b border-slate-100 pb-2">
                <DollarSign size={20} /><h2 className="font-semibold">Proposta de Venda</h2>
              </div>
              <textarea {...register('saleProposalTemplate')} rows={8} placeholder="Proponho a compra do imóvel..." className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs resize-y"></textarea>
            </div>

            {/* Proposta Aluguel */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 text-orange-500 mb-4 border-b border-slate-100 pb-2">
                <FileText size={20} /><h2 className="font-semibold">Proposta de Locação</h2>
              </div>
              <textarea {...register('rentProposalTemplate')} rows={8} placeholder="Proponho a locação do imóvel..." className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 font-mono text-xs resize-y"></textarea>
            </div>

            {/* Termo de Chaves */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 md:col-span-2">
              <div className="flex items-center gap-2 text-amber-500 mb-4 border-b border-slate-100 pb-2">
                <Key size={20} /><h2 className="font-semibold">Termo de Entrega de Chaves</h2>
              </div>
              <textarea {...register('keyTermTemplate')} rows={6} placeholder="Declaro que recebi as chaves..." className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 font-mono text-xs resize-y"></textarea>
            </div>
          </div>
        </div>

        {/* ABA 4: FINANCEIRO / GATEWAY (MERCADO PAGO) */}
        <div className={activeTab === 'financeiro' ? 'space-y-6 animate-in fade-in slide-in-from-right-2' : 'hidden'}>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 text-blue-600 mb-4 border-b border-slate-100 pb-2">
              <DollarSign size={20} />
              <h2 className="font-semibold text-lg">Integração Mercado Pago</h2>
            </div>
            
            <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
              <p className="font-semibold mb-1">Receba os pagamentos diretamente na sua conta!</p>
              <p>Para gerar cobranças de PIX e Boletos aos seus inquilinos, aceda ao painel de desenvolvedor do seu Mercado Pago, crie uma aplicação e cole aqui as suas <strong>Credenciais de Produção</strong>.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Access Token (Token de Acesso)</label>
                <input 
                  type="password" 
                  {...register('mpAccessToken')} 
                  placeholder="APP_USR-123456789..." 
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Public Key (Chave Pública)</label>
                <input 
                  type="text" 
                  {...register('mpPublicKey')} 
                  placeholder="APP_USR-..." 
                  className="w-full md:w-1/2 px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md disabled:opacity-70">
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {isSubmitting ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </form>
    </div>
  );
}