'use client';

import { useState, useEffect, use } from 'react';
import { api } from '@/src/lib/api';
import { Calculator, Building, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function PublicSimuladorPage(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  const slug = params?.slug;

  const [storeData, setStoreData] = useState<any>(null);
  const [isLoadingStore, setIsLoadingStore] = useState(true);

  const [form, setForm] = useState({
    propertyValue: '450000',
    monthlyIncome: '7500',
    buyerAge: '32',
    fgtsAmount: '25000',
    programType: 'MCMV'
  });

  const [result, setResult] = useState<any>(null);
  const [isLoadingSim, setIsLoadingSim] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api.get(`/public/stores/${slug}`)
      .then(res => setStoreData(res.data.realEstate))
      .catch(() => {})
      .finally(() => setIsLoadingStore(false));
  }, [slug]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingSim(true);
    try {
      const payload = {
        propertyValue: Number(form.propertyValue),
        monthlyIncome: Number(form.monthlyIncome),
        buyerAge: Number(form.buyerAge),
        fgtsAmount: Number(form.fgtsAmount),
        programType: form.programType
      };

      const res = await api
        .post('/incorporadoras/simulate-financing', payload)
        .catch(() => api.post('/incorporadora/simulate-financing', payload));

      setResult(res.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao simular financiamento.');
    } finally {
      setIsLoadingSim(false);
    }
  };

  if (isLoadingStore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
      
      {/* HEADER PÚBLICO CLARO */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {storeData?.logoUrl ? (
              <img src={storeData.logoUrl} alt="Logo" className="h-10 object-contain" />
            ) : (
              <span className="font-black text-lg text-slate-900">{storeData?.tradeName || 'Imobiliária'}</span>
            )}
          </div>
          <Link
            href={`/loja/${slug}`}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl border border-slate-200 transition-colors"
          >
            <ArrowLeft size={14} /> Voltar para a Vitrine
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        <div>
          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-extrabold px-3 py-1 rounded-full uppercase inline-block">
            Simulador Habitacional
          </span>
          <h1 className="text-3xl md:text-4xl font-black mt-2 text-slate-900">
            Simule seu Financiamento & Subsídio
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Descubra em segundos o valor do seu subsídio (MCMV/Caixa), o financiamento aprovado e o fluxo de entrada.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* FORMULÁRIO CLARO */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">
              Dados da Simulação
            </h3>
            <form onSubmit={handleSimulate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Valor do Imóvel (R$) *</label>
                <input
                  required
                  type="number"
                  value={form.propertyValue}
                  onChange={e => setForm({ ...form, propertyValue: e.target.value })}
                  className="w-full p-3 rounded-xl bg-white border border-slate-300 text-slate-800 font-bold text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Renda Familiar Bruta Mensal (R$) *</label>
                <input
                  required
                  type="number"
                  value={form.monthlyIncome}
                  onChange={e => setForm({ ...form, monthlyIncome: e.target.value })}
                  className="w-full p-3 rounded-xl bg-white border border-slate-300 text-slate-800 font-bold text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Idade *</label>
                  <input
                    required
                    type="number"
                    value={form.buyerAge}
                    onChange={e => setForm({ ...form, buyerAge: e.target.value })}
                    className="w-full p-3 rounded-xl bg-white border border-slate-300 text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Saldo FGTS (R$)</label>
                  <input
                    type="number"
                    value={form.fgtsAmount}
                    onChange={e => setForm({ ...form, fgtsAmount: e.target.value })}
                    className="w-full p-3 rounded-xl bg-white border border-slate-300 text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Programa Habitacional</label>
                <select
                  value={form.programType}
                  onChange={e => setForm({ ...form, programType: e.target.value })}
                  className="w-full p-3 rounded-xl bg-white border border-slate-300 text-slate-800 font-bold outline-none focus:border-blue-500"
                >
                  <option value="MCMV">Minha Casa Minha Vida (MCMV)</option>
                  <option value="SBPE">SBPE / Mercado (Poupança Caixa)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoadingSim}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm transition-colors"
              >
                {isLoadingSim ? <Loader2 size={18} className="animate-spin" /> : <Calculator size={18} />}
                Calcular Simulação Agora
              </button>
            </form>
          </div>

          {/* RESULTADO CLARO */}
          <div className="lg:col-span-7">
            {!result ? (
              <div className="bg-white p-16 rounded-3xl border border-slate-200 shadow-sm text-center text-slate-400 space-y-2">
                <Building size={48} className="mx-auto text-slate-300" />
                <p className="font-bold text-sm text-slate-600">Sua simulação aparecerá aqui.</p>
                <p className="text-xs text-slate-400">Preencha os dados ao lado e clique em calcular para ver as condições.</p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm text-blue-600 border-b border-slate-100 pb-3 flex justify-between items-center">
                    <span>Resumo da Análise de Crédito</span>
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] px-2.5 py-1 rounded-full uppercase font-extrabold">
                      {result.simulation.programType}
                    </span>
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-slate-500 block font-bold uppercase text-[10px]">Financiamento Máx.</span>
                      <span className="text-lg font-black text-slate-900 mt-0.5 block">
                        {formatCurrency(result.simulation.maxFinancingAmount)}
                      </span>
                    </div>
                    <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100">
                      <span className="text-emerald-700 block font-bold uppercase text-[10px]">Subsídio Estimado</span>
                      <span className="text-lg font-black text-emerald-600 mt-0.5 block">
                        {formatCurrency(result.simulation.estimatedSubsidy)}
                      </span>
                    </div>
                    <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-100">
                      <span className="text-amber-700 block font-bold uppercase text-[10px]">Entrada Total</span>
                      <span className="text-lg font-black text-amber-600 mt-0.5 block">
                        {formatCurrency(result.simulation.downPaymentTotal)}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-slate-500 block font-bold uppercase text-[10px]">Prazo Máximo</span>
                      <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                        {result.simulation.maxTermMonths} meses
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-slate-500 block font-bold uppercase text-[10px]">1ª Prestação</span>
                      <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                        {formatCurrency(result.simulation.estimatedFirstInstallment)}/mês
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-slate-500 block font-bold uppercase text-[10px]">Taxa Anual</span>
                      <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                        {result.simulation.interestRateAnnual}% a.a.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 text-xs">
                  <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">
                    Fluxo de Pagamento Sugerido (Tabela de Vendas)
                  </h3>
                  <div className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-700 font-bold">Sinal / Ato (30% da entrada)</span>
                    <span className="font-black text-slate-900">{formatCurrency(result.salesTableFlow.ato)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-700 font-bold">Parcela em 30 Dias (30% da entrada)</span>
                    <span className="font-black text-slate-900">{formatCurrency(result.salesTableFlow.em30Dias)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-700 font-bold">{result.salesTableFlow.mensaisObraCount}x Mensais de Obra (c/ INCC)</span>
                    <span className="font-black text-blue-600">{formatCurrency(result.salesTableFlow.mensaisObraValue)} /mês</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-sm">
                    <span className="font-bold text-emerald-900">Saldo de Chaves (Financiamento Bancário)</span>
                    <span className="font-black text-emerald-700">{formatCurrency(result.salesTableFlow.saldoChavesFinanciamento)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}