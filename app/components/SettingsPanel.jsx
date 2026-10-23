'use client';

import { useState } from 'react';
import CoverSearch from './CoverSearch';
import ExcelImport from './ExcelImport';

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

  // Собираем все аниме из всех категорий для поиска обложек
  const allAnime = Object.values(animeLists).flat();

  return (
    <>
      {/* ========================================== */}
      {/* ОСНОВНАЯ ПАНЕЛЬ НАСТРОЕК (z-[250])         */}
      {/* ========================================== */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[250] p-4">
        <div className="bg-gray-900 border border-red-900/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
          
          {/* Заголовок */}
          <div className="p-6 border-b border-red-900/30 flex items-center justify-between sticky top-0 bg-gray-900 z-10">
            <h2 className="text-2xl font-bold text-red-400">⚙️ Настройки</h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-red-400 text-2xl transition font-bold"
            >
              ✕
            </button>
          </div>

          {/* Содержимое */}
          <div className="p-6 space-y-6">
            
            {/* Секция: Профиль */}
            <div className="p-4 bg-black/40 border border-red-900/30 rounded-xl">
              <h3 className="text-lg font-bold text-white mb-3">👤 Профиль</h3>
              <div className="flex items-center gap-4 mb-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black text-white flex-shrink-0" 
                  style={{ backgroundColor: currentProfile?.avatar_color || '#ef4444' }}
                >
                  {currentProfile?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold truncate">{currentProfile?.name}</p>
                  <p className="text-gray-400 text-sm">ID: {currentProfile?.id}</p>
                  {currentProfile?.is_admin && (
                    <p className="text-xs text-red-400 font-medium">Администратор</p>
                  )}
                </div>
              </div>
              <button 
                onClick={onLogout} 
                className="w-full px-4 py-2 bg-red-900/50 hover:bg-red-900/80 border border-red-700/50 rounded-lg text-red-200 font-bold transition"
              >
                🚪 Выйти из аккаунта
              </button>
            </div>

            {/* Секция: Инструменты */}
            <div className="p-4 bg-black/40 border border-red-900/30 rounded-xl">
              <h3 className="text-lg font-bold text-white mb-3">🛠️ Инструменты</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowImport(true)}
                  className="px-4 py-3 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-700/50 rounded-lg text-blue-200 font-bold transition text-left flex items-center gap-2"
                >
                  📊 Импорт из Excel/CSV
                </button>
                <button 
                  onClick={() => setShowCoverSearch(true)}
                  className="px-4 py-3 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-700/50 rounded-lg text-purple-200 font-bold transition text-left flex items-center gap-2"
                >
                  🖼️ Найти обложки
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* ПОДПАНЕЛИ (z-[300]) - РЕНДЕРЯТСЯ ВНЕ ОСНОВНОЙ ПАНЕЛИ */}
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
            animeList={allAnime}
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