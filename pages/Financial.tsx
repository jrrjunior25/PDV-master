
import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { FinancialRecord } from '../types';
import { Plus, TrendingUp, TrendingDown, DollarSign, Trash2 } from 'lucide-react';

export const Financial: React.FC = () => {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<FinancialRecord>>({ type: 'DESPESA' });

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = () => {
    const sorted = db.getFinancialRecords().sort((a, b) => b.date - a.date);
    setRecords(sorted);
  };

  const totalReceitas = records.filter(r => r.type === 'RECEITA').reduce((acc, r) => acc + r.amount, 0);
  const totalDespesas = records.filter(r => r.type === 'DESPESA').reduce((acc, r) => acc + r.amount, 0);
  const saldo = totalReceitas - totalDespesas;

  const handleSave = () => {
    if (!newRecord.description || !newRecord.amount) return alert('Preencha os campos');

    db.addFinancialRecord({
        id: crypto.randomUUID(),
        type: newRecord.type as any,
        description: newRecord.description,
        amount: Number(newRecord.amount),
        date: Date.now(),
        category: newRecord.category || 'Geral'
    });
    loadRecords();
    setIsModalOpen(false);
    setNewRecord({ type: 'DESPESA' });
  };

  const handleDelete = (id: string) => {
      if(window.confirm("Remover lançamento?")) {
          db.deleteFinancialRecord(id);
          loadRecords();
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Controle Financeiro</h2>
          <p className="text-slate-500">Fluxo de Caixa, Contas a Pagar e Receber.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md"
        >
          <Plus size={18} />
          Lançar Movimento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500 mb-2 font-medium">
                  <TrendingUp size={20} className="text-green-500" /> Total Receitas
              </div>
              <div className="text-3xl font-bold text-green-600">R$ {totalReceitas.toFixed(2)}</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500 mb-2 font-medium">
                  <TrendingDown size={20} className="text-red-500" /> Total Despesas
              </div>
              <div className="text-3xl font-bold text-red-600">R$ {totalDespesas.toFixed(2)}</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500 mb-2 font-medium">
                  <DollarSign size={20} className="text-blue-500" /> Saldo Líquido
              </div>
              <div className={`text-3xl font-bold ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  R$ {saldo.toFixed(2)}
              </div>
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                    <tr>
                        <th className="px-6 py-3 font-semibold text-slate-600">Data</th>
                        <th className="px-6 py-3 font-semibold text-slate-600">Descrição</th>
                        <th className="px-6 py-3 font-semibold text-slate-600">Categoria</th>
                        <th className="px-6 py-3 font-semibold text-slate-600 text-right">Valor</th>
                        <th className="px-6 py-3 font-semibold text-slate-600 w-12"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {records.map(rec => (
                        <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-slate-500">{new Date(rec.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4 font-medium text-slate-800">{rec.description}</td>
                            <td className="px-6 py-4">
                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold uppercase">
                                    {rec.category}
                                </span>
                            </td>
                            <td className={`px-6 py-4 text-right font-bold ${rec.type === 'RECEITA' ? 'text-green-600' : 'text-red-600'}`}>
                                {rec.type === 'DESPESA' ? '-' : '+'} R$ {rec.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4">
                                <button onClick={() => handleDelete(rec.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 w-96 shadow-2xl animate-fade-in">
                <h3 className="text-lg font-bold mb-4 text-slate-800">Novo Lançamento</h3>
                <div className="space-y-4">
                    <div className="flex gap-4 bg-slate-50 p-2 rounded-lg">
                        <label className="flex items-center gap-2 cursor-pointer flex-1 justify-center py-2 rounded transition-colors has-[:checked]:bg-green-100 has-[:checked]:text-green-700">
                            <input 
                                type="radio" 
                                name="type" 
                                className="hidden"
                                checked={newRecord.type === 'RECEITA'} 
                                onChange={() => setNewRecord({...newRecord, type: 'RECEITA'})}
                            /> 
                            <TrendingUp size={16} /> Receita
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer flex-1 justify-center py-2 rounded transition-colors has-[:checked]:bg-red-100 has-[:checked]:text-red-700">
                            <input 
                                type="radio" 
                                name="type" 
                                className="hidden"
                                checked={newRecord.type === 'DESPESA'} 
                                onChange={() => setNewRecord({...newRecord, type: 'DESPESA'})}
                            /> 
                            <TrendingDown size={16} /> Despesa
                        </label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Descrição</label>
                        <input 
                            type="text" 
                            className="w-full border border-slate-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={newRecord.description || ''}
                            onChange={e => setNewRecord({...newRecord, description: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Valor (R$)</label>
                        <input 
                            type="number" 
                            step="0.01"
                            className="w-full border border-slate-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={newRecord.amount || ''}
                            onChange={e => setNewRecord({...newRecord, amount: parseFloat(e.target.value)})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Categoria</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                            value={newRecord.category}
                            onChange={e => setNewRecord({...newRecord, category: e.target.value})}
                        >
                             <option value="Geral">Geral</option>
                             <option value="Fornecedores">Fornecedores</option>
                             <option value="Aluguel">Aluguel</option>
                             <option value="Funcionários">Funcionários</option>
                             <option value="Vendas">Vendas</option>
                             <option value="Impostos">Impostos</option>
                        </select>
                    </div>
                    <button onClick={handleSave} className="w-full bg-emerald-600 text-white py-2 rounded-lg font-bold hover:bg-emerald-700 mt-4">
                        Salvar Lançamento
                    </button>
                    <button onClick={() => setIsModalOpen(false)} className="w-full text-slate-500 py-2 mt-2 text-sm hover:text-slate-700">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
