import React, { useEffect, useState } from 'react';
import { accountingService } from '../../../infra/services/accountingService';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DRE: React.FC = () => {
    const [report, setReport] = useState<any>(null);
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime(); // End of day? Usually users expect inclusive.
        // Fix end date to be end of day
        const endInclusive = new Date(endDate);
        endInclusive.setHours(23, 59, 59, 999);

        const data = accountingService.getDRE(start, endInclusive.getTime());
        setReport(data);
    }, [startDate, endDate]);

    if (!report) return <div>Carregando...</div>;

    const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const Row = ({ label, value, bold = false, indent = false, color = 'text-slate-800' }: any) => (
        <div className={`flex justify-between py-2 border-b border-slate-100 last:border-0 ${indent ? 'pl-8' : ''}`}>
            <span className={`${bold ? 'font-bold' : ''} ${color}`}>{label}</span>
            <span className={`${bold ? 'font-bold' : ''} ${color}`}>{formatMoney(value)}</span>
        </div>
    );

    const handleExport = () => {
        if (!window.XLSX) return alert("Biblioteca Excel não carregada.");

        const data = [
            ["Demonstração do Resultado do Exercício"],
            [`Período: ${startDate} a ${endDate}`],
            [""],
            ["Descrição", "Valor"],
            ["RECEITA OPERACIONAL BRUTA", report.grossRevenue],
            ["(-) Deduções", report.deductions],
            ["(=) RECEITA LÍQUIDA", report.netRevenue],
            ["(-) CMV", report.costs],
            ["(=) LUCRO BRUTO", report.grossProfit],
            ["(-) Despesas Operacionais", report.expenses],
            ["(=) RESULTADO LÍQUIDO", report.netProfit]
        ];

        const ws = window.XLSX.utils.aoa_to_sheet(data);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, "DRE");
        window.XLSX.writeFile(wb, `DRE_${startDate}_${endDate}.xlsx`);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/accounting" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Demonstrativo do Resultado</h2>
                        <p className="text-slate-500">Visão geral de lucros e perdas.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="border-none bg-transparent text-sm focus:ring-0"
                    />
                    <span className="text-slate-400">até</span>
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

            <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-slate-200 print:shadow-none print:border-none">
                <div className="text-center mb-8 border-b border-slate-200 pb-4">
                    <h1 className="text-xl font-bold uppercase tracking-widest text-slate-800">Demonstração do Resultado</h1>
                    <p className="text-sm text-slate-500 mt-1">Período: {new Date(startDate).toLocaleDateString()} até {new Date(endDate).toLocaleDateString()}</p>
                </div>

                <div className="space-y-1">
                    <Row label="RECEITA OPERACIONAL BRUTA" value={report.grossRevenue} bold />
                    <Row label="(-) Deduções da Receita" value={report.deductions} indent color="text-red-600" />
                    <div className="h-4"></div>

                    <Row label="(=) RECEITA OPERACIONAL LÍQUIDA" value={report.netRevenue} bold color="text-indigo-900" />
                    <div className="h-4"></div>

                    <Row label="(-) Custos das Vendas (CMV)" value={report.costs} indent color="text-red-600" />
                    <div className="h-4"></div>

                    <Row label="(=) LUCRO BRUTO" value={report.grossProfit} bold color="text-indigo-900" />
                    <div className="h-4"></div>

                    <Row label="(-) Despesas Operacionais" value={report.expenses} indent color="text-red-600" />
                    {/* Detailed expenses could be listed here if we broke them down further in the service return */}

                    <div className="h-8 border-b-2 border-slate-800 mb-4"></div>

                    <div className="flex justify-between py-4 bg-slate-50 px-4 rounded-lg">
                        <span className="text-lg font-bold text-slate-900">(=) RESULTADO LÍQUIDO (LUCRO/PREJUÍZO)</span>
                        <span className={`text-lg font-bold ${report.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatMoney(report.netProfit)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
