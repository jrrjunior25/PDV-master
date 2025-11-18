
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Package, ShoppingCart, TrendingUp, Users, BarChart2, DollarSign, LogOut, Menu, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const SidebarItem = ({ to, icon: Icon, label, active }: any) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      active 
        ? 'bg-indigo-600 text-white' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isPdv = location.pathname === '/pdv';

  if (isPdv) return <>{children}</>;

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-10 hidden md:flex">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingCart className="text-indigo-500" />
            Mercado<span className="text-indigo-500">Master</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">ERP Enterprise v2.0</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <SidebarItem to="/" icon={LayoutGrid} label="Dashboard" active={location.pathname === '/'} />
          <SidebarItem to="/products" icon={Package} label="Produtos & Estoque" active={location.pathname === '/products'} />
          <SidebarItem to="/sales" icon={TrendingUp} label="Vendas Realizadas" active={location.pathname === '/sales'} />
          <SidebarItem to="/financial" icon={DollarSign} label="Financeiro" active={location.pathname === '/financial'} />
          <SidebarItem to="/reports" icon={BarChart2} label="Relatórios" active={location.pathname === '/reports'} />
          
          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Operacional</p>
          </div>
          <SidebarItem to="/pdv" icon={ShoppingCart} label="Abrir PDV (Caixa)" active={false} />
          <SidebarItem to="/users" icon={Users} label="Usuários" active={location.pathname === '/users'} />
          <SidebarItem to="/settings" icon={Settings} label="Configurações" active={location.pathname === '/settings'} />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 px-4 py-2 w-full text-slate-400 hover:text-white transition-colors">
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white p-4 z-20 flex justify-between items-center">
          <span className="font-bold">MercadoMaster</span>
          <Menu />
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-auto mt-14 md:mt-0 h-full">
        <div className="max-w-7xl mx-auto pb-10">
            {children}
        </div>
      </main>
    </div>
  );
};
