import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../infra/db';
import { PixPayload } from '../../infra/services/pixService';
import { Product, CartItem, PaymentMethod, Sale, CashSession, Client } from '../../core/types';
import { Search, CreditCard, Banknote, Smartphone, RefreshCw, CheckCircle, ArrowLeft, Copy, Lock, Coins, ArrowRightLeft, FileText, User, Star, Gift, X, Printer } from 'lucide-react';
import QRCode from 'qrcode';

export const POS: React.FC = () => {
  const [inputCode, setInputCode] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastAddedItem, setLastAddedItem] = useState<CartItem | null>(null);
  const [status, setStatus] = useState<'LIVRE' | 'OCUPADO' | 'FINALIZANDO' | 'FECHADO'>('LIVRE');
  const [msg, setMsg] = useState('CAIXA LIVRE');
  
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [isIdentifyModalOpen, setIsIdentifyModalOpen] = useState(false);
  const [identifyCpf, setIdentifyCpf] = useState('');
  const [identifyName, setIdentifyName] = useState('');
  const [isNewClientMode, setIsNewClientMode] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [useCashback, setUseCashback] = useState(false);

  const [successModal, setSuccessModal] = useState(false);
  const [isPriceCheckOpen, setIsPriceCheckOpen] = useState(false);
  const [priceCheckTerm, setPriceCheckTerm] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [lastSaleData, setLastSaleData] = useState<Sale | null>(null);
  
  const [cashSession, setCashSession] = useState<CashSession | undefined>(undefined);
  const [isCashOpenModal, setIsCashOpenModal] = useState(false);
  const [openingValue, setOpeningValue] = useState('');
  const [isFunctionsMenuOpen, setIsFunctionsMenuOpen] = useState(false);
  const [isBleedModalOpen, setIsBleedModalOpen] = useState(false);
  const [bleedAmount, setBleedAmount] = useState('');
  const [bleedReason, setBleedReason] = useState('');
  const [isCloseCashModalOpen, setIsCloseCashModalOpen] = useState(false);
  const [closingCounted, setClosingCounted] = useState('');
  const [closingReport, setClosingReport] = useState<{systemBalance: number, diff: number} | null>(null);

  const [showPixQr, setShowPixQr] = useState(false);
  const [pixPayload, setPixPayload] = useState('');
  const [pixCopiaCola, setPixCopiaCola] = useState('');
  const pixCanvasRef = useRef<HTMLCanvasElement>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const priceCheckInputRef = useRef<HTMLInputElement>(null);
  const openingInputRef = useRef<HTMLInputElement>(null);
  const identifyInputRef = useRef<HTMLInputElement>(null);

  const checkSession = useCallback(() => {
      const session = db.cash.getCurrentSession();
      setCashSession(session);
      if (!session) {
          setStatus('FECHADO');
          setMsg('CAIXA FECHADO');
          setIsCashOpenModal(true);
      } else {
          if(status === 'FECHADO') {
              setStatus('LIVRE');
              setMsg('CAIXA LIVRE');
          }
      }
  }, [status]);

  useEffect(() => {
    db.init();
    setAllProducts(db.getProducts());
    checkSession();
    
    const focusInterval = setInterval(() => {
      if (!isPaymentModalOpen && !successModal && !isPriceCheckOpen && !isCashOpenModal && !isBleedModalOpen && !isCloseCashModalOpen && !isFunctionsMenuOpen && !isIdentifyModalOpen) {
        inputRef.current?.focus();
      }
    }, 2000);
    return () => clearInterval(focusInterval);
  }, [isPaymentModalOpen, successModal, isPriceCheckOpen, isCashOpenModal, isBleedModalOpen, isCloseCashModalOpen, isFunctionsMenuOpen, isIdentifyModalOpen, checkSession]);

  useEffect(() => {
      if (isPriceCheckOpen) setTimeout(() => priceCheckInputRef.current?.focus(), 100);
      if (isCashOpenModal) setTimeout(() => openingInputRef.current?.focus(), 100);
      if (isIdentifyModalOpen) setTimeout(() => identifyInputRef.current?.focus(), 100);
  }, [isPriceCheckOpen, isCashOpenModal, isIdentifyModalOpen]);

  useEffect(() => {
    if (showPixQr && pixCanvasRef.current && pixPayload) {
      QRCode.toCanvas(pixCanvasRef.current, pixPayload, { width: 256, margin: 2, color: { dark: '#000000', light: '#FFFFFF' } }, (error) => { if (error) console.error(error); });
    }
  }, [showPixQr, pixPayload]);

  // --- IMPRESSÃO DE CUPOM (F8) ---
  const handlePrintReceipt = useCallback((saleData: Sale | null = null) => {
      const sale = saleData || lastSaleData;
      if (!sale) {
          alert("Nenhuma venda recente para imprimir.");
          return;
      }

      const settings = db.getSettings();
      const printWindow = window.open('', '_blank', 'width=350,height=600');

      if (!printWindow) {
          alert("Pop-up bloqueado. Permita pop-ups para imprimir.");
          return;
      }

      const itemsHtml = sale.items.map(item => `
          <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <span style="flex: 1;">${item.name.substring(0, 20)}</span>
              <span style="width: 30px; text-align: right;">${item.quantity}</span>
              <span style="width: 50px; text-align: right;">${item.total.toFixed(2)}</span>
          </div>
      `).join('');

      const htmlContent = `
        <html>
          <head>
            <title>Imprimir Cupom</title>
            <style>
              @media print {
                @page { margin: 0; }
                body { margin: 0; padding: 5px; }
              }
              body {
                font-family: 'Courier New', monospace;
                width: ${settings.printerWidth === 58 ? '58mm' : '78mm'};
                margin: 0 auto;
                color: #000;
                background: #fff;
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .bold { font-weight: bold; }
              .line { border-bottom: 1px dashed #000; margin: 5px 0; }
              .header { font-size: 14px; margin-bottom: 5px; }
              .sub-header { font-size: 12px; }
              .items-header { display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; border-bottom: 1px dashed #000; margin-bottom: 5px; }
              .total-section { margin-top: 10px; font-size: 14px; }
              .footer { margin-top: 20px; font-size: 10px; text-align: center; }
            </style>
          </head>
          <body>
            <div class="text-center header bold">${settings.companyName.toUpperCase()}</div>
            <div class="text-center sub-header">CNPJ: ${settings.cnpj}</div>
            <div class="text-center sub-header">${settings.address}</div>
            <div class="line"></div>
            <div class="text-center bold" style="font-size: 12px;">*** ${sale.protocol === 'SEM VALOR FISCAL' ? 'RECIBO NÃO FISCAL' : 'DOCUMENTO AUXILIAR'} ***</div>
            <div class="text-center sub-header">Nº ${sale.fiscalCode?.slice(-8) || '000000'}</div>
            <div class="line"></div>
            
            <div class="items-header">
                <span style="flex: 1;">ITEM</span>
                <span style="width: 30px; text-align: right;">QTD</span>
                <span style="width: 50px; text-align: right;">VALOR</span>
            </div>
            
            ${itemsHtml}
            
            <div class="line"></div>
            
            <div class="total-section">
                <div style="display: flex; justify-content: space-between;">
                    <span>SUBTOTAL:</span>
                    <span>R$ ${sale.subtotal.toFixed(2)}</span>
                </div>
                ${sale.discount > 0 ? `
                <div style="display: flex; justify-content: space-between;">
                    <span>DESCONTO:</span>
                    <span>- R$ ${sale.discount.toFixed(2)}</span>
                </div>` : ''}
                <div style="display: flex; justify-content: space-between;" class="bold">
                    <span>TOTAL A PAGAR:</span>
                    <span>R$ ${sale.total.toFixed(2)}</span>
                </div>
            </div>

            <div class="line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
                <span>FORMA PAGTO:</span>
                <span class="bold">${sale.paymentMethod}</span>
            </div>

            ${sale.clientName ? `
            <div class="line"></div>
            <div style="font-size: 12px;">
                CLIENTE: ${sale.clientName}<br/>
                CPF: ${sale.clientCpf}
            </div>` : ''}

            <div class="footer">
                ${new Date(sale.timestamp).toLocaleString()}<br/>
                OP: ${db.auth.getSession()?.name || 'ADMIN'}<br/>
                <br/>
                MERCADOMASTER SISTEMAS
            </div>
            
            <script>
              setTimeout(() => {
                 window.print();
                 window.close();
              }, 500);
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
  }, [lastSaleData]);

  const openIdentifyModal = () => {
      setIdentifyCpf('');
      setIdentifyName('');
      setIsNewClientMode(false);
      setUseCashback(false);
      setIsIdentifyModalOpen(true);
  }

  const startCheckoutFlow = () => {
      if (cart.length === 0) return;
      if (!currentClient) {
        openIdentifyModal();
      } else {
        setIsPaymentModalOpen(true);
      }
  };

  const handleIdentifyClient = (e: React.FormEvent) => {
      e.preventDefault();
      const cpf = identifyCpf.trim();
      if (!cpf) return;
      const found = db.getClientByCpf(cpf);
      if (found) {
          setCurrentClient(found);
          setIsIdentifyModalOpen(false);
          if (cart.length > 0 && !isFunctionsMenuOpen) {
             // opcional: abrir direto pagamento
          }
      } else {
          setIsNewClientMode(true);
      }
  };

  const handleQuickRegister = () => {
      if(!identifyName || !identifyCpf) return alert("Nome e CPF obrigatórios");
      const newClient: Client = { id: crypto.randomUUID(), name: identifyName.toUpperCase(), cpf: identifyCpf, points: 0 };
      db.saveClient(newClient);
      setCurrentClient(newClient);
      setIsIdentifyModalOpen(false);
  };

  const skipIdentify = () => {
      setIsIdentifyModalOpen(false);
      if (cart.length > 0) setIsPaymentModalOpen(true);
  };

  const handleOpenCash = (e: React.FormEvent) => {
      e.preventDefault();
      const val = parseFloat(openingValue.replace(',','.'));
      if(isNaN(val)) return alert("Valor inválido");
      try {
          const user = db.auth.getSession();
          if(!user) return alert("Erro de sessão");
          db.cash.openSession(val, user.id);
          setOpeningValue('');
          setIsCashOpenModal(false);
          checkSession();
      } catch (err: any) { alert(err.message); }
  };

  const handleBleed = (e: React.FormEvent) => {
      e.preventDefault();
      const val = parseFloat(bleedAmount.replace(',', '.'));
      if (isNaN(val) || val <= 0) return alert("Valor inválido");
      if (!bleedReason) return alert("Motivo obrigatório");
      try {
          const user = db.auth.getSession();
          if(!user) return alert("Erro de sessão");
          db.cash.addMovement('SANGRIA', val, bleedReason, user.id);
          alert("Sangria realizada com sucesso!");
          setBleedAmount('');
          setBleedReason('');
          setIsBleedModalOpen(false);
      } catch (err: any) { alert(err.message); }
  };

  const handleCloseCash = () => {
      const val = parseFloat(closingCounted.replace(',', '.'));
      if(isNaN(val)) return alert("Valor inválido");
      try {
          const result = db.cash.closeSession(val);
          setClosingReport(result);
      } catch (err: any) { alert(err.message); }
  };

  const confirmCloseAndLogout = () => {
      checkSession(); 
      setIsCloseCashModalOpen(false);
      setClosingReport(null);
      setClosingCounted('');
  };

  const addToCart = (product: Product) => {
    if(!cashSession) return;
    
    let newCart = [...cart];
    const existingItemIndex = newCart.findIndex(item => item.id === product.id);
    let currentQty = 0;

    if (existingItemIndex >= 0) {
      newCart[existingItemIndex].quantity += 1;
      currentQty = newCart[existingItemIndex].quantity;
    } else {
      currentQty = 1;
      const newItem: CartItem = { 
          ...product, 
          quantity: 1, 
          total: product.price,
          appliedPrice: product.price,
          isWholesale: false
      };
      newCart.push(newItem);
    }

    const targetIndex = existingItemIndex >= 0 ? existingItemIndex : newCart.length - 1;
    const item = newCart[targetIndex];

    if (product.wholesalePrice && product.wholesaleMinQuantity && currentQty >= product.wholesaleMinQuantity) {
        item.appliedPrice = product.wholesalePrice;
        item.isWholesale = true;
    } else {
        item.appliedPrice = product.price;
        item.isWholesale = false;
    }
    
    item.total = item.quantity * item.appliedPrice;
    
    setLastAddedItem(item);
    setCart(newCart);
    setStatus('OCUPADO');
    setMsg(item.isWholesale ? 'PREÇO DE ATACADO APLICADO!' : 'REGISTRANDO PRODUTOS...');
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode) return;
    if (!cashSession) { setInputCode(''); return setIsCashOpenModal(true); }
    const product = db.getProductByCode(inputCode);
    if (product) { addToCart(product); setInputCode(''); } 
    else { alert(`Produto não encontrado: ${inputCode}`); setInputCode(''); }
  };

  // ATALHO F8: Venda Rápida (Não Fiscal, Dinheiro)
  const handleFastNonFiscalCheckout = async () => {
      if (cart.length === 0) return alert("Carrinho vazio.");
      // Finaliza direto em dinheiro como Não Fiscal
      const sale = await finalizeSale(PaymentMethod.DINHEIRO, false);
      // Imprime imediatamente
      if (sale) {
          setTimeout(() => handlePrintReceipt(sale), 500);
      }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F5') { e.preventDefault(); setPriceCheckTerm(''); setIsPriceCheckOpen(true); }
      if (e.key === 'F8') { e.preventDefault(); handleFastNonFiscalCheckout(); } // Atalho F8
      if (e.key === 'F9') { e.preventDefault(); setIsFunctionsMenuOpen(true); }
      if (e.key === 'F11') { e.preventDefault(); openIdentifyModal(); }
      if (e.key === 'F12') { e.preventDefault(); startCheckoutFlow(); }
      if (e.key === 'Escape') {
          if(showPixQr) setShowPixQr(false);
          else {
            setIsPaymentModalOpen(false); setIsPriceCheckOpen(false); setIsFunctionsMenuOpen(false); setIsBleedModalOpen(false); setIsIdentifyModalOpen(false);
            if(!closingReport) setIsCloseCashModalOpen(false);
          }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, showPixQr, closingReport, currentClient, handlePrintReceipt, useCashback]);

  const cartSubtotal = cart.reduce((acc, item) => acc + item.total, 0);
  const maxPointsUsable = currentClient ? Math.min(currentClient.points, Math.floor(cartSubtotal)) : 0;
  const discountValue = useCashback ? maxPointsUsable : 0;
  const finalTotal = cartSubtotal - discountValue;

  const handlePayment = (method: PaymentMethod) => {
    if (method === PaymentMethod.PIX) {
      const settings = db.getSettings();
      if (!settings.pixKey) { alert('Chave PIX não configurada!'); return; }
      try {
        const txId = `PDV${Date.now().toString().slice(-10)}`; 
        let city = 'SAO PAULO';
        if (settings.address) {
          const parts = settings.address.split('-');
          if (parts.length >= 2) city = parts[parts.length - 2].split('/')[0].trim();
          else city = settings.address.trim();
        }
        const pix = new PixPayload(settings.companyName || 'LOJA', city, settings.pixKey.trim(), finalTotal, txId);
        const payload = pix.getPayload();
        setPixPayload(payload);
        setPixCopiaCola(payload);
        setShowPixQr(true);
        return;
      } catch (e) { console.error(e); alert('Erro ao gerar PIX.'); return; }
    }
    finalizeSale(method);
  };

  const finalizeSale = async (method: PaymentMethod, isFiscal: boolean = true) => {
    try {
      setMsg(isFiscal ? 'EMITINDO NFC-e...' : 'GERANDO RECIBO...');
      const sale = await db.createSale(cart, method, currentClient, discountValue, isFiscal);
      setLastSaleData(sale);
      setSuccessModal(true);
      setIsPaymentModalOpen(false);
      setShowPixQr(false);
      
      setTimeout(() => {
        setSuccessModal(false);
        setCart([]);
        setLastAddedItem(null);
        setStatus('LIVRE');
        setMsg('CAIXA LIVRE');
        setLastSaleData(null);
        setCurrentClient(null);
      }, 5000);
      return sale;
    } catch (error: any) {
      alert("Erro na venda: " + error.message);
      setMsg('ERRO NA VENDA');
      return null;
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

  const filteredProducts = allProducts.filter(p => p.name.toLowerCase().includes(priceCheckTerm.toLowerCase()) || p.code.includes(priceCheckTerm));

  return (
    <div className="h-screen w-full bg-pdv-bg text-white flex flex-col overflow-hidden font-mono">
      <header className="h-14 bg-pdv-panel border-b border-slate-700 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
            <Link to="/" className="text-slate-400 hover:text-white transition-colors"><ArrowLeft size={20} /></Link>
            <h1 className="text-xl font-bold text-pdv-accent tracking-widest">PDV MERCADOMASTER</h1>
        </div>
        <div className="flex items-center gap-4">
            <button 
                onClick={openIdentifyModal}
                className={`flex items-center gap-2 px-3 py-1 rounded border transition-colors text-sm font-bold ${currentClient ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-600 text-slate-400 hover:border-indigo-500 hover:text-indigo-400'}`}
            >
                <User size={16} />
                {currentClient ? `F11: ${currentClient.name.split(' ')[0]}` : 'F11: IDENTIFICAR CPF'}
            </button>
            <div className="flex items-center gap-6 text-sm font-bold border-l border-slate-700 pl-6">
                <span className="flex items-center gap-2 text-pdv-success"><RefreshCw size={16} /> SEFAZ ONLINE</span>
                <span className="text-slate-400">TERMINAL 01</span>
                <span className="text-slate-400 uppercase">OP: {db.auth.getSession()?.name || 'Admin'}</span>
            </div>
        </div>
      </header>

      <div className="flex-1 flex p-4 gap-4 relative">
        {!cashSession && !isCashOpenModal && (
             <div className="absolute inset-0 bg-black/60 z-40 flex items-center justify-center backdrop-blur-sm">
                 <div className="text-center animate-bounce">
                     <Lock size={64} className="mx-auto mb-4 text-slate-400" />
                     <h2 className="text-3xl font-bold text-white">CAIXA FECHADO</h2>
                     <button onClick={() => setIsCashOpenModal(true)} className="mt-4 bg-pdv-accent text-white px-6 py-2 rounded font-bold hover:bg-blue-600">ABRIR CAIXA</button>
                 </div>
             </div>
        )}

        <div className="w-2/5 bg-white rounded-lg shadow-xl text-slate-900 flex flex-col overflow-hidden">
            <div className="bg-slate-200 p-3 text-sm font-bold flex justify-between border-b border-slate-300">
                <span className="w-12">ITEM</span><span className="flex-1">DESCRIÇÃO</span><span className="w-16 text-right">QTD</span><span className="w-24 text-right">VALOR</span>
            </div>
            <div className="flex-1 overflow-y-auto pdv-scroll p-2">
                <table className="w-full text-sm">
                    <tbody>
                        {cart.map((item, idx) => (
                            <tr key={item.id} className="border-b border-slate-100 hover:bg-blue-50">
                                <td className="py-2 w-12 font-bold text-slate-500">{String(idx + 1).padStart(3, '0')}</td>
                                <td className="py-2 font-semibold truncate max-w-[200px]">
                                    {item.name}
                                    {item.isWholesale && (
                                        <span className="ml-2 bg-indigo-600 text-white text-[10px] px-1 rounded font-bold uppercase">ATACADO</span>
                                    )}
                                </td>
                                <td className="py-2 w-16 text-right">
                                    {item.quantity} {item.unit}
                                    {item.isWholesale && <div className="text-[10px] text-green-600 font-bold">R$ {item.appliedPrice.toFixed(2)}</div>}
                                </td>
                                <td className="py-2 w-24 text-right font-bold">R$ {item.total.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {cart.length === 0 && (<div className="h-full flex items-center justify-center text-slate-400 opacity-50 text-2xl font-bold uppercase">Lista Vazia</div>)}
            </div>
        </div>

        <div className="w-3/5 flex flex-col gap-4">
            <div className="bg-pdv-panel rounded-lg p-6 flex gap-6 h-64 border border-slate-700 shadow-lg relative overflow-hidden">
                 {currentClient && (
                     <div className="absolute top-4 right-4 flex items-center gap-2 bg-indigo-900/50 px-3 py-1 rounded-full border border-indigo-500/50 text-indigo-200 text-xs font-bold">
                         <User size={12} /> {currentClient.name} | <Star size={10} className="text-yellow-500" /> {currentClient.points} pts
                     </div>
                 )}

                <div className="w-48 h-full bg-white rounded-lg p-2 flex items-center justify-center">
                   {lastAddedItem ? (<img src={lastAddedItem.imageUrl} alt="Prod" className="max-h-full object-contain" />) : (<div className="text-slate-300 font-bold text-6xl text-center">IMG</div>)}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <h2 className="text-pdv-accent text-sm font-bold mb-1">PRODUTO ATUAL</h2>
                        <div className="text-3xl font-bold text-white truncate h-20 leading-tight">{lastAddedItem ? lastAddedItem.name : "AGUARDANDO LEITURA..."}</div>
                    </div>
                    <div className="flex justify-between items-end border-t border-slate-700 pt-4">
                        <div><div className="text-slate-400 text-xs mb-1">VALOR UNITÁRIO</div><div className="text-2xl font-bold text-white">R$ {lastAddedItem ? lastAddedItem.appliedPrice.toFixed(2) : '0.00'}</div></div>
                         <div><div className="text-slate-400 text-xs mb-1">SUBTOTAL ITEM</div><div className="text-3xl font-bold text-pdv-warning">R$ {lastAddedItem ? lastAddedItem.total.toFixed(2) : '0.00'}</div></div>
                    </div>
                </div>
            </div>

            <div className="bg-pdv-panel rounded-lg p-6 flex-1 flex flex-col justify-center border border-slate-700 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Search size={200} /></div>
                <div className="text-right z-10">
                    <div className="text-slate-400 text-xl font-bold mb-2">SUBTOTAL DA VENDA</div>
                    <div className="text-7xl font-bold text-white tracking-tight">R$ {cartSubtotal.toFixed(2)}</div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-lg flex gap-4 items-center">
                <div className="flex-1 relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-lg">CÓDIGO:</span>
                     <form onSubmit={handleScan}>
                        <input ref={inputRef} type="text" value={inputCode} onChange={(e) => setInputCode(e.target.value)} className="w-full h-14 pl-28 pr-4 text-2xl font-bold text-slate-900 border-2 border-slate-300 rounded-md focus:border-pdv-accent focus:ring-0 uppercase" placeholder="LEIA O CÓDIGO DE BARRAS" disabled={!cashSession} />
                     </form>
                </div>
                <div className={`h-14 px-6 rounded-md flex items-center justify-center font-bold text-xl min-w-[200px] ${status === 'LIVRE' ? 'bg-pdv-success text-white' : status === 'FECHADO' ? 'bg-red-600 text-white' : 'bg-pdv-warning text-black'}`}>{status}</div>
            </div>
        </div>
      </div>

      <footer className="bg-slate-900 h-12 flex items-center px-4 justify-between text-sm font-bold text-slate-300 border-t border-slate-800">
        <div className="flex gap-4">
            <button className="bg-slate-800 px-3 py-1 rounded hover:bg-pdv-accent hover:text-white transition-colors">F1 - AJUDA</button>
            <button onClick={() => setIsPriceCheckOpen(true)} className="bg-slate-800 px-3 py-1 rounded hover:bg-pdv-accent hover:text-white transition-colors">F5 - CONSULTAR</button>
            <button onClick={handleFastNonFiscalCheckout} className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors shadow-md font-bold flex items-center gap-1"><Printer size={14} /> F8 - NÃO FISCAL</button>
            <button onClick={() => setIsFunctionsMenuOpen(true)} className="bg-slate-800 px-3 py-1 rounded hover:bg-pdv-accent hover:text-white text-pdv-accent transition-colors">F9 - FUNÇÕES</button>
            <button onClick={startCheckoutFlow} className="bg-pdv-accent text-white px-4 py-1 rounded hover:bg-blue-600 transition-colors shadow-lg shadow-blue-900/50">F12 - FECHAR VENDA</button>
        </div>
        <div className="text-pdv-accent animate-pulse">{msg}</div>
      </footer>

      {isPaymentModalOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm">
              <div className="bg-white text-slate-900 rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl flex min-h-[500px]">
                  <div className="w-5/12 bg-slate-100 p-8 border-r border-slate-200 flex flex-col justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-4 text-slate-800">Resumo da Venda</h2>
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-4">
                                {currentClient ? (
                                    <>
                                        <div className="flex items-center gap-2 text-indigo-600 font-bold mb-1"><User size={18} /> {currentClient.name}</div>
                                        <div className="text-xs text-slate-500 mb-2">CPF: {currentClient.cpf}</div>
                                        <div className="bg-yellow-50 p-3 rounded border border-yellow-100">
                                            <div className="flex justify-between items-center text-sm"><span className="text-yellow-800 font-bold flex items-center gap-1"><Star size={14} fill="orange" /> Pontos: {currentClient.points}</span></div>
                                            {currentClient.points > 0 && maxPointsUsable > 0 && (
                                                <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                                                    <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={useCashback} onChange={(e) => setUseCashback(e.target.checked)} />
                                                    <span className="text-xs text-indigo-800 font-bold">Usar {maxPointsUsable} pts (-R$ {maxPointsUsable.toFixed(2)})</span>
                                                </label>
                                            )}
                                        </div>
                                    </>
                                ) : (<div className="text-slate-400 text-sm italic">Consumidor não identificado</div>)}
                            </div>
                            <div className="space-y-2 text-sm text-slate-700">
                                <div className="flex justify-between"><span>Itens</span><span className="font-bold">{cart.length}</span></div>
                                <div className="flex justify-between"><span>Subtotal</span><span className="font-bold">R$ {cartSubtotal.toFixed(2)}</span></div>
                                {useCashback && (<div className="flex justify-between text-green-600 font-bold"><span className="flex items-center gap-1"><Gift size={14} /> Desconto Fidelidade</span><span>- R$ {discountValue.toFixed(2)}</span></div>)}
                            </div>
                        </div>
                        <div className="pt-6 border-t border-slate-300">
                             <div className="text-sm text-slate-500 mb-1">TOTAL A PAGAR</div>
                             <div className="text-5xl font-bold text-pdv-bg">R$ {finalTotal.toFixed(2)}</div>
                        </div>
                  </div>

                  <div className="w-7/12 p-8 bg-white flex flex-col">
                      {!showPixQr ? (
                        <>
                          <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><CreditCard className="text-pdv-accent" /> Forma de Pagamento</h3>
                          <div className="grid grid-cols-2 gap-4 flex-1 content-start">
                              {['DINHEIRO', 'PIX', 'DEBITO', 'CREDITO'].map(method => (
                                  <button key={method} onClick={() => handlePayment(method as PaymentMethod)} className="flex flex-col items-center justify-center p-6 border-2 border-slate-200 rounded-lg hover:border-pdv-accent hover:bg-blue-50 transition-all group">
                                      {method === 'DINHEIRO' && <Banknote size={32} className="text-slate-400 group-hover:text-pdv-accent mb-2" />}
                                      {method === 'PIX' && <Smartphone size={32} className="text-slate-400 group-hover:text-pdv-accent mb-2" />}
                                      {(method === 'DEBITO' || method === 'CREDITO') && <CreditCard size={32} className="text-slate-400 group-hover:text-pdv-accent mb-2" />}
                                      <span className="font-bold text-slate-700">{method}</span>
                                  </button>
                              ))}
                          </div>
                          <button onClick={() => setIsPaymentModalOpen(false)} className="w-full mt-4 py-3 bg-slate-200 text-slate-700 font-bold rounded hover:bg-slate-300">CANCELAR (ESC)</button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center flex-1 animate-fade-in">
                          <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-pdv-accent"><Smartphone /> Pagamento Pix</h3>
                          <div className="border-4 border-slate-800 rounded-lg p-2 bg-white mb-4"><canvas ref={pixCanvasRef} className="w-48 h-48" /></div>
                          <div className="w-full mb-4"><button onClick={handleCopyPix} className="w-full flex items-center justify-center gap-2 p-2 bg-slate-100 hover:bg-slate-200 rounded text-sm font-bold text-slate-600"><Copy size={14} /> Copiar Código</button></div>
                          <button onClick={() => finalizeSale(PaymentMethod.PIX)} className="w-full py-3 bg-pdv-success text-white font-bold rounded hover:bg-green-600 shadow-lg animate-pulse">CONFIRMAR RECEBIMENTO</button>
                          <button onClick={() => setShowPixQr(false)} className="w-full mt-2 py-2 text-slate-400 text-sm hover:text-slate-600">Voltar</button>
                        </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {isIdentifyModalOpen && (
         <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center">
            <div className="bg-white rounded-xl w-[500px] p-6 shadow-2xl text-slate-800">
                <div className="flex items-center gap-2 mb-4 text-indigo-700">
                    <User size={28} />
                    <h2 className="text-2xl font-bold">CPF na Nota?</h2>
                </div>
                
                {!isNewClientMode ? (
                    <form onSubmit={handleIdentifyClient} className="space-y-4">
                        <div>
                            <label className="block font-bold text-sm text-slate-500 mb-1">DIGITE O CPF</label>
                            <input 
                                ref={identifyInputRef}
                                type="text" 
                                className="w-full text-2xl border-2 border-indigo-200 rounded-lg p-3 focus:border-indigo-600 outline-none font-mono"
                                placeholder="000.000.000-00"
                                value={identifyCpf}
                                onChange={e => setIdentifyCpf(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700">
                            IDENTIFICAR CLIENTE
                        </button>
                        <button type="button" onClick={skipIdentify} className="w-full bg-slate-200 text-slate-600 py-3 rounded-lg font-bold hover:bg-slate-300">
                            PULAR / NÃO IDENTIFICAR
                        </button>
                    </form>
                ) : (
                    <div className="space-y-4 animate-fade-in">
                        <div className="bg-yellow-50 p-3 rounded border border-yellow-100 text-yellow-800 text-sm font-bold">
                           Cliente não encontrado. Cadastre abaixo:
                        </div>
                        <div>
                            <label className="block font-bold text-sm text-slate-500 mb-1">CPF</label>
                            <input type="text" className="w-full border p-2 rounded bg-slate-100" value={identifyCpf} disabled />
                        </div>
                        <div>
                            <label className="block font-bold text-sm text-slate-500 mb-1">NOME COMPLETO</label>
                            <input 
                                type="text" 
                                className="w-full border-2 border-indigo-200 rounded p-2 focus:border-indigo-600 outline-none uppercase" 
                                value={identifyName} 
                                onChange={e => setIdentifyName(e.target.value)} 
                                autoFocus
                            />
                        </div>
                        <button onClick={handleQuickRegister} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">
                            CADASTRAR E CONTINUAR
                        </button>
                        <button onClick={() => setIsNewClientMode(false)} className="w-full text-slate-500 py-2 underline text-sm">Voltar</button>
                    </div>
                )}
            </div>
         </div>
      )}

      {isCashOpenModal && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center">
            <div className="bg-white rounded-xl p-8 w-96 text-center text-slate-800">
                <Coins size={48} className="mx-auto mb-4 text-pdv-accent" />
                <h2 className="text-2xl font-bold mb-2">Abertura de Caixa</h2>
                <form onSubmit={handleOpenCash}>
                    <input ref={openingInputRef} type="number" step="0.01" className="w-full text-center text-3xl font-bold border-2 border-slate-300 rounded-lg p-2 mb-6 text-slate-900" value={openingValue} onChange={e => setOpeningValue(e.target.value)} placeholder="0,00" />
                    <button type="submit" className="w-full bg-pdv-success text-white font-bold py-3 rounded-lg">CONFIRMAR</button>
                </form>
            </div>
        </div>
      )}
      
      {isFunctionsMenuOpen && ( <div className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center backdrop-blur-sm"><div className="bg-white rounded-xl p-6 w-[500px] shadow-2xl"><div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4"><h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Coins className="text-pdv-accent" /> Funções do Caixa</h2><button onClick={() => setIsFunctionsMenuOpen(false)}><X className="text-slate-400" /></button></div><div className="grid grid-cols-2 gap-4"><button onClick={() => { setIsFunctionsMenuOpen(false); setIsBleedModalOpen(true); }} className="flex flex-col items-center justify-center p-6 bg-red-50 border-2 border-red-100 rounded-xl hover:border-red-500 hover:bg-red-100 transition-all group"><ArrowRightLeft size={32} className="text-red-500 mb-2 group-hover:scale-110 transition-transform" /><span className="font-bold text-red-700">SANGRIA</span></button><button onClick={() => { setIsFunctionsMenuOpen(false); setIsCloseCashModalOpen(true); }} className="flex flex-col items-center justify-center p-6 bg-slate-50 border-2 border-slate-100 rounded-xl hover:border-slate-500 hover:bg-slate-100 transition-all group"><FileText size={32} className="text-slate-500 mb-2 group-hover:scale-110 transition-transform" /><span className="font-bold text-slate-700">FECHAR CAIXA</span></button></div></div></div> )}
      {isBleedModalOpen && ( <div className="fixed inset-0 bg-black/80 z-[90] flex items-center justify-center"><div className="bg-white rounded-xl p-8 w-96 text-center shadow-2xl border-t-4 border-red-500 text-slate-800"><h2 className="text-2xl font-bold text-red-600 mb-4">Sangria de Caixa</h2><form onSubmit={handleBleed}><div className="mb-4 text-left"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor</label><input type="number" step="0.01" className="w-full text-lg font-bold border border-slate-300 rounded p-2 text-slate-800" value={bleedAmount} onChange={e => setBleedAmount(e.target.value)} autoFocus /></div><div className="mb-6 text-left"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Motivo</label><input type="text" className="w-full border border-slate-300 rounded p-2 text-slate-800" value={bleedReason} onChange={e => setBleedReason(e.target.value)} /></div><div className="flex gap-2"><button type="button" onClick={() => setIsBleedModalOpen(false)} className="flex-1 py-2 bg-slate-200 rounded text-slate-800">CANCELAR</button><button type="submit" className="flex-1 py-2 bg-red-600 text-white rounded font-bold">CONFIRMAR</button></div></form></div></div> )}
      {isCloseCashModalOpen && ( <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center"><div className="bg-white rounded-xl w-[500px] shadow-2xl overflow-hidden text-slate-800"><div className="bg-slate-800 p-4 text-white flex justify-between items-center"><h2 className="text-xl font-bold">Fechamento</h2>{!closingReport && <button onClick={() => setIsCloseCashModalOpen(false)}><X /></button>}</div>{!closingReport ? (<div className="p-8"><p className="text-slate-500 mb-6 text-center">Conte o dinheiro.</p><div className="mb-6"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor Contado</label><input type="number" step="0.01" className="w-full text-center text-4xl font-bold border-2 border-slate-300 rounded-lg p-4 text-slate-800" value={closingCounted} onChange={e => setClosingCounted(e.target.value)} autoFocus /></div><button onClick={handleCloseCash} className="w-full bg-pdv-accent text-white font-bold py-4 rounded-lg">ENCERRAR</button></div>) : (<div className="p-6"><div className="space-y-4"><div className="flex justify-between"><span>Sistema:</span><span className="font-bold">R$ {closingReport.systemBalance.toFixed(2)}</span></div><div className="flex justify-between"><span>Gaveta:</span><span className="font-bold">R$ {parseFloat(closingCounted).toFixed(2)}</span></div><div className={`flex justify-between text-xl font-bold p-3 rounded ${closingReport.diff === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}><span>Diferença:</span><span>R$ {closingReport.diff.toFixed(2)}</span></div></div><button onClick={confirmCloseAndLogout} className="w-full bg-slate-800 text-white font-bold py-3 rounded mt-6">SAIR</button></div>)}</div></div> )}

      {isPriceCheckOpen && ( <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center backdrop-blur-sm p-6"><div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl"><div className="p-6 border-b bg-slate-50 flex justify-between"><h2 className="text-2xl font-bold text-slate-800">Consulta</h2><button onClick={() => setIsPriceCheckOpen(false)}><X className="text-slate-600"/></button></div><div className="p-6"><input ref={priceCheckInputRef} type="text" className="w-full p-4 text-xl border-2 border-slate-300 rounded-lg uppercase text-slate-800" placeholder="BUSCAR..." value={priceCheckTerm} onChange={e => setPriceCheckTerm(e.target.value)} /></div><div className="flex-1 overflow-y-auto"><table className="w-full text-left text-slate-800"><thead className="bg-slate-100"><tr><th className="p-4">CÓDIGO</th><th className="p-4">PRODUTO</th><th className="p-4 text-right">PREÇO</th><th className="p-4"></th></tr></thead><tbody>{filteredProducts.map(p => (<tr key={p.id} className="border-b hover:bg-slate-50"><td className="p-4 font-mono">{p.code}</td><td className="p-4 font-bold">{p.name}</td><td className="p-4 text-right font-bold text-blue-600">R$ {p.price.toFixed(2)}</td><td className="p-4"><button onClick={() => handleAddFromSearch(p)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs">ADD</button></td></tr>))}</tbody></table></div></div></div> )}

      {successModal && (
          <div className="fixed inset-0 bg-pdv-success z-[60] flex flex-col items-center justify-center text-white animate-fade-in">
              <CheckCircle size={120} className="mb-6 animate-bounce" />
              <h2 className="text-4xl font-bold mb-2">VENDA FINALIZADA!</h2>
              
              {lastSaleData && (
                <div className="mt-8 bg-white/20 px-8 py-6 rounded-lg font-mono text-sm text-center max-w-2xl backdrop-blur-sm">
                    <p className="mb-2 font-bold text-lg">{lastSaleData.protocol === 'SEM VALOR FISCAL' ? 'RECIBO NÃO FISCAL' : `NFC-e Nº ${lastSaleData.fiscalCode?.slice(25,34)}`}</p>
                    <div className="text-left bg-black/10 p-4 rounded mb-4">
                        {lastSaleData.clientName ? (
                            <>
                                <p className="font-bold">Cliente: {lastSaleData.clientName}</p>
                                <p className="text-xs opacity-70">CPF: {lastSaleData.clientCpf}</p>
                            </>
                        ) : <p className="italic opacity-70">Consumidor não identificado</p>}
                    </div>
                    <button 
                        onClick={() => handlePrintReceipt(lastSaleData)}
                        className="mt-4 bg-white text-pdv-success px-6 py-2 rounded-lg font-bold hover:bg-green-50 flex items-center gap-2 mx-auto"
                    >
                        <Printer size={18} /> REIMPRIMIR CUPOM
                    </button>
                </div>
              )}
              <div className="mt-8 text-sm opacity-70">Fechando em 5 segundos...</div>
          </div>
      )}
    </div>
  );
};