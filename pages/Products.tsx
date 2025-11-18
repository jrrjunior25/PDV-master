
import React, { useEffect, useState, useRef } from 'react';
import { db } from '../services/db';
import { Product, ImportPreviewData, ImportItem } from '../types';
import { Plus, Search, Package, Edit, Trash2, X, Save, Sparkles, Upload, FileText, Check, ArrowRight, DollarSign, Calendar, CreditCard, RefreshCw, FileSpreadsheet, Download } from 'lucide-react';
import { geminiService } from '../services/geminiService';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [showExcelMenu, setShowExcelMenu] = useState(false);
  
  // Estados para Importação/Conferência XML
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<ImportPreviewData | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProducts(db.getProducts());
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      db.deleteProduct(id);
      setProducts(db.getProducts());
    }
  };

  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setCurrentProduct({
      id: crypto.randomUUID(),
      code: '',
      name: '',
      category: 'Geral',
      price: 0,
      costPrice: 0,
      stock: 0,
      unit: 'UN',
      imageUrl: 'https://picsum.photos/200'
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!currentProduct.name || !currentProduct.price) return alert('Nome e Preço são obrigatórios');
    db.saveProduct(currentProduct as Product);
    setProducts(db.getProducts());
    setIsModalOpen(false);
  };

  const handleGenerateDescription = async () => {
    if (!currentProduct.name) return;
    setGeneratingDesc(true);
    const desc = await geminiService.generateProductDescription(currentProduct.name);
    alert(`Sugestão IA: ${desc}`);
    setGeneratingDesc(false);
  };

  // --- EXCEL HANDLERS ---
  const handleDownloadTemplate = () => {
    db.downloadExcelTemplate();
    setShowExcelMenu(false);
  };

  const handleExportExcel = () => {
    db.exportProductsToExcel();
    setShowExcelMenu(false);
  };

  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    db.importProductsFromExcel(file)
      .then(msg => {
        alert(msg);
        setProducts(db.getProducts());
      })
      .catch(err => alert(err));
    
    if(excelInputRef.current) excelInputRef.current.value = '';
    setShowExcelMenu(false);
  };

  // --- XML HANDLERS ---
  const handleImportXml = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          const content = e.target?.result as string;
          try {
              const preview = db.parseNFe(content);
              setImportData(preview);
              setImportModalOpen(true);
          } catch (err) {
              alert('Erro ao processar XML. Verifique se é uma NFe válida.');
              console.error(err);
          }
      };
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 2. Atualização da Quantidade na Conferência
  const handleUpdateImportQuantity = (index: number, newQty: number) => {
    if (!importData) return;
    const newItems = [...importData.items];
    newItems[index].quantity = newQty;
    setImportData({ ...importData, items: newItems });
  };

  const handleUpdateFinance = (key: string, value: any) => {
    if (!importData) return;
    setImportData({
        ...importData,
        finance: {
            ...importData.finance,
            [key]: value
        }
    });
  };

  // 3. Confirmação Final (Commit)
  const handleConfirmImport = () => {
    if (!importData) return;
    const summary = db.commitImport(importData);
    setProducts(db.getProducts());
    setImportModalOpen(false);
    setImportData(null);
    alert(`Importação Concluída!\n\n📦 Produtos Criados: ${summary.productsCreated}\n🔄 Produtos Atualizados: ${summary.productsUpdated}\n💰 Despesas Geradas: ${summary.financeRecordsCreated}`);
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.code.includes(search)
  );

  // Renderização de parcelas simuladas
  const renderInstallmentsPreview = () => {
      if(!importData) return null;
      const { totalValue, installments, firstDueDate } = importData.finance;
      
      // Garantir que sejam números para o cálculo
      const totalVal = Number(totalValue) || 0;
      const numInstallments = Math.max(1, Number(installments) || 1);
      
      const valuePerInstallment = totalVal / numInstallments;
      const baseDate = new Date(firstDueDate);
      // Ajuste de fuso
      baseDate.setMinutes(baseDate.getMinutes() + baseDate.getTimezoneOffset());

      const previews = [];
      for(let i=0; i<Math.min(numInstallments, 6); i++) {
          const date = new Date(baseDate);
          date.setMonth(date.getMonth() + i);
          previews.push(
              <div key={i} className="flex justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                  <span className="text-slate-500">Parc {i+1}/{numInstallments} - {date.toLocaleDateString()}</span>
                  <span className="font-bold text-slate-700">R$ {valuePerInstallment.toFixed(2)}</span>
              </div>
          );
      }
      if(numInstallments > 6) {
          previews.push(<div key="more" className="text-xs text-center text-slate-400 pt-1">... e mais {numInstallments - 6} parcelas</div>);
      }
      return previews;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Produtos e Estoque</h2>
          <p className="text-slate-500">Gerencie seu catálogo, fiscal e inventário.</p>
        </div>
        <div className="flex gap-3">
            {/* Dropdown Excel */}
            <div className="relative">
              <button 
                onClick={() => setShowExcelMenu(!showExcelMenu)}
                className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                <FileSpreadsheet size={18} className="text-green-600" />
                <span className="hidden md:inline">Excel</span>
              </button>
              
              {showExcelMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-20 overflow-hidden animate-fade-in">
                   <button onClick={handleDownloadTemplate} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700 border-b border-slate-100">
                      <Download size={16} /> Baixar Modelo
                   </button>
                   <button onClick={handleExportExcel} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700 border-b border-slate-100">
                      <Upload className="rotate-180" size={16} /> Exportar Lista
                   </button>
                   <label className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <Upload size={16} /> Importar Excel
                      <input 
                        ref={excelInputRef}
                        type="file" 
                        accept=".xlsx, .xls" 
                        className="hidden" 
                        onChange={handleImportExcel}
                      />
                   </label>
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md cursor-pointer">
                <FileText size={18} />
                <span className="hidden md:inline">Importar XML (NFe)</span>
                <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".xml" 
                    className="hidden"
                    onChange={handleImportXml}
                />
            </label>
            <button 
                onClick={handleNew}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md"
            >
                <Plus size={18} />
                <span className="hidden md:inline">Novo Produto</span>
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text"
                    placeholder="Buscar por nome, código ou EAN..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-3 font-semibold">Produto</th>
                        <th className="px-6 py-3 font-semibold">Código / NCM</th>
                        <th className="px-6 py-3 font-semibold">Categoria</th>
                        <th className="px-6 py-3 font-semibold text-right">Custo</th>
                        <th className="px-6 py-3 font-semibold text-right">Venda</th>
                        <th className="px-6 py-3 font-semibold text-center">Estoque</th>
                        <th className="px-6 py-3 font-semibold text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {filtered.map(product => (
                        <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                        <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <span className="font-medium text-slate-900 block">{product.name}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-slate-600 font-mono text-xs">{product.code}</div>
                                {product.ncm && <div className="text-slate-400 font-mono text-[10px] bg-slate-100 inline px-1 rounded mt-1">NCM: {product.ncm}</div>}
                            </td>
                            <td className="px-6 py-4">
                                <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                                    {product.category}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right text-slate-500 text-sm">
                                R$ {product.costPrice?.toFixed(2) || '0.00'}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-slate-900">
                                R$ {product.price.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className={`font-bold px-2 py-1 rounded text-xs ${product.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                    {product.stock} {product.unit}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                                <button onClick={() => handleEdit(product)} className="text-indigo-600 hover:text-indigo-800 p-1 hover:bg-indigo-50 rounded">
                                    <Edit size={18} />
                                </button>
                                <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded">
                                    <Trash2 size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        
        {filtered.length === 0 && (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                <Package size={48} className="mb-3 opacity-50" />
                <p>Nenhum produto encontrado.</p>
            </div>
        )}
      </div>

      {/* Modal de Conferência XML */}
      {importModalOpen && importData && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                  {/* Header */}
                  <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                      <div>
                          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                              <FileText className="text-indigo-600" /> Conferência de Nota Fiscal
                          </h3>
                          <p className="text-sm text-slate-500 mt-1">
                              Fornecedor: <span className="font-bold text-slate-700">{importData.supplier?.name || 'N/A'}</span> | 
                              CNPJ: {importData.supplier?.cnpj}
                          </p>
                      </div>
                      <button onClick={() => setImportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={24} />
                      </button>
                  </div>

                  <div className="flex flex-1 overflow-hidden">
                      {/* Lista de Itens (Esquerda) */}
                      <div className="flex-1 overflow-y-auto p-0 border-r border-slate-200">
                          <table className="w-full text-left border-collapse">
                              <thead className="bg-slate-100 text-slate-600 text-xs uppercase sticky top-0 z-10 shadow-sm">
                                  <tr>
                                      <th className="px-4 py-3">Status</th>
                                      <th className="px-4 py-3">Código</th>
                                      <th className="px-4 py-3">Produto (XML)</th>
                                      <th className="px-4 py-3 text-right">Custo Un.</th>
                                      <th className="px-4 py-3 text-center w-24">Qtd Nota</th>
                                      <th className="px-4 py-3 text-center w-28 bg-yellow-50 border-x border-yellow-100">Qtd Real</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                  {importData.items.map((item, index) => (
                                      <tr key={index} className="hover:bg-slate-50">
                                          <td className="px-4 py-3">
                                              {item.isNew ? (
                                                  <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded uppercase">Novo</span>
                                              ) : (
                                                  <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded uppercase">Estoque</span>
                                              )}
                                          </td>
                                          <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.code}</td>
                                          <td className="px-4 py-3 text-sm font-medium truncate max-w-[200px]" title={item.name}>{item.name}</td>
                                          <td className="px-4 py-3 text-right text-sm text-slate-600">R$ {item.costPrice.toFixed(2)}</td>
                                          <td className="px-4 py-3 text-center text-sm font-bold text-slate-400">{item.quantity}</td>
                                          <td className="px-4 py-3 text-center bg-yellow-50 border-x border-yellow-100">
                                              <input 
                                                  type="number" 
                                                  className="w-20 text-center border border-slate-300 rounded p-1 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                  value={item.quantity}
                                                  onChange={(e) => handleUpdateImportQuantity(index, parseFloat(e.target.value) || 0)}
                                              />
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>

                      {/* Painel Financeiro (Direita) */}
                      <div className="w-96 bg-slate-50 p-6 overflow-y-auto flex flex-col gap-6 border-l border-slate-200">
                           <div>
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-200">
                                    <DollarSign size={18} className="text-green-600" /> Financeiro / Contas a Pagar
                                </h4>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor Total da Nota (R$)</label>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            className="w-full p-2 border border-slate-300 rounded font-bold text-lg text-slate-800 focus:ring-2 focus:ring-green-500 outline-none bg-white"
                                            value={importData.finance.totalValue}
                                            onChange={(e) => handleUpdateFinance('totalValue', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Forma de Pagamento</label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <select 
                                                className="w-full pl-10 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none bg-white appearance-none"
                                                value={importData.finance.paymentMethod}
                                                onChange={(e) => handleUpdateFinance('paymentMethod', e.target.value)}
                                            >
                                                <option value="BOLETO">Boleto Bancário</option>
                                                <option value="PIX">Pix / Transferência</option>
                                                <option value="DINHEIRO">Dinheiro / À Vista</option>
                                                <option value="CARTAO">Cartão de Crédito</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Parcelas</label>
                                            <input 
                                                type="number" 
                                                min="1"
                                                max="48"
                                                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                                value={importData.finance.installments}
                                                onChange={(e) => handleUpdateFinance('installments', parseInt(e.target.value) || 1)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">1º Vencimento</label>
                                            <input 
                                                type="date" 
                                                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
                                                value={importData.finance.firstDueDate}
                                                onChange={(e) => handleUpdateFinance('firstDueDate', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                           </div>

                           <div className="bg-white rounded-lg border border-slate-200 p-4 flex-1">
                                <h5 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                    <Calendar size={14} /> Simulação de Parcelas
                                </h5>
                                <div className="space-y-1">
                                    {renderInstallmentsPreview()}
                                </div>
                           </div>
                      </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t border-slate-200 flex justify-between items-center bg-slate-50">
                      <div className="text-sm text-slate-500">
                          Total de Itens: <span className="font-bold text-slate-800">{importData.items.length}</span>
                      </div>
                      <div className="flex gap-3">
                          <button 
                              onClick={() => setImportModalOpen(false)}
                              className="px-6 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                          >
                              Cancelar
                          </button>
                          <button 
                              onClick={handleConfirmImport}
                              className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-lg flex items-center gap-2 transition-transform active:scale-95"
                          >
                              <Check size={20} />
                              Confirmar Entrada & Financeiro
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Modal de Produto (Edição/Novo) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800">
                        {currentProduct.id ? 'Editar Produto' : 'Novo Produto'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Dados Gerais */}
                    <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Produto</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                className="flex-1 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={currentProduct.name || ''}
                                onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})}
                            />
                            <button 
                                onClick={handleGenerateDescription}
                                disabled={generatingDesc}
                                className="bg-purple-100 text-purple-700 px-3 rounded-lg text-xs font-bold hover:bg-purple-200 transition-colors flex items-center gap-1"
                            >
                                <Sparkles size={14} />
                                {generatingDesc ? '...' : 'IA'}
                            </button>
                        </div>
                    </div>
                    
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Código (EAN)</label>
                        <input 
                            type="text" 
                            className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                            value={currentProduct.code || ''}
                            onChange={e => setCurrentProduct({...currentProduct, code: e.target.value})}
                        />
                    </div>

                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            value={currentProduct.category || 'Geral'}
                            onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})}
                        >
                            <option value="Alimentos">Alimentos</option>
                            <option value="Bebidas">Bebidas</option>
                            <option value="Limpeza">Limpeza</option>
                            <option value="Laticínios">Laticínios</option>
                            <option value="Hortifruti">Hortifruti</option>
                            <option value="Importado XML">Importado XML</option>
                            <option value="Geral">Geral</option>
                        </select>
                    </div>

                    <div className="md:col-span-1">
                         <label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            value={currentProduct.unit || 'UN'}
                            onChange={e => setCurrentProduct({...currentProduct, unit: e.target.value})}
                        >
                            <option value="UN">Unidade (UN)</option>
                            <option value="KG">Quilo (KG)</option>
                            <option value="LT">Litro (LT)</option>
                            <option value="PC">Pacote (PC)</option>
                            <option value="CX">Caixa (CX)</option>
                        </select>
                    </div>

                    {/* Preços e Estoque */}
                    <div className="bg-slate-50 p-4 rounded-lg md:col-span-3 grid grid-cols-3 gap-4 border border-slate-200">
                        <div className="col-span-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-[-8px]">Financeiro & Estoque</div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Preço Custo (R$)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={currentProduct.costPrice || 0}
                                onChange={e => setCurrentProduct({...currentProduct, costPrice: parseFloat(e.target.value)})}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Preço Venda (R$)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={currentProduct.price || 0}
                                onChange={e => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value)})}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Estoque Atual</label>
                            <input 
                                type="number" 
                                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                value={currentProduct.stock || 0}
                                onChange={e => setCurrentProduct({...currentProduct, stock: parseFloat(e.target.value)})}
                            />
                        </div>
                    </div>

                    {/* Dados Fiscais */}
                    <div className="bg-blue-50 p-4 rounded-lg md:col-span-3 grid grid-cols-3 gap-4 border border-blue-100">
                        <div className="col-span-3 text-xs font-bold text-blue-700 uppercase tracking-wider mb-[-8px] flex items-center gap-1">
                            <FileText size={12} /> Informações Fiscais
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">NCM</label>
                            <input 
                                type="text" 
                                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={currentProduct.ncm || ''}
                                onChange={e => setCurrentProduct({...currentProduct, ncm: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">CFOP</label>
                            <input 
                                type="text" 
                                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={currentProduct.cfop || ''}
                                onChange={e => setCurrentProduct({...currentProduct, cfop: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">CEST</label>
                            <input 
                                type="text" 
                                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={currentProduct.cest || ''}
                                onChange={e => setCurrentProduct({...currentProduct, cest: e.target.value})}
                            />
                        </div>
                    </div>
                    
                    <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-slate-700 mb-1">URL da Imagem</label>
                        <input 
                            type="text" 
                            className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={currentProduct.imageUrl || ''}
                            onChange={e => setCurrentProduct({...currentProduct, imageUrl: e.target.value})}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 flex items-center gap-2 shadow-md"
                    >
                        <Save size={18} />
                        Salvar Produto
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
