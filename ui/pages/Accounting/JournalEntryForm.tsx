import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { accountingService } from '../../../infra/services/accountingService';
import { AccountingAccount, AccountingEntryLine } from '../../../core/types';
import { Link } from 'react-router-dom';

export const JournalEntryForm: React.FC = () => {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState<AccountingAccount[]>([]);
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [lines, setLines] = useState<AccountingEntryLine[]>([
        { accountId: '', debit: 0, credit: 0 },
        { accountId: '', debit: 0, credit: 0 }
    ]);

    useEffect(() => {
        setAccounts(accountingService.getAccounts());
    }, []);

    const handleLineChange = (index: number, field: keyof AccountingEntryLine, value: any) => {
        const newLines = [...lines];
        newLines[index] = { ...newLines[index], [field]: value };

        // Auto-balance logic helper (optional, maybe later)
        // If user types debit in one, maybe suggest credit in other? sticking to manual for now.

        // Ensure mutual exclusivity of Debit/Credit per line?
        // Standard practice: A line usually has Debit OR Credit, but theoretically could correct itself.
        // Let's keep it flexible.
        setLines(newLines);
    };

    const addLine = () => {
        setLines([...lines, { accountId: '', debit: 0, credit: 0 }]);
    };

    const removeLine = (index: number) => {
        if (lines.length <= 2) return;
        const newLines = lines.filter((_, i) => i !== index);
        setLines(newLines);
    };

    const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
    const difference = totalDebit - totalCredit;
    const isBalanced = Math.abs(difference) < 0.01;

    const handleSave = () => {
        if (!description) {
            alert("Informe uma descrição/histórico.");
            return;
        }
        if (!isBalanced) {
            alert("O lançamento não está balanceado. Débito e Crédito devem ser iguais.");
            return;
        }
        if (lines.some(l => !l.accountId)) {
            alert("Selecione as contas para todas as linhas.");
            return;
        }

        const entry = {
            id: crypto.randomUUID(),
            date: new Date(date).getTime(),
            description,
            lines: lines.map(l => ({
                accountId: l.accountId,
                debit: Number(l.debit || 0),
                credit: Number(l.credit || 0)
            })),
            relatedType: 'MANUAL' as const
        };

        accountingService.addEntry(entry);
        alert("Lançamento realizado com sucesso!");
        navigate('/accounting');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Link to="/accounting" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-slate-600" />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Novo Lançamento Contábil</h2>
                    <p className="text-slate-500">Lançamento manual de partidas dobradas.</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Histórico / Descrição</label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Ex: Ajuste de Estoque, Aporte de Capital..."
                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                </div>

                <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden mb-6">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-2 font-semibold text-slate-700">Conta Contábil</th>
                                <th className="px-4 py-2 font-semibold text-slate-700 w-32 text-right">Débito</th>
                                <th className="px-4 py-2 font-semibold text-slate-700 w-32 text-right">Crédito</th>
                                <th className="px-4 py-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {lines.map((line, index) => (
                                <tr key={index}>
                                    <td className="p-2">
                                        <select
                                            value={line.accountId}
                                            onChange={e => handleLineChange(index, 'accountId', e.target.value)}
                                            className="w-full p-2 border border-slate-300 rounded bg-white"
                                        >
                                            <option value="">Selecione a conta...</option>
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.code} - {acc.name}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            value={line.debit || ''}
                                            onChange={e => handleLineChange(index, 'debit', parseFloat(e.target.value))}
                                            className="w-full p-2 border border-slate-300 rounded text-right"
                                            min="0" step="0.01"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            value={line.credit || ''}
                                            onChange={e => handleLineChange(index, 'credit', parseFloat(e.target.value))}
                                            className="w-full p-2 border border-slate-300 rounded text-right"
                                            min="0" step="0.01"
                                        />
                                    </td>
                                    <td className="p-2 text-center">
                                        <button
                                            onClick={() => removeLine(index)}
                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                            disabled={lines.length <= 2}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-100 font-semibold text-slate-700">
                            <tr>
                                <td className="p-3">
                                    <button onClick={addLine} className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm">
                                        <Plus size={16} /> Adicionar Linha
                                    </button>
                                </td>
                                <td className="p-3 text-right text-indigo-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDebit)}</td>
                                <td className="p-3 text-right text-indigo-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCredit)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="flex items-center justify-between">
                    <div className={`text-sm font-medium px-3 py-1 rounded ${isBalanced ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {isBalanced ? 'Balanceado' : `Diferença: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(difference)}`}
                    </div>
                    <button
                        onClick={handleSave}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-white transition-colors ${isBalanced ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-400 cursor-not-allowed'}`}
                        disabled={!isBalanced}
                    >
                        <Save size={18} />
                        <span>Salvar Lançamento</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
