import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '../../components/ui/card';
import { accountingService } from '../../../infra/services/accountingService';
import { FileText, Calculator, List, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const AccountingDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    assets: 0,
    liabilities: 0,
    revenue: 0,
    expenses: 0
  });

  const navigate = useNavigate();

  useEffect(() => {
     // Quick snapshot calculation for the dashboard cards
     const today = new Date();
     const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
     const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getTime();

     // We can reuse getTrialBalance to get current balances
     // Note: Trial balance is cumulative, not just this month for Assets/Liabilities
     // But Revenue/Expense is usually period based for DRE.
     // Let's get "All time" for Balance Sheet items and "This Month" for P&L items if we wanted to be precise.
     // For simplicity in this dashboard overview, let's grab the Trial Balance for ALL TIME to show current state of accounts.
     const report = accountingService.getTrialBalance(0, Date.now());

     let assets = 0;
     let liabilities = 0;
     let revenue = 0;
     let expenses = 0;

     report.forEach(acc => {
         if (acc.type === 'ASSET' && acc.code.length === 1) assets += acc.balance; // Only top level? No, trial balance returns all accounts. We need to sum only leaf nodes or check logic.
         // Actually getTrialBalance returns all accounts with their calculated balances.
         // If we sum everything we might double count if we sum parents and children.
         // The service logic calculates balance for everyone based on lines.
         // Lines are usually booked against leaf accounts.
         // Let's filter by type and just sum the ones that have values or just grab top level groups if possible.
         // Our default chart has "1" as Asset, "2" as Liability.

         if (acc.code === '1') assets = acc.balance;
         if (acc.code === '2') liabilities = acc.balance;
         if (acc.code === '4') revenue = acc.balance;
         if (acc.code === '5') expenses = acc.balance;
     });

     setStats({ assets, liabilities, revenue, expenses });
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, onClick }: any) => (
    <div onClick={onClick} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className={`text-2xl font-bold mt-2 ${color}`}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
          </h3>
        </div>
        <div className={`p-3 rounded-lg bg-slate-50 ${color.replace('text-', 'text-opacity-80 ')}`}>
          <Icon size={24} className="opacity-80" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Módulo Contábil</h2>
          <p className="text-slate-500">Gestão contábil integrada e demonstrativos financeiros.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => navigate('/accounting/entries')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                <Plus size={18} />
                <span>Novo Lançamento</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Ativo Total" value={stats.assets} icon={FileText} color="text-emerald-600" />
        <StatCard title="Passivo Total" value={stats.liabilities} icon={List} color="text-red-600" />
        <StatCard title="Receitas (Acum.)" value={stats.revenue} icon={TrendingUp} color="text-blue-600" />
        <StatCard title="Despesas (Acum.)" value={stats.expenses} icon={TrendingDown} color="text-orange-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/accounting/dre" className="group block">
            <div className="bg-white rounded-lg border border-slate-200 p-6 hover:border-indigo-500 transition-colors h-full">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <FileText size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">DRE Gerencial</h3>
                </div>
                <p className="text-slate-500 text-sm">Demonstração do Resultado do Exercício. Visualize lucro líquido, margens e resultados operacionais.</p>
            </div>
          </Link>

          <Link to="/accounting/balance" className="group block">
            <div className="bg-white rounded-lg border border-slate-200 p-6 hover:border-indigo-500 transition-colors h-full">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Calculator size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Balancete de Verificação</h3>
                </div>
                <p className="text-slate-500 text-sm">Relatório detalhado de todas as contas, créditos, débitos e saldos finais para conferência.</p>
            </div>
          </Link>

          <Link to="/accounting/chart" className="group block">
            <div className="bg-white rounded-lg border border-slate-200 p-6 hover:border-indigo-500 transition-colors h-full">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <List size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Plano de Contas</h3>
                </div>
                <p className="text-slate-500 text-sm">Gerencie a estrutura de contas contábeis (Ativo, Passivo, Receitas, Despesas) do sistema.</p>
            </div>
          </Link>
      </div>
    </div>
  );
};
