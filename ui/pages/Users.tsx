
import React, { useEffect, useState } from 'react';
import { db } from '../../infra/db';
import { User } from '../../core/types';
import { Plus, Trash2, Shield, User as UserIcon } from 'lucide-react';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({ role: 'OPERADOR' });

  useEffect(() => {
    setUsers(db.getUsers());
  }, []);

  const handleSave = () => {
    if (!newUser.name || !newUser.pin) return alert('Preencha todos os campos');
    
    const user: User = {
      id: newUser.id || crypto.randomUUID(),
      name: newUser.name,
      role: newUser.role || 'OPERADOR',
      pin: newUser.pin
    };
    
    db.saveUser(user);
    setUsers(db.getUsers());
    setIsModalOpen(false);
    setNewUser({ role: 'OPERADOR' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Excluir usuário?')) {
      db.deleteUser(id);
      setUsers(db.getUsers());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Usuários do Sistema</h2>
          <p className="text-slate-500">Controle de acesso e operadores de caixa.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md"
        >
          <Plus size={18} />
          Novo Usuário
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
            <div key={user.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                    {user.role === 'ADMIN' ? <Shield size={24} /> : <UserIcon size={24} />}
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-slate-800">{user.name}</h3>
                    <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">{user.role}</span>
                </div>
                <button onClick={() => handleDelete(user.id)} className="text-slate-300 hover:text-red-600 p-2 transition-colors">
                    <Trash2 size={18} />
                </button>
            </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 w-96 shadow-2xl animate-fade-in">
                <h3 className="text-lg font-bold mb-4 text-slate-800">Novo Usuário</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Nome</label>
                        <input 
                            type="text" 
                            className="w-full border border-slate-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={newUser.name || ''}
                            onChange={e => setNewUser({...newUser, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Função</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            value={newUser.role}
                            onChange={e => setNewUser({...newUser, role: e.target.value as any})}
                        >
                            <option value="OPERADOR">Operador de Caixa</option>
                            <option value="ADMIN">Administrador</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">PIN (Senha Numérica)</label>
                        <input 
                            type="password" 
                            className="w-full border border-slate-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
                            maxLength={6}
                            placeholder="Ex: 1234"
                            value={newUser.pin || ''}
                            onChange={e => setNewUser({...newUser, pin: e.target.value})}
                        />
                    </div>
                    <button 
                        onClick={handleSave}
                        className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 mt-4"
                    >
                        Salvar Usuário
                    </button>
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="w-full text-slate-500 py-2 mt-2 text-sm hover:text-slate-700"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
