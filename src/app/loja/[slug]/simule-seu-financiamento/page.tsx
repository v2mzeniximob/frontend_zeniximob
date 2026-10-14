'use client';

import { useState, useEffect, use } from 'react';
import { api } from '../../../../lib/api';
import { MapPin, Phone, Mail, Loader2, CheckCircle2, Calculator, Landmark, ShieldCheck, FileText } from 'lucide-react';
import Link from 'next/link';

export default function SimuleSeuFinanciamentoPage(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  const slug = params?.slug;

  const [storeData, setStoreData] = useState<any>(null);
  const [isLoadingStore, setIsLoadingStore] = useState(true);

  // Estados da Calculadora de Financiamento
  const [propertyValue, setPropertyValue] = useState<number>(350000);
  const [downPayment, setDownPayment] = useState<number>(70000); // Mínimo 20%
  const [termYears, setTermYears] = useState<number>(30); // Anos
  
  // Dados do Formulário do Cliente
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
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

  // Atualiza a entrada recomendada automaticamente (20%) se o valor do imóvel mudar
  const handlePropertyValueChange = (val: number) => {
    setPropertyValue(val);
    setDownPayment(Math.round(val * 0.2));
  };

  // Cálculos da Estimativa (SAC / Taxa média de mercado ~10.5% a.a.)
  const financedAmount = Math.max(0, propertyValue - downPayment);
  const totalMonths = termYears * 12;
  const annualInterestRate = 0.105;
  const monthlyInterestRate = annualInterestRate / 12;
  
  // Estimativa aproximada de amortização
  const monthlyAmortization = financedAmount / (totalMonths || 1);
  const firstInstallmentEstimate = (monthlyAmortization + (financedAmount * monthlyInterestRate)) * 1.05; // com taxas e seguro cobridos

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      alert('Por favor, preencha pelo menos o Nome e o Telefone/WhatsApp.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Envia os dados simulados para a API gerar o Lead no Kanban do CRM
      await api.post(`/public/leads`, {
        realEstateId: storeData?.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        interest: 'Simulação de Financiamento Habitacional',
        notes: `🎯 SIMULAÇÃO DE FINANCIAMENTO REALIZADA PELO SITE:
• Valor do Imóvel: ${formatCurrency(propertyValue)}
• Entrada Informada: ${formatCurrency(downPayment)} (${Math.round((downPayment / propertyValue) * 100)}%)
• Valor a Financiar: ${formatCurrency(financedAmount)}
• Prazo: ${termYears} anos (${totalMonths} meses)
• Estimativa da 1ª Parcela: ${formatCurrency(firstInstallmentEstimate)}
• CPF: ${form.cpf || 'Não informado'}
• Observações do Cliente: ${form.observations || 'Nenhuma'}`
      });

      setSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Erro ao enviar simulação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingStore) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="animate-spin text-amber-600 mb-4" size={40} />
        <p className="text-slate-500">Carregando simulador...</p>
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
            <Link href={`/loja/${slug}/simule-seu-financiamento`} className="font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">Simule seu Financiamento</Link>
            <Link href={`/loja/${slug}/cadastre-seu-imovel`} className="hover:text-blue-600 transition-colors">Cadastre seu Imóvel</Link>
            <Link href={`/loja/${slug}/sobre`} className="hover:text-blue-600 transition-colors">Sobre Nós</Link>
            <Link href={`/loja/${slug}/corretores`} className="hover:text-blue-600 transition-colors">Corretores</Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <div className="flex flex-col text-right">
              <span className="text-xs text-slate-500">Dúvidas sobre Financiamento?</span>
              <span className="text-sm font-bold text-slate-900">{storeData?.phone}</span>
            </div>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="bg-amber-100 text-amber-800 text-xs font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider">Crédito Imobiliário</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mt-4 mb-4">
            Simule seu Financiamento Habitacional
          </h1>
          <p className="text-slate-600 text-base md:text-lg leading-relaxed">
            Descubra as estimativas de parcelas e o valor de entrada para realizar a conquista da sua casa própria. Trabalhamos com os principais bancos para aprovar o seu crédito com as melhores taxas do mercado.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUNA ESQUERDA: CALCULADORA DE FINANCIAMENTO */}
          <div className="lg:col-span-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-lg space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl">
                <Calculator size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Calculadora de Parcela</h3>
                <p className="text-xs text-slate-500">Ajuste os valores para visualizar a estimativa em tempo real</p>
              </div>
            </div>

            {/* Campo 1: Valor do Imóvel */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Valor do Imóvel</label>
                <span className="text-lg font-extrabold text-slate-900">{formatCurrency(propertyValue)}</span>
              </div>
              <input
                type="range"
                min={100000}
                max={2000000}
                step={10000}
                value={propertyValue}
                onChange={e => handlePropertyValueChange(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>R$ 100 mil</span>
                <span>R$ 2 Milhões</span>
              </div>
            </div>

            {/* Campo 2: Entrada */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Valor da Entrada (Mínimo recomendado ~20%)</label>
                <span className="text-base font-bold text-emerald-600">{formatCurrency(downPayment)}</span>
              </div>
              <input
                type="range"
                min={propertyValue * 0.1}
                max={propertyValue * 0.8}
                step={5000}
                value={downPayment}
                onChange={e => setDownPayment(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Campo 3: Prazo */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Prazo do Financiamento</label>
              <div className="grid grid-cols-4 gap-2">
                {[15, 20, 25, 30].map(years => (
                  <button
                    key={years}
                    type="button"
                    onClick={() => setTermYears(years)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      termYears === years
                        ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {years} Anos
                  </button>
                ))}
              </div>
            </div>

            {/* CARD DE RESUMO DO CÁLCULO */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-center text-xs text-slate-300 border-b border-slate-800 pb-3">
                <span>Valor Financiado:</span>
                <span className="font-bold text-white">{formatCurrency(financedAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-300 border-b border-slate-800 pb-3">
                <span>Prazo Total:</span>
                <span className="font-bold text-white">{termYears} anos ({totalMonths} parcelas)</span>
              </div>
              <div className="pt-2">
                <span className="text-xs text-amber-400 font-semibold block uppercase">Estimativa da 1ª Parcela (Aproximada)</span>
                <p className="text-3xl font-extrabold text-white mt-1">{formatCurrency(firstInstallmentEstimate)}</p>
                <span className="text-[11px] text-slate-400 mt-1 block">*Valor estimado. Pode variar de acordo com o seu perfil de renda e banco.</span>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: FORMULÁRIO PARA ENVIAR AO CORRETOR / APROVAR CRÉDITO */}
          <div className="lg:col-span-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl">
            {success ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Simulação Enviada com Sucesso!</h3>
                <p className="text-slate-600 text-sm max-w-md mx-auto">
                  Os dados da sua simulação foram encaminhados para os nossos correspondentes bancários. Entraremos em contacto para dar início ao processo de aprovação de crédito!
                </p>
                <button
                  onClick={() => { setSuccess(false); setForm({ name: '', email: '', phone: '', cpf: '', observations: '' }); }}
                  className="mt-4 bg-amber-500 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-amber-600 transition-colors text-sm"
                >
                  Fazer Nova Simulação
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-xl font-bold text-slate-800">Solicite a Análise Oficial de Crédito</h3>
                  <p className="text-xs text-slate-500">Envie a sua simulação para um de nossos corretores analisar as menores taxas nos bancos</p>
                </div>

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
                    placeholder="Ex: Maria Oliveira"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:border-amber-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Telefone / WhatsApp *</label>
                    <input
                      required
                      type="text"
                      value={form.phone}
                      onChange={e => setForm({...form, phone: e.target.value})}
                      placeholder="(11) 99999-9999"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:border-amber-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">E-mail</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm({...form, email: e.target.value})}
                      placeholder="seuemail@exemplo.com"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:border-amber-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CPF (Opcional - Acelera a aprovação)</label>
                  <input
                    type="text"
                    value={form.cpf}
                    onChange={e => setForm({...form, cpf: e.target.value})}
                    placeholder="000.000.000-00"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:border-amber-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Observações / Dúvidas</label>
                  <textarea
                    rows={3}
                    value={form.observations}
                    onChange={e => setForm({...form, observations: e.target.value})}
                    placeholder="Tenho FGTS para usar na entrada, renda conjunta com cônjuge, etc..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:border-amber-500 text-sm resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Landmark size={18} />}
                  SOLICITAR APROVAÇÃO DE CRÉDITO
                </button>
              </form>
            )}
          </div>
        </div>

        {/* SECÇÃO DE BANCOS PARCEIROS E GARANTIAS */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="bg-amber-50 text-amber-600 p-3 rounded-xl shrink-0">
              <Landmark size={24} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">Principais Bancos</h4>
              <p className="text-slate-500 text-xs leading-relaxed">Caixa Econômica, Itaú, Bradesco, Santander e Banco do Brasil.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl shrink-0">
              <FileText size={24} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">Uso do FGTS</h4>
              <p className="text-slate-500 text-xs leading-relaxed">Você pode utilizar seu saldo do FGTS para abate no valor de entrada ou parcelas.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">Assessoria Gratuita</h4>
              <p className="text-slate-500 text-xs leading-relaxed">Acompanhamento completo de todo o processo bancário e cartorário sem custos adicionais.</p>
            </div>
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
              <li><Link href={`/loja/${slug}/simule-seu-financiamento`} className="hover:text-white transition-colors">Simule seu Financiamento</Link></li>
              <li><Link href={`/loja/${slug}/cadastre-seu-imovel`} className="hover:text-white transition-colors">Cadastre seu Imóvel</Link></li>
              <li><Link href={`/loja/${slug}/sobre`} className="hover:text-white transition-colors">Quem Somos</Link></li>
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