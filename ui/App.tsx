import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { POS } from './pages/POS';
import { Sales } from './pages/Sales';
import { Users } from './pages/Users';
import { Financial } from './pages/Financial';
import { Reports } from './pages/Reports';
import { SettingsPage } from './pages/Settings';
import { Clients } from './pages/Clients';
import { Login } from './pages/Login';
import { db } from '../infra/db';
import { User } from '../core/types';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
    const user = db.auth.getSession();
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        if (user.role === 'OPERADOR') return <Navigate to="/pdv" replace />;
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeSystem = async () => {
        await db.init();
        const session = db.auth.getSession();
        setCurrentUser(session);
        setIsLoading(false);
    };
    initializeSystem();
  }, []);

  const handleLoginSuccess = () => {
    const user = db.auth.getSession();
    setCurrentUser(user);
    if (user?.role === 'ADMIN') {
        navigate('/');
    } else {
        navigate('/pdv');
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-900 text-white animate-pulse">Carregando Sistema e Banco de Dados...</div>;

  return (
    <Layout>
        <Routes>
          <Route path="/login" element={
             currentUser ? <Navigate to={currentUser.role === 'ADMIN' ? '/' : '/pdv'} /> : <Login onLogin={handleLoginSuccess} />
          } />
          
          <Route path="/" element={<ProtectedRoute allowedRoles={['ADMIN']}><Dashboard /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute allowedRoles={['ADMIN']}><Products /></ProtectedRoute>} />
          <Route path="/sales" element={<ProtectedRoute allowedRoles={['ADMIN']}><Sales /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><Users /></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute allowedRoles={['ADMIN']}><Clients /></ProtectedRoute>} />
          <Route path="/financial" element={<ProtectedRoute allowedRoles={['ADMIN']}><Financial /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute allowedRoles={['ADMIN']}><Reports /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute allowedRoles={['ADMIN']}><SettingsPage /></ProtectedRoute>} />

          <Route path="/pdv" element={<ProtectedRoute allowedRoles={['ADMIN', 'OPERADOR']}><POS /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </Layout>
  );
}

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;