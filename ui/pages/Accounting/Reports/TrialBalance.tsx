import React, { useEffect, useState } from 'react';
import { accountingService } from '../../../infra/services/accountingService';
import { ArrowLeft, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TrialBalance: React.FC = () => {
    const [report, setReport] = useState<any[]>([]);

    useEffect(() => {
        // Balancete usually includes everything from beginning of time or fiscal year
        const data = accountingService.getTrialBalance(0, Date.now());
        setReport(data);
    }, []);

    const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // Totals for verification
    const totalDebit = report.reduce((acc, curr) => acc + curr.debit, 0);
    const totalCredit = report.reduce((acc, curr) => acc + curr.credit, 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/accounting" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Balancete de Verificação</h2>
                        <p className="text-slate-500">Listagem de saldos de todas as contas.</p>
                    </div>
                </div>
                <button onClick={() => window.print()} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600">
                    <Printer size={20} />
                </button>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 border-b border-slate-200 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-3 font-bold text-slate-600 w-32">Conta</th>
                            <th className="px-6 py-3 font-bold text-slate-600">Descrição</th>
                            <th className="px-6 py-3 font-bold text-slate-600 text-right w-40">Débito</th>
                            <th className="px-6 py-3 font-bold text-slate-600 text-right w-40">Crédito</th>
                            <th className="px-6 py-3 font-bold text-slate-600 text-right w-40">Saldo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {report.map(row => {
                             const isGroup = row.code.length <= 3; // Simple heuristic for group accounts
                             return (
                                <tr key={row.id} className={`hover:bg-slate-50 transition-colors ${isGroup ? 'bg-slate-50 font-semibold' : ''}`}>
                                    <td className="px-6 py-3 font-medium text-slate-700">{row.code}</td>
                                    <td className="px-6 py-3 text-slate-800">{row.name}</td>
                                    <td className="px-6 py-3 text-right text-slate-600">{row.debit > 0 ? formatMoney(row.debit) : '-'}</td>
                                    <td className="px-6 py-3 text-right text-slate-600">{row.credit > 0 ? formatMoney(row.credit) : '-'}</td>
                                    <td className={`px-6 py-3 text-right font-medium ${row.balance < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                        {formatMoney(row.balance)} {row.balance !== 0 ? (['ASSET','EXPENSE'].includes(row.type) ? 'D' : 'C') : ''}
                                    </td>
                                </tr>
                             );
                        })}
                    </tbody>
                    <tfoot className="bg-slate-200 font-bold border-t-2 border-slate-300">
                        <tr>
                            <td colSpan={2} className="px-6 py-3 text-right uppercase text-xs tracking-wider">Totais</td>
                            <td className="px-6 py-3 text-right">{formatMoney(totalDebit)}</td>
                            <td className="px-6 py-3 text-right">{formatMoney(totalCredit)}</td>
                            <td className="px-6 py-3 text-right">-</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};
