
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../services/db';
import { PixPayload } from '../services/pixService';
import { Product, CartItem, PaymentMethod, Sale } from '../types';
import { Search, Trash2, CreditCard, Banknote, Smartphone, RefreshCw, CheckCircle, XCircle, ArrowLeft, Package, Plus, X, Copy } from 'lucide-react';
import QRCode from 'qrcode';

export const POS: React.FC = () => {
  const [inputCode, setInputCode] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastAddedItem, setLastAddedItem] = useState<CartItem | null>(null);
  const [status, setStatus] = useState<'LIVRE' | 'OCUPADO' | 'FINALIZANDO' | 'FECHADO'>('LIVRE');
  
  // Modais e Estados Auxiliares
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [isPriceCheckOpen, setIsPriceCheckOpen] = useState(false);
  const [priceCheckTerm, setPriceCheckTerm] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [lastSaleData, setLastSaleData] = useState<Sale | null>(null);
  
  // PIX States
  const [showPixQr, setShowPixQr] = useState(false);
  const [pixPayload, setPixPayload] = useState('');
  const [pixCopiaCola, setPixCopiaCola] = useState('');
  const pixCanvasRef = useRef<HTMLCanvasElement>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const priceCheckInputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('CAIXA LIVRE - AGUARDANDO CLIENTE');

  useEffect(() => {
    db.init();
    setAllProducts(db.getProducts());
    
    const focusInterval = setInterval(() => {
      if (!isPaymentModalOpen && !successModal && !isPriceCheckOpen) {
        inputRef.current?.focus();
      }
    }, 2000);
    return () => clearInterval(focusInterval);
  }, [isPaymentModalOpen, successModal, isPriceCheckOpen]);

  useEffect(() => {
      if (isPriceCheckOpen) {
          setTimeout(() => {
              priceCheckInputRef.current?.focus();
          }, 100);
      }
  }, [isPriceCheckOpen]);

  // Effect para desenhar o QR Code quando o estado showPixQr muda
  useEffect(() => {
    if (showPixQr && pixCanvasRef.current && pixPayload) {
      QRCode.toCanvas(pixCanvasRef.current, pixPayload, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (error) => {
        if (error) console.error(error);
      });
    }
  }, [showPixQr, pixPayload]);

  const addToCart = (product: Product) => {
    const existingItemIndex = cart.findIndex(item => item.id === product.id);
    let newCart = [...cart];

    if (existingItemIndex >= 0) {
      newCart[existingItemIndex].quantity += 1;
      newCart[existingItemIndex].total = newCart[existingItemIndex].quantity * newCart[existingItemIndex].price;
      setLastAddedItem(newCart[existingItemIndex]);
    } else {
      const newItem: CartItem = { ...product, quantity: 1, total: product.price };
      newCart.push(newItem);
      setLastAddedItem(newItem);
    }

    setCart(newCart);
    setStatus('OCUPADO');
    setMsg('REGISTRANDO PRODUTOS...');
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode) return;

    const product = db.getProductByCode(inputCode);
    if (product) {
      addToCart(product);
      setInputCode('');
    } else {
      alert(`Produto não encontrado: ${inputCode}`);
      setInputCode('');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F5') {
          e.preventDefault();
          setPriceCheckTerm('');
          setIsPriceCheckOpen(true);
      }
      if (e.key === 'F12') {
        e.preventDefault();
        if (cart.length > 0) setIsPaymentModalOpen(true);
      }
      if (e.key === 'Escape') {
          if(showPixQr) {
            setShowPixQr(false);
          } else {
            setIsPaymentModalOpen(false);
            setIsPriceCheckOpen(false);
          }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, showPixQr]);

  const cartTotal = cart.reduce((acc, item) => acc + item.total, 0);

  const handlePayment = (method: PaymentMethod) => {
    if (method === PaymentMethod.PIX) {
      const settings = db.getSettings();
      if (!settings.pixKey) {
        alert('Chave PIX não configurada! Vá em Configurações > Empresa.');
        return;
      }

      // Gerar Payload Pix
      try {
        const txId = `PDV${Date.now().toString().slice(-10)}`; // ID Único curto
        
        let city = 'SAO PAULO'; // Fallback
        if (settings.address) {
          const parts = settings.address.split('-');
          if (parts.length >= 2) {
            const possibleCity = parts[parts.length - 2].trim(); 
            city = possibleCity.split('/')[0].trim();
          } else {
            city = settings.address.trim();
          }
        }

        const pix = new PixPayload(
          settings.companyName || 'LOJA',
          city, 
          settings.pixKey.trim(),
          cartTotal,
          txId
        );
        const payload = pix.getPayload();
        
        setPixPayload(payload);
        setPixCopiaCola(payload);
        setShowPixQr(true);
        return;
      } catch (e) {
        console.error(e);
        alert('Erro ao gerar QR Code PIX.');
        return;
      }
    }

    finalizeSale(method);
  };

  const finalizeSale = async (method: PaymentMethod) => {
    try {
      setMsg('EMITINDO NFC-e...');
      const sale = await db.createSale(cart, method);
      setLastSaleData(sale);
      setSuccessModal(true);
      setIsPaymentModalOpen(false);
      setShowPixQr(false);
      
      setTimeout(() => {
        setSuccessModal(false);
        setCart([]);
        setLastAddedItem(null);
        setStatus('LIVRE');
        setMsg('CAIXA LIVRE - AGUARDANDO CLIENTE');
        setLastSaleData(null);
      }, 5000);
    } catch (error) {
      alert("Erro ao processar venda");
      setMsg('ERRO NA VENDA');
    }
  };

  const handleAddFromSearch = (product: Product) => {
      addToCart(product);
      setIsPriceCheckOpen(false);
      setInputCode('');
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCopiaCola);
    alert("Código Copia e Cola copiado!");
  };

  const filteredProducts = allProducts.filter(p => 
      p.name.toLowerCase().includes(priceCheckTerm.toLowerCase()) || 
      p.code.includes(priceCheckTerm)
  );

  return (
    <div className="h-screen w-full bg-pdv-bg text-white flex flex-col overflow-hidden font-mono">
      {/* Top Bar */}
      <header className="h-14 bg-pdv-panel border-b border-slate-700 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
            <Link to="/" className="text-slate-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-bold text-pdv-accent tracking-widest">PDV MERCADOMASTER</h1>
        </div>
        <div className="flex items-center gap-6 text-sm font-bold">
          <span className="flex items-center gap-2 text-pdv-success"><RefreshCw size={16} /> SEFAZ ONLINE</span>
          <span className="text-slate-400">TERMINAL 01</span>
          <span className="text-slate-400">OPERADOR: ADMIN</span>
        </div>
      </header>

      {/* Main PDV Area */}
      <div className="flex-1 flex p-4 gap-4">
        
        {/* Left: Product List */}
        <div className="w-2/5 bg-white rounded-lg shadow-xl text-slate-900 flex flex-col overflow-hidden">
            <div className="bg-slate-200 p-3 text-sm font-bold flex justify-between border-b border-slate-300">
                <span className="w-12">ITEM</span>
                <span className="flex-1">DESCRIÇÃO</span>
                <span className="w-16 text-right">QTD</span>
                <span className="w-24 text-right">VALOR</span>
            </div>
            <div className="flex-1 overflow-y-auto pdv-scroll p-2">
                <table className="w-full text-sm">
                    <tbody>
                        {cart.map((item, idx) => (
                            <tr key={item.id} className="border-b border-slate-100 hover:bg-blue-50">
                                <td className="py-2 w-12 font-bold text-slate-500">{String(idx + 1).padStart(3, '0')}</td>
                                <td className="py-2 font-semibold truncate max-w-[200px]">{item.name}</td>
                                <td className="py-2 w-16 text-right">{item.quantity} {item.unit}</td>
                                <td className="py-2 w-24 text-right font-bold">R$ {item.total.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {cart.length === 0 && (
                    <div className="h-full flex items-center justify-center text-slate-400 opacity-50 text-2xl font-bold uppercase">
                        Lista Vazia
                    </div>
                )}
            </div>
        </div>

        {/* Right: Details & Input */}
        <div className="w-3/5 flex flex-col gap-4">
            
            {/* Current Item Display */}
            <div className="bg-pdv-panel rounded-lg p-6 flex gap-6 h-64 border border-slate-700 shadow-lg">
                <div className="w-48 h-full bg-white rounded-lg p-2 flex items-center justify-center">
                   {lastAddedItem ? (
                       <img src={lastAddedItem.imageUrl} alt="Prod" className="max-h-full object-contain" />
                   ) : (
                       <div className="text-slate-300 font-bold text-6xl text-center">IMG</div>
                   )}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <h2 className="text-pdv-accent text-sm font-bold mb-1">PRODUTO ATUAL</h2>
                        <div className="text-3xl font-bold text-white truncate h-20 leading-tight">
                            {lastAddedItem ? lastAddedItem.name : "AGUARDANDO LEITURA..."}
                        </div>
                    </div>
                    <div className="flex justify-between items-end border-t border-slate-700 pt-4">
                        <div>
                            <div className="text-slate-400 text-xs mb-1">VALOR UNITÁRIO</div>
                            <div className="text-2xl font-bold text-white">
                                R$ {lastAddedItem ? lastAddedItem.price.toFixed(2) : '0.00'}
                            </div>
                        </div>
                         <div>
                            <div className="text-slate-400 text-xs mb-1">SUBTOTAL ITEM</div>
                            <div className="text-3xl font-bold text-pdv-warning">
                                R$ {lastAddedItem ? lastAddedItem.total.toFixed(2) : '0.00'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Total Display */}
            <div className="bg-pdv-panel rounded-lg p-6 flex-1 flex flex-col justify-center border border-slate-700 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Search size={200} />
                </div>
                <div className="text-right z-10">
                    <div className="text-slate-400 text-xl font-bold mb-2">SUBTOTAL DA VENDA</div>
                    <div className="text-7xl font-bold text-white tracking-tight">
                        R$ {cartTotal.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Input Bar */}
            <div className="bg-white p-4 rounded-lg shadow-lg flex gap-4 items-center">
                <div className="flex-1 relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-lg">CÓDIGO:</span>
                     <form onSubmit={handleScan}>
                        <input 
                            ref={inputRef}
                            type="text" 
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value)}
                            className="w-full h-14 pl-28 pr-4 text-2xl font-bold text-slate-900 border-2 border-slate-300 rounded-md focus:border-pdv-accent focus:ring-0 uppercase"
                            placeholder="LEIA O CÓDIGO DE BARRAS"
                        />
                     </form>
                </div>
                <div className={`h-14 px-6 rounded-md flex items-center justify-center font-bold text-xl min-w-[200px] ${status === 'LIVRE' ? 'bg-pdv-success text-white' : 'bg-pdv-warning text-black'}`}>
                    {status}
                </div>
            </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <footer className="bg-slate-900 h-12 flex items-center px-4 justify-between text-sm font-bold text-slate-300 border-t border-slate-800">
        <div className="flex gap-6">
            <span className="bg-slate-800 px-2 py-1 rounded">F1 - AJUDA</span>
            <button 
                onClick={() => setIsPriceCheckOpen(true)}
                className="bg-slate-800 px-2 py-1 rounded hover:bg-pdv-accent hover:text-white transition-colors"
            >
                F5 - CONSULTAR PREÇO
            </button>
            <span className="bg-pdv-accent text-white px-2 py-1 rounded">F12 - PAGAMENTO</span>
        </div>
        <div className="text-pdv-accent animate-pulse">{msg}</div>
      </footer>

      {/* === MODAL F5: CONSULTA DE PREÇO === */}
      {isPriceCheckOpen && (
          <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center backdrop-blur-sm p-6">
              <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden h-[80vh]">
                  <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                      <div>
                          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                              <Search className="text-pdv-accent" /> Consulta de Preços
                          </h2>
                          <p className="text-slate-500 text-sm">Pesquise por Nome, Código de Barras ou Código Interno</p>
                      </div>
                      <button 
                          onClick={() => setIsPriceCheckOpen(false)}
                          className="p-2 hover:bg-slate-200 rounded-full text-slate-500"
                      >
                          <X size={24} />
                      </button>
                  </div>
                  
                  <div className="p-6 bg-white border-b border-slate-100">
                      <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                          <input 
                              ref={priceCheckInputRef}
                              type="text" 
                              className="w-full pl-14 pr-4 py-4 text-xl border-2 border-slate-300 rounded-lg focus:border-pdv-accent focus:ring-0 outline-none uppercase font-bold text-slate-800"
                              placeholder="DIGITE O CÓDIGO OU NOME..."
                              value={priceCheckTerm}
                              onChange={(e) => setPriceCheckTerm(e.target.value)}
                          />
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-0">
                      <table className="w-full text-left">
                          <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                              <tr>
                                  <th className="p-4 w-32">CÓDIGO</th>
                                  <th className="p-4">PRODUTO</th>
                                  <th className="p-4 text-center">UN</th>
                                  <th className="p-4 text-center">ESTOQUE</th>
                                  <th className="p-4 text-right text-lg">PREÇO</th>
                                  <th className="p-4 text-center">AÇÃO</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-800">
                              {filteredProducts.length > 0 ? (
                                  filteredProducts.map((product) => (
                                      <tr key={product.id} className="hover:bg-blue-50 transition-colors group">
                                          <td className="p-4 font-mono text-slate-500">{product.code}</td>
                                          <td className="p-4 font-bold">{product.name}</td>
                                          <td className="p-4 text-center text-sm">{product.unit}</td>
                                          <td className="p-4 text-center">
                                              <span className={`px-2 py-1 rounded text-xs font-bold ${product.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                  {product.stock}
                                              </span>
                                          </td>
                                          <td className="p-4 text-right font-bold text-xl text-pdv-accent">
                                              R$ {product.price.toFixed(2)}
                                          </td>
                                          <td className="p-4 text-center">
                                              <button 
                                                  onClick={() => handleAddFromSearch(product)}
                                                  className="bg-white border border-pdv-accent text-pdv-accent hover:bg-pdv-accent hover:text-white px-3 py-1 rounded flex items-center gap-1 text-sm font-bold transition-colors mx-auto opacity-0 group-hover:opacity-100"
                                              >
                                                  <Plus size={16} /> ADD
                                              </button>
                                          </td>
                                      </tr>
                                  ))
                              ) : (
                                  <tr>
                                      <td colSpan={6} className="p-12 text-center text-slate-400">
                                          {priceCheckTerm ? "NENHUM PRODUTO ENCONTRADO" : "DIGITE PARA PESQUISAR..."}
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm">
              <div className="bg-white text-slate-900 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex min-h-[450px]">
                  {/* Left Side: Summary */}
                  <div className="w-1/2 bg-slate-100 p-8 border-r border-slate-200 flex flex-col justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-6 text-slate-800">Resumo da Venda</h2>
                            <div className="space-y-4">
                                <div className="flex justify-between text-lg">
                                    <span>Itens</span>
                                    <span className="font-bold">{cart.length}</span>
                                </div>
                                <div className="flex justify-between text-lg">
                                    <span>Subtotal</span>
                                    <span className="font-bold">R$ {cartTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-slate-300">
                             <div className="text-sm text-slate-500 mb-1">TOTAL A PAGAR</div>
                             <div className="text-5xl font-bold text-pdv-bg">R$ {cartTotal.toFixed(2)}</div>
                        </div>
                  </div>

                  {/* Right Side: Methods or QR Code */}
                  <div className="w-1/2 p-8 bg-white flex flex-col">
                      {!showPixQr ? (
                        <>
                          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                              <CreditCard className="text-pdv-accent" />
                              Forma de Pagamento
                          </h3>
                          <div className="grid grid-cols-2 gap-4 flex-1 content-start">
                              <button 
                                onClick={() => handlePayment(PaymentMethod.DINHEIRO)}
                                className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-pdv-accent hover:bg-blue-50 transition-all group"
                              >
                                  <Banknote size={32} className="text-slate-400 group-hover:text-pdv-accent mb-2" />
                                  <span className="font-bold text-slate-700">DINHEIRO</span>
                              </button>
                              <button 
                                onClick={() => handlePayment(PaymentMethod.PIX)}
                                className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-pdv-accent hover:bg-blue-50 transition-all group"
                              >
                                  <Smartphone size={32} className="text-slate-400 group-hover:text-pdv-accent mb-2" />
                                  <span className="font-bold text-slate-700">PIX</span>
                              </button>
                              <button 
                                onClick={() => handlePayment(PaymentMethod.DEBITO)}
                                className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-pdv-accent hover:bg-blue-50 transition-all group"
                              >
                                  <CreditCard size={32} className="text-slate-400 group-hover:text-pdv-accent mb-2" />
                                  <span className="font-bold text-slate-700">DÉBITO</span>
                              </button>
                              <button 
                                onClick={() => handlePayment(PaymentMethod.CREDITO)}
                                className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-pdv-accent hover:bg-blue-50 transition-all group"
                              >
                                  <CreditCard size={32} className="text-slate-400 group-hover:text-pdv-accent mb-2" />
                                  <span className="font-bold text-slate-700">CRÉDITO</span>
                              </button>
                          </div>
                          <button 
                            onClick={() => setIsPaymentModalOpen(false)}
                            className="w-full mt-4 py-3 bg-slate-200 text-slate-700 font-bold rounded hover:bg-slate-300"
                          >
                              CANCELAR (ESC)
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center flex-1 animate-fade-in">
                          <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-pdv-accent">
                              <Smartphone />
                              Pagamento Pix
                          </h3>
                          <p className="text-sm text-slate-500 mb-4 text-center">Leia o QR Code no App do Banco</p>
                          
                          <div className="border-4 border-slate-800 rounded-lg p-2 bg-white mb-4">
                             <canvas ref={pixCanvasRef} className="w-48 h-48" />
                          </div>

                          <div className="w-full mb-4">
                             <button 
                                onClick={handleCopyPix}
                                className="w-full flex items-center justify-center gap-2 p-2 bg-slate-100 hover:bg-slate-200 rounded text-sm font-bold text-slate-600"
                             >
                                <Copy size={14} /> Copiar "Copia e Cola"
                             </button>
                          </div>

                          <button 
                             onClick={() => finalizeSale(PaymentMethod.PIX)}
                             className="w-full py-3 bg-pdv-success text-white font-bold rounded hover:bg-green-600 shadow-lg animate-pulse"
                          >
                             CONFIRMAR RECEBIMENTO
                          </button>
                          
                          <button 
                            onClick={() => setShowPixQr(false)}
                            className="w-full mt-2 py-2 text-slate-400 text-sm hover:text-slate-600"
                          >
                              Voltar
                          </button>
                        </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Success Modal (NFC-e Simulated) */}
      {successModal && (
          <div className="fixed inset-0 bg-pdv-success z-[60] flex flex-col items-center justify-center text-white animate-fade-in">
              <CheckCircle size={120} className="mb-6 animate-bounce" />
              <h2 className="text-4xl font-bold mb-2">VENDA FINALIZADA!</h2>
              <p className="text-xl opacity-90">NFC-e Autorizada</p>
              
              {lastSaleData && (
                <div className="mt-8 bg-white/20 px-8 py-6 rounded-lg font-mono text-sm text-center max-w-2xl backdrop-blur-sm">
                    <p className="mb-2 font-bold text-lg">DETALHES DA EMISSÃO</p>
                    <div className="grid grid-cols-1 gap-2 text-left">
                       <div>
                         <span className="opacity-70 text-xs block">CHAVE DE ACESSO:</span>
                         <span className="font-bold tracking-widest select-all">{lastSaleData.fiscalCode}</span>
                       </div>
                       <div>
                         <span className="opacity-70 text-xs block">PROTOCOLO SEFAZ:</span>
                         <span className="font-bold">{lastSaleData.protocol}</span>
                       </div>
                       <div>
                         <span className="opacity-70 text-xs block">AMBIENTE:</span>
                         <span className="font-bold bg-black/20 px-2 rounded">{lastSaleData.environment}</span>
                       </div>
                    </div>
                </div>
              )}
              
              <div className="mt-8 text-sm opacity-70">
                 Fechando em 5 segundos...
              </div>
          </div>
      )}
    </div>
  );
};
