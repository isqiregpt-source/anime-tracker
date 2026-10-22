'use client';

import { useState, useEffect } from 'react';
import { getProfiles, createProfile, deleteProfile } from '../lib/profiles';

const avatarColors = ['#dc143c', '#8b0000', '#4a0080', '#006400', '#00008b', '#8b4513', '#2f4f4f', '#800080'];

export default function AdminPanel({ onClose }) {
  const [profiles, setProfiles] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newColor, setNewColor] = useState('#dc143c');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const { data } = await getProfiles();
    if (data) setProfiles(data);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newName.trim() || !newPassword) {
      setError('Заполни все поля');
      return;
    }

    if (newPassword.length < 4) {
      setError('Пароль минимум 4 символа');
      return;
    }

    const { data, error } = await createProfile(newName.trim(), newPassword, isAdmin, newColor);
    
    if (error) {
      if (error.message.includes('unique')) {
        setError('Профиль с таким именем уже существует');
      } else {
        setError('Ошибка создания профиля');
      }
    } else {
      setSuccess(`Профиль "${newName}" создан!${isAdmin ? ' (Администратор)' : ''}`);
      setNewName('');
      setNewPassword('');
      setIsAdmin(false);
      loadProfiles();
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleDelete = async (profileId, profileName) => {
    if (!confirm(`Удалить профиль "${profileName}"? Все его аниме тоже будут удалены!`)) return;
    
    const { error } = await deleteProfile(profileId);
    if (error) {
      setError('Ошибка удаления');
    } else {
      loadProfiles();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[250] p-4">
      <div className="bg-gray-900 border border-red-900/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-red-400">👥 Управление профилями</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-red-400 text-2xl transition font-bold"
            >
              ✕
            </button>
          </div>

          {/* Кнопка создания */}
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="w-full mb-6 px-4 py-3 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 rounded-xl text-white font-bold transition-all duration-300 transform hover:scale-105"
          >
            {showCreate ? '✕ Закрыть форму' : '+ Создать новый профиль'}
          </button>

          {/* Форма создания */}
          {showCreate && (
            <div className="mb-6 p-4 bg-black/40 border border-red-900/30 rounded-xl">
              <h3 className="text-sm font-bold text-gray-300 mb-3">Новый профиль:</h3>
              <form onSubmit={handleCreate} className="space-y-3">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Имя профиля"
                  className="w-full px-4 py-2 bg-black/60 border border-red-900/30 rounded-xl text-white text-sm focus:outline-none focus:border-red-700"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Пароль (мин. 4 символа)"
                  className="w-full px-4 py-2 bg-black/60 border border-red-900/30 rounded-xl text-white text-sm focus:outline-none focus:border-red-700"
                />
                
                {/* ГАЛОЧКА АДМИНИСТРАТОР */}
                <label className="flex items-center gap-3 p-3 bg-purple-900/20 border border-purple-900/30 rounded-xl cursor-pointer hover:bg-purple-900/30 transition">
                  <input
                    type="checkbox"
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)}
                    className="w-5 h-5 rounded border-purple-700 text-purple-600 focus:ring-purple-500 bg-black/60 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-bold text-purple-300">Администратор</span>
                    <p className="text-xs text-gray-400 mt-0.5">Полный доступ: создание/удаление профилей и аниме</p>
                  </div>
                </label>

                <div>
                  <label className="block text-xs text-gray-400 mb-2">Цвет аватара:</label>
                  <div className="flex gap-2 flex-wrap">
                    {avatarColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewColor(color)}
                        className={`w-10 h-10 rounded-full border-2 transition ${
                          newColor === color ? 'border-white scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                {error && (
                  <div className="p-2 bg-red-900/30 border border-red-900/50 rounded-lg text-red-400 text-xs">{error}</div>
                )}
                {success && (
                  <div className="p-2 bg-green-900/30 border border-green-900/50 rounded-lg text-green-400 text-xs">{success}</div>
                )}
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-green-700 hover:bg-green-600 rounded-xl text-white font-bold transition"
                >
                  Создать профиль
                </button>
              </form>
            </div>
          )}

          {/* Список профилей */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-300">Существующие профили:</h3>
            {profiles.map(profile => (
              <div key={profile.id} className="flex items-center justify-between p-4 bg-black/40 border border-red-900/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black text-white"
                    style={{ backgroundColor: profile.avatar_color }}
                  >
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-bold">{profile.name}</p>
                    {profile.is_admin && (
                      <span className="text-xs text-red-400 font-bold">👑 Администратор</span>
                    )}
                  </div>
                </div>
                {!profile.is_admin && (
                  <button
                    onClick={() => handleDelete(profile.id, profile.name)}
                    className="px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 border border-red-900/50 rounded-lg text-red-400 text-xs transition"
                  >
                    🗑️ Удалить
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}