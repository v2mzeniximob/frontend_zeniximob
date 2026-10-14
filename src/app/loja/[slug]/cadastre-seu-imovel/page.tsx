'use client';

import { useState, useEffect, use } from 'react';
import { api } from '../../../../lib/api';
import { MapPin, Phone, Mail, Loader2, CheckCircle2, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';

export default function CadastreSeuImovelPage(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  const slug = params?.slug;

  const [storeData, setStoreData] = useState<any>(null);
  const [isLoadingStore, setIsLoadingStore] = useState(true);
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    observations: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!slug) return;
    const fetchStore = async () => {
      try {
        const response = await api.get(`/public/stores/${slug}`);
        setStoreData(response.data.realEstate);
      } catch (err) {
        console.error('Erro ao buscar dados da loja:', err);
      } finally {
        setIsLoadingStore(false);
      }
    };
    fetchStore();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      alert('Por favor, preencha pelo menos o Nome e o Telefone.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Cria o Lead automaticamente no Kanban com os dados informados
      await api.post(`/public/leads`, {
        realEstateId: storeData?.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        interest: 'Captação / Anúncio de Imóvel pelo Site',
        notes: `Cadastrou o imóvel pelo site.\nObservações: ${form.observations || 'Nenhuma'}`
      });
      setSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Erro ao enviar cadastro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingStore) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-slate-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* CABEÇALHO */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link href={`/loja/${slug}`}>
            {storeData?.logoUrl ? (
              <img src={storeData.logoUrl} alt={storeData.tradeName} className="h-12 object-contain" />
            ) : (
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{storeData?.tradeName || 'Imobiliária'}</h1>
            )}
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <Link href={`/loja/${slug}`} className="hover:text-blue-600 transition-colors">Início</Link>
            <Link href={`/loja/${slug}/simule-seu-financiamento`} className="hover:text-blue-600 transition-colors font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">Simule seu Financiamento</Link>
            <Link href={`/loja/${slug}/cadastre-seu-imovel`} className="font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">Cadastre seu Imóvel</Link>
            <Link href={`/loja/${slug}/sobre`} className="hover:text-blue-600 transition-colors">Sobre Nós</Link>
            <Link href={`/loja/${slug}/corretores`} className="hover:text-blue-600 transition-colors">Corretores</Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <div className="flex flex-col text-right">
              <span className="text-xs text-slate-500">Ligue para nós</span>
              <span className="text-sm font-bold text-slate-900">{storeData?.phone}</span>
            </div>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="bg-blue-100 text-blue-700 text-xs font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider">Anuncie Conosco</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mt-4 mb-4">
            Quer vender ou alugar o seu imóvel com rapidez?
          </h1>
          <p className="text-slate-600 text-base md:text-lg leading-relaxed">
            Cadastre as informações do seu imóvel agora mesmo. Nossa equipe de especialistas entrará em contato para realizar uma avaliação profissional e iniciar a divulgação em nossos portais e canais oficiais.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Vantagens / Explicações */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex gap-4 items-start">
              <div className="bg-blue-50 text-blue-600 p-3 rounded-xl shrink-0">
                <TrendingUp size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Máxima Visibilidade</h3>
                <p className="text-slate-600 text-sm leading-relaxed">Seu imóvel anunciado no nosso site oficial, redes sociais e integrado aos maiores portais imobiliários do mercado.</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex gap-4 items-start">
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Segurança e Rigor</h3>
                <p className="text-slate-600 text-sm leading-relaxed">Contamos com assessoria jurídica especializada, análise cadastral rigorosa de inquilinos e total segurança nas negociações.</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex gap-4 items-start">
              <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl shrink-0">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Atendimento Exclusivo</h3>
                <p className="text-slate-600 text-sm leading-relaxed">Um corretor dedicado acompanhará todo o processo, desde a captação e fotos até a concretização do negócio.</p>
              </div>
            </div>
          </div>

          {/* Formulário de Cadastro */}
          <div className="lg:col-span-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
            {success ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Imóvel Cadastrado com Sucesso!</h3>
                <p className="text-slate-600 text-sm max-w-md mx-auto">
                  Recebemos os seus dados e gerámos o seu atendimento no nosso sistema. Em instantes, um dos nossos consultores entrará em contacto!
                </p>
                <button
                  onClick={() => { setSuccess(false); setForm({ name: '', email: '', phone: '', observations: '' }); }}
                  className="mt-4 bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm"
                >
                  Cadastrar Outro Imóvel
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Preencha os Dados do Proprietário</h3>
                
                {errorMessage && (
                  <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-200">
                    {errorMessage}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="Ex: João da Silva"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:border-blue-600 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">E-mail</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm({...form, email: e.target.value})}
                      placeholder="exemplo@email.com"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:border-blue-600 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Telefone / WhatsApp *</label>
                    <input
                      required
                      type="text"
                      value={form.phone}
                      onChange={e => setForm({...form, phone: e.target.value})}
                      placeholder="(11) 99999-9999"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:border-blue-600 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Observações / Detalhes do Imóvel</label>
                  <textarea
                    rows={4}
                    value={form.observations}
                    onChange={e => setForm({...form, observations: e.target.value})}
                    placeholder="Informe o tipo de imóvel (Casa, Apto), bairro, cidade, se é para venda ou aluguel e outros detalhes..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:border-blue-600 text-sm resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  ENVIAR CADASTRO DO IMÓVEL
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* RODAPÉ */}
      <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            {storeData?.logoUrl ? (
              <img src={storeData.logoUrl} alt="Logo" className="h-10 object-contain mb-6 brightness-0 invert opacity-90" />
            ) : (
              <h3 className="text-xl font-bold text-white mb-6">{storeData?.tradeName}</h3>
            )}
            <p className="text-sm leading-relaxed mb-6">
              {storeData?.footerText || 'Especialistas em realizar os seus sonhos. Encontre as melhores opções de compra, venda e locação.'}
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Navegação</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href={`/loja/${slug}`} className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href={`/loja/${slug}/cadastre-seu-imovel`} className="hover:text-white transition-colors">Cadastre seu Imóvel</Link></li>
              <li><Link href={`/loja/${slug}/sobre`} className="hover:text-white transition-colors">Quem Somos</Link></li>
              <li><Link href={`/loja/${slug}/corretores`} className="hover:text-white transition-colors">Nossa Equipe</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Matriz</h4>
            <ul className="space-y-4 text-sm">
              <li><p className="font-semibold text-white">{storeData?.tradeName}</p></li>
              <li className="flex items-start gap-3">
                <MapPin size={18} className="shrink-0 mt-0.5 text-slate-500" />
                <span>{storeData?.address}, {storeData?.cep}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-slate-500" />
                <span>{storeData?.phone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-slate-500" />
                <span>{storeData?.email}</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Outros Links</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Área do Locador</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Área do Locatário</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Políticas de Privacidade</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs">
          <p>© {new Date().getFullYear()} {storeData?.corporateName}. Todos os direitos reservados.</p>
          <p className="mt-2 md:mt-0">Desenvolvido por <span className="font-bold text-white">ZenixImob</span></p>
        </div>
      </footer>
    </div>
  );
}