'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../../../lib/api';
import { Loader2, Save, Store, MapPin, Lock, Globe } from 'lucide-react';
import { maskCep, maskPhone } from '@/src/utils/mask';

const settingsSchema = z.object({
  tradeName: z.string().min(3, 'Nome fantasia obrigatório'),
  corporateName: z.string().min(3, 'Razão social obrigatória'),
  slug: z.string().min(3, 'Slug da vitrine obrigatório').regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hifens (sem espaços)'),
  phone: z.string().min(14, 'Telefone incompleto'),
  email: z.string().email('E-mail inválido'),
  cep: z.string().min(9, 'CEP incompleto'),
  address: z.string().min(5, 'Endereço obrigatório'),
  password: z.string().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function ConfiguracoesLojaPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema)
  });

  const currentSlug = watch('slug');

  async function fetchMyStoreData() {
    try {
      const response = await api.get('/my-store');
      const data = response.data;
      reset({
        tradeName: data.tradeName || '',
        corporateName: data.corporateName || '',
        slug: data.slug || '',
        phone: maskPhone(data.phone) || '',
        email: data.email || '',
        cep: maskCep(data.cep) || '',
        address: data.address || '',
        password: '', // Senha sempre vazia por padrão
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
      if (!payload.password) {
        delete payload.password; // Não envia a senha se o campo estiver vazio
      }

      await api.put('/my-store', payload);
      alert('Configurações salvas com sucesso!');
      setValue('password', ''); // Limpa o campo de senha após salvar
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar as configurações.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configurações da Loja</h1>
        <p className="text-slate-500 text-sm">Atualize os dados cadastrais e a vitrine pública da sua imobiliária.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* BLOCO 1: Dados Principais e Vitrine */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-blue-600 mb-4 border-b border-slate-100 pb-2">
            <Store size={20} />
            <h2 className="font-semibold text-lg">Perfil e Vitrine</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome Fantasia</label>
              <input type="text" {...register('tradeName')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              {errors.tradeName && <span className="text-red-500 text-xs">{errors.tradeName.message}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Razão Social</label>
              <input type="text" {...register('corporateName')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              {errors.corporateName && <span className="text-red-500 text-xs">{errors.corporateName.message}</span>}
            </div>
          </div>

          <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
              <Globe size={16} /> Link da sua Vitrine (Slug)
            </label>
            <div className="flex items-center">
              <span className="bg-slate-200 text-slate-600 px-3 py-2 rounded-l-lg border border-r-0 border-slate-300 text-sm hidden sm:block">
                zeniximob.vercel.app/loja/
              </span>
              <input type="text" {...register('slug')} className="w-full px-3 py-2 border border-slate-300 rounded-r-lg sm:rounded-l-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-blue-600" />
            </div>
            {errors.slug && <span className="text-red-500 text-xs block mt-1">{errors.slug.message}</span>}
            <p className="text-xs text-slate-500 mt-2">Este será o link que enviará para os seus clientes verem os seus imóveis. Ex: https://zeniximob.vercel.app/loja/<b>{currentSlug || 'sua-loja'}</b></p>
          </div>
        </div>

        {/* BLOCO 2: Contato e Endereço */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-blue-600 mb-4 border-b border-slate-100 pb-2">
            <MapPin size={20} />
            <h2 className="font-semibold text-lg">Contato e Endereço</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail de Contato (Público)</label>
              <input type="email" {...register('email')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefone / WhatsApp da Loja</label>
              <input type="text" {...register('phone')} onChange={(e) => setValue('phone', maskPhone(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              {errors.phone && <span className="text-red-500 text-xs">{errors.phone.message}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                CEP {isFetchingCep && <Loader2 size={14} className="animate-spin text-blue-500" />}
              </label>
              <input type="text" {...register('cep')} onChange={handleCepManualChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              {errors.cep && <span className="text-red-500 text-xs">{errors.cep.message}</span>}
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo</label>
              <input type="text" {...register('address')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" />
              {errors.address && <span className="text-red-500 text-xs">{errors.address.message}</span>}
            </div>
          </div>
        </div>

        {/* BLOCO 3: Segurança */}
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