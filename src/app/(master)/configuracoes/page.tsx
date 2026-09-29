'use client';

import { Settings } from 'lucide-react';

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configurações do Sistema</h1>
        <p className="text-slate-500 text-sm">Gerencie as preferências globais do painel.</p>
      </div>

      {/* Cartão de Aviso */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
          <Settings size={32} className="animate-spin-slow" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800">Módulo em Desenvolvimento</h2>
        <p className="text-slate-500 mt-2 max-w-md">
          As configurações globais (dados do administrador master, personalização e integrações avançadas) estarão disponíveis nas próximas atualizações do sistema.
        </p>
      </div>
    </div>
  );
}