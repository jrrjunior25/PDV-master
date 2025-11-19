import React, { useEffect, useState, useRef } from 'react';
import { db } from '../../infra/db';
import { Product, ImportPreviewData, StockMovement } from '../../core/types';
import { Plus, Search, Edit, Trash2, X, FileText, FileSpreadsheet, Download, Upload, History, AlertTriangle, Check, DollarSign, Calendar, CreditCard, Layers, Printer, ListPlus, Minus } from 'lucide-react';
import { geminiService } from '../../infra/services/geminiService';

interface PrintQueueItem {
    product: Product;
    quantity: number;
}

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [showExcelMenu, setShowExcelMenu] = useState(false);
  
  // Importação XML
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<ImportPreviewData | null>(null);

  // Kardex
  const [kardexModalOpen, setKardexModalOpen] = useState(false);
  const [productMovements, setProductMovements] = useState<StockMovement[]>([]);
  const [selectedProductForKardex, setSelectedProductForKardex] = useState<string>('');
  
  // Impressão de Etiquetas
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printQueue, setPrintQueue] = useState<PrintQueueItem[]>([]);
  const [searchLabel, setSearchLabel] = useState('');

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

  const handleUpdateImportItem = (index: number, field: 'quantity' | 'costPrice', value: string) => {
      if (!importData) return;
      const numValue = value === '' ? 0 : parseFloat(value);
      const newItems = [...importData.items];
      newItems[index] = { ...newItems[index], [field]: numValue };
      setImportData({ ...importData, items: newItems });
  };

  const handleUpdateFinance = (field: string, value: string | number) => {
      if (!importData) return;
      setImportData(prev => {
          if(!prev) return null;
          return {
              ...prev,
              finance: {
                  ...prev.finance,
                  [field]: value
              }
          };
      });
  };
  
  const handleConfirmImport = () => {
      if(!importData) return;
      const summary = db.commitImport(importData);
      setProducts(db.getProducts());
      setImportModalOpen(false);
      setImportData(null);
      alert(`Importação Realizada!\n\n📦 Produtos: ${summary.productsUpdated} atualizados, ${summary.productsCreated} criados.\n💰 Financeiro: ${summary.financeRecordsCreated} contas a pagar lançadas.`);
  };

  // --- LÓGICA DE IMPRESSÃO DE ETIQUETAS ---
  const addToPrintQueue = (product: Product) => {
      const existing = printQueue.find(item => item.product.id === product.id);
      if (existing) {
          setPrintQueue(printQueue.map(item => 
              item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          ));
      } else {
          setPrintQueue([...printQueue, { product, quantity: 1 }]);
      }
  };

  const removeFromPrintQueue = (productId: string) => {
      setPrintQueue(printQueue.filter(item => item.product.id !== productId));
  };

  const updateQueueQuantity = (productId: string, newQty: number) => {
      if (newQty < 1) return;
      setPrintQueue(printQueue.map(item => 
          item.product.id === productId ? { ...item, quantity: newQty } : item
      ));
  };

  const executePrint = () => {
      if (printQueue.length === 0) return alert("A fila de impressão está vazia.");

      const printWindow = window.open('', '_blank', 'width=900,height=600');
      if (!printWindow) return alert("Pop-up bloqueado. Permita pop-ups para imprimir.");

      // Gera o array final de etiquetas repetindo o produto conforme a quantidade
      const labelsToRender: Product[] = [];
      printQueue.forEach(item => {
          for (let i = 0; i < item.quantity; i++) {
              labelsToRender.push(item.product);
          }
      });

      // OTIMIZAÇÃO DO CÓDIGO DE BARRAS:
      // 1. width: 1.6 -> Barras mais largas facilitam leitura.
      // 2. height: 35 -> Mais altura para o laser pegar.
      // 3. fontSize: 11 -> Números legíveis.
      // 4. displayValue: true -> Mostra os números pelo JsBarcode, alinhados.
      // 5. Remoção de elementos HTML extras para limpar a área.

      const htmlContent = `
        <html>
          <head>
            <title>Imprimir Etiquetas</title>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
            <style>
              @media print {
                @page {
                  size: auto;
                  margin: 0;
                }
                body { margin: 0; padding: 0; }
              }
              body {
                font-family: 'Arial', sans-serif;
                background: white;
                margin: 0;
                padding: 1mm; /* Margem de segurança da impressora */
              }
              .grid-container {
                display: grid;
                grid-template-columns: repeat(3, 33mm);
                column-gap: 2mm; /* Espaço entre colunas */
                row-gap: 2mm; /* Espaço entre linhas */
                width: 105mm; /* Largura total aproximada do papel de 3 colunas */
              }
              .label {
                width: 33mm;
                height: 22mm;
                box-sizing: border-box;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                page-break-inside: avoid;
                /* padding: 1mm; Removido padding interno para ganhar espaço */
              }
              .label-name {
                font-size: 7px; /* Fonte menor para caber nomes longos */
                font-weight: bold;
                line-height: 1;
                max-height: 7px; /* Apenas uma linha de nome */
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                width: 95%;
                margin-bottom: 1px;
              }
              .label-price {
                font-size: 10px;
                font-weight: 900;
                margin-bottom: 0px;
              }
              /* SVG ocupa quase toda a etiqueta */
              svg.barcode {
                width: 100% !important;
                height: auto !important; 
                display: block;
              }
            </style>
          </head>
          <body>
            <div class="grid-container">
              ${labelsToRender.map(p => `
                <div class="label">
                  <div class="label-name">${p.name.substring(0, 30)}</div>
                  <div class="label-price">R$ ${p.price.toFixed(2)}</div>
                  <svg class="barcode"
                    jsbarcode-format="EAN13"
                    jsbarcode-value="${p.code.padStart(13, '0').substring(0, 12)}"
                    jsbarcode-width="1.3" 
                    jsbarcode-height="25"
                    jsbarcode-fontsize="9"
                    jsbarcode-margin="0"
                    jsbarcode-textmargin="0"
                    jsbarcode-fontoptions="bold"
                    jsbarcode-displayValue="true"
                  ></svg>
                </div>
              `).join('')}
            </div>
            <script>
              JsBarcode(".barcode").init();
              setTimeout(() => {
                 window.print();
              }, 800); // Tempo um pouco maior para garantir renderização
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.code.includes(search)
  );
  
  const filteredForLabel = products.filter(p => 
    p.name.toLowerCase().includes(searchLabel.toLowerCase()) || 
    p.code.includes(searchLabel)
  ).slice(0, 10);

  const renderInstallmentsPreview = () => {
    if(!importData) return null;
    const { totalValue, installments, firstDueDate, paymentMethod } = importData.finance;
    
    const total = Number(totalValue) || 0;
    const count = Math.max(1, Math.floor(Number(installments) || 1));
    const installmentValue = total / count;
    
    const baseDate = new Date(firstDueDate);
    baseDate.setMinutes(baseDate.getMinutes() + baseDate.getTimezoneOffset());

    return (
        <div className="mt-6 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <DollarSign size={18} className="text-green-600"/> 
                    Financeiro / Contas a Pagar
                </h4>
                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {count}x de R$ {installmentValue.toFixed(2)}
                </span>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">VALOR TOTAL DA NOTA</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
                        <input 
                            type="number" 
                            step="0.01"
                            className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={totalValue}
                            onChange={e => handleUpdateFinance('totalValue', e.target.valueAsNumber || 0)}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">FORMA DE PAGAMENTO</label>
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={paymentMethod}
                            onChange={e => handleUpdateFinance('paymentMethod', e.target.value)}
                        >
                            <option value="BOLETO">Boleto Bancário</option>
                            <option value="PIX">Pix Transferência</option>
                            <option value="DINHEIRO">Dinheiro / Espécie</option>
                            <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                            <option value="OUTRO">Outro</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Nº PARCELAS</label>
                    <div className="relative">
                        <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="number" 
                            min="1"
                            max="60"
                            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={installments}
                            onChange={e => handleUpdateFinance('installments', e.target.valueAsNumber || 1)}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">1º VENCIMENTO</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="date" 
                            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={firstDueDate}
                            onChange={e => handleUpdateFinance('firstDueDate', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="px-6 pb-6">
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Simulação de Lançamentos</label>
                <div className="bg-white border border-slate-200 rounded-lg max-h-32 overflow-y-auto divide-y divide-slate-100">
                    {Array.from({ length: Math.min(12, count) }).map((_, idx) => {
                         const dueDate = new Date(baseDate);
                         dueDate.setMonth(dueDate.getMonth() + idx);
                         return (
                            <div key={idx} className="px-4 py-2 flex justify-between text-sm text-slate-600 hover:bg-slate-50">
                                <span>Parcela {idx + 1}/{count} - {paymentMethod}</span>
                                <div className="flex gap-4">
                                    <span>Vence: {dueDate.toLocaleDateString()}</span>
                                    <span className="font-bold text-slate-800">R$ {installmentValue.toFixed(2)}</span>
                                </div>
                            </div>
                         );
                    })}
                    {count > 12 && (
                        <div className="px-4 py-2 text-xs text-center text-slate-400 italic">
                            ... e mais {count - 12} parcelas.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
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
            <button onClick={() => setIsPrintModalOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md">
                <Printer size={18} /><span className="hidden md:inline">Etiquetas</span>
            </button>
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

      {/* MODAL DE IMPRESSÃO DE ETIQUETAS */}
      {isPrintModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl">
                  <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
                      <div>
                          <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                              <Printer className="text-blue-600" /> Gerenciador de Etiquetas
                          </h3>
                          <p className="text-sm text-slate-500 mt-1">Selecione os produtos e a quantidade para impressão.</p>
                      </div>
                      <button onClick={() => setIsPrintModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  
                  <div className="flex-1 flex overflow-hidden">
                      {/* Coluna Esquerda: Busca e Adição */}
                      <div className="w-1/2 border-r border-slate-200 p-6 flex flex-col">
                          <h4 className="font-bold text-slate-700 mb-4">Buscar Produtos</h4>
                          <div className="relative mb-4">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                              <input 
                                  type="text" 
                                  placeholder="Digite nome ou código..." 
                                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                  value={searchLabel}
                                  onChange={e => setSearchLabel(e.target.value)}
                                  autoFocus
                              />
                          </div>
                          <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg">
                              {filteredForLabel.length === 0 && <div className="p-4 text-center text-slate-400">Nenhum produto encontrado.</div>}
                              {filteredForLabel.map(p => (
                                  <div key={p.id} className="p-3 border-b hover:bg-slate-50 flex justify-between items-center group">
                                      <div>
                                          <div className="font-bold text-sm text-slate-800">{p.name}</div>
                                          <div className="text-xs text-slate-500 font-mono">{p.code}</div>
                                      </div>
                                      <button 
                                          onClick={() => addToPrintQueue(p)}
                                          className="bg-white border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1"
                                      >
                                          <ListPlus size={14} /> Adicionar
                                      </button>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* Coluna Direita: Fila de Impressão */}
                      <div className="w-1/2 p-6 flex flex-col bg-slate-50">
                           <div className="flex justify-between items-center mb-4">
                               <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                   <Layers size={18} /> Fila de Impressão
                               </h4>
                               <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
                                   {printQueue.reduce((acc, item) => acc + item.quantity, 0)} etiquetas
                               </span>
                           </div>
                           
                           <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                               {printQueue.length === 0 && (
                                   <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 rounded-lg">
                                       <Printer size={48} className="mb-2 opacity-20" />
                                       <p>Adicione produtos para imprimir.</p>
                                   </div>
                               )}
                               {printQueue.map(item => (
                                   <div key={item.product.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
                                       <div className="flex-1 truncate pr-2">
                                           <div className="font-bold text-sm text-slate-800 truncate">{item.product.name}</div>
                                           <div className="text-xs text-slate-500">R$ {item.product.price.toFixed(2)}</div>
                                       </div>
                                       <div className="flex items-center gap-2">
                                           <div className="flex items-center border border-slate-300 rounded-lg bg-white">
                                               <button onClick={() => updateQueueQuantity(item.product.id, item.quantity - 1)} className="px-2 py-1 hover:bg-slate-100 text-slate-600"><Minus size={12} /></button>
                                               <input 
                                                  type="number" 
                                                  className="w-10 text-center text-sm font-bold outline-none" 
                                                  value={item.quantity}
                                                  onChange={e => updateQueueQuantity(item.product.id, parseInt(e.target.value) || 1)}
                                                />
                                               <button onClick={() => updateQueueQuantity(item.product.id, item.quantity + 1)} className="px-2 py-1 hover:bg-slate-100 text-slate-600"><Plus size={12} /></button>
                                           </div>
                                           <button onClick={() => removeFromPrintQueue(item.product.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                                       </div>
                                   </div>
                               ))}
                           </div>
                      </div>
                  </div>

                  <div className="p-6 border-t bg-white flex justify-end gap-3 rounded-b-xl">
                      <button onClick={() => setIsPrintModalOpen(false)} className="px-6 py-3 border border-slate-300 text-slate-600 rounded-lg font-bold hover:bg-slate-50">Cancelar</button>
                      <button onClick={executePrint} className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg flex items-center gap-2">
                          <Printer size={20} /> Imprimir Etiquetas
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Modal Produto (Edit/New) */}
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

      {/* Modal Import XML */}
      {importModalOpen && importData && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-6xl h-[95vh] flex flex-col shadow-2xl">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <FileText className="text-green-600" /> Conferência de Entrada (XML)
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Fornecedor: <b>{importData.supplier?.name || 'Não identificado'}</b></p>
                    </div>
                    <button onClick={() => setImportModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-bold sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-4 border-b">Status</th>
                                    <th className="p-4 border-b">Código</th>
                                    <th className="p-4 border-b">Produto</th>
                                    <th className="p-4 border-b">UN</th>
                                    <th className="p-4 border-b text-right w-32">Custo Unit. (R$)</th>
                                    <th className="p-4 border-b text-right w-32">Qtd. Conferida</th>
                                    <th className="p-4 border-b text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {importData.items.map((item, idx) => (
                                    <tr key={idx} className={`hover:bg-blue-50 transition-colors ${item.isNew ? 'bg-green-50/30' : ''}`}>
                                        <td className="p-4 text-center">
                                            {item.isNew ? (
                                                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded uppercase">Novo</span>
                                            ) : (
                                                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded uppercase">Existente</span>
                                            )}
                                        </td>
                                        <td className="p-4 font-mono text-xs text-slate-500">{item.code}</td>
                                        <td className="p-4 font-medium text-slate-800">{item.name}</td>
                                        <td className="p-4 text-sm">{item.unit}</td>
                                        <td className="p-4 text-right">
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                className="w-24 border border-slate-300 rounded px-2 py-1 text-right focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={item.costPrice}
                                                onChange={(e) => handleUpdateImportItem(idx, 'costPrice', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-4 text-right">
                                            <input 
                                                type="number" 
                                                className="w-24 border border-slate-300 rounded px-2 py-1 text-right font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                                value={item.quantity}
                                                onChange={(e) => handleUpdateImportItem(idx, 'quantity', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-4 text-right font-bold text-slate-600">
                                            R$ {(item.quantity * item.costPrice).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="p-6">
                         {renderInstallmentsPreview()}
                    </div>
                </div>

                <div className="p-6 border-t bg-slate-50 flex justify-between items-center rounded-b-xl">
                    <div className="text-sm text-slate-500 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-yellow-500" />
                        <span>Verifique as quantidades físicas e financeiro antes de confirmar.</span>
                    </div>
                    <div className="flex gap-3">
                         <button onClick={() => setImportModalOpen(false)} className="px-6 py-3 border border-slate-300 bg-white text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
                         <button onClick={handleConfirmImport} className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-md flex items-center gap-2 transition-transform active:scale-95">
                            <Check size={20} /> Confirmar Entrada & Financeiro
                         </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Modal Kardex */}
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
    </div>
  );
};