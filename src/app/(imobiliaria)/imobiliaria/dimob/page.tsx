'use client';

import { useState, useEffect } from 'react';
import { api } from '@/src/lib/api';
import { 
  Landmark, FileText, Download, Calendar, DollarSign, 
  Users, Building, Loader2, Info, CheckCircle2, ArrowRight
} from 'lucide-react';

export default function DimobPage() {
  // Por padrão, a DIMOB declara o ano anterior ao atual
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear - 1);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [summary, setSummary] = useState({
    totalInvoices: 0,
    totalRent: 0,
    totalCommission: 0,
    activeContracts: 0,
    involvedOwners: 0
  });

  // Gera uma lista com os últimos 5 anos para o Select
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    fetchSummary();
  }, [selectedYear]);

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/dimob/summary?year=${selectedYear}`);
      setSummary(res.data);
    } catch (error) {
      console.error('Erro ao buscar resumo DIMOB:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const handleDownloadTxt = async () => {
    setIsDownloading(true);
    try {
      // Faz a requisição com responseType 'blob' para lidar com o download de arquivo
      const response = await api.get(`/dimob/export?year=${selectedYear}`, {
        responseType: 'blob'
      });

      // Cria um link temporário para forçar o download no navegador
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DIMOB_${selectedYear}.txt`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

    } catch (error) {
      alert('Erro ao gerar o arquivo TXT da DIMOB. Verifique se a sua Imobiliária tem CNPJ configurado nas Definições.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto font-sans animate-in fade-in duration-300 pb-20">
      
      {/* CABEÇALHO */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Landmark className="text-indigo-600 bg-indigo-50 p-1.5 rounded-lg" size={36} />
            Declaração DIMOB
          </h1>
          <p className="text-slate-500 mt-2">Gere automaticamente o ficheiro TXT para importar no validador da Receita Federal.</p>
        </div>
        
        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3 w-full md:w-auto">
          <Calendar className="text-slate-400 ml-2" size={20} />
          <div className="flex flex-col pr-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ano-Calendário</label>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-black text-indigo-700 outline-none cursor-pointer"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: DASHBOARD DE RESUMO */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText size={18} className="text-indigo-600" />
                Resumo da Ficha de Locação ({selectedYear})
              </h2>
            </div>
            
            {isLoading ? (
              <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                <Loader2 size={40} className="animate-spin mb-4 text-indigo-600" />
                <p>Calculando valores e agrupando contratos...</p>
              </div>
            ) : (
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Métricas Financeiras */}
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-2 text-emerald-700 mb-2">
                    <DollarSign size={18}/> <h3 className="font-bold text-sm uppercase tracking-wider">Total Bruto Locação</h3>
                  </div>
                  <p className="text-3xl font-black text-emerald-800">{formatCurrency(summary.totalRent)}</p>
                  <p className="text-xs text-emerald-600 mt-1">Soma de todos os aluguéis recebidos</p>
                </div>

                <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
                  <div className="flex items-center gap-2 text-indigo-700 mb-2">
                    <Landmark size={18}/> <h3 className="font-bold text-sm uppercase tracking-wider">Comissão Retida</h3>
                  </div>
                  <p className="text-3xl font-black text-indigo-800">{formatCurrency(summary.totalCommission)}</p>
                  <p className="text-xs text-indigo-600 mt-1">Taxa de administração da imobiliária</p>
                </div>

                {/* Métricas de Volume */}
                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contratos Declarados</p>
                    <p className="text-xl font-black text-slate-800 mt-0.5">{summary.activeContracts}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-400"><FileText size={18}/></div>
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proprietários (Locadores)</p>
                    <p className="text-xl font-black text-slate-800 mt-0.5">{summary.involvedOwners}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-400"><Users size={18}/></div>
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50 sm:col-span-2">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Faturas / Recibos Lidos</p>
                    <p className="text-xl font-black text-slate-800 mt-0.5">{summary.totalInvoices} Faturas Pagas</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-400"><CheckCircle2 size={18}/></div>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: DOWNLOAD E INSTRUÇÕES */}
        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-3xl shadow-lg p-6 text-white text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 opacity-10"><Landmark size={150} /></div>
            
            <h3 className="font-bold text-xl mb-2 relative z-10">Arquivo TXT DIMOB</h3>
            <p className="text-indigo-200 text-sm mb-6 relative z-10">Pronto a ser importado no programa PGD da Receita Federal.</p>
            
            <button 
              onClick={handleDownloadTxt} 
              disabled={isLoading || isDownloading || summary.activeContracts === 0}
              className="w-full bg-white hover:bg-slate-50 text-indigo-700 font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed relative z-10 group"
            >
              {isDownloading ? <Loader2 size={20} className="animate-spin"/> : <Download size={20} className="group-hover:-translate-y-1 transition-transform" />}
              {isDownloading ? 'Gerando Arquivo...' : 'Baixar TXT DIMOB'}
            </button>
            
            {summary.activeContracts === 0 && !isLoading && (
              <p className="text-xs text-indigo-300 mt-3 relative z-10">Sem dados suficientes para gerar no ano {selectedYear}.</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Info size={18} className="text-amber-500"/>
              Como enviar a DIMOB?
            </h4>
            <ol className="space-y-4 text-sm text-slate-600 relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100 z-0"></div>
              
              <li className="flex items-start gap-3 relative z-10">
                <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0 text-slate-700">1</div>
                <div>Clique no botão acima para baixar o arquivo <strong>.txt</strong> para o seu computador.</div>
              </li>
              <li className="flex items-start gap-3 relative z-10">
                <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0 text-slate-700">2</div>
                <div>Abra o programa oficial <strong>PGD DIMOB</strong> da Receita Federal.</div>
              </li>
              <li className="flex items-start gap-3 relative z-10">
                <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0 text-slate-700">3</div>
                <div>No menu superior, vá em <strong className="text-slate-800">Declaração <ArrowRight size={12} className="inline"/> Importar</strong> e selecione o ficheiro baixado.</div>
              </li>
              <li className="flex items-start gap-3 relative z-10">
                <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0 text-slate-700">4</div>
                <div>Valide os dados, assine com o Certificado Digital (e-CNPJ) e transmita!</div>
              </li>
            </ol>
          </div>
        </div>

      </div>
    </div>
  );
}