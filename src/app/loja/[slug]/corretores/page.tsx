'use client';

import { useState, useEffect, use } from 'react';
import { api } from '@/src/lib/api';
import {
  Users, Phone, Mail, Award, ArrowLeft, Loader2, MessageSquare, Building2, UserCheck
} from 'lucide-react';
import Link from 'next/link';

export default function PublicCorretoresPage(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  const slug = params?.slug;

  const [storeData, setStoreData] = useState<any>(null);
  const [brokers, setBrokers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;

    const fetchBrokers = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/public/stores/${slug}`);
        const store = res.data?.realEstate || null;
        setStoreData(store);

        // Lê os corretores tanto de res.data.brokers quanto de res.data.realEstate.brokers
        const list = res.data?.brokers || store?.brokers || [];
        setBrokers(list.filter((b: any) => b.isActive !== false));
      } catch (err: any) {
        setError(err.response?.data?.error || 'Erro ao carregar a equipe de corretores.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrokers();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600 mb-3" size={40} />
        <p className="text-slate-500 text-sm font-medium">Carregando equipe de corretores...</p>
      </div>
    );
  }

  if (error || !storeData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <h1 className="text-2xl font-bold text-slate-800">{error || 'Imobiliária não encontrada.'}</h1>
        <Link href={`/loja/${slug}`} className="mt-4 text-blue-600 font-bold underline">
          Voltar para a Vitrine
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col justify-between">
      
      {/* CABEÇALHO */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link href={`/loja/${slug}`} className="focus:outline-none">
            {storeData.logoUrl ? (
              <img src={storeData.logoUrl} alt={storeData.tradeName} className="h-12 object-contain" />
            ) : (
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{storeData.tradeName}</h1>
            )}
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href={`/loja/${slug}`}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl border border-slate-200 flex items-center gap-2 transition-colors"
            >
              <ArrowLeft size={15} /> Voltar para a Vitrine
            </Link>
            <Link
              href={`/loja/${slug}/portal-cliente/login`}
              className="hidden sm:flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm"
            >
              <UserCheck size={15} className="text-blue-400" />
              Portal do Cliente
            </Link>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL — TIME DE CORRETORES */}
      <main className="max-w-7xl mx-auto px-4 py-14 w-full flex-1">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider inline-block mb-3">
            Atendimento Especializado
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900">
            Conheça Nossos Corretores
          </h2>
          <p className="text-slate-500 text-sm md:text-base mt-2">
            Profissionais credenciados prontos para ajudar você a encontrar, comprar, vender ou alugar o seu imóvel com total segurança jurídica.
          </p>
        </div>

        {brokers.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center max-w-xl mx-auto shadow-sm">
            <Users size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Nenhum corretor listado no momento</h3>
            <p className="text-xs text-slate-500 mt-1">
              Entre em contato diretamente com a nossa central de atendimento pelo telefone {storeData.phone}.
            </p>
            <Link
              href={`/loja/${slug}`}
              className="mt-6 inline-block bg-blue-600 text-white font-bold text-xs px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Ver Imóveis Disponíveis
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {brokers.map((broker: any) => {
              const cleanPhone = String(broker.phone || '').replace(/\D/g, '');
              const whatsappLink = cleanPhone
                ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                    `Olá ${broker.name}! Vi o seu perfil no site da ${storeData.tradeName} e gostaria de atendimento.`
                  )}`
                : null;

              return (
                <div
                  key={broker.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-4 mb-5">
                      {broker.avatarUrl || broker.photoUrl ? (
                        <img
                          src={broker.avatarUrl || broker.photoUrl}
                          alt={broker.name}
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-2xl shrink-0 shadow-md">
                          {String(broker.name || 'C').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-base text-slate-900 leading-snug">{broker.name}</h3>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full mt-1">
                          <Award size={12} /> CRECI: {broker.creci || 'Consultor'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                      {broker.phone && (
                        <div className="flex items-center gap-2.5">
                          <Phone size={14} className="text-blue-600 shrink-0" />
                          <span className="font-semibold text-slate-700">{broker.phone}</span>
                        </div>
                      )}
                      {broker.email && (
                        <div className="flex items-center gap-2.5">
                          <Mail size={14} className="text-blue-600 shrink-0" />
                          <span className="truncate">{broker.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    {whatsappLink ? (
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
                      >
                        <MessageSquare size={15} /> Chamar no WhatsApp
                      </a>
                    ) : (
                      <a
                        href={`mailto:${broker.email}`}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                      >
                        <Mail size={15} /> Enviar E-mail
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* RODAPÉ */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center text-xs gap-4">
          <p>© {new Date().getFullYear()} {storeData.corporateName || storeData.tradeName}. Todos os direitos reservados.</p>
          <p>Desenvolvido por <span className="font-bold text-white">ZenixImob</span></p>
        </div>
      </footer>
    </div>
  );
}