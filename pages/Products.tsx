
import React, { useEffect, useState, useRef } from 'react';
import { db } from '../services/db';
import { Product } from '../types';
import { Plus, Search, Package, Edit, Trash2, X, Save, Sparkles, Upload, FileText } from 'lucide-react';
import { geminiService } from '../services/geminiService';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  const [generatingDesc, setGeneratingDesc] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImportXml = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          const content = e.target?.result as string;
          try {
              const summary = db.processXmlImport(content);
              alert(`Importação Concluída!\n\nProdutos Criados: ${summary.productsCreated}\nProdutos Atualizados (Estoque): ${summary.productsUpdated}\nFornecedor Salvo: ${summary.supplierSaved ? 'Sim' : 'Não'}\nTransportadora Salva: ${summary.carrierSaved ? 'Sim' : 'Não'}`);
              setProducts(db.getProducts());
          } catch (err) {
              alert('Erro ao processar XML. Verifique se é uma NFe válida.');
              console.error(err);
          }
      };
      reader.readAsText(file);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.code.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Produtos e Estoque</h2>
          <p className="text-slate-500">Gerencie seu catálogo, fiscal e inventário.</p>
        </div>
        <div className="flex gap-3">
            <label className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md cursor-pointer">
                <Upload size={18} />
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

      {/* Modal */}
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
