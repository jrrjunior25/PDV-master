
import React, { useEffect, useState, useRef } from 'react';
import { db } from '../../infra/db';
import { AppSettings } from '../../core/types';
import { Save, Upload, Download, Server, FileCheck, CreditCard, Printer, Store, CheckCircle, Key } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'GERAL' | 'FISCAL' | 'BACKUP'>('GERAL');
  const [feedback, setFeedback] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loaded = db.getSettings();
    setSettings(loaded);
  }, []);

  const updateSetting = (key: keyof AppSettings, value: any) => {
    if (settings) {
      setSettings({ ...settings, [key]: value });
    }
  };

  if (!settings) return <div className="p-8">Carregando configurações...</div>;

  const handleSave = () => {
    if (settings) {
      db.saveSettings(settings);
      setFeedback('Configurações salvas com sucesso!');
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  const handleExportBackup = () => {
    const json = db.createBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_mercadomaster_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setFeedback('Backup exportado para Downloads!');
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (db.restoreBackup(content)) {
        alert('Backup restaurado com sucesso! A página será recarregada.');
        window.location.reload();
      } else {
        alert('Erro ao processar arquivo. Verifique se é um backup válido.');
      }
    };
    reader.readAsText(file);
  };

  const handleCertificateUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && settings) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Data = e.target?.result as string;
            setSettings({ 
                ...settings, 
                certificateName: file.name,
                certificateData: base64Data 
            });
            setFeedback('Certificado carregado e pronto para salvar.');
        };
        reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Configurações do Sistema</h2>
          <p className="text-slate-500">Personalize os dados da empresa, fiscal e backup.</p>
        </div>
        {feedback && (
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg flex items-center gap-2 animate-bounce">
            <CheckCircle size={18} /> {feedback}
          </div>
        )}
      </div>

      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('GERAL')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'GERAL' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-2">
             <Store size={18} /> Empresa & Pix
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('FISCAL')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'FISCAL' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-2">
             <FileCheck size={18} /> Fiscal & Hardware
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('BACKUP')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'BACKUP' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-2">
             <Server size={18} /> Backup & Dados
          </div>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        
        {activeTab === 'GERAL' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                 <Store className="text-indigo-500" size={20} />
                 Dados da Empresa
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Razão Social</label>
                  <input 
                    type="text" 
                    value={settings.companyName || ''}
                    onChange={e => updateSetting('companyName', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
                  <input 
                    type="text" 
                    value={settings.cnpj || ''}
                    onChange={e => updateSetting('cnpj', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo (Rua, Num - Bairro - Cidade/UF)</label>
                  <input 
                    type="text" 
                    value={settings.address || ''}
                    onChange={e => updateSetting('address', e.target.value)}
                    placeholder="Ex: Rua A, 100 - Centro - São Paulo/SP"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <p className="text-xs text-slate-400 mt-1">A cidade é extraída automaticamente do endereço para o PIX.</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                 <CreditCard className="text-indigo-500" size={20} />
                 Configuração Pix (QR Code)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Chave</label>
                   <select 
                      value={settings.pixKeyType || 'CNPJ'}
                      onChange={e => updateSetting('pixKeyType', e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                   >
                      <option value="CNPJ">CNPJ</option>
                      <option value="CPF">CPF</option>
                      <option value="EMAIL">E-mail</option>
                      <option value="PHONE">Telefone</option>
                      <option value="RANDOM">Chave Aleatória</option>
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Chave Pix</label>
                   <input 
                    type="text" 
                    value={settings.pixKey || ''}
                    onChange={e => updateSetting('pixKey', e.target.value)}
                    placeholder="Ex: 12.345.678/0001-90"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'FISCAL' && (
           <div className="space-y-8 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                   <FileCheck className="text-indigo-500" size={20} />
                   NFC-e e Certificado Digital
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ambiente de Emissão</label>
                        <div className="flex gap-4 mt-2">
                            <label className={`flex items-center gap-2 border p-3 rounded-lg cursor-pointer transition-all flex-1 ${settings.environment === 'HOMOLOGACAO' ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                                <input 
                                    type="radio" 
                                    name="env" 
                                    className="hidden"
                                    checked={settings.environment === 'HOMOLOGACAO'}
                                    onChange={() => updateSetting('environment', 'HOMOLOGACAO')}
                                />
                                <div>
                                    <div className="font-bold text-sm text-slate-900">Homologação</div>
                                    <div className="text-xs text-slate-500">Para testes (Sem valor fiscal)</div>
                                </div>
                            </label>
                            <label className={`flex items-center gap-2 border p-3 rounded-lg cursor-pointer transition-all flex-1 ${settings.environment === 'PRODUCAO' ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                                <input 
                                    type="radio" 
                                    name="env" 
                                    className="hidden"
                                    checked={settings.environment === 'PRODUCAO'}
                                    onChange={() => updateSetting('environment', 'PRODUCAO')}
                                />
                                <div>
                                    <div className="font-bold text-sm text-slate-900">Produção</div>
                                    <div className="text-xs text-slate-500">Venda real (Valor fiscal)</div>
                                </div>
                            </label>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Certificado A1 (.pfx)</label>
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center text-center bg-slate-50 h-[86px]">
                            {settings.certificateName ? (
                                <div className="flex flex-col items-center">
                                     <div className="flex items-center gap-2 text-green-600 font-bold mb-1">
                                        <FileCheck size={20} /> {settings.certificateName}
                                     </div>
                                     <span className="text-[10px] text-slate-400">Salvo em banco de dados local</span>
                                </div>
                            ) : (
                                <>
                                    <label className="cursor-pointer text-indigo-600 font-medium hover:underline">
                                        Carregar Arquivo
                                        <input type="file" className="hidden" accept=".pfx" onChange={handleCertificateUpload} />
                                    </label>
                                    <span className="text-slate-400 text-xs mt-1">Nenhum certificado</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
              </div>
              
              <div className="border-t border-slate-100 pt-6">
                 <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                   <Key className="text-indigo-500" size={20} />
                   Parâmetros de Emissão (CSC / Série)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Série NFC-e</label>
                        <input 
                            type="number" 
                            className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={settings.nfcSeries || 1}
                            onChange={e => updateSetting('nfcSeries', parseInt(e.target.value) || 1)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Próximo Número</label>
                        <input 
                            type="number" 
                            className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-600"
                            value={settings.nextNfcNumber || 1}
                            onChange={e => updateSetting('nextNfcNumber', parseInt(e.target.value) || 1)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">ID do Token (CSC)</label>
                        <input 
                            type="text" 
                            placeholder="Ex: 000001"
                            className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={settings.cscId || ''}
                            onChange={e => updateSetting('cscId', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Código CSC (Token)</label>
                        <input 
                            type="password"
                            placeholder="Código Alfa-Numérico"
                            className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={settings.cscToken || ''}
                            onChange={e => updateSetting('cscToken', e.target.value)}
                        />
                    </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                   <Printer className="text-indigo-500" size={20} />
                   Hardware & Impressão
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Largura da Impressão</label>
                         <select 
                            value={settings.printerWidth || 80}
                            onChange={e => updateSetting('printerWidth', Number(e.target.value))}
                            className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                         >
                            <option value={80}>80mm (Padrão Térmica)</option>
                            <option value={58}>58mm (Mini Impressora)</option>
                         </select>
                    </div>
                </div>
              </div>
           </div>
        )}

        {activeTab === 'BACKUP' && (
           <div className="space-y-8 animate-fade-in">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-blue-800 mb-2 flex items-center gap-2">
                        <Server size={20} />
                        Segurança dos Dados
                    </h3>
                    <p className="text-blue-700 mb-6 text-sm leading-relaxed">
                        Como este sistema opera em modo <strong>Offline-First</strong>, todos os seus dados (vendas, produtos, financeiro) estão salvos exclusivamente neste navegador.
                        Recomendamos fazer o backup diário para garantir a segurança das informações.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                            onClick={handleExportBackup}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-md"
                        >
                            <Download size={20} />
                            Baixar Backup Completo
                        </button>
                        
                        <label className="flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-lg font-bold transition-colors shadow-sm cursor-pointer">
                            <Upload size={20} />
                            Restaurar Backup
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                accept=".json" 
                                className="hidden" 
                                onChange={handleImportBackup}
                            />
                        </label>
                    </div>
                </div>
           </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
            <button 
                onClick={handleSave}
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-lg flex items-center gap-2 transition-transform active:scale-95"
            >
                <Save size={20} />
                Salvar Alterações
            </button>
        </div>
      </div>
    </div>
  );
};
