'use client';

import { useState, useEffect } from 'react';
import { api } from '@/src/lib/api';
import { Loader2, Copy, CheckCircle2, Share2, Shield, ArrowRight, ExternalLink } from 'lucide-react';

export default function MetaIntegrationPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [storeData, setStoreData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStore();
  }, []);

  const fetchStore = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/my-store');
      setStoreData(res.data);
    } catch (error) {
      console.error('Erro ao carregar dados da loja:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const webhookUrl = storeData?.id 
    ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'}/webhook/meta-leads/${storeData.id}`
    : '';

  const handleCopyWebhook = () => {
    if (!webhookUrl) return;
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    alert('URL do Webhook copiada com sucesso!');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <Share2 className="text-blue-600 bg-blue-50 p-2 rounded-xl" size={38} />
          Integração Meta Lead Ads (Instagram & Facebook)
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Conecte seus anúncios patrocinados para que os leads cheguem instantaneamente ao ZenixImob, distribuídos pela Roleta e atendidos pelo robô do WhatsApp.
        </p>
      </div>

      {/* CARD DO WEBHOOK */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 text-blue-600 border-b border-slate-100 pb-3">
          <Shield size={20} />
          <h2 className="font-bold text-lg text-slate-800">URL do Webhook para a Meta</h2>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Copie o link abaixo e cole-o no campo <strong>Callback URL</strong> (URL de Retorno) nas configurações de Webhook do seu aplicativo no <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold inline-flex items-center gap-1">Meta for Developers <ExternalLink size={12}/></a>.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
          <input 
            type="text" 
            readOnly 
            value={webhookUrl} 
            className="w-full bg-transparent text-xs font-mono text-slate-700 outline-none px-2" 
          />
          <button 
            onClick={handleCopyWebhook}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm shrink-0"
          >
            {copied ? <CheckCircle2 size={14}/> : <Copy size={14}/>}
            {copied ? 'Copiado!' : 'Copiar URL'}
          </button>
        </div>

        <div className="pt-2">
          <label className="block text-xs font-bold text-slate-700 mb-1">Verify Token (Token de Verificação)</label>
          <input 
            type="text" 
            readOnly 
            value="zenix_meta_secure_token" 
            className="w-full md:w-1/2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 outline-none" 
          />
        </div>
      </div>

      {/* PASSO A PASSO */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          Passo a Passo para Ativar os Anúncios
        </h3>
        <ul className="space-y-3 text-xs text-slate-300">
          <li className="flex items-start gap-2">
            <span className="bg-blue-600 text-white font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">1</span>
            <span>Acesse o <strong>Meta for Developers</strong> e crie ou selecione um aplicativo do tipo <em>Negócios</em>.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-blue-600 text-white font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">2</span>
            <span>Adicione o produto <strong>Webhooks</strong> e selecione a subscrição para <code>leadgen</code>.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-blue-600 text-white font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">3</span>
            <span>Cole a <strong>URL do Webhook</strong> gerada acima e o token <code>zenix_meta_secure_token</code>.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-blue-600 text-white font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">4</span>
            <span>Certifique-se de que a <strong>Roleta de Leads</strong> e a <strong>Evolution API (WhatsApp)</strong> estão ativadas nas respectivas telas para que o lead seja distribuído e respondido instantaneamente!</span>
          </li>
        </ul>
      </div>

    </div>
  );
}