import React, { useState, useEffect } from 'react';
import { db } from '../../infra/db';
import { User } from '../../core/types';
import { Lock, User as UserIcon, ArrowRight, ShoppingCart, ShieldCheck, Store } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setUsers(db.getUsers());
    setIsLoaded(true);
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
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* BACKGROUND ANIMATION */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-600/20 blur-[100px] animate-blob mix-blend-multiply filter"></div>
          <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-purple-600/20 blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply filter"></div>
          <div className="absolute top-[20%] right-[20%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[100px] animate-blob animation-delay-4000 mix-blend-multiply filter"></div>
      </div>

      {/* CONTENT CONTAINER */}
      <div className={`z-10 w-full max-w-5xl flex flex-col md:flex-row bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/10 transition-all duration-1000 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          
          {/* LEFT SIDE: BRANDING */}
          <div className="md:w-5/12 bg-indigo-900/80 p-10 flex flex-col justify-between text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
              
              <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                        <ShoppingCart className="text-white" size={32} />
                      </div>
                      <h1 className="text-2xl font-bold tracking-wide">MercadoMaster</h1>
                  </div>
                  <p className="text-indigo-200 text-sm leading-relaxed">
                      Sistema de Gestão Enterprise v2.0.<br/>
                      Controle total do seu varejo com tecnologia de ponta e inteligência artificial.
                  </p>
              </div>

              <div className="relative z-10 mt-12 md:mt-0">
                  <div className="flex items-center gap-3 mb-4">
                      <ShieldCheck className="text-green-400" size={20} />
                      <span className="text-sm font-medium text-indigo-100">Ambiente Seguro & Criptografado</span>
                  </div>
                  <div className="flex items-center gap-3">
                      <Store className="text-blue-400" size={20} />
                      <span className="text-sm font-medium text-indigo-100">Operação Offline Habilitada</span>
                  </div>
              </div>
          </div>

          {/* RIGHT SIDE: LOGIN FORM */}
          <div className="md:w-7/12 bg-white p-8 md:p-12">
              <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-800 mb-1">Bem-vindo de volta</h2>
                  <p className="text-slate-500 text-sm">Selecione seu perfil para acessar o sistema.</p>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Usuário</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {users.map(user => (
                              <div 
                                  key={user.id}
                                  onClick={() => { setSelectedUser(user.id); setError(''); }}
                                  className={`relative cursor-pointer border rounded-xl p-4 flex items-center gap-4 transition-all duration-200 group ${
                                      selectedUser === user.id 
                                      ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600 shadow-md' 
                                      : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                                  }`}
                              >
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                      selectedUser === user.id
                                      ? 'bg-indigo-600 text-white'
                                      : (user.role === 'ADMIN' ? 'bg-purple-100 text-purple-600 group-hover:bg-purple-200' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-200')
                                  }`}>
                                      <UserIcon size={20} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className={`font-bold text-sm truncate ${selectedUser === user.id ? 'text-indigo-900' : 'text-slate-700'}`}>{user.name}</div>
                                      <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">{user.role}</div>
                                  </div>
                                  {selectedUser === user.id && (
                                      <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                                  )}
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className={`transition-all duration-500 ease-in-out overflow-hidden ${selectedUser ? 'max-h-40 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4'}`}>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Senha de Acesso (PIN)</label>
                      <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <Lock className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                          </div>
                          <input 
                              type="password" 
                              value={pin}
                              onChange={e => setPin(e.target.value)}
                              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-lg tracking-[0.5em] font-bold text-slate-800 placeholder-slate-300 transition-all"
                              placeholder="••••••"
                              maxLength={6}
                              autoFocus={!!selectedUser}
                          />
                      </div>
                  </div>

                  {error && (
                      <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 border border-red-100 animate-shake">
                          <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                          {error}
                      </div>
                  )}

                  <button 
                      type="submit"
                      className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-lg transform active:scale-[0.98] ${
                          selectedUser 
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/30' 
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                      disabled={!selectedUser}
                  >
                      <span>Acessar Sistema</span>
                      <ArrowRight size={20} className={`${selectedUser ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'} transition-all duration-300`} />
                  </button>
              </form>
              
              <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-400">
                      Protegido por reCAPTCHA e sujeito à Política de Privacidade e Termos de Uso.
                      <br/>&copy; 2025 MercadoMaster Systems.
                  </p>
              </div>
          </div>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
            animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};