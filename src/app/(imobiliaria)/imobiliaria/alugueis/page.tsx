'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { 
  Users, Home, Plus, FileText, UserCheck, Search, 
  CheckCircle2, XCircle, FileUp, Edit, X, ExternalLink
} from 'lucide-react';

// ==========================================
// FUNÇÕES DE MÁSCARA
// ==========================================
const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '') // Remove tudo o que não é dígito
    .replace(/(\d{3})(\d)/, '$1.$2') // Coloca um ponto entre o terceiro e o quarto dígitos
    .replace(/(\d{3})(\d)/, '$1.$2') // Coloca um ponto entre o terceiro e o quarto dígitos de novo
    .replace(/(\d{3})(\d{1,2})/, '$1-$2') // Coloca um hífen entre o terceiro e o quarto dígitos
    .replace(/(-\d{2})\d+?$/, '$1'); // Captura 2 números seguidos de um traço e não deixa ser digitado mais nada
};

const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{4,5})(\d{4})/, '$1-$2')     .replace(/(-\d{4})\d+?$/, '$1');
};

export default function GestaoLocacaoPage() {
  const [activeTab, setActiveTab] = useState<'inquilinos' | 'imoveis'>('inquilinos');
  
  // Estados para dados
  const [tenants, setTenants] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados dos Modais
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  
  // Estado para controlar se estamos a Editar ou Criar
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  // Formulário de Inquilino
  const [tenantForm, setTenantForm] = useState({
    name: '', cpf: '', currentAddress: '', phone: '', email: '',
    maritalStatus: 'Solteiro', 
    spouseName: '', spouseCpf: '', 
    guarantorName: '', guarantorCpf: '',
    documentUrl: '', spouseDocUrl: '', guarantorDocUrl: '' // Campos para guardar os links dos docs
  });

  // Formulário de Locação (Vincular Inquilino e Contratos ao Imóvel)
  const [rentalForm, setRentalForm] = useState({
    rentStatus: 'Vago',
    tenantId: '',
    contractUrl: '',
    inspectionUrl: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const resTenants = await api.get('/tenants');
      setTenants(resTenants.data);

      const resProperties = await api.get('/properties');
      const rentalProps = resProperties.data.filter((p: any) => p.transaction === 'Aluguel' || p.transaction === 'Venda e Aluguel');
      setProperties(rentalProps);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // FUNÇÕES DE INQUILINOS
  // ==========================================
  
  // Abrir modal limpo para NOVO inquilino
  const handleOpenNewTenantModal = () => {
    setEditingTenantId(null);
    setTenantForm({
      name: '', cpf: '', currentAddress: '', phone: '', email: '',
      maritalStatus: 'Solteiro', spouseName: '', spouseCpf: '', guarantorName: '', guarantorCpf: '',
      documentUrl: '', spouseDocUrl: '', guarantorDocUrl: ''
    });
    setIsTenantModalOpen(true);
  };

  // Abrir modal preenchido para EDITAR inquilino
  const handleEditTenant = (tenant: any) => {
    setEditingTenantId(tenant.id);
    setTenantForm({
      name: tenant.name || '',
      cpf: maskCPF(tenant.cpf || ''),
      currentAddress: tenant.currentAddress || '',
      phone: maskPhone(tenant.phone || ''),
      email: tenant.email || '',
      maritalStatus: tenant.maritalStatus || 'Solteiro',
      spouseName: tenant.spouseName || '',
      spouseCpf: maskCPF(tenant.spouseCpf || ''),
      guarantorName: tenant.guarantorName || '',
      guarantorCpf: maskCPF(tenant.guarantorCpf || ''),
      documentUrl: tenant.documentUrl || '',
      spouseDocUrl: tenant.spouseDocUrl || '',
      guarantorDocUrl: tenant.guarantorDocUrl || ''
    });
    setIsTenantModalOpen(true);
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTenantId) {
        await api.put(`/tenants/${editingTenantId}`, tenantForm);
        alert('Inquilino atualizado com sucesso!');
      } else {
        await api.post('/tenants', tenantForm);
        alert('Inquilino cadastrado com sucesso!');
      }
      setIsTenantModalOpen(false);
      setEditingTenantId(null);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar inquilino.');
    }
  };

  // ==========================================
  // FUNÇÕES DE IMÓVEIS (ALUGUEL)
  // ==========================================
  const handleOpenRentalModal = (property: any) => {
    setSelectedProperty(property);
    setRentalForm({
      rentStatus: property.rentStatus || 'Vago',
      tenantId: property.tenantId || '',
      contractUrl: property.contractUrl || '',
      inspectionUrl: property.inspectionUrl || ''
    });
    setIsPropertyModalOpen(true);
  };

  const handleSaveRental = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/properties/${selectedProperty.id}/rental`, rentalForm);
      alert('Dados de locação atualizados com sucesso!');
      setIsPropertyModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert('Erro ao atualizar locação.');
    }
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center text-slate-500">A carregar dados...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Gestão de Locação</h1>
          <p className="text-slate-500">Faça a gestão dos seus inquilinos e imóveis alugados.</p>
        </div>
      </div>

      {/* ABAS (TABS) */}
      <div className="flex gap-4 border-b border-slate-200 mb-8">
        <button 
          onClick={() => setActiveTab('inquilinos')}
          className={`pb-4 px-2 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'inquilinos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Users size={18} /> Cadastro de Inquilinos
        </button>
        <button 
          onClick={() => setActiveTab('imoveis')}
          className={`pb-4 px-2 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'imoveis' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Home size={18} /> Imóveis para Aluguel
        </button>
      </div>

      {/* =======================================================
          ABA 1: INQUILINOS
          ======================================================= */}
      {activeTab === 'inquilinos' && (
        <div className="animate-in fade-in">
          <div className="flex justify-between items-center mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Buscar inquilino..." className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <button onClick={handleOpenNewTenantModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
              <Plus size={18} /> Novo Inquilino
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nome</th>
                  <th className="py-3 px-4">CPF</th>
                  <th className="py-3 px-4">Telefone</th>
                  <th className="py-3 px-4">Estado Civil</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {tenants.map(tenant => (
                  <tr key={tenant.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium">{tenant.name}</td>
                    <td className="py-3 px-4">{maskCPF(tenant.cpf)}</td>
                    <td className="py-3 px-4">{maskPhone(tenant.phone)}</td>
                    <td className="py-3 px-4">{tenant.maritalStatus}</td>
                    <td className="py-3 px-4">
                      {tenant.isActive 
                        ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-max"><CheckCircle2 size={12}/> Ativo</span>
                        : <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-max"><XCircle size={12}/> Inativo</span>
                      }
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button 
                        onClick={() => handleEditTenant(tenant)}
                        className="text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Editar / Ver Docs
                      </button>
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-500">Nenhum inquilino cadastrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =======================================================
          ABA 2: IMÓVEIS PARA ALUGUEL
          ======================================================= */}
      {activeTab === 'imoveis' && (
        <div className="animate-in fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(property => (
            <div key={property.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 bg-slate-100 relative">
                {property.imageUrls?.[0] ? (
                  <img src={property.imageUrls[0]} alt={property.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300"><Home size={40}/></div>
                )}
                {/* Badge de Status */}
                <div className="absolute top-3 left-3">
                  {property.rentStatus === 'Alugado' ? (
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1"><UserCheck size={14}/> ALUGADO</span>
                  ) : (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1"><CheckCircle2 size={14}/> VAGO</span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-slate-800 line-clamp-1">{property.title}</h3>
                <p className="text-sm text-slate-500 mb-4 line-clamp-1">{property.address}</p>
                
                {property.rentStatus === 'Alugado' && property.tenantId && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Inquilino Atual</p>
                    <p className="text-sm font-medium text-slate-800">
                      {tenants.find(t => t.id === property.tenantId)?.name || 'Carregando...'}
                    </p>
                  </div>
                )}

                <button 
                  onClick={() => handleOpenRentalModal(property)}
                  className="w-full py-2 border border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                >
                  Gerir Locação / Documentos
                </button>
              </div>
            </div>
          ))}
          {properties.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">Nenhum imóvel listado para aluguel.</div>
          )}
        </div>
      )}

      {/* =======================================================
          MODAL: CADASTRAR/EDITAR INQUILINO
          ======================================================= */}
      {isTenantModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800">
                {editingTenantId ? 'Editar Inquilino / Documentos' : 'Cadastrar Inquilino'}
              </h2>
              <button onClick={() => setIsTenantModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSaveTenant} className="p-6 space-y-8">
              
              {/* DADOS PRINCIPAIS */}
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">Dados do Inquilino</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm mb-1 text-slate-600">Nome Completo</label><input required type="text" value={tenantForm.name} onChange={e => setTenantForm({...tenantForm, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                  
                  {/* COM MÁSCARA DE CPF */}
                  <div><label className="block text-sm mb-1 text-slate-600">CPF</label><input required type="text" value={tenantForm.cpf} onChange={e => setTenantForm({...tenantForm, cpf: maskCPF(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" disabled={!!editingTenantId} title={editingTenantId ? "CPF não pode ser alterado" : ""} maxLength={14} /></div>
                  
                  {/* COM MÁSCARA DE TELEFONE */}
                  <div><label className="block text-sm mb-1 text-slate-600">Telefone</label><input required type="text" value={tenantForm.phone} onChange={e => setTenantForm({...tenantForm, phone: maskPhone(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" maxLength={15} /></div>
                  
                  <div><label className="block text-sm mb-1 text-slate-600">E-mail</label><input required type="email" value={tenantForm.email} onChange={e => setTenantForm({...tenantForm, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div className="md:col-span-2"><label className="block text-sm mb-1 text-slate-600">Endereço Atual</label><input required type="text" value={tenantForm.currentAddress} onChange={e => setTenantForm({...tenantForm, currentAddress: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                  
                  <div className="md:col-span-2 mt-2">
                    <div className="flex justify-between items-end mb-1">
                      <label className="block text-sm text-slate-600 font-medium flex items-center gap-2"><FileUp size={16}/> Upload: Documento do Inquilino</label>
                      {tenantForm.documentUrl && (
                        <a href={tenantForm.documentUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                          <ExternalLink size={14}/> Visualizar Anexo
                        </a>
                      )}
                    </div>
                    {/* Nota: Substituir este input futuramente pela lógica de Upload p/ S3, Firebase, etc */}
                    <input type="file" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  </div>
                </div>
              </div>

              {/* ESTADO CIVIL E CÔNJUGE */}
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">Estado Civil</h3>
                <div className="mb-4">
                  <select value={tenantForm.maritalStatus} onChange={e => setTenantForm({...tenantForm, maritalStatus: e.target.value})} className="w-full md:w-1/2 px-3 py-2 border rounded-lg">
                    <option value="Solteiro">Solteiro(a)</option>
                    <option value="Casado">Casado(a)</option>
                    <option value="Divorciado">Divorciado(a)</option>
                    <option value="Viuvo">Viúvo(a)</option>
                  </select>
                </div>

                {tenantForm.maritalStatus === 'Casado' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="md:col-span-2"><p className="text-sm font-bold text-slate-700 mb-2">Dados do Cônjuge</p></div>
                    <div><label className="block text-sm mb-1 text-slate-600">Nome do Cônjuge</label><input type="text" value={tenantForm.spouseName} onChange={e => setTenantForm({...tenantForm, spouseName: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white" /></div>
                    
                    {/* COM MÁSCARA DE CPF */}
                    <div><label className="block text-sm mb-1 text-slate-600">CPF do Cônjuge</label><input type="text" value={tenantForm.spouseCpf} onChange={e => setTenantForm({...tenantForm, spouseCpf: maskCPF(e.target.value)})} className="w-full px-3 py-2 border rounded-lg bg-white" maxLength={14} /></div>
                    
                    <div className="md:col-span-2 mt-2">
                      <div className="flex justify-between items-end mb-1">
                        <label className="block text-sm text-slate-600 flex items-center gap-2"><FileUp size={16}/> Upload: Documento do Cônjuge</label>
                        {tenantForm.spouseDocUrl && (
                          <a href={tenantForm.spouseDocUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                            <ExternalLink size={14}/> Visualizar Anexo
                          </a>
                        )}
                      </div>
                      <input type="file" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300" />
                    </div>
                  </div>
                )}
              </div>

              {/* FIADOR */}
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">Dados do Fiador (Opcional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm mb-1 text-slate-600">Nome do Fiador</label><input type="text" value={tenantForm.guarantorName} onChange={e => setTenantForm({...tenantForm, guarantorName: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                  
                  {/* COM MÁSCARA DE CPF */}
                  <div><label className="block text-sm mb-1 text-slate-600">CPF do Fiador</label><input type="text" value={tenantForm.guarantorCpf} onChange={e => setTenantForm({...tenantForm, guarantorCpf: maskCPF(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" maxLength={14} /></div>
                  
                  <div className="md:col-span-2 mt-2">
                    <div className="flex justify-between items-end mb-1">
                      <label className="block text-sm text-slate-600 flex items-center gap-2"><FileUp size={16}/> Upload: Documentos do Fiador</label>
                      {tenantForm.guarantorDocUrl && (
                        <a href={tenantForm.guarantorDocUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                          <ExternalLink size={14}/> Visualizar Anexo
                        </a>
                      )}
                    </div>
                    <input type="file" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t">
                <button type="button" onClick={() => setIsTenantModalOpen(false)} className="px-5 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">
                  {editingTenantId ? 'Salvar Alterações' : 'Salvar Inquilino'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================
          MODAL: GERIR LOCAÇÃO DO IMÓVEL (Vincular, Contrato, Vistoria)
          ======================================================= */}
      {isPropertyModalOpen && selectedProperty && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Gerir Locação</h2>
                <p className="text-sm text-slate-500 mt-1 line-clamp-1">{selectedProperty.title}</p>
              </div>
              <button onClick={() => setIsPropertyModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
            </div>

            <form onSubmit={handleSaveRental} className="p-6 space-y-6">
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Status do Imóvel</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="rentStatus" value="Vago" checked={rentalForm.rentStatus === 'Vago'} onChange={(e) => setRentalForm({...rentalForm, rentStatus: e.target.value})} className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-green-600">Vago (Disponível)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="rentStatus" value="Alugado" checked={rentalForm.rentStatus === 'Alugado'} onChange={(e) => setRentalForm({...rentalForm, rentStatus: e.target.value})} className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-red-600">Alugado</span>
                  </label>
                </div>
              </div>

              {rentalForm.rentStatus === 'Alugado' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Selecione o Inquilino</label>
                    <select required value={rentalForm.tenantId} onChange={e => setRentalForm({...rentalForm, tenantId: e.target.value})} className="w-full px-3 py-3 border border-slate-300 rounded-lg bg-white outline-none focus:border-blue-500">
                      <option value="" disabled>-- Selecione um inquilino cadastrado --</option>
                      {tenants.map(t => (
                        <option key={t.id} value={t.id}>{t.name} (CPF: {maskCPF(t.cpf)})</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                    <p className="text-sm font-bold text-slate-700">Documentos da Locação</p>
                    
                    <div>
                      <div className="flex justify-between items-end mb-1">
                        <label className="block text-sm text-slate-600 flex items-center gap-2"><FileText size={16}/> Contrato de Aluguel (PDF)</label>
                        {rentalForm.contractUrl && (
                          <a href={rentalForm.contractUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 bg-blue-100 px-2 py-1 rounded">
                            <ExternalLink size={14}/> Ver Contrato
                          </a>
                        )}
                      </div>
                      <input type="file" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 bg-white border border-slate-200 rounded-lg p-1" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-end mb-1">
                        <label className="block text-sm text-slate-600 flex items-center gap-2"><Edit size={16}/> Termo de Vistoria (PDF)</label>
                        {rentalForm.inspectionUrl && (
                          <a href={rentalForm.inspectionUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 bg-blue-100 px-2 py-1 rounded">
                            <ExternalLink size={14}/> Ver Vistoria
                          </a>
                        )}
                      </div>
                      <input type="file" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 bg-white border border-slate-200 rounded-lg p-1" />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t">
                <button type="button" onClick={() => setIsPropertyModalOpen(false)} className="px-5 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}