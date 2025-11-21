import React, { useEffect, useState } from 'react';
import { accountingService } from '../../../infra/services/accountingService';
import { AccountingAccount, AccountType } from '../../../core/types';
import { ArrowLeft, ChevronRight, FolderOpen, Plus, Save, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ChartOfAccounts: React.FC = () => {
    const [accounts, setAccounts] = useState<AccountingAccount[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newAccount, setNewAccount] = useState<Partial<AccountingAccount>>({
        code: '', name: '', type: 'ASSET', parentId: null
    });

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = () => {
        setAccounts(accountingService.getAccounts());
    };

    const handleAddAccount = () => {
        if (!newAccount.code || !newAccount.name || !newAccount.type) {
            alert("Preencha todos os campos.");
            return;
        }

        accountingService.saveAccount({
            id: crypto.randomUUID(),
            code: newAccount.code,
            name: newAccount.name,
            type: newAccount.type as AccountType,
            parentId: newAccount.parentId || null,
            systemAccount: false
        });

        setIsModalOpen(false);
        setNewAccount({ code: '', name: '', type: 'ASSET', parentId: null });
        loadAccounts();
    };

    const handleDelete = (id: string, system: boolean) => {
        if (system) {
            alert("Contas de sistema não podem ser excluídas.");
            return;
        }
        if (confirm("Tem certeza que deseja excluir esta conta?")) {
            accountingService.deleteAccount(id);
            loadAccounts();
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/accounting" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Plano de Contas</h2>
                        <p className="text-slate-500">Estrutura hierárquica das contas contábeis.</p>
                    </div>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                    <Plus size={18} />
                    <span>Nova Conta</span>
                </button>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 font-semibold text-slate-700 w-32">Código</th>
                            <th className="px-6 py-3 font-semibold text-slate-700">Nome da Conta</th>
                            <th className="px-6 py-3 font-semibold text-slate-700 w-32">Tipo</th>
                            <th className="px-6 py-3 font-semibold text-slate-700 w-24 text-center">Ações</th>
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
                                        {!acc.systemAccount && (
                                            <button
                                                onClick={() => handleDelete(acc.id, !!acc.systemAccount)}
                                                className="text-slate-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                        {acc.systemAccount && <span className="text-xs text-slate-400">Padrão</span>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-900">Cadastrar Nova Conta</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="text-slate-500 hover:text-slate-900" /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Código da Conta</label>
                                <input
                                    type="text"
                                    value={newAccount.code}
                                    onChange={e => setNewAccount({...newAccount, code: e.target.value})}
                                    placeholder="Ex: 1.1.4.01"
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Conta</label>
                                <input
                                    type="text"
                                    value={newAccount.name}
                                    onChange={e => setNewAccount({...newAccount, name: e.target.value})}
                                    placeholder="Ex: Investimentos"
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                                <select
                                    value={newAccount.type}
                                    onChange={e => setNewAccount({...newAccount, type: e.target.value as AccountType})}
                                    className="w-full p-2 border border-slate-300 rounded"
                                >
                                    <option value="ASSET">Ativo</option>
                                    <option value="LIABILITY">Passivo</option>
                                    <option value="EQUITY">Patrimônio Líquido</option>
                                    <option value="REVENUE">Receita</option>
                                    <option value="EXPENSE">Despesa</option>
                                </select>
                            </div>

                            <button
                                onClick={handleAddAccount}
                                className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 flex justify-center items-center gap-2"
                            >
                                <Save size={18} />
                                Salvar Conta
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
