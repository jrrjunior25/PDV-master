import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../services/db';
import { Product, CartItem, PaymentMethod } from '../types';
import { Search, Trash2, CreditCard, Banknote, Smartphone, RefreshCw, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

export const POS: React.FC = () => {
  const [inputCode, setInputCode] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastAddedItem, setLastAddedItem] = useState<CartItem | null>(null);
  const [status, setStatus] = useState<'LIVRE' | 'OCUPADO' | 'FINALIZANDO' | 'FECHADO'>('LIVRE');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('CAIXA LIVRE - AGUARDANDO CLIENTE');

  useEffect(() => {
    db.init();
    // Auto-focus logic
    const focusInterval = setInterval(() => {
      if (!isPaymentModalOpen && !successModal) {
        inputRef.current?.focus();
      }
    }, 2000);
    return () => clearInterval(focusInterval);
  }, [isPaymentModalOpen, successModal]);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
        if (cart.length > 0) setIsPaymentModalOpen(true);
      }
      if (e.key === 'Escape') {
          setIsPaymentModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  const cartTotal = cart.reduce((acc, item) => acc + item.total, 0);

  const handlePayment = (method: PaymentMethod) => {
    try {
      db.createSale(cart, method);
      setSuccessModal(true);
      setIsPaymentModalOpen(false);
      
      setTimeout(() => {
        setSuccessModal(false);
        setCart([]);
        setLastAddedItem(null);
        setStatus('LIVRE');
        setMsg('CAIXA LIVRE - AGUARDANDO CLIENTE');
      }, 3000);
    } catch (error) {
      alert("Erro ao processar venda");
    }
  };

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
          <span className="flex items-center gap-2 text-pdv-success"><RefreshCw size={16} /> ONLINE</span>
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
            <span className="bg-slate-800 px-2 py-1 rounded">F5 - CONSULTAR PREÇO</span>
            <span className="bg-pdv-accent text-white px-2 py-1 rounded">F12 - PAGAMENTO</span>
        </div>
        <div className="text-pdv-accent animate-pulse">{msg}</div>
      </footer>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm">
              <div className="bg-white text-slate-900 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex">
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
                                <div className="flex justify-between text-lg text-red-500">
                                    <span>Desconto</span>
                                    <span className="font-bold">R$ 0,00</span>
                                </div>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-slate-300">
                             <div className="text-sm text-slate-500 mb-1">TOTAL A PAGAR</div>
                             <div className="text-5xl font-bold text-pdv-bg">R$ {cartTotal.toFixed(2)}</div>
                        </div>
                  </div>
                  <div className="w-1/2 p-8 bg-white">
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                          <CreditCard className="text-pdv-accent" />
                          Forma de Pagamento
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
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
                        className="w-full mt-8 py-3 bg-slate-200 text-slate-700 font-bold rounded hover:bg-slate-300"
                      >
                          CANCELAR (ESC)
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Success Modal (NFC-e Simulated) */}
      {successModal && (
          <div className="fixed inset-0 bg-pdv-success z-[60] flex flex-col items-center justify-center text-white">
              <CheckCircle size={120} className="mb-6 animate-bounce" />
              <h2 className="text-4xl font-bold mb-2">VENDA FINALIZADA!</h2>
              <p className="text-xl opacity-90">Emitindo NFC-e...</p>
              <div className="mt-8 bg-white/20 px-6 py-2 rounded-full font-mono text-sm">
                  Chave: 3523 0912 3456 7800 0187 5500 1000 0012 3410
              </div>
          </div>
      )}
    </div>
  );
};