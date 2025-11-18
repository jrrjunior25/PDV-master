
import React, { useEffect, useState } from 'react';
import { db } from '../../infra/db';
import { geminiService } from '../../infra/services/geminiService';
import { Sale, Product } from '../../core/types';
import { DollarSign, ShoppingBag, AlertTriangle, TrendingUp, Sparkles, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="text-white" size={24} />
      </div>
    </div>
  </div>
);

type DateRange = 'TODAY' | '7D' | '30D' | 'ALL';

export const Dashboard: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('TODAY');

  useEffect(() => {
    db.init();
    setSales(db.getSales());
    setProducts(db.getProducts());
  }, []);

  const getFilteredSales = () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      
      return sales.filter(s => {
          if (dateRange === 'ALL') return true;
          if (dateRange === 'TODAY') return s.timestamp >= todayStart;
          if (dateRange === '7D') {
              const sevenDaysAgo = todayStart - (7 * 24 * 60 * 60 * 1000);
              return s.timestamp >= sevenDaysAgo;
          }
          if (dateRange === '30D') {
              const thirtyDaysAgo = todayStart - (30 * 24 * 60 * 60 * 1000);
              return s.timestamp >= thirtyDaysAgo;
          }
          return true;
      });
  };

  const filteredSales = getFilteredSales();
  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const totalTransactions = filteredSales.length;
  const lowStockItems = products.filter(p => p.stock < 10).length;

  const chartData = filteredSales.slice(-20).map((s, i) => ({
    name: new Date(s.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    valor: s.total
  }));

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    const result = await geminiService.analyzeBusiness(filteredSales, products);
    setAiAnalysis(result || "Sem dados suficientes.");
    setLoadingAi(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>
          <p className="text-slate-500">Monitoramento estratégico da loja.</p>
        </div>
        
        <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-300 shadow-sm">
            <button onClick={() => setDateRange('TODAY')} className={`px-3 py-1 text-sm font-bold rounded ${dateRange === 'TODAY' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>Hoje</button>
            <button onClick={() => setDateRange('7D')} className={`px-3 py-1 text-sm font-bold rounded ${dateRange === '7D' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>7 Dias</button>
            <button onClick={() => setDateRange('30D')} className={`px-3 py-1 text-sm font-bold rounded ${dateRange === '30D' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>30 Dias</button>
            <button onClick={() => setDateRange('ALL')} className={`px-3 py-1 text-sm font-bold rounded ${dateRange === 'ALL' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>Total</button>
        </div>

        <button 
          onClick={handleAiAnalysis}
          disabled={loadingAi}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-purple-200"
        >
          {loadingAi ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <Sparkles size={18} />}
          Relatório Inteligente (IA)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Faturamento" value={`R$ ${totalRevenue.toFixed(2)}`} icon={DollarSign} color="bg-green-500" />
        <StatCard title="Vendas" value={totalTransactions} icon={ShoppingBag} color="bg-blue-500" />
        <StatCard title="Estoque Crítico" value={lowStockItems} icon={AlertTriangle} color="bg-red-500" />
        <StatCard title="Ticket Médio" value={`R$ ${totalTransactions > 0 ? (totalRevenue / totalTransactions).toFixed(2) : '0.00'}`} icon={TrendingUp} color="bg-indigo-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Calendar size={16} /> Fluxo de Vendas ({dateRange === 'TODAY' ? 'Hoje' : dateRange})</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="valor" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-purple-200 rounded-full opacity-20 blur-xl"></div>
          <h3 className="font-semibold text-purple-900 flex items-center gap-2 mb-4"><Sparkles size={18} className="text-purple-600" /> Insights do Consultor IA</h3>
          {aiAnalysis ? (
            <div className="prose prose-sm prose-purple text-slate-700 h-60 overflow-y-auto custom-scroll">
               <div className="whitespace-pre-wrap text-sm leading-relaxed">{aiAnalysis}</div>
            </div>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-slate-400 text-sm text-center">
              <p>Clique no botão acima para gerar uma análise estratégica baseada nos dados filtrados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
