import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { geminiService } from '../services/geminiService';
import { Sale, Product } from '../types';
import { DollarSign, ShoppingBag, AlertTriangle, TrendingUp, Sparkles } from 'lucide-react';
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

export const Dashboard: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    db.init();
    setSales(db.getSales());
    setProducts(db.getProducts());
  }, []);

  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
  const totalTransactions = sales.length;
  const lowStockItems = products.filter(p => p.stock < 10).length;

  // Chart Data Preparation
  const chartData = sales.slice(-10).map((s, i) => ({
    name: `Venda ${i+1}`,
    valor: s.total
  }));

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    const result = await geminiService.analyzeBusiness(sales, products);
    setAiAnalysis(result || "Sem dados suficientes.");
    setLoadingAi(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>
          <p className="text-slate-500">Monitoramento em tempo real da loja.</p>
        </div>
        <button 
          onClick={handleAiAnalysis}
          disabled={loadingAi}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-purple-200"
        >
          {loadingAi ? (
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Sparkles size={18} />
          )}
          Relatório Inteligente (IA)
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Faturamento Total" 
          value={`R$ ${totalRevenue.toFixed(2)}`} 
          icon={DollarSign} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Vendas Realizadas" 
          value={totalTransactions} 
          icon={ShoppingBag} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Estoque Crítico" 
          value={lowStockItems} 
          icon={AlertTriangle} 
          color="bg-red-500" 
        />
        <StatCard 
          title="Ticket Médio" 
          value={`R$ ${totalTransactions > 0 ? (totalRevenue / totalTransactions).toFixed(2) : '0.00'}`} 
          icon={TrendingUp} 
          color="bg-indigo-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
          <h3 className="font-semibold text-slate-800 mb-4">Fluxo de Vendas Recentes</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" hide />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="valor" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* AI Insights Panel */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-purple-200 rounded-full opacity-20 blur-xl"></div>
          <h3 className="font-semibold text-purple-900 flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-purple-600" />
            Insights do Consultor IA
          </h3>
          
          {aiAnalysis ? (
            <div className="prose prose-sm prose-purple text-slate-700 h-60 overflow-y-auto custom-scroll">
               <div className="whitespace-pre-wrap text-sm leading-relaxed">{aiAnalysis}</div>
            </div>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-slate-400 text-sm text-center">
              <p>Clique no botão acima para gerar uma análise estratégica baseada nos seus dados de venda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};