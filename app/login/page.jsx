'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#ef4444');
  const [newPassword, setNewPassword] = useState('');
  const [createMessage, setCreateMessage] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    setLoadError('');
    console.log('🔄 Загрузка профилей из Supabase...');
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Ошибка Supabase:', error);
        setLoadError(`Ошибка загрузки: ${error.message}`);
        setProfiles([]);
      } else {
        console.log('✅ Профили загружены:', data);
        setProfiles(data || []);
      }
    } catch (e) {
      console.error('💥 Критическая ошибка:', e);
      setLoadError('Не удалось подключиться к базе данных');
      setProfiles([]);
    }
    setLoading(false);
  };

  const handleSelectProfile = (profile) => {
    setSelectedProfile(profile);
    setPassword('');
    setError('');
    setShowPasswordModal(true);
  };

  const handleConfirmLogin = () => {
    if (!selectedProfile) return;

    if (password === selectedProfile.password) {
      localStorage.setItem('currentProfile', JSON.stringify(selectedProfile));
      setShowPasswordModal(false);
      setSelectedProfile(null);
      setPassword('');
      router.push('/');
    } else {
      setError('❌ Неверный пароль!');
    }
  };

  const handleCreateFirstProfile = async () => {
    if (!newName.trim()) {
      setCreateMessage(' Введи имя!');
      return;
    }
    if (!newPassword.trim() || newPassword.length < 4) {
      setCreateMessage('❌ Пароль должен быть минимум 4 символа!');
      return;
    }

    if (profiles.find(p => p.name.toLowerCase() === newName.trim().toLowerCase())) {
      setCreateMessage('❌ Профиль с таким именем уже существует!');
      return;
    }

    setCreateLoading(true);
    setCreateMessage('⏳ Создание профиля...');

    const newProfile = {
      id: `profile_${Date.now()}`,
      name: newName.trim(),
      avatar_color: newColor,
      password: newPassword,
      is_admin: profiles.length === 0,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .single();

    if (error) {
      console.error('❌ Ошибка создания:', error);
      setCreateMessage(`❌ Ошибка: ${error.message}`);
    } else {
      console.log('✅ Профиль создан:', data);
      localStorage.setItem('currentProfile', JSON.stringify(data));
      setCreateMessage('✅ Профиль создан! Вход...');
      setTimeout(() => router.push('/'), 500);
    }
    
    setCreateLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #000000 0%, #1a0000 100%)' }}>
      <div className="bg-gray-900 border-2 border-red-900/50 rounded-2xl max-w-2xl w-full shadow-2xl">
        
        <div className="p-6 border-b border-red-900/30 text-center">
          <h1 className="text-3xl font-bold text-red-400 mb-2">🎌 Anime Tracker</h1>
          <p className="text-gray-400 text-sm">Выбери профиль для входа</p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-4 animate-pulse">⏳</p>
              <p className="text-gray-400">Загрузка профилей из базы данных...</p>
            </div>
          ) : loadError ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-4">⚠️</p>
              <p className="text-red-400 mb-4">{loadError}</p>
              <button 
                onClick={loadProfiles}
                className="px-6 py-3 bg-red-700 hover:bg-red-600 rounded-xl text-white font-bold transition"
              >
                🔄 Попробовать снова
              </button>
            </div>
          ) : profiles.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-400 font-bold mb-4">Доступные профили ({profiles.length}):</p>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {profiles.map(profile => (
                  <button
                    key={profile.id}
                    onClick={() => handleSelectProfile(profile)}
                    className="w-full flex items-center gap-4 p-4 bg-black/40 hover:bg-red-900/20 border border-red-900/30 hover:border-red-700/50 rounded-xl transition-all duration-300 text-left group"
                  >
                    <div 
                      className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black text-white flex-shrink-0 group-hover:scale-110 transition-transform" 
                      style={{ backgroundColor: profile.avatar_color || '#ef4444' }}
                    >
                      {profile.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-lg truncate">{profile.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {profile.is_admin && (
                          <span className="px-2 py-0.5 bg-red-900/50 border border-red-700/50 rounded text-xs text-red-300 font-bold">
                            👑 Админ
                          </span>
                        )}
                        <span className="text-xs text-gray-500">🔒 Защищён паролем</span>
                      </div>
                    </div>
                    <div className="text-gray-600 group-hover:text-red-400 transition text-2xl">→</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-6xl mb-4"></p>
              <p className="text-white text-lg mb-2">Добро пожаловать!</p>
              <p className="text-gray-400 text-sm mb-6">Создай свой первый профиль</p>
              
              {!showCreateForm ? (
                <button 
                  onClick={() => setShowCreateForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 rounded-xl text-white font-bold transition-all transform hover:scale-105 shadow-lg shadow-red-900/50"
                >
                  ➕ Создать первый профиль
                </button>
              ) : (
                <div className="max-w-md mx-auto space-y-4 text-left">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Имя профиля:</label>
                    <input 
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Например: Иван"
                      className="w-full px-4 py-3 bg-black/60 border-2 border-red-900/30 rounded-lg text-white text-base focus:outline-none focus:border-red-700 placeholder-gray-500"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Пароль (мин. 4 символа):</label>
                    <input 
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••"
                      className="w-full px-4 py-3 bg-black/60 border-2 border-red-900/30 rounded-lg text-white text-base focus:outline-none focus:border-red-700 placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Цвет аватара:</label>
                    <input 
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="w-full h-12 rounded-lg cursor-pointer bg-transparent border-2 border-red-900/30"
                    />
                  </div>
                  
                  {createMessage && (
                    <div className={`p-3 rounded-lg text-sm ${
                      createMessage.includes('✅') ? 'bg-green-900/30 border border-green-700/50 text-green-300' :
                      createMessage.includes('❌') ? 'bg-red-900/30 border border-red-700/50 text-red-300' :
                      'bg-blue-900/30 border border-blue-700/50 text-blue-300'
                    }`}>
                      {createMessage}
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={handleCreateFirstProfile}
                      disabled={createLoading}
                      className="flex-1 px-4 py-3 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 rounded-lg text-white font-bold transition"
                    >
                      {createLoading ? '⏳ Создание...' : '✓ Создать и войти'}
                    </button>
                    <button 
                      onClick={() => { setShowCreateForm(false); setCreateMessage(''); }}
                      className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-bold transition"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showPasswordModal && selectedProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-gray-900 border-2 border-blue-700/50 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-blue-400">🔑 Вход в профиль</h3>
                <button 
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedProfile(null);
                    setPassword('');
                    setError('');
                  }}
                  className="text-gray-400 hover:text-red-400 text-2xl transition font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6 p-4 bg-black/40 border border-red-900/30 rounded-xl">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black text-white flex-shrink-0" 
                  style={{ backgroundColor: selectedProfile.avatar_color || '#ef4444' }}
                >
                  {selectedProfile.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-white font-bold text-lg">{selectedProfile.name}</p>
                  {selectedProfile.is_admin && (
                    <p className="text-xs text-red-400">👑 Администратор</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Введи пароль:</label>
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirmLogin();
                    }}
                    placeholder="••••••"
                    className="w-full px-4 py-3 bg-black/60 border-2 border-red-900/30 rounded-lg text-white text-base focus:outline-none focus:border-blue-700 placeholder-gray-500"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button 
                    onClick={handleConfirmLogin}
                    className="flex-1 px-4 py-3 bg-blue-700 hover:bg-blue-600 rounded-lg text-white font-bold transition"
                  >
                    ✓ Войти
                  </button>
                  <button 
                    onClick={() => {
                      setShowPasswordModal(false);
                      setSelectedProfile(null);
                      setPassword('');
                      setError('');
                    }}
                    className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-bold transition"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}