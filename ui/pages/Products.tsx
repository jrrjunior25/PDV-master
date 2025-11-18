
import React, { useEffect, useState, useRef } from 'react';
import { db } from '../../infra/db';
import { Product, ImportPreviewData, StockMovement } from '../../core/types';
import { Plus, Search, Edit, Trash2, X, FileText, FileSpreadsheet, Download, Upload, History } from 'lucide-react';
import { geminiService } from '../../infra/services/geminiService';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [showExcelMenu, setShowExcelMenu] = useState(false);
  
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<ImportPreviewData | null>(null);

  const [kardexModalOpen, setKardexModalOpen] = useState(false);
  const [productMovements, setProductMovements] = useState<StockMovement[]>([]);
  const [selectedProductForKardex, setSelectedProductForKardex] = useState<string>('');
  
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
      wholesalePrice: 0,
      wholesaleMinQuantity: 0,
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

  const handleOpenKardex = (product: Product) => {
      setSelectedProductForKardex(product.name);
      const moves = db.getStockMovements(product.id);
      setProductMovements(moves);
      setKardexModalOpen(true);
  };

  const handleGenerateDescription = async () => {
    if (!currentProduct.name) return;
    setGeneratingDesc(true);
    const desc = await geminiService.generateProductDescription(currentProduct.name);
    alert(`Sugestão IA: ${desc}`);
    setGeneratingDesc(false);
  };

  const handleDownloadTemplate = () => { db.downloadExcelTemplate(); setShowExcelMenu(false); };
  const handleExportExcel = () => { db.exportProductsToExcel(); setShowExcelMenu(false); };
  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => { 
      const file = event.target.files?.[0];
      if (!file) return;
      db.importProductsFromExcel(file).then(msg => { alert(msg); setProducts(db.getProducts()); }).catch(err => alert(err));
      if(excelInputRef.current) excelInputRef.current.value = '';
      setShowExcelMenu(false);
  };

  const handleImportXml = (event: React.ChangeEvent<HTMLInputElement>) => { 
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const preview = db.parseNFe(e.target?.result as string);
              setImportData(preview);
              setImportModalOpen(true);
          } catch (err) { alert('Erro ao ler XML'); }
      };
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleConfirmImport = () => {
      if(!importData) return;
      const summary = db.commitImport(importData);
      setProducts(db.getProducts());
      setImportModalOpen(false);
      setImportData(null);
      alert(`Importação OK. ${summary.productsUpdated} atualizados, ${summary.productsCreated} criados.`);
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.code.includes(search)
  );

  const renderInstallmentsPreview = () => {
    if(!importData) return null;
    const { totalValue, installments } = importData.finance;
    return <div className="text-xs text-slate-500 mt-2">Simulação: {installments}x de R$ {(Number(totalValue)/Number(installments)).toFixed(2)}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Produtos e Estoque</h2>
          <p className="text-slate-500">Gerencie seu catálogo, fiscal e inventário.</p>
        </div>
        <div className="flex gap-3">
             <div className="relative">
              <button onClick={() => setShowExcelMenu(!showExcelMenu)} className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition-colors shadow-sm">
                <FileSpreadsheet size={18} className="text-green-600" /><span className="hidden md:inline">Excel</span>
              </button>
              {showExcelMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-20 overflow-hidden">
                   <button onClick={handleDownloadTemplate} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700 border-b border-slate-100"><Download size={16} /> Baixar Modelo</button>
                   <button onClick={handleExportExcel} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700"><Upload className="rotate-180" size={16} /> Exportar Lista</button>
                   <label className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700 cursor-pointer"><Upload size={16} /> Importar Excel<input ref={excelInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleImportExcel} /></label>
                </div>
              )}
            </div>
            <label className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md cursor-pointer">
                <FileText size={18} /><span className="hidden md:inline">Importar XML</span>
                <input ref={fileInputRef} type="file" accept=".xml" className="hidden" onChange={handleImportXml} />
            </label>
            <button onClick={handleNew} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md">
                <Plus size={18} /><span className="hidden md:inline">Novo Produto</span>
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-3 font-semibold">Produto</th>
                        <th className="px-6 py-3 font-semibold text-right">Varejo</th>
                        <th className="px-6 py-3 font-semibold text-right">Atacado</th>
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
                                        <span className="text-xs text-slate-500 font-mono">{product.code}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-slate-900">R$ {product.price.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right text-sm text-slate-600">
                                {product.wholesalePrice && product.wholesaleMinQuantity ? (
                                    <div>
                                        <span className="text-indigo-600 font-bold">R$ {product.wholesalePrice.toFixed(2)}</span>
                                        <div className="text-[10px] text-slate-400">Min: {product.wholesaleMinQuantity} un</div>
                                    </div>
                                ) : '-'}
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className={`font-bold px-2 py-1 rounded text-xs ${product.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                    {product.stock} {product.unit}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                                <button onClick={() => handleOpenKardex(product)} className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded" title="Histórico de Estoque">
                                    <History size={18} />
                                </button>
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
      </div>

      {kardexModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl">
                  <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
                      <div>
                          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                              <History className="text-blue-600" /> Histórico de Movimentação (Kardex)
                          </h3>
                          <p className="text-slate-500 text-sm mt-1">Produto: <span className="font-bold text-slate-700">{selectedProductForKardex}</span></p>
                      </div>
                      <button onClick={() => setKardexModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-0">
                      <table className="w-full text-left">
                          <thead className="bg-slate-100 text-slate-600 text-xs uppercase sticky top-0">
                              <tr>
                                  <th className="px-6 py-3">Data/Hora</th>
                                  <th className="px-6 py-3">Tipo</th>
                                  <th className="px-6 py-3">Descrição</th>
                                  <th className="px-6 py-3 text-right">Qtd</th>
                                  <th className="px-6 py-3 text-right">Saldo Anterior</th>
                                  <th className="px-6 py-3 text-right">Saldo Novo</th>
                                  <th className="px-6 py-3">Usuário</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                              {productMovements.map(move => (
                                  <tr key={move.id} className="hover:bg-slate-50">
                                      <td className="px-6 py-3 text-xs text-slate-500">{new Date(move.timestamp).toLocaleString()}</td>
                                      <td className="px-6 py-3">
                                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                              move.quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                          }`}>
                                              {move.type === 'SALE' ? 'VENDA' : move.type === 'ENTRY_XML' ? 'ENTRADA XML' : move.type === 'MANUAL_ADJUST' ? 'AJUSTE' : move.type}
                                          </span>
                                      </td>
                                      <td className="px-6 py-3 text-sm">{move.description}</td>
                                      <td className={`px-6 py-3 text-right font-bold ${move.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {move.quantity > 0 ? '+' : ''}{move.quantity}
                                      </td>
                                      <td className="px-6 py-3 text-right text-sm text-slate-400">{move.previousStock}</td>
                                      <td className="px-6 py-3 text-right text-sm font-bold text-slate-800">{move.newStock}</td>
                                      <td className="px-6 py-3 text-xs text-slate-500">{move.userId}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                      {productMovements.length === 0 && <div className="p-8 text-center text-slate-400">Nenhuma movimentação registrada.</div>}
                  </div>
              </div>
          </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800">{currentProduct.id ? 'Editar Produto' : 'Novo Produto'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3"><label className="block text-sm font-medium text-slate-700 mb-1">Nome</label><input type="text" className="w-full border border-slate-300 rounded-lg p-2" value={currentProduct.name} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} /></div>
                    <div className="md:col-span-1"><label className="block text-sm font-medium text-slate-700 mb-1">Código</label><input type="text" className="w-full border border-slate-300 rounded-lg p-2" value={currentProduct.code} onChange={e => setCurrentProduct({...currentProduct, code: e.target.value})} /></div>
                    <div className="md:col-span-1"><label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label><select className="w-full border border-slate-300 rounded-lg p-2" value={currentProduct.category} onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})}><option value="Geral">Geral</option><option value="Alimentos">Alimentos</option><option value="Bebidas">Bebidas</option></select></div>
                    <div className="md:col-span-1"><label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label><select className="w-full border border-slate-300 rounded-lg p-2" value={currentProduct.unit} onChange={e => setCurrentProduct({...currentProduct, unit: e.target.value})}><option value="UN">UN</option><option value="KG">KG</option></select></div>

                    <div className="bg-slate-50 p-4 rounded-lg md:col-span-3 grid grid-cols-4 gap-4 border border-slate-200">
                        <div className="col-span-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-[-8px]">Precificação & Estoque</div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Preço Venda (Varejo)</label>
                            <input type="number" step="0.01" className="w-full border border-slate-300 rounded-lg p-2 font-bold" value={currentProduct.price || 0} onChange={e => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value)})} />
                        </div>
                         <div className="bg-indigo-50 p-2 rounded border border-indigo-100">
                            <label className="block text-xs font-bold text-indigo-700 mb-1">Preço Atacado (R$)</label>
                            <input type="number" step="0.01" className="w-full border border-indigo-200 rounded-lg p-1 text-sm" value={currentProduct.wholesalePrice || 0} onChange={e => setCurrentProduct({...currentProduct, wholesalePrice: parseFloat(e.target.value)})} />
                        </div>
                        <div className="bg-indigo-50 p-2 rounded border border-indigo-100">
                            <label className="block text-xs font-bold text-indigo-700 mb-1">Qtd Mín. Atacado</label>
                            <input type="number" className="w-full border border-indigo-200 rounded-lg p-1 text-sm" value={currentProduct.wholesaleMinQuantity || 0} onChange={e => setCurrentProduct({...currentProduct, wholesaleMinQuantity: parseFloat(e.target.value)})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Estoque Atual</label>
                            <input type="number" className="w-full border border-slate-300 rounded-lg p-2" value={currentProduct.stock || 0} onChange={e => setCurrentProduct({...currentProduct, stock: parseFloat(e.target.value)})} />
                        </div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg md:col-span-3 grid grid-cols-3 gap-4 border border-blue-100">
                        <div className="col-span-3 text-xs font-bold text-blue-700 uppercase tracking-wider mb-[-8px]">Fiscal</div>
                        <div><label className="block text-sm text-slate-700">NCM</label><input className="w-full border rounded p-1" value={currentProduct.ncm || ''} onChange={e => setCurrentProduct({...currentProduct, ncm: e.target.value})} /></div>
                        <div><label className="block text-sm text-slate-700">CFOP</label><input className="w-full border rounded p-1" value={currentProduct.cfop || ''} onChange={e => setCurrentProduct({...currentProduct, cfop: e.target.value})} /></div>
                    </div>
                    <div className="md:col-span-3"><label className="block text-sm text-slate-700">Imagem URL</label><input className="w-full border rounded p-1" value={currentProduct.imageUrl || ''} onChange={e => setCurrentProduct({...currentProduct, imageUrl: e.target.value})} /></div>
                </div>
                <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md">Salvar Produto</button>
                </div>
            </div>
        </div>
      )}

      {importModalOpen && importData && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-4xl h-[90vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-center"><h3 className="text-xl font-bold">Importar XML</h3><button onClick={() => setImportModalOpen(false)}><X /></button></div>
                <div className="flex-1 overflow-y-auto p-6">
                    <p>Itens na nota: {importData.items.length}</p>
                    <div className="mt-4 p-4 bg-slate-100 rounded">{renderInstallmentsPreview()}</div>
                </div>
                <div className="p-6 border-t bg-slate-50 flex justify-end"><button onClick={handleConfirmImport} className="bg-green-600 text-white px-6 py-2 rounded font-bold">Confirmar Importação</button></div>
            </div>
        </div>
      )}
    </div>
  );
};
