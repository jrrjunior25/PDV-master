import React, { useEffect, useState } from 'react';
import { accountingService } from '../../../infra/services/accountingService';
import { AccountingAccount } from '../../../core/types';
import { ArrowLeft, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ChartOfAccounts: React.FC = () => {
    const [accounts, setAccounts] = useState<AccountingAccount[]>([]);

    useEffect(() => {
        setAccounts(accountingService.getAccounts());
    }, []);

    // Recursive render function could be nice, but a flat list with indentation sorted by code is easier for now.
    // The service returns them sorted by code.

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Link to="/accounting" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-slate-600" />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Plano de Contas</h2>
                    <p className="text-slate-500">Estrutura hierárquica das contas contábeis.</p>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 font-semibold text-slate-700 w-32">Código</th>
                            <th className="px-6 py-3 font-semibold text-slate-700">Nome da Conta</th>
                            <th className="px-6 py-3 font-semibold text-slate-700 w-32">Tipo</th>
                            <th className="px-6 py-3 font-semibold text-slate-700 w-24 text-center">Sistema</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {accounts.map(acc => {
                            const depth = acc.code.split('.').length - 1;
                            return (
                                <tr key={acc.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-3 font-medium text-slate-600">{acc.code}</td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 20}px` }}>
                                            {depth < 2 ? <FolderOpen size={16} className="text-indigo-500" /> : <ChevronRight size={16} className="text-slate-400" />}
                                            <span className={depth < 2 ? 'font-bold text-slate-800' : 'text-slate-600'}>
                                                {acc.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                        <span className={`px-2 py-1 rounded-full ${
                                            acc.type === 'ASSET' ? 'bg-emerald-100 text-emerald-700' :
                                            acc.type === 'LIABILITY' ? 'bg-red-100 text-red-700' :
                                            acc.type === 'REVENUE' ? 'bg-blue-100 text-blue-700' :
                                            acc.type === 'EXPENSE' ? 'bg-orange-100 text-orange-700' :
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                            {acc.type === 'ASSET' ? 'Ativo' :
                                             acc.type === 'LIABILITY' ? 'Passivo' :
                                             acc.type === 'REVENUE' ? 'Receita' :
                                             acc.type === 'EXPENSE' ? 'Despesa' : 'Patrimônio'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        {acc.systemAccount ? (
                                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">Padrão</span>
                                        ) : (
                                            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded">Personalizado</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
