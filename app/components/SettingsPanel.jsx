'use client';

import { useState, useEffect } from 'react';
import CoverSearch from './CoverSearch';
import ExcelImport from './ExcelImport';
import { 
  getAllCategories, 
  addCustomCategory, 
  deleteCustomCategory,
  isDefaultCategory
} from '../utils/categories';
import { supabase } from '../lib/supabase';

export default function SettingsPanel({ 
  onClose, 
  onImportComplete, 
  currentProfile, 
  onLogout, 
  activeCategory, 
  setActiveCategory, 
  animeLists, 
  setAnimeLists 
}) {
  const [showCoverSearch, setShowCoverSearch] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Фон
  const [bgStart, setBgStart] = useState(localStorage.getItem('gradientStart') || '#000000');
  const [bgEnd, setBgEnd] = useState(localStorage.getItem('gradientEnd') || '#1a0000');

  // Папки
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');

  // Теги
  const [tags, setTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#ef4444');

  // Профили
  const [allProfiles, setAllProfiles] = useState([]);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileColor, setNewProfileColor] = useState('#ef4444');
  const [profileMessage, setProfileMessage] = useState('');

  // Загрузка данных при открытии
  useEffect(() => {
    setCategories(getAllCategories());
    loadTags();
    loadAllProfiles();
  }, []);

  const loadTags = () => {
    try {
      const saved = localStorage.getItem('customTags');
      setTags(saved ? JSON.parse(saved) : []);
    } catch {
      setTags([]);
    }
  };

  const saveTags = (newTags) => {
    setTags(newTags);
    localStorage.setItem('customTags', JSON.stringify(newTags));
  };

  // Загрузка всех профилей из localStorage
  const loadAllProfiles = () => {
    try {
      const saved = localStorage.getItem('allProfiles');
      const profiles = saved ? JSON.parse(saved) : [];
      
      // Если текущего профиля нет в списке, добавляем его
      if (currentProfile && !profiles.find(p => p.id === currentProfile.id)) {
        profiles.push(currentProfile);
        localStorage.setItem('allProfiles', JSON.stringify(profiles));
      }
      
      setAllProfiles(profiles);
    } catch {
      setAllProfiles(currentProfile ? [currentProfile] : []);
    }
  };

  // ===== ФОН =====
  const handleBgChange = () => {
    localStorage.setItem('gradientStart', bgStart);
    localStorage.setItem('gradientEnd', bgEnd);
    document.body.style.background = `linear-gradient(135deg, ${bgStart} 0%, ${bgEnd} 100%)`;
    document.body.style.backgroundAttachment = 'fixed';
  };

  const handleResetBg = () => {
    localStorage.setItem('gradientStart', '#000000');
    localStorage.setItem('gradientEnd', '#1a0000');
    setBgStart('#000000');
    setBgEnd('#1a0000');
    document.body.style.background = 'linear-gradient(135deg, #000000 0%, #1a0000 100%)';
    document.body.style.backgroundAttachment = 'fixed';
  };

  // ===== ПАПКИ =====
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      alert('Введи название папки!');
      return;
    }
    const newCat = {
      id: `custom_${Date.now()}`,
      name: newCategoryName.trim(),
      icon: newCategoryIcon,
      isCustom: true
    };
    addCustomCategory(newCat);
    setCategories(getAllCategories());
    setNewCategoryName('');
    setNewCategoryIcon('📁');
  };

  const handleDeleteCategory = (catId) => {
    if (isDefaultCategory(catId)) {
      alert('Системные папки нельзя удалять!');
      return;
    }
    if (!confirm(`Удалить папку "${categories.find(c => c.id === catId)?.name}"?`)) return;
    
    const catAnime = animeLists[catId] || [];
    if (catAnime.length > 0) {
      catAnime.forEach(anime => {
        supabase.from('anime').update({ category_id: 'planned' }).eq('id', anime.id);
      });
      setAnimeLists(prev => {
        const newList = { ...prev };
        newList['planned'] = [...(newList['planned'] || []), ...catAnime.map(a => ({ ...a, category_id: 'planned' }))];
        delete newList[catId];
        return newList;
      });
    }
    
    deleteCustomCategory(catId);
    setCategories(getAllCategories());
    if (activeCategory === catId) setActiveCategory('watching');
  };

  // ===== ТЕГИ =====
  const handleAddTag = () => {
    if (!newTagName.trim()) {
      alert('Введи название тега!');
      return;
    }
    const newTag = {
      id: `tag_${Date.now()}`,
      name: newTagName.trim(),
      color: newTagColor
    };
    saveTags([...tags, newTag]);
    setNewTagName('');
    setNewTagColor('#ef4444');
  };

  const handleDeleteTag = (tagId) => {
    if (!confirm('Удалить этот тег?')) return;
    saveTags(tags.filter(t => t.id !== tagId));
    
    Object.keys(animeLists).forEach(catId => {
      const updated = (animeLists[catId] || []).map(anime => ({
        ...anime,
        custom_tags: (anime.custom_tags || []).filter(id => id !== tagId)
      }));
      updated.forEach(anime => {
        supabase.from('anime').update({ custom_tags: anime.custom_tags }).eq('id', anime.id);
      });
      setAnimeLists(prev => ({ ...prev, [catId]: updated }));
    });
  };

  // ===== ПРОФИЛИ =====
  const handleCreateProfile = () => {
    if (!newProfileName.trim()) {
      setProfileMessage('❌ Введи имя профиля!');
      return;
    }
    
    // Проверяем, нет ли уже такого профиля
    if (allProfiles.find(p => p.name.toLowerCase() === newProfileName.trim().toLowerCase())) {
      setProfileMessage('❌ Профиль с таким именем уже существует!');
      return;
    }

    const newProfile = {
      id: `profile_${Date.now()}`,
      name: newProfileName.trim(),
      avatar_color: newProfileColor,
      is_admin: false,
      created_at: new Date().toISOString()
    };

    const updated = [...allProfiles, newProfile];
    localStorage.setItem('allProfiles', JSON.stringify(updated));
    setAllProfiles(updated);
    setNewProfileName('');
    setNewProfileColor('#ef4444');
    setProfileMessage(`✅ Профиль "${newProfile.name}" создан!`);
  };

  const handleSwitchProfile = (profile) => {
    if (profile.id === currentProfile?.id) {
      alert('Вы уже используете этот профиль!');
      return;
    }
    if (confirm(`Переключиться на профиль "${profile.name}"?`)) {
      localStorage.setItem('currentProfile', JSON.stringify(profile));
      window.location.reload();
    }
  };

  const handleDeleteProfile = (profile) => {
    if (profile.id === currentProfile?.id) {
      alert('Нельзя удалить текущий профиль! Сначала переключитесь на другой.');
      return;
    }
    if (!confirm(`Удалить профиль "${profile.name}"? Все данные этого профиля будут потеряны.`)) return;
    
    const updated = allProfiles.filter(p => p.id !== profile.id);
    localStorage.setItem('allProfiles', JSON.stringify(updated));
    setAllProfiles(updated);
  };

  const handleToggleAdmin = (profile) => {
    if (profile.id === currentProfile?.id) {
      alert('Нельзя изменить права текущего профиля!');
      return;
    }
    
    const updated = allProfiles.map(p => 
      p.id === profile.id ? { ...p, is_admin: !p.is_admin } : p
    );
    localStorage.setItem('allProfiles', JSON.stringify(updated));
    setAllProfiles(updated);
  };

  const iconOptions = ['📁', '📂', '', '⭐', '', '💎', '🌟', '', '🎪', '', '🎵', '', '📚', '', '🌙', '☀️', '', '🌸', '', '🏆'];

  const tabs = [
    { id: 'profile', name: '👤 Профиль' },
    { id: 'accounts', name: '👥 Профили' },
    { id: 'appearance', name: '🎨 Фон' },
    { id: 'folders', name: '📁 Папки' },
    { id: 'tags', name: '🏷️ Теги' },
    { id: 'tools', name: '🛠️ Инструменты' },
  ];

  return (
    <>
      {/* ========================================== */}
      {/* ОСНОВНАЯ ПАНЕЛЬ НАСТРОЕК (z-[250])         */}
      {/* ========================================== */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[250] p-4">
        <div className="bg-gray-900 border border-red-900/50 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col">
          
          {/* Заголовок */}
          <div className="p-5 border-b border-red-900/30 flex items-center justify-between flex-shrink-0 bg-gray-900">
            <h2 className="text-2xl font-bold text-red-400">⚙️ Настройки</h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-red-400 text-2xl transition font-bold"
            >
              
            </button>
          </div>

          {/* Вкладки */}
          <div className="flex flex-wrap gap-1 p-3 border-b border-red-900/20 bg-black/30 flex-shrink-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-lg text-sm font-bold transition ${
                  activeTab === tab.id
                    ? 'bg-red-900/50 text-white border border-red-700/50'
                    : 'text-gray-400 hover:text-white hover:bg-red-900/20'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Содержимое */}
          <div className="p-6 overflow-y-auto flex-1">
            
            {/* ===== ПРОФИЛЬ ===== */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white mb-3">👤 Текущий профиль</h3>
                <div className="p-4 bg-black/40 border border-red-900/30 rounded-xl flex items-center gap-4">
                  <div 
                    className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black text-white flex-shrink-0" 
                    style={{ backgroundColor: currentProfile?.avatar_color || '#ef4444' }}
                  >
                    {currentProfile?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-bold text-lg truncate">{currentProfile?.name}</p>
                    <p className="text-gray-400 text-sm">ID: {currentProfile?.id}</p>
                    {currentProfile?.is_admin && (
                      <p className="text-xs text-red-400 font-medium mt-1">👑 Администратор</p>
                    )}
                  </div>
                </div>
                <button 
                  onClick={onLogout} 
                  className="w-full px-4 py-3 bg-red-900/50 hover:bg-red-900/80 border border-red-700/50 rounded-lg text-red-200 font-bold transition"
                >
                  🚪 Выйти (выбрать другой профиль)
                </button>
              </div>
            )}

            {/* ===== УПРАВЛЕНИЕ ПРОФИЛЯМИ ===== */}
            {activeTab === 'accounts' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white mb-3">👥 Управление профилями</h3>
                
                {/* Список всех профилей */}
                <div className="p-4 bg-black/40 border border-red-900/30 rounded-xl">
                  <p className="text-sm text-gray-400 font-bold mb-3">Все профили ({allProfiles.length}):</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {allProfiles.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-4">Нет профилей</p>
                    ) : (
                      allProfiles.map(profile => (
                        <div 
                          key={profile.id} 
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            profile.id === currentProfile?.id 
                              ? 'bg-green-900/20 border-green-700/50' 
                              : 'bg-black/40 border-red-900/30'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-black text-white flex-shrink-0" 
                              style={{ backgroundColor: profile.avatar_color || '#ef4444' }}
                            >
                              {profile.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-white font-medium truncate">{profile.name}</p>
                              <p className="text-gray-500 text-xs">ID: {profile.id}</p>
                            </div>
                            {profile.id === currentProfile?.id && (
                              <span className="px-2 py-1 bg-green-900/50 border border-green-700/50 rounded text-xs text-green-300 font-bold">
                                ✓ Активен
                              </span>
                            )}
                            {profile.is_admin && profile.id !== currentProfile?.id && (
                              <span className="px-2 py-1 bg-red-900/50 border border-red-700/50 rounded text-xs text-red-300 font-bold">
                                👑 Админ
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 ml-3">
                            {profile.id !== currentProfile?.id && (
                              <>
                                <button 
                                  onClick={() => handleSwitchProfile(profile)}
                                  className="px-3 py-1 bg-blue-900/50 hover:bg-blue-900/80 rounded text-blue-300 text-xs font-bold transition"
                                >
                                  Войти
                                </button>
                                {currentProfile?.is_admin && (
                                  <>
                                    <button 
                                      onClick={() => handleToggleAdmin(profile)}
                                      className={`px-3 py-1 rounded text-xs font-bold transition ${
                                        profile.is_admin 
                                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                                          : 'bg-yellow-900/50 hover:bg-yellow-900/80 text-yellow-300'
                                      }`}
                                    >
                                      {profile.is_admin ? 'Убрать админа' : 'Сделать админом'}
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteProfile(profile)}
                                      className="px-3 py-1 bg-red-900/50 hover:bg-red-900/80 rounded text-red-300 text-xs font-bold transition"
                                    >
                                      Удалить
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Создание нового профиля (только для админа) */}
                {currentProfile?.is_admin && (
                  <div className="p-4 bg-black/40 border border-red-900/30 rounded-xl space-y-3">
                    <p className="text-sm text-gray-400 font-bold"> Создать новый профиль (только для администратора):</p>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Имя профиля:</label>
                      <input 
                        type="text"
                        value={newProfileName}
                        onChange={(e) => setNewProfileName(e.target.value)}
                        placeholder="Например: Иван"
                        className="w-full px-3 py-2 bg-black/60 border border-red-900/30 rounded-lg text-white text-sm focus:outline-none focus:border-red-700"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Цвет аватара:</label>
                      <input 
                        type="color"
                        value={newProfileColor}
                        onChange={(e) => setNewProfileColor(e.target.value)}
                        className="w-full h-10 rounded-lg cursor-pointer bg-transparent border border-red-900/30"
                      />
                    </div>
                    
                    <button 
                      onClick={handleCreateProfile}
                      className="w-full px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-white font-bold transition"
                    >
                      ➕ Создать профиль
                    </button>
                    
                    {profileMessage && (
                      <div className={`p-3 rounded-lg text-sm ${
                        profileMessage.includes('✅') ? 'bg-green-900/30 border border-green-700/50 text-green-300' :
                        profileMessage.includes('') ? 'bg-red-900/30 border border-red-700/50 text-red-300' :
                        'bg-blue-900/30 border border-blue-700/50 text-blue-300'
                      }`}>
                        {profileMessage}
                      </div>
                    )}
                  </div>
                )}

                {!currentProfile?.is_admin && (
                  <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-xl">
                    <p className="text-sm text-yellow-300">
                      <strong>⚠️ Только администратор</strong> может создавать новые профили и управлять правами.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ===== ФОН ===== */}
            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white mb-3">🎨 Цвет фона</h3>
                <div className="p-4 bg-black/40 border border-red-900/30 rounded-xl space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Цвет начала градиента:</label>
                    <input 
                      type="color" 
                      value={bgStart} 
                      onChange={(e) => setBgStart(e.target.value)}
                      className="w-full h-12 rounded-lg cursor-pointer bg-transparent border border-red-900/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Цвет конца градиента:</label>
                    <input 
                      type="color" 
                      value={bgEnd} 
                      onChange={(e) => setBgEnd(e.target.value)}
                      className="w-full h-12 rounded-lg cursor-pointer bg-transparent border border-red-900/30"
                    />
                  </div>
                  <div 
                    className="h-20 rounded-lg border border-red-900/30"
                    style={{ background: `linear-gradient(135deg, ${bgStart} 0%, ${bgEnd} 100%)` }}
                  ></div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleBgChange}
                      className="flex-1 px-4 py-2 bg-purple-900/50 hover:bg-purple-900/80 border border-purple-700/50 rounded-lg text-purple-200 font-bold transition"
                    >
                      ✓ Применить
                    </button>
                    <button 
                      onClick={handleResetBg}
                      className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-bold transition"
                    >
                      ↺ Сбросить
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ===== ПАПКИ ===== */}
            {activeTab === 'folders' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white mb-3">📁 Управление папками</h3>
                
                <div className="p-4 bg-black/40 border border-red-900/30 rounded-xl space-y-3">
                  <p className="text-sm text-gray-400 font-bold">Добавить новую папку:</p>
                  <div className="flex gap-2">
                    <select 
                      value={newCategoryIcon}
                      onChange={(e) => setNewCategoryIcon(e.target.value)}
                      className="px-3 py-2 bg-black/60 border border-red-900/30 rounded-lg text-white text-sm focus:outline-none focus:border-red-700"
                    >
                      {iconOptions.map(icon => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                    <input 
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Название папки"
                      className="flex-1 px-3 py-2 bg-black/60 border border-red-900/30 rounded-lg text-white text-sm focus:outline-none focus:border-red-700"
                    />
                    <button 
                      onClick={handleAddCategory}
                      className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-white text-sm font-bold transition"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {categories.map(cat => (
                    <div 
                      key={cat.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        cat.id === activeCategory 
                          ? 'bg-red-900/30 border-red-700/50' 
                          : 'bg-black/40 border-red-900/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-xl">{cat.icon}</span>
                        <span className="text-white font-medium truncate">{cat.name}</span>
                        <span className="text-gray-500 text-sm">({(animeLists[cat.id] || []).length})</span>
                        {cat.isCustom && (
                          <span className="px-2 py-0.5 bg-blue-900/30 border border-blue-700/50 rounded text-xs text-blue-300">custom</span>
                        )}
                      </div>
                      {!isDefaultCategory(cat.id) && (
                        <button 
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="ml-2 px-3 py-1 bg-red-900/50 hover:bg-red-900/80 rounded text-red-300 text-xs font-bold transition"
                        >
                          Удалить
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== ТЕГИ ===== */}
            {activeTab === 'tags' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white mb-3">🏷️ Управление тегами</h3>
                
                <div className="p-4 bg-black/40 border border-red-900/30 rounded-xl space-y-3">
                  <p className="text-sm text-gray-400 font-bold">Добавить новый тег:</p>
                  <div className="flex gap-2">
                    <input 
                      type="color"
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border border-red-900/30"
                    />
                    <input 
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Название тега"
                      className="flex-1 px-3 py-2 bg-black/60 border border-red-900/30 rounded-lg text-white text-sm focus:outline-none focus:border-red-700"
                    />
                    <button 
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-white text-sm font-bold transition"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {tags.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">Нет пользовательских тегов</p>
                  ) : (
                    tags.map(tag => (
                      <div 
                        key={tag.id} 
                        className="flex items-center justify-between p-3 bg-black/40 border border-red-900/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }}></div>
                          <span className="text-white font-medium">{tag.name}</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteTag(tag.id)}
                          className="px-3 py-1 bg-red-900/50 hover:bg-red-900/80 rounded text-red-300 text-xs font-bold transition"
                        >
                          Удалить
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ===== ИНСТРУМЕНТЫ ===== */}
            {activeTab === 'tools' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white mb-3">🛠️ Инструменты</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button 
                    onClick={() => setShowImport(true)}
                    className="px-4 py-4 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-700/50 rounded-lg text-blue-200 font-bold transition text-left flex items-center gap-3"
                  >
                    <span className="text-2xl">📊</span>
                    <div>
                      <p className="font-bold">Импорт из Excel/CSV</p>
                      <p className="text-xs text-blue-300/70">Массовое добавление аниме</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => setShowCoverSearch(true)}
                    className="px-4 py-4 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-700/50 rounded-lg text-purple-200 font-bold transition text-left flex items-center gap-3"
                  >
                    <span className="text-2xl">️</span>
                    <div>
                      <p className="font-bold">Найти обложки</p>
                      <p className="text-xs text-purple-300/70">Автоматический поиск постеров</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* ПОДПАНЕЛИ (z-[300])                        */}
      {/* ========================================== */}
      
      {showImport && (
        <div className="fixed inset-0 z-[300]">
          <ExcelImport 
            onClose={() => setShowImport(false)} 
            onImportComplete={() => {
              setShowImport(false);
              if (onImportComplete) onImportComplete();
            }}
            currentProfile={currentProfile}
            activeCategory={activeCategory}
            animeLists={animeLists}
            setAnimeLists={setAnimeLists}
          />
        </div>
      )}

      {showCoverSearch && (
        <div className="fixed inset-0 z-[300]">
          <CoverSearch 
            onClose={() => setShowCoverSearch(false)} 
            animeList={Object.values(animeLists).flat()}
            onUpdateAnime={(animeId, updatedData) => {
              setAnimeLists(prev => {
                const newList = { ...prev };
                for (const cat in newList) {
                  const index = (newList[cat] || []).findIndex(a => a.id === animeId);
                  if (index !== -1) {
                    newList[cat][index] = { ...newList[cat][index], ...updatedData };
                    break;
                  }
                }
                return newList;
              });
            }}
          />
        </div>
      )}
    </>
  );
}