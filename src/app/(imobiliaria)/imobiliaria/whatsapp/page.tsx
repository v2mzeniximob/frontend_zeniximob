'use client';

import { useState, useEffect } from 'react';
import { api } from '@/src/lib/api';
import { 
  Smartphone, MessageSquare, Loader2, CheckCircle2, 
  QrCode, RefreshCcw, Power, PowerOff, ShieldCheck, 
  AlertCircle, Bot
} from 'lucide-react';

export default function WhatsappPage() {
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados do Formulário do Bot
  const [botEnabled, setBotEnabled] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');

  useEffect(() => {
    fetchWhatsappStatus();
  }, []);

  // Simula um "Polling" para verificar se o QR Code já foi lido (A cada 5 segundos se estiver gerando QR)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (config?.status === 'QR_READY') {
      interval = setInterval(() => {
        fetchWhatsappStatus(false);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [config?.status]);

  const fetchWhatsappStatus = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const response = await api.get('/whatsapp/status');
      setConfig(response.data);
      setBotEnabled(response.data?.botEnabled || false);
      setWelcomeMessage(response.data?.welcomeMessage || 'Olá! Sou o assistente virtual da imobiliária. Como posso ajudar hoje?');
    } catch (error) {
      console.error('Erro ao buscar status do WhatsApp:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsProcessing(true);
    try {
      // Chama o backend para criar a instância na Evolution API e gerar o QR
      const response = await api.post('/whatsapp/connect');
      setConfig(response.data);
    } catch (error) {
      alert('Erro ao gerar QR Code. Verifique se a API do WhatsApp está online.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Tem certeza que deseja desconectar o WhatsApp da plataforma? O robô irá parar de funcionar imediatamente.')) return;
    setIsProcessing(true);
    try {
      await api.post('/whatsapp/disconnect');
      await fetchWhatsappStatus();
    } catch (error) {
      alert('Erro ao desconectar.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveBotSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await api.put('/whatsapp/settings', { botEnabled, welcomeMessage });
      alert('Configurações do Robô atualizadas com sucesso!');
      fetchWhatsappStatus();
    } catch (error) {
      alert('Erro ao salvar as configurações.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return <div className="min-h-[80vh] flex justify-center items-center text-slate-500"><Loader2 className="animate-spin" size={40}/></div>;

  const isConnected = config?.status === 'CONNECTED';
  const hasQR = config?.status === 'QR_READY' && config?.qrCodeBase64;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto font-sans animate-in fade-in duration-300">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <MessageSquare className="text-emerald-500 bg-emerald-50 p-1.5 rounded-lg" size={36} />
          Integração WhatsApp & Bot
        </h1>
        <p className="text-slate-500 mt-2">Conecte o número da sua imobiliária e deixe o nosso Robô Inteligente qualificar os seus leads 24h por dia.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUNA ESQUERDA: STATUS DA CONEXÃO */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center flex flex-col items-center">
            
            {isConnected ? (
              <>
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-inner border-4 border-white ring-4 ring-emerald-50">
                  <Smartphone size={40} />
                  <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Conectado!</h2>
                <p className="text-slate-500 text-sm mb-8 px-4">O seu WhatsApp está vinculado ao ZenixImob e pronto para enviar e receber mensagens.</p>
                
                <div className="w-full space-y-3">
                  <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-emerald-100">
                    <ShieldCheck size={18}/> Sessão Ativa & Segura
                  </div>
                  <button onClick={handleDisconnect} disabled={isProcessing} className="w-full bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 p-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                    {isProcessing ? <Loader2 size={18} className="animate-spin"/> : <PowerOff size={18}/>}
                    Desconectar Aparelho
                  </button>
                </div>
              </>
            ) : hasQR ? (
              <>
                <div className="mb-4 text-emerald-600 flex flex-col items-center">
                  <QrCode size={40} className="mb-2"/>
                  <h2 className="font-bold text-lg">Aguardando Leitura...</h2>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 w-full max-w-[250px] aspect-square flex items-center justify-center relative overflow-hidden">
                  <img src={config.qrCodeBase64} alt="WhatsApp QR Code" className="w-full h-full object-contain" />
                </div>
                <ol className="text-left text-sm text-slate-600 space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <li><strong>1.</strong> Abra o WhatsApp no seu telemóvel.</li>
                  <li><strong>2.</strong> Toque em <strong>Configurações</strong> {'>'} <strong>Aparelhos Conectados</strong>.</li>
                  <li><strong>3.</strong> Toque em <strong>Conectar um aparelho</strong> e aponte a câmara para este ecrã.</li>
                </ol>
                <button onClick={handleConnect} disabled={isProcessing} className="w-full bg-slate-800 hover:bg-slate-900 text-white p-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  <RefreshCcw size={16} className={isProcessing ? "animate-spin" : ""} /> Gerar Novo QR Code
                </button>
              </>
            ) : (
              <>
                <div className="w-24 h-24 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6 border border-slate-200">
                  <Power size={40} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">WhatsApp Desconectado</h2>
                <p className="text-slate-500 text-sm mb-8 px-4">Conecte o seu aparelho para ativar as automações de atendimento e registo de leads.</p>
                <button onClick={handleConnect} disabled={isProcessing} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-md disabled:opacity-50">
                  {isProcessing ? <Loader2 size={18} className="animate-spin"/> : <QrCode size={18}/>}
                  Gerar QR Code de Conexão
                </button>
              </>
            )}

          </div>

          {!isConnected && (
             <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start gap-3 text-amber-800 text-sm">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-1">Aviso Importante</p>
                  <p>Mantenha o telemóvel conectado à internet. O Robô e o registo automático de leads no CRM só funcionam enquanto o WhatsApp estiver devidamente emparelhado.</p>
                </div>
             </div>
          )}
        </div>

        {/* COLUNA DIREITA: CONFIGURAÇÕES DO ROBÔ */}
        <div className="lg:col-span-7">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden h-full">
            
            {/* Overlay de Bloqueio caso não esteja conectado */}
            {!isConnected && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center p-6 text-center">
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 max-w-sm">
                  <Bot size={40} className="text-slate-300 mx-auto mb-3" />
                  <h3 className="font-bold text-slate-800 mb-2">Conecte o WhatsApp Primeiro</h3>
                  <p className="text-sm text-slate-500">As configurações do robô de triagem só ficarão disponíveis após ler o QR Code com sucesso.</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
              <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600"><Bot size={24}/></div>
              <div>
                <h3 className="font-bold text-xl text-slate-800">Robô de Qualificação (IA)</h3>
                <p className="text-sm text-slate-500">Configurações do comportamento do chatbot.</p>
              </div>
            </div>

            <form onSubmit={handleSaveBotSettings} className="space-y-8">
              
              {/* Toggle Ligar/Desligar Bot */}
              <div className="flex items-center justify-between p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <p className="font-bold text-slate-800">Ativar Robô de Triagem?</p>
                  <p className="text-sm text-slate-500 mt-1">Se ativado, o robô responderá aos clientes instantaneamente e criará o Lead no Kanban sozinho.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer scale-110">
                  <input type="checkbox" className="sr-only peer" checked={botEnabled} onChange={e => setBotEnabled(e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Mensagem de Saudação */}
              <div className={`transition-opacity duration-300 ${botEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <label className="block font-bold text-slate-700 mb-2">Mensagem de Saudação Inicial</label>
                <p className="text-xs text-slate-500 mb-3">Esta é a primeira mensagem que o bot envia quando alguém manda "Olá". Depois disto, o bot assume o controlo e começa a fazer perguntas para qualificar o lead.</p>
                <textarea 
                  rows={4} 
                  required
                  value={welcomeMessage} 
                  onChange={e => setWelcomeMessage(e.target.value)}
                  className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm bg-white"
                  placeholder="Ex: Olá! Sou o assistente virtual da imobiliária..."
                ></textarea>
                
                <div className="mt-6 bg-blue-50 border border-blue-100 p-5 rounded-2xl text-sm text-blue-800 leading-relaxed">
                  <strong>💡 Como o Robô funciona:</strong><br/>
                  Após a saudação, a nossa Inteligência Artificial vai tentar extrair naturalmente do cliente as seguintes informações: 
                  <ul className="list-disc pl-5 mt-2 space-y-1 font-medium">
                    <li>Deseja Comprar ou Alugar?</li>
                    <li>Qual o tipo de imóvel (Casa, Apê)?</li>
                    <li>Qual o orçamento máximo?</li>
                    <li>Em quais bairros procura?</li>
                  </ul>
                  Assim que ele conseguir essas respostas, o robô encerra o seu papel, cria o card na coluna <strong>"Novo"</strong> no CRM e você assume!
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button type="submit" disabled={isProcessing || !isConnected} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-8 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 ml-auto">
                  {isProcessing ? <Loader2 size={20} className="animate-spin"/> : <CheckCircle2 size={20}/>}
                  Salvar Configurações
                </button>
              </div>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
}