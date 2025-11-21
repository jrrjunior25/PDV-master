
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, Package, ShoppingCart, TrendingUp, Users, BarChart2, DollarSign, LogOut, Menu, Settings, UserCircle, Heart, BookOpen } from 'lucide-react';
import { db } from '../../infra/db';

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
  const navigate = useNavigate();
  const isPdv = location.pathname === '/pdv';
  const isLogin = location.pathname === '/login';

  const user = db.auth.getSession();

  if (isPdv || isLogin) return <>{children}</>;

  const handleLogout = () => {
      db.auth.logout();
      window.location.reload();
  };

  return (
    <div className="flex h-screen bg-slate-100">
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-10 hidden md:flex">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingCart className="text-indigo-500" />
            Mercado<span className="text-indigo-500">Master</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">ERP Enterprise v2.0</p>
        </div>

        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user?.role === 'ADMIN' ? 'bg-purple-900 text-purple-300' : 'bg-blue-900 text-blue-300'}`}>
                <UserCircle size={24} />
            </div>
            <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{user?.name || 'Usuário'}</p>
                <p className="text-[10px] text-slate-400 uppercase">{user?.role || 'Indefinido'}</p>
            </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {user?.role === 'ADMIN' && (
            <>
                <SidebarItem to="/" icon={LayoutGrid} label="Dashboard" active={location.pathname === '/'} />
                <SidebarItem to="/products" icon={Package} label="Produtos & Estoque" active={location.pathname === '/products'} />
                <SidebarItem to="/clients" icon={Heart} label="Clientes & Fidelidade" active={location.pathname === '/clients'} />
                <SidebarItem to="/sales" icon={TrendingUp} label="Vendas Realizadas" active={location.pathname === '/sales'} />
                <SidebarItem to="/financial" icon={DollarSign} label="Financeiro" active={location.pathname === '/financial'} />
                <SidebarItem to="/accounting" icon={BookOpen} label="Contabilidade" active={location.pathname.startsWith('/accounting')} />
                <SidebarItem to="/reports" icon={BarChart2} label="Relatórios" active={location.pathname === '/reports'} />
                <SidebarItem to="/users" icon={Users} label="Usuários do Sistema" active={location.pathname === '/users'} />
                <SidebarItem to="/settings" icon={Settings} label="Configurações" active={location.pathname === '/settings'} />
            </>
          )}
          
          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Operacional</p>
          </div>
          <SidebarItem to="/pdv" icon={ShoppingCart} label="Abrir PDV (Caixa)" active={false} />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 w-full text-slate-400 hover:text-white transition-colors">
            <LogOut size={18} />
            <span>Sair / Logout</span>
          </button>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white p-4 z-20 flex justify-between items-center">
          <span className="font-bold">MercadoMaster</span>
          <Menu />
      </div>

      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-auto mt-14 md:mt-0 h-full">
        <div className="max-w-7xl mx-auto pb-10">
            {children}
        </div>
      </main>
    </div>
  );
};
