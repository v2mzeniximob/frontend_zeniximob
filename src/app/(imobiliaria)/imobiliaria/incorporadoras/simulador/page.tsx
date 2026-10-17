'use client';

import { useState } from 'react';
import { api } from '@/src/lib/api';
import { Calculator, DollarSign, FileText, CheckCircle2, Loader2, Building, Percent } from 'lucide-react';

export default function SimuladorFinanciamentoPage() {
  const [form, setForm] = useState({
    propertyValue: '450000',
    monthlyIncome: '7500',
    buyerAge: '32',
    fgtsAmount: '25000',
    programType: 'MCMV'
  });

  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post('/incorporadora/simulate-financing', {
        propertyValue: Number(form.propertyValue),
        monthlyIncome: Number(form.monthlyIncome),
        buyerAge: Number(form.buyerAge),
        fgtsAmount: Number(form.fgtsAmount),
        programType: form.programType
      });
      setResult(res.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao simular financiamento.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto font-sans space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Calculator className="text-blue-600 bg-blue-50 p-2 rounded-xl" size={38} />
          Simulador de Crédito Imobiliário & Tabela de Vendas (Caixa / MCMV)
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Simule aprovação de financiamento, cálculo automático de subsídio e gere o fluxo de pagamentos da entrada (Ato + Mensais com INCC + Financiamento).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* FORMULÁRIO DE ENTRADA */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">Parâmetros da Simulação</h2>
          
          <form onSubmit={handleSimulate} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Valor do Imóvel (R$) *</label>
              <input required type="number" value={form.propertyValue} onChange={e => setForm({ ...form, propertyValue: e.target.value })} className="w-full p-3 border border-slate-300 rounded-xl font-bold text-sm" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Renda Familiar Bruta Mensal (R$) *</label>
              <input required type="number" value={form.monthlyIncome} onChange={e => setForm({ ...form, monthlyIncome: e.target.value })} className="w-full p-3 border border-slate-300 rounded-xl font-bold text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Idade do Comprador *</label>
                <input required type="number" value={form.buyerAge} onChange={e => setForm({ ...form, buyerAge: e.target.value })} className="w-full p-3 border border-slate-300 rounded-xl" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Saldo FGTS (R$)</label>
                <input required type="number" value={form.fgtsAmount} onChange={e => setForm({ ...form, fgtsAmount: e.target.value })} className="w-full p-3 border border-slate-300 rounded-xl" />
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Linha de Financiamento</label>
              <select value={form.programType} onChange={e => setForm({ ...form, programType: e.target.value })} className="w-full p-3 border border-slate-300 rounded-xl bg-white font-bold">
                <option value="MCMV">Minha Casa Minha Vida (Subsídio + Juros Baixos)</option>
                <option value="SBPE">SBPE / FGTS (Sistema Caderneta de Poupança)</option>
              </select>
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 text-sm">
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Calculator size={18} />}
              Calcular Financiamento & Tabela
            </button>
          </form>
        </div>

        {/* RESULTADO E TABELA DE VENDAS */}
        <div className="lg:col-span-7 space-y-6">
          {!result ? (
            <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center text-slate-400 space-y-2">
              <Building size={48} className="mx-auto text-slate-300" />
              <p className="font-bold text-base text-slate-600">Aguardando parâmetros...</p>
              <p className="text-xs">Preencha os dados ao lado e clique em calcular para gerar o cenário de crédito.</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Resumo do Crédito */}
              <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4">
                <h3 className="text-base font-bold text-blue-400 border-b border-slate-800 pb-3 flex justify-between items-center">
                  <span>Resultado da Análise de Crédito</span>
                  <span className="bg-blue-600 text-white text-[10px] px-2.5 py-1 rounded-full uppercase">{result.simulation.programType}</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-bold uppercase">Financiamento Máximo</span>
                    <span className="text-lg font-black text-white">{formatCurrency(result.simulation.maxFinancingAmount)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold uppercase">Subsídio Estimado</span>
                    <span className="text-lg font-black text-emerald-400">{formatCurrency(result.simulation.estimatedSubsidy)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold uppercase">Valor da Entrada Total</span>
                    <span className="text-lg font-black text-amber-400">{formatCurrency(result.simulation.downPaymentTotal)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold uppercase">Prazo Máximo</span>
                    <span className="text-sm font-bold text-white">{result.simulation.maxTermMonths} meses ({Math.round(result.simulation.maxTermMonths / 12)} anos)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold uppercase">1ª Prestação Estimada</span>
                    <span className="text-sm font-bold text-white">{formatCurrency(result.simulation.estimatedFirstInstallment)}/mês</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold uppercase">Taxa de Juros Anual</span>
                    <span className="text-sm font-bold text-white">{result.simulation.interestRateAnnual}% a.a.</span>
                  </div>
                </div>
              </div>

              {/* Tabela de Vendas (Fluxo de Obra) */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
                  Tabela de Vendas Sugerida (Fluxo de Pagamento da Entrada)
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-700">Sinal / Ato (30% da Entrada)</span>
                    <span className="font-black text-slate-900">{formatCurrency(result.salesTableFlow.ato)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-700">Parcela em 30 Dias (30% da Entrada)</span>
                    <span className="font-black text-slate-900">{formatCurrency(result.salesTableFlow.em30Dias)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-700">{result.salesTableFlow.mensaisObraCount}x Mensais durante a Obra (Corrigidas por INCC)</span>
                    <span className="font-black text-blue-600">{result.salesTableFlow.mensaisObraCount}x de {formatCurrency(result.salesTableFlow.mensaisObraValue)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-700">{result.salesTableFlow.baloesSemestralCount}x Balões / Semestrais</span>
                    <span className="font-black text-indigo-600">{result.salesTableFlow.baloesSemestralCount}x de {formatCurrency(result.salesTableFlow.baloesSemestralValue)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-sm">
                    <span className="font-bold text-emerald-900">Saldo de Chaves (Financiamento Bancário / FGTS)</span>
                    <span className="font-black text-emerald-700">{formatCurrency(result.salesTableFlow.saldoChavesFinanciamento)}</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}