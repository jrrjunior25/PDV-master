import React, { useEffect, useState } from 'react';
import { accountingService } from '../../../infra/services/accountingService';
import { ArrowLeft, Printer, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DRE: React.FC = () => {
    const [report, setReport] = useState<any>(null);
    const [period, setPeriod] = useState({
        start: new Date(new Date().getFullYear(), 0, 1).getTime(), // Beginning of year
        end: Date.now()
    });

    useEffect(() => {
        const data = accountingService.getDRE(period.start, period.end);
        setReport(data);
    }, [period]);

    if (!report) return <div>Carregando...</div>;

    const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const Row = ({ label, value, bold = false, indent = false, color = 'text-slate-800' }: any) => (
        <div className={`flex justify-between py-2 border-b border-slate-100 last:border-0 ${indent ? 'pl-8' : ''}`}>
            <span className={`${bold ? 'font-bold' : ''} ${color}`}>{label}</span>
            <span className={`${bold ? 'font-bold' : ''} ${color}`}>{formatMoney(value)}</span>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/accounting" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Demonstrativo do Resultado (DRE)</h2>
                        <p className="text-slate-500">
                            Período: {new Date(period.start).toLocaleDateString()} até {new Date(period.end).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <button onClick={() => window.print()} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600">
                    <Printer size={20} />
                </button>
            </div>

            <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-slate-200 print:shadow-none print:border-none">
                <div className="text-center mb-8 border-b border-slate-200 pb-4">
                    <h1 className="text-xl font-bold uppercase tracking-widest text-slate-800">Demonstração do Resultado</h1>
                    <p className="text-sm text-slate-500 mt-1">Exercício de {new Date(period.start).getFullYear()}</p>
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
