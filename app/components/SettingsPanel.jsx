'use client';

import { useState, useEffect } from 'react';
import ExcelImport from './ExcelImport';
import CategoryManager from './CategoryManager';
import TagManager from './TagManager';
import AdminPanel from './AdminPanel';
import CoverSearch from './CoverSearch';

export default function SettingsPanel({ onClose, onImportComplete, currentProfile, onLogout, activeCategory, setActiveCategory, animeLists, setAnimeLists }) {
  const [gradientStart, setGradientStart] = useState('#000000');
  const [gradientEnd, setGradientEnd] = useState('#d90d65');
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showCoverSearch, setShowCoverSearch] = useState(false);
  const [activeTab, setActiveTab] = useState('appearance');

  useEffect(() => {
    const savedStart = localStorage.getItem('gradientStart');
    const savedEnd = localStorage.getItem('gradientEnd');
    if (savedStart) setGradientStart(savedStart);
    if (savedEnd) setGradientEnd(savedEnd);
  }, []);

  const handleColorChange = (type, value) => {
    if (type === 'start') {
      setGradientStart(value);
      localStorage.setItem('gradientStart', value);
    } else {
      setGradientEnd(value);
      localStorage.setItem('gradientEnd', value);
    }
    const start = type === 'start' ? value : gradientStart;
    const end = type === 'end' ? value : gradientEnd;
    document.body.style.background = `linear-gradient(135deg, ${start} 0%, ${end} 100%)`;
    document.body.style.backgroundAttachment = 'fixed';
  };

  const handleReset = () => {
    setGradientStart('#000000');
    setGradientEnd('#d90d65');
    localStorage.removeItem('gradientStart');
    localStorage.removeItem('gradientEnd');
    document.body.style.background = 'linear-gradient(135deg, #000000 0%, #d90d65 100%)';
    document.body.style.backgroundAttachment = 'fixed';
  };

  const handleLogout = () => {
    if (confirm('Выйти из профиля?')) {
      localStorage.removeItem('currentProfile');
      if (onLogout) onLogout();
    }
  };

  const handleUpdateAnime = (animeId, updates) => {
    setAnimeLists(prev => {
      const newList = { ...prev };
      for (const cat in newList) {
        const index = (newList[cat] || []).findIndex(a => a.id === animeId);
        if (index !== -1) {
          newList[cat][index] = { ...newList[cat][index], ...updates };
          break;
        }
      }
      return newList;
    });
  };

  return (
    <>
      {/* Затемнение фона */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[290]" onClick={onClose}></div>
      
      {/* Центрированное меню настроек */}
      <div className="fixed inset-0 flex items-center justify-center z-[300] p-4">
        <div className="bg-gray-900/95 backdrop-blur-md border border-red-900/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-red-400">⚙️ Настройки</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-red-400 text-3xl transition font-bold">✕</button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <button onClick={() => setActiveTab('appearance')} className={`px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === 'appearance' ? 'bg-red-900/50 text-white border border-red-700' : 'bg-black/40 text-gray-400 border border-red-900/30 hover:border-red-700'}`}>🎨 Внешний вид</button>
              <button onClick={() => setActiveTab('import')} className={`px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === 'import' ? 'bg-red-900/50 text-white border border-red-700' : 'bg-black/40 text-gray-400 border border-red-900/30 hover:border-red-700'}`}>📊 Импорт</button>
              <button onClick={() => setActiveTab('categories')} className={`px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === 'categories' ? 'bg-red-900/50 text-white border border-red-700' : 'bg-black/40 text-gray-400 border border-red-900/30 hover:border-red-700'}`}>📁 Папки</button>
              <button onClick={() => setActiveTab('tags')} className={`px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === 'tags' ? 'bg-red-900/50 text-white border border-red-700' : 'bg-black/40 text-gray-400 border border-red-900/30 hover:border-red-700'}`}> Теги</button>
              <button onClick={() => setActiveTab('covers')} className={`px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === 'covers' ? 'bg-red-900/50 text-white border border-red-700' : 'bg-black/40 text-gray-400 border border-red-900/30 hover:border-red-700'}`}>️ Обложки</button>
              {currentProfile?.is_admin && (
                <button onClick={() => setActiveTab('profiles')} className={`px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === 'profiles' ? 'bg-purple-900/50 text-purple-300 border border-purple-700' : 'bg-black/40 text-gray-400 border border-purple-900/30 hover:border-purple-700'}`}>👥 Профили</button>
              )}
            </div>

            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <div className="p-5 bg-black/40 border border-red-900/30 rounded-xl">
                  <h3 className="text-lg font-bold text-gray-300 mb-4">🎨 Цвета градиента фона</h3>
                  <div className="mb-4">
                    <label className="block text-sm text-gray-400 mb-2">Начальный цвет (верх-лево)</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={gradientStart} onChange={(e) => handleColorChange('start', e.target.value)} className="w-14 h-12 rounded-lg cursor-pointer border border-red-900/50 bg-transparent" />
                      <input type="text" value={gradientStart} onChange={(e) => handleColorChange('start', e.target.value)} className="flex-1 px-4 py-3 bg-black/60 border border-red-900/30 rounded-lg text-white text-base font-mono focus:outline-none focus:border-red-700" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Конечный цвет (низ-право)</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={gradientEnd} onChange={(e) => handleColorChange('end', e.target.value)} className="w-14 h-12 rounded-lg cursor-pointer border border-red-900/50 bg-transparent" />
                      <input type="text" value={gradientEnd} onChange={(e) => handleColorChange('end', e.target.value)} className="flex-1 px-4 py-3 bg-black/60 border border-red-900/30 rounded-lg text-white text-base font-mono focus:outline-none focus:border-red-700" />
                    </div>
                  </div>
                  <div className="mt-4 h-12 rounded-lg border border-red-900/30" style={{ background: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)` }}></div>
                </div>
                <button onClick={handleReset} className="w-full px-4 py-3 bg-red-900/30 hover:bg-red-900/50 border border-red-900/50 rounded-xl text-red-400 text-base transition-all duration-300 font-medium">🔄 Сбросить к стандартным цветам</button>
                <button onClick={handleLogout} className="w-full px-4 py-4 bg-red-900/20 hover:bg-red-900/40 border border-red-900/40 rounded-xl text-red-400 text-base transition-all duration-300 flex items-center justify-center gap-2 font-bold">🚪 Выйти из профиля</button>
              </div>
            )}

            {activeTab === 'import' && (
              <div className="space-y-4">
                <div className="p-5 bg-black/40 border border-red-900/30 rounded-xl">
                  <h3 className="text-lg font-bold text-gray-300 mb-3">📊 Импорт аниме</h3>
                  <p className="text-sm text-gray-400 mb-4">Загрузи Excel/CSV файл или вставь текстовый список аниме.</p>
                  <button onClick={() => setShowExcelImport(true)} className="w-full px-4 py-4 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 rounded-xl text-white text-base font-bold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-900/50">🚀 Открыть импорт</button>
                </div>
              </div>
            )}

            {activeTab === 'categories' && (
              <div className="space-y-4">
                <div className="p-5 bg-black/40 border border-red-900/30 rounded-xl">
                  <h3 className="text-lg font-bold text-gray-300 mb-3">📁 Управление папками</h3>
                  <p className="text-sm text-gray-400 mb-4">Создавай, переименовывай и удаляй папки для аниме.</p>
                  <button onClick={() => setShowCategoryManager(true)} className="w-full px-4 py-4 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 rounded-xl text-white text-base font-bold transition-all duration-300">📁 Открыть управление папками</button>
                </div>
              </div>
            )}

            {activeTab === 'tags' && (
              <div className="space-y-4">
                <div className="p-5 bg-black/40 border border-red-900/30 rounded-xl">
                  <h3 className="text-lg font-bold text-gray-300 mb-3">🎨 Управление тегами</h3>
                  <p className="text-sm text-gray-400 mb-4">Создавай и удаляй цветные теги для аниме.</p>
                  <button onClick={() => setShowTagManager(true)} className="w-full px-4 py-4 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 rounded-xl text-white text-base font-bold transition-all duration-300">🎨 Открыть управление тегами</button>
                </div>
              </div>
            )}

            {activeTab === 'covers' && (
              <div className="space-y-4">
                <div className="p-5 bg-black/40 border border-red-900/30 rounded-xl">
                  <h3 className="text-lg font-bold text-gray-300 mb-3">🖼️ Поиск обложек</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Автоматически найти и подгрузить обложки для всех аниме без изображений в текущей категории.
                  </p>
                  <button 
                    onClick={() => setShowCoverSearch(true)} 
                    className="w-full px-4 py-4 bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 rounded-xl text-white text-base font-bold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-900/50"
                  >
                    🔍 Найти обложки
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'profiles' && currentProfile?.is_admin && (
              <div className="space-y-4">
                <div className="p-5 bg-black/40 border border-purple-900/30 rounded-xl">
                  <h3 className="text-lg font-bold text-purple-300 mb-3">👥 Управление профилями</h3>
                  <p className="text-sm text-gray-400 mb-4">Создавай и удаляй профили пользователей.</p>
                  <button onClick={() => setShowAdminPanel(true)} className="w-full px-4 py-4 bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 rounded-xl text-white text-base font-bold transition-all duration-300">👥 Открыть управление профилями</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showExcelImport && <ExcelImport onClose={() => setShowExcelImport(false)} onImportComplete={() => { setShowExcelImport(false); if (onImportComplete) onImportComplete(); }} />}
      {showCategoryManager && <CategoryManager onClose={() => setShowCategoryManager(false)} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />}
      {showTagManager && <TagManager onClose={() => setShowTagManager(false)} />}
      {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
      {showCoverSearch && <CoverSearch onClose={() => setShowCoverSearch(false)} animeList={animeLists[activeCategory] || []} onUpdateAnime={handleUpdateAnime} />}
    </>
  );
}