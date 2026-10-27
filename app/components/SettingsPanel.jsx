'use client';

import { useState, useEffect } from 'react';
import CoverSearch from './CoverSearch';
import ExcelImport from './ExcelImport';
import { 
  getAllCategories, 
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
  
  const [bgStart, setBgStart] = useState(localStorage.getItem('gradientStart') || '#000000');
  const [bgEnd, setBgEnd] = useState(localStorage.getItem('gradientEnd') || '#1a0000');

  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📁');

  const [tags, setTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#ef4444');

  const [allProfiles, setAllProfiles] = useState([]);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileColor, setNewProfileColor] = useState('#ef4444');
  const [newProfilePassword, setNewProfilePassword] = useState('');
  const [profileMessage, setProfileMessage] = useState('');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedProfileForLogin, setSelectedProfileForLogin] = useState(null);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const isAdmin = currentProfile?.is_admin === true;

  useEffect(() => {
    setCategories(getAllCategories());
    loadTags();
    loadAllProfiles();
    loadCustomCategories();
  }, [currentProfile]);

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

  const loadAllProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Ошибка загрузки профилей:', error);
        setAllProfiles([]);
      } else {
        const profiles = (data || []).map(p => ({
          ...p,
          is_admin: p.is_admin === true
        }));
        setAllProfiles(profiles);
      }
    } catch (e) {
      console.error('Критическая ошибка:', e);
      setAllProfiles([]);
    }
  };

  const loadCustomCategories = async () => {
    if (!currentProfile?.id) return;
    
    console.log('Загрузка папок для профиля:', currentProfile.id);
    
    const { data, error } = await supabase
      .from('custom_categories')
      .select('*')
      .eq('profile_id', currentProfile.id)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Ошибка загрузки папок:', error);
      return;
    }

    const systemCats = getAllCategories();
    
    if (data && data.length > 0) {
      const customCats = data.map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon || '',
        isCustom: true
      }));
      setCategories([...systemCats, ...customCats]);
      console.log('Папки загружены:', customCats.length);
    } else {
      setCategories(systemCats);
    }
  };

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

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Введи название папки!');
      return;
    }
    
    const newCat = {
      profile_id: currentProfile.id,
      name: newCategoryName.trim(),
      icon: newCategoryIcon || '📁',
      sort_order: categories.length,
      created_at: new Date().toISOString()
    };

    console.log('Создание папки:', newCat);

    const { data, error } = await supabase
      .from('custom_categories')
      .insert(newCat)
      .select()
      .single();

    if (error) {
      console.error('Ошибка создания папки:', error);
      alert(`Ошибка: ${error.message}`);
      return;
    }

    const updatedCategories = [
      ...categories,
      { id: data.id, name: data.name, icon: data.icon, isCustom: true }
    ];
    setCategories(updatedCategories);
    setNewCategoryName('');
    setNewCategoryIcon('');
    alert(`✅ Папка "${data.name}" создана!`);
  };

  const handleDeleteCategory = async (catId) => {
    if (isDefaultCategory(catId)) {
      alert('Системные папки нельзя удалять!');
      return;
    }
    if (!confirm(`Удалить папку "${categories.find(c => c.id === catId)?.name}"?`)) return;
    
    const { error } = await supabase
      .from('custom_categories')
      .delete()
      .eq('id', catId);

    if (error) {
      alert(`Ошибка удаления: ${error.message}`);
      return;
    }

    const catAnime = animeLists[catId] || [];
    if (catAnime.length > 0) {
      for (const anime of catAnime) {
        await supabase.from('anime').update({ category_id: 'planned' }).eq('id', anime.id);
      }
      setAnimeLists(prev => {
        const newList = { ...prev };
        newList['planned'] = [...(newList['planned'] || []), ...catAnime.map(a => ({ ...a, category_id: 'planned' }))];
        delete newList[catId];
        return newList;
      });
    }
    
    const updatedCategories = categories.filter(c => c.id !== catId);
    setCategories(updatedCategories);
    if (activeCategory === catId) setActiveCategory('watching');
  };

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

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      setProfileMessage('❌ Введи имя профиля!');
      return;
    }
    if (!newProfilePassword.trim() || newProfilePassword.length < 4) {
      setProfileMessage('❌ Пароль должен быть минимум 4 символа!');
      return;
    }
    if (allProfiles.find(p => p.name.toLowerCase() === newProfileName.trim().toLowerCase())) {
      setProfileMessage('❌ Профиль с таким именем уже существует!');
      return;
    }

    const newId = crypto.randomUUID();

    const newProfile = {
      id: newId,
      name: newProfileName.trim(),
      avatar_color: newProfileColor,
      password: newProfilePassword,
      is_admin: false,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .single();

    if (error) {
      console.error('Ошибка создания профиля:', error);
      setProfileMessage(`❌ Ошибка: ${error.message}`);
    } else {
      await loadAllProfiles();
      setNewProfileName('');
      setNewProfilePassword('');
      setNewProfileColor('#ef4444');
      setProfileMessage(`✅ Профиль "${data.name}" создан!`);
    }
  };

  const handleAdminLogin = (profile) => {
    if (!isAdmin) {
      alert('Только администратор может входить без пароля!');
      return;
    }
    if (profile.id === currentProfile?.id) {
      alert('Вы уже в этом профиле!');
      return;
    }
    if (confirm(`Войти в профиль "${profile.name}" без пароля?`)) {
      localStorage.setItem('currentProfile', JSON.stringify(profile));
      window.location.reload();
    }
  };

  const handleRequestLogin = (profile) => {
    if (profile.id === currentProfile?.id) {
      alert('Вы уже используете этот профиль!');
      return;
    }
    setSelectedProfileForLogin(profile);
    setLoginPassword('');
    setLoginError('');
    setShowPasswordModal(true);
  };

  const handleConfirmLogin = () => {
    if (!selectedProfileForLogin) return;

    if (loginPassword === selectedProfileForLogin.password) {
      localStorage.setItem('currentProfile', JSON.stringify(selectedProfileForLogin));
      setShowPasswordModal(false);
      setSelectedProfileForLogin(null);
      setLoginPassword('');
      setLoginError('');
      window.location.reload();
    } else {
      setLoginError('❌ Неверный пароль!');
    }
  };

  const handleDeleteProfile = async (profile) => {
    if (!isAdmin) {
      alert('Только администратор может удалять профили!');
      return;
    }
    if (profile.id === currentProfile?.id) {
      alert('Нельзя удалить текущий профиль! Сначала переключитесь на другой.');
      return;
    }
    if (!confirm(`Удалить профиль "${profile.name}"? Все данные этого профиля будут потеряны.`)) return;
    
    const { error } = await supabase.from('profiles').delete().eq('id', profile.id);
    if (error) {
      alert(`Ошибка удаления: ${error.message}`);
      return;
    }
    
    await loadAllProfiles();
  };

  const handleToggleAdmin = async (profile) => {
    if (!isAdmin) {
      alert('Только администратор может изменять права!');
      return;
    }
    if (profile.id === currentProfile?.id) {
      alert('Нельзя изменить права текущего профиля!');
      return;
    }
    
    const newAdminStatus = !profile.is_admin;
    
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: newAdminStatus })
      .eq('id', profile.id);
    
    if (error) {
      alert(`Ошибка: ${error.message}`);
      return;
    }
    
    await loadAllProfiles();
    alert(`✅ ${profile.name} теперь ${newAdminStatus ? 'администратор' : 'обычный пользователь'}`);
  };

  const handleChangePassword = async (profile) => {
    if (!isAdmin) {
      alert('Только администратор может менять пароли!');
      return;
    }
    const newPassword = prompt(`Введи новый пароль для профиля "${profile.name}":`);
    if (!newPassword) return;
    
    if (newPassword.length < 4) {
      alert('Пароль должен быть минимум 4 символа!');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ password: newPassword })
      .eq('id', profile.id);
    
    if (error) {
      alert(`Ошибка: ${error.message}`);
      return;
    }

    await loadAllProfiles();
    alert(`✅ Пароль для профиля "${profile.name}" изменён!`);
  };

  const iconOptions = ['📁', '📂', '', '⭐', '🔥', '', '🌟', '🎭', '🎪', '🎨', '', '🎮', '⚡', '🌙', '☀️', '🌊', '🌸', '', '🚀', '💫'];

  const tabs = [
    { id: 'profile', name: '👤 Профиль' },
    { id: 'accounts', name: ' Профили' },
    { id: 'appearance', name: '🎨 Фон' },
    { id: 'folders', name: ' Папки' },
    { id: 'tags', name: '🏷️ Теги' },
    { id: 'tools', name: '️ Инструменты' },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[250] p-4">
        <div className="bg-gray-900 border border-red-900/50 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col">
          
          <div className="p-5 border-b border-red-900/30 flex items-center justify-between flex-shrink-0 bg-gray-900">
            <h2 className="text-2xl font-bold text-red-400">⚙️ Настройки</h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-red-400 text-2xl transition font-bold"
            >
              ✕
            </button>
          </div>

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

          <div className="p-6 overflow-y-auto flex-1">
            
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
                    {isAdmin && (
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

            {activeTab === 'accounts' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white mb-3">👥 Управление профилями</h3>
                
                <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg mb-4">
                  <p className="text-xs text-blue-300">
                    Текущий: {currentProfile?.name} | is_admin: {String(isAdmin)} | Всего: {allProfiles.length}
                  </p>
                </div>

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
                          <div className="flex gap-1 ml-3 flex-wrap">
                            {profile.id !== currentProfile?.id && (
                              <>
                                {isAdmin && (
                                  <button 
                                    onClick={() => handleAdminLogin(profile)}
                                    className="px-2 py-1 bg-green-900/50 hover:bg-green-900/80 rounded text-green-300 text-xs font-bold transition"
                                    title="Войти без пароля (только админ)"
                                  >
                                    🔓 Войти
                                  </button>
                                )}
                                
                                {!isAdmin && (
                                  <button 
                                    onClick={() => handleRequestLogin(profile)}
                                    className="px-2 py-1 bg-blue-900/50 hover:bg-blue-900/80 rounded text-blue-300 text-xs font-bold transition"
                                  >
                                    🔑 Войти
                                  </button>
                                )}
                                
                                {isAdmin && (
                                  <>
                                    <button 
                                      onClick={() => handleChangePassword(profile)}
                                      className="px-2 py-1 bg-purple-900/50 hover:bg-purple-900/80 rounded text-purple-300 text-xs font-bold transition"
                                      title="Сменить пароль"
                                    >
                                      🔒
                                    </button>
                                    <button 
                                      onClick={() => handleToggleAdmin(profile)}
                                      className={`px-2 py-1 rounded text-xs font-bold transition ${
                                        profile.is_admin 
                                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                                          : 'bg-yellow-900/50 hover:bg-yellow-900/80 text-yellow-300'
                                      }`}
                                      title={profile.is_admin ? 'Убрать права админа' : 'Сделать админом'}
                                    >
                                      {profile.is_admin ? '-' : '👑+'}
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteProfile(profile)}
                                      className="px-2 py-1 bg-red-900/50 hover:bg-red-900/80 rounded text-red-300 text-xs font-bold transition"
                                      title="Удалить профиль"
                                    >
                                      🗑️
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

                {isAdmin && (
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
                      <label className="block text-sm text-gray-400 mb-1">Пароль (мин. 4 символа):</label>
                      <input 
                        type="password"
                        value={newProfilePassword}
                        onChange={(e) => setNewProfilePassword(e.target.value)}
                        placeholder="••••••"
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
                        profileMessage.includes('❌') ? 'bg-red-900/30 border border-red-700/50 text-red-300' :
                        'bg-blue-900/30 border border-blue-700/50 text-blue-300'
                      }`}>
                        {profileMessage}
                      </div>
                    )}
                  </div>
                )}

                {!isAdmin && (
                  <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-xl">
                    <p className="text-sm text-yellow-300">
                      <strong>️ Только администратор</strong> может создавать новые профили и управлять правами.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white mb-3"> Цвет фона</h3>
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

            {activeTab === 'folders' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white mb-3">📁 Управление папками</h3>
                
                <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg mb-4">
                  <p className="text-xs text-blue-300">
                    Профиль: {currentProfile?.name} | Папок: {categories.filter(c => c.isCustom).length}
                  </p>
                </div>

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
                    <span className="text-2xl">🖼️</span>
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

      {showPasswordModal && selectedProfileForLogin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[310] p-4">
          <div className="bg-gray-900 border-2 border-blue-700/50 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-blue-400">🔑 Вход в профиль</h3>
                <button 
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedProfileForLogin(null);
                    setLoginPassword('');
                    setLoginError('');
                  }}
                  className="text-gray-400 hover:text-red-400 text-2xl transition font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6 p-4 bg-black/40 border border-red-900/30 rounded-xl">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black text-white flex-shrink-0" 
                  style={{ backgroundColor: selectedProfileForLogin.avatar_color || '#ef4444' }}
                >
                  {selectedProfileForLogin.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-white font-bold text-lg">{selectedProfileForLogin.name}</p>
                  {selectedProfileForLogin.is_admin && (
                    <p className="text-xs text-red-400">👑 Администратор</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Введи пароль:</label>
                  <input 
                    type="password"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      setLoginError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirmLogin();
                    }}
                    placeholder="••••••"
                    className="w-full px-4 py-3 bg-black/60 border-2 border-red-900/30 rounded-lg text-white text-base focus:outline-none focus:border-blue-700 placeholder-gray-500"
                    autoFocus
                  />
                </div>

                {loginError && (
                  <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-sm">
                    {loginError}
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
                      setSelectedProfileForLogin(null);
                      setLoginPassword('');
                      setLoginError('');
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