
import React, { useEffect, useState } from 'react';
import { db } from '../../infra/db';
import { Sale } from '../../core/types';
import { Calendar, CreditCard, Search, Receipt, CheckCircle } from 'lucide-react';

export const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const allSales = db.getSales().sort((a, b) => b.timestamp - a.timestamp);
    setSales(allSales);
  }, []);

  const filteredSales = sales.filter(s => 
    s.fiscalCode?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
      <div className="w-1/2 flex flex-col space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Vendas Realizadas</h2>
        <div className="bg-white rounded-xl border border-slate-200 flex-1 overflow-hidden flex flex-col shadow-sm">
            <div className="p-4 border-b bg-slate-50">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nº cupom ou pagamento..." 
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                 </div>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                {filteredSales.map(sale => (
                    <div 
                        key={sale.id} 
                        onClick={() => setSelectedSale(sale)}
                        className={`p-4 cursor-pointer transition-all hover:bg-slate-50 ${selectedSale?.id === sale.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent'}`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <div>
                                <span className="font-bold text-slate-800">#{sale.fiscalCode?.slice(-6)}</span>
                                <span className="ml-2 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex-inline items-center gap-1">
                                    <CheckCircle size={10} /> CONCLUÍDA
                                </span>
                            </div>
                            <span className="font-bold text-indigo-600">R$ {sale.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                                <Calendar size={12} />
                                {new Date(sale.timestamp).toLocaleString()}
                            </div>
                            <div className="uppercase flex items-center gap-1">
                                <CreditCard size={12} />
                                {sale.paymentMethod}
                            </div>
                        </div>
                    </div>
                ))}
                {filteredSales.length === 0 && (
                    <div className="p-8 text-center text-slate-400">Nenhuma venda encontrada.</div>
                )}
            </div>
        </div>
      </div>

      <div className="w-1/2 bg-white rounded-xl border border-slate-200 p-8 shadow-sm overflow-y-auto flex flex-col items-center bg-slate-50">
        {selectedSale ? (
            <div className="w-full max-w-sm bg-white shadow-xl p-6 font-mono text-sm relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-[linear-gradient(45deg,transparent_25%,#e2e8f0_25%,#e2e8f0_50%,transparent_50%,transparent_75%,#e2e8f0_75%,#e2e8f0_100%)] bg-[length:10px_10px]"></div>

                <div className="text-center border-b border-dashed border-slate-300 pb-4 mb-4 mt-2">
                    <h3 className="font-bold text-xl text-slate-900">MERCADOMASTER</h3>
                    <p className="text-xs text-slate-500">Rua Exemplo, 123 - Centro</p>
                    <p className="text-xs text-slate-500">CNPJ: 00.000.000/0001-91</p>
                    <p className="font-bold mt-2 bg-slate-100 inline-block px-2 py-1">EXTRATO Nº {selectedSale.fiscalCode?.slice(-6)}</p>
                </div>
                
                <div className="space-y-2 mb-4">
                    <div className="flex font-bold border-b border-slate-200 pb-1 mb-2">
                        <span className="flex-1">ITEM</span>
                        <span className="w-16 text-right">QTD</span>
                        <span className="w-20 text-right">VALOR</span>
                    </div>
                    {selectedSale.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-slate-700">
                            <div className="truncate flex-1 pr-2 text-xs">
                                {item.name}
                            </div>
                            <div className="text-right w-16 text-xs">
                                {item.quantity} {item.unit}
                            </div>
                            <div className="text-right w-20 font-bold">
                                {item.total.toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="border-t border-dashed border-slate-300 pt-4 mb-4">
                    <div className="flex justify-between font-bold text-xl text-slate-900">
                        <span>TOTAL</span>
                        <span>R$ {selectedSale.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 mt-2 text-xs">
                        <span>Forma de Pagamento:</span>
                        <span className="font-bold">{selectedSale.paymentMethod}</span>
                    </div>
                </div>

                <div className="text-center text-[10px] text-slate-400">
                    <p>{new Date(selectedSale.timestamp).toLocaleString()}</p>
                    <p className="mt-2">Chave de Acesso NFC-e:</p>
                    <p className="break-all font-mono bg-slate-50 p-1">{selectedSale.fiscalCode}</p>
                    <p className="mt-4 font-bold">OBRIGADO PELA PREFERÊNCIA!</p>
                </div>

                 <div className="absolute bottom-0 left-0 w-full h-2 bg-[linear-gradient(45deg,transparent_25%,#e2e8f0_25%,#e2e8f0_50%,transparent_50%,transparent_75%,#e2e8f0_75%,#e2e8f0_100%)] bg-[length:10px_10px]"></div>
            </div>
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Receipt size={64} className="mb-4 opacity-20" />
                <p>Selecione uma venda para visualizar o cupom fiscal.</p>
            </div>
        )}
      </div>
    </div>
  );
};
