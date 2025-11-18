
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { POS } from './pages/POS';
import { Sales } from './pages/Sales';
import { Users } from './pages/Users';
import { Financial } from './pages/Financial';
import { Reports } from './pages/Reports';
import { SettingsPage } from './pages/Settings';
import { db } from './services/db';

const App: React.FC = () => {
  
  useEffect(() => {
    // Garante que o banco de dados (LocalStorage) tenha os dados iniciais
    // ao carregar a aplicação pela primeira vez ou após um refresh
    db.init();
  }, []);

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/pdv" element={<POS />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/users" element={<Users />} />
          <Route path="/financial" element={<Financial />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
