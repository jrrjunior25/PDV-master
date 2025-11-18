
import React, { useState, useEffect } from 'react';
import { db } from '../../infra/db';
import { User } from '../../core/types';
import { Lock, User as UserIcon, ArrowRight, ShoppingCart } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setUsers(db.getUsers());
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedUser) {
      setError('Selecione um usuário');
      return;
    }

    const user = db.auth.login(selectedUser, pin);
    if (user) {
      onLogin();
    } else {
      setError('PIN Incorreto. Tente novamente.');
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
             <ShoppingCart className="text-indigo-500" size={40} />
             MercadoMaster
          </h1>
          <p className="text-slate-400 mt-2">Autenticação de Sistema</p>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Quem está acessando?</h2>
              
              <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                      <label className="block text-sm font-medium text-slate-500 mb-2">Selecione seu Usuário</label>
                      <div className="grid grid-cols-2 gap-3">
                          {users.map(user => (
                              <div 
                                  key={user.id}
                                  onClick={() => { setSelectedUser(user.id); setError(''); }}
                                  className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center transition-all ${selectedUser === user.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}
                              >
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${user.role === 'ADMIN' ? 'bg-purple-200 text-purple-700' : 'bg-blue-200 text-blue-700'}`}>
                                      <UserIcon size={20} />
                                  </div>
                                  <span className="font-bold text-sm text-slate-800">{user.name}</span>
                                  <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">{user.role}</span>
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className={`transition-all duration-300 ${selectedUser ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                      <label className="block text-sm font-medium text-slate-500 mb-2">Digite seu PIN (Senha)</label>
                      <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                          <input 
                              type="password" 
                              value={pin}
                              onChange={e => setPin(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 outline-none text-center text-lg tracking-widest font-bold"
                              placeholder="****"
                              maxLength={6}
                              autoFocus
                          />
                      </div>
                  </div>

                  {error && (
                      <div className="text-red-500 text-center text-sm font-medium bg-red-50 py-2 rounded-lg animate-pulse">
                          {error}
                      </div>
                  )}

                  <button 
                      type="submit"
                      className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2"
                      disabled={!selectedUser}
                  >
                      Entrar no Sistema <ArrowRight size={20} />
                  </button>
              </form>
          </div>
          <div className="bg-slate-50 p-4 text-center text-xs text-slate-400 border-t border-slate-100">
              MercadoMaster v2.0 &copy; 2025
          </div>
      </div>
    </div>
  );
};
