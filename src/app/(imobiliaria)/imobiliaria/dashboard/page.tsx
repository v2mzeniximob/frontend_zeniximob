'use client';

export default function RealEstateDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Visão Geral da Imobiliária</h1>
        <p className="text-slate-500 text-sm">Bem-vindo ao seu painel de controlo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-slate-500 text-sm font-medium">Imóveis Ativos</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-slate-500 text-sm font-medium">Leads (Novos)</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-slate-500 text-sm font-medium">Corretores Ativos</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">0</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl text-blue-800">
        <h2 className="font-semibold text-lg mb-2">Painel Pronto!</h2>
        <p className="text-sm">O seu ambiente isolado está a funcionar perfeitamente. A partir daqui, você criará os imóveis e gerirá os leads da sua loja.</p>
      </div>
    </div>
  );
}