'use client';

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard de B.I.</h1>
        <p className="text-slate-500">Visão geral do sistema ZenixImob.</p>
      </div>
      
      {/* Aqui entrarão os gráficos na próxima etapa */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 bg-white border border-slate-100 rounded-xl shadow-sm">
          <h3 className="text-slate-500 text-sm font-medium">Carregando métricas...</h3>
        </div>
      </div>
    </div>
  );
}