import React, { useEffect, useState } from 'react';
import { accountingService } from '../../../infra/services/accountingService';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TrialBalance: React.FC = () => {
    const [report, setReport] = useState<any[]>([]);
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        // Balancete usually includes everything from beginning of time or fiscal year up to end date for balance sheet accounts
        // But for report purposes, we might want period movements.
        // Standard Trial Balance shows: Previous Balance, Debit, Credit, Final Balance.
        // Our current simple implementation just sums debits and credits in the period.
        // For "Professional" feel, it should ideally encompass all history for Assets/Liabilities.
        // Let's assume "0" start for now to get full balance, but filtering by date range is also useful for period analysis.

        // If user selects a range, they expect movements within that range.
        // BUT, the final balance column must reflect the true balance at endDate.
        // This requires:
        // 1. Calculate Balance at startDate - 1ms (Opening Balance)
        // 2. Calculate Debits/Credits between startDate and endDate
        // 3. Final Balance = Opening + Debits - Credits (or vice versa depending on type)

        // Our current service `getTrialBalance` takes start/end and sums everything in between.
        // To do it properly:
        // We will just fetch EVERYTHING from 0 to endDate for the "Balance" column.
        // But users might want to see specifically what happened this month in Debit/Credit columns.

        // Let's stick to the simple version: View movements and balance for the selected period.
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).setHours(23, 59, 59, 999);

        const data = accountingService.getTrialBalance(0, end);
        // Wait, if we pass 0, we get full history. If we pass start, we miss opening balance.
        // Since we don't have a "Opening Balance" column in UI yet, showing Full History (cumulative) is safer for "Saldo".
        // Debit/Credit columns will show total accumulated history too.
        // Ideally we'd change the UI to have 4 columns: Opening, Debit, Credit, Closing.

        setReport(data);
    }, [startDate, endDate]);

    const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // Totals for verification
    const totalDebit = report.reduce((acc, curr) => acc + curr.debit, 0);
    const totalCredit = report.reduce((acc, curr) => acc + curr.credit, 0);

    const handleExport = () => {
        if (!window.XLSX) return alert("Biblioteca Excel não carregada.");

        const data = [
            ["Balancete de Verificação"],
            [`Data Base: ${endDate}`],
            [""],
            ["Código", "Conta", "Débito", "Crédito", "Saldo Final"],
            ...report.map(r => [
                r.code,
                r.name,
                r.debit,
                r.credit,
                r.balance
            ]),
            ["", "TOTAIS", totalDebit, totalCredit, ""]
        ];

        const ws = window.XLSX.utils.aoa_to_sheet(data);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, "Balancete");
        window.XLSX.writeFile(wb, `Balancete_${endDate}.xlsx`);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/accounting" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Balancete de Verificação</h2>
                        <p className="text-slate-500">Posição acumulada até a data selecionada.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-slate-400 text-sm">Posição em:</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="border-none bg-transparent text-sm focus:ring-0"
                    />
                </div>

                <div className="flex gap-2">
                     <button onClick={handleExport} className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 flex items-center gap-2 text-sm font-medium">
                        <Download size={18} />
                        Exportar
                    </button>
                    <button onClick={() => window.print()} className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 flex items-center gap-2 text-sm font-medium">
                        <Printer size={18} />
                        Imprimir
                    </button>
                </div>
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
