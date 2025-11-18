
import React, { useEffect, useState } from 'react';
import { db } from '../../infra/db';
import { Client } from '../../core/types';
import { Plus, Search, Edit, Star, User } from 'lucide-react';

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<Partial<Client>>({});

  useEffect(() => {
    setClients(db.getClients());
  }, []);

  const handleSave = () => {
    if (!currentClient.name || !currentClient.cpf) return alert('Nome e CPF são obrigatórios');
    
    const clientToSave: Client = {
        id: currentClient.id || crypto.randomUUID(),
        name: currentClient.name,
        cpf: currentClient.cpf,
        points: currentClient.points || 0,
        phone: currentClient.phone || '',
        lastPurchase: currentClient.lastPurchase
    };

    db.saveClient(clientToSave);
    setClients(db.getClients());
    setIsModalOpen(false);
    setCurrentClient({});
  };

  const handleEdit = (client: Client) => {
      setCurrentClient(client);
      setIsModalOpen(true);
  };

  const filtered = clients.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.cpf.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Clientes & Fidelidade</h2>
          <p className="text-slate-500">Gerencie sua carteira de clientes e saldo de pontos.</p>
        </div>
        <button 
          onClick={() => { setCurrentClient({}); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md"
        >
          <Plus size={18} />
          Novo Cliente
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
             <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar por nome ou CPF..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
        </div>

        <table className="w-full text-left">
            <thead className="bg-slate-50 border-b text-slate-600 text-xs uppercase font-bold">
                <tr>
                    <th className="px-6 py-3">Cliente</th>
                    <th className="px-6 py-3">CPF</th>
                    <th className="px-6 py-3">Pontos Fidelidade</th>
                    <th className="px-6 py-3">Última Compra</th>
                    <th className="px-6 py-3 text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filtered.map(client => (
                    <tr key={client.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                                <User size={16} />
                            </div>
                            {client.name}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-mono">{client.cpf}</td>
                        <td className="px-6 py-4">
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                <Star size={12} fill="orange" /> {client.points} pts
                            </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                            {client.lastPurchase ? new Date(client.lastPurchase).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                            <button onClick={() => handleEdit(client)} className="text-indigo-600 hover:text-indigo-800">
                                <Edit size={18} />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-slate-400">Nenhum cliente encontrado.</div>}
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
              <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl animate-fade-in">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">
                      {currentClient.id ? 'Editar Cliente' : 'Novo Cliente'}
                  </h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-slate-500 mb-1">Nome Completo</label>
                          <input 
                              type="text" 
                              className="w-full border border-slate-300 rounded-lg p-2 uppercase focus:ring-2 focus:ring-indigo-500 outline-none"
                              value={currentClient.name || ''}
                              onChange={e => setCurrentClient({...currentClient, name: e.target.value})}
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-bold text-slate-500 mb-1">CPF</label>
                              <input 
                                  type="text" 
                                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                  placeholder="000.000.000-00"
                                  value={currentClient.cpf || ''}
                                  onChange={e => setCurrentClient({...currentClient, cpf: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-500 mb-1">Telefone</label>
                              <input 
                                  type="text" 
                                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                  value={currentClient.phone || ''}
                                  onChange={e => setCurrentClient({...currentClient, phone: e.target.value})}
                              />
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-500 mb-1">Saldo de Pontos (Ajuste Manual)</label>
                          <input 
                              type="number" 
                              className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-yellow-50"
                              value={currentClient.points || 0}
                              onChange={e => setCurrentClient({...currentClient, points: parseInt(e.target.value) || 0})}
                          />
                          <p className="text-xs text-slate-400 mt-1">Alterar apenas para correções. O sistema calcula automaticamente nas vendas.</p>
                      </div>

                      <div className="flex gap-3 mt-6 pt-4 border-t">
                          <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200">Cancelar</button>
                          <button onClick={handleSave} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">Salvar</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
