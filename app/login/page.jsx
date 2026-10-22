'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfiles, loginProfile } from '../lib/profiles';

export default function LoginPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const { data } = await getProfiles();
    if (data) setProfiles(data);
    setLoading(false);
  };

  const handleProfileSelect = (profile) => {
    setSelectedProfile(profile);
    setPassword('');
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Введи пароль');
      return;
    }

    const { data, error } = await loginProfile(selectedProfile.id, password);
    
    if (error || !data) {
      setError('Неверный пароль');
      setPassword('');
      return;
    }

    // Сохраняем профиль в localStorage
    localStorage.setItem('currentProfile', JSON.stringify(data));
    router.push('/');
  };

  const handleBack = () => {
    setSelectedProfile(null);
    setPassword('');
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #000000 0%, #1a0000 100%)'
      }}>
        <p className="text-white text-xl animate-pulse">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #000000 0%, #1a0000 100%)'
    }}>
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-red-500 text-center mb-2">
          Pedikovatiy Anime Tracker
        </h1>
        <p className="text-gray-400 text-center mb-8">
          {selectedProfile ? `Введи пароль для профиля "${selectedProfile.name}"` : 'Выбери профиль'}
        </p>

        {!selectedProfile ? (
          // Экран выбора профиля
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleProfileSelect(profile)}
                className="flex flex-col items-center p-6 bg-black/60 backdrop-blur-sm border border-red-900/30 rounded-2xl hover:border-red-700/50 hover:scale-105 transition-all duration-300 group"
              >
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black text-white mb-3 shadow-lg group-hover:shadow-red-900/50 transition"
                  style={{ backgroundColor: profile.avatar_color }}
                >
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-white font-bold text-lg">{profile.name}</span>
                {profile.is_admin && (
                  <span className="text-xs text-red-400 mt-1">Админ</span>
                )}
              </button>
            ))}
          </div>
        ) : (
          // Экран ввода пароля
          <div className="max-w-md mx-auto bg-black/80 backdrop-blur-md border border-red-900/50 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-center mb-6">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black text-white shadow-lg"
                style={{ backgroundColor: selectedProfile.avatar_color }}
              >
                {selectedProfile.name.charAt(0).toUpperCase()}
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Пароль</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введи пароль"
                  className="w-full px-4 py-3 bg-black/60 border border-red-900/30 rounded-xl text-white text-sm focus:outline-none focus:border-red-700"
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 bg-red-900/30 border border-red-900/50 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 rounded-xl text-white font-bold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-900/50"
              >
                Войти
              </button>

              <button
                type="button"
                onClick={handleBack}
                className="w-full px-4 py-2 text-gray-400 hover:text-white transition text-sm"
              >
                ← Назад к профилям
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}