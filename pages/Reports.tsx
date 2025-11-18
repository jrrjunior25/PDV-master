
import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { Sale } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const Reports: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  
  useEffect(() => {
    setSales(db.getSales());
  }, []);

  // Dados por Categoria
  const salesByCategory = sales.reduce((acc: any, sale) => {
      sale.items.forEach(item => {
          if(!acc[item.category]) acc[item.category] = 0;
          acc[item.category] += item.total;
      });
      return acc;
  }, {});

  const categoryData = Object.keys(salesByCategory).map(key => ({
      name: key,
      value: salesByCategory[key]
  }));

  // Dados por Método de Pagamento
  const salesByMethod = sales.reduce((acc: any, sale) => {
      if(!acc[sale.paymentMethod]) acc[sale.paymentMethod] = 0;
      acc[sale.paymentMethod] += sale.total;
      return acc;
  }, {});

  const methodData = Object.keys(salesByMethod).map(key => ({
      name: key,
      value: salesByMethod[key]
  }));

  return (
    <div className="space-y-6">
       <div>
          <h2 className="text-2xl font-bold text-slate-800">Relatórios Gerenciais</h2>
          <p className="text-slate-500">Visualização estratégica do desempenho da loja.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Barras */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-96 flex flex-col">
                <h3 className="font-bold text-slate-700 mb-6">Vendas por Categoria (R$)</h3>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip cursor={{fill: '#f1f5f9'}} />
                            <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} name="Total" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Gráfico de Pizza */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-96 flex flex-col">
                <h3 className="font-bold text-slate-700 mb-6">Métodos de Pagamento</h3>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={methodData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            >
                                {methodData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </div>
  );
};
