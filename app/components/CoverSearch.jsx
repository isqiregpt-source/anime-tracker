'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function CoverSearch({ onClose, animeList, onUpdateAnime }) {
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, skipped: 0 });
  const [currentAnime, setCurrentAnime] = useState('');
  const [logs, setLogs] = useState([]);
  const [searchDone, setSearchDone] = useState(false);

  const defaultNoCoverImage = 'https://images.meme-arsenal.com/31f2e18074a78fed6adf2284b5ff3e71.jpg';

  const animeWithNoCover = animeList.filter(anime => {
    const tags = anime.custom_tags || [];
    return tags.includes('no-cover') || 
           !anime.image_url || 
           anime.image_url === defaultNoCoverImage ||
           anime.image_url.includes('placeholder');
  });

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev.slice(-50), { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const searchCover = async (animeTitle) => {
    try {
      const response = await fetch(`/api/cover-search?q=${encodeURIComponent(animeTitle)}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      if (data.url) {
        console.log(`✅ Найдено для "${animeTitle}": ${data.title} (${data.source})`);
      }
      return { url: data.url, source: data.source };
    } catch (error) {
      console.error('Ошибка поиска:', error);
      return null;
    }
  };

  const handleStartSearch = async () => {
    if (animeWithNoCover.length === 0) {
      alert('Нет аниме без обложки!');
      return;
    }

    if (!confirm(`Найти обложки для ${animeWithNoCover.length} аниме?`)) {
      return;
    }

    setIsSearching(true);
    setProgress({ current: 0, total: animeWithNoCover.length, success: 0, skipped: 0 });
    setLogs([]);
    setSearchDone(false);

    let successCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < animeWithNoCover.length; i++) {
      const anime = animeWithNoCover[i];
      setCurrentAnime(anime.title);
      addLog(`🔍 ${anime.title}`);

      try {
        const coverResult = await searchCover(anime.title);

        if (coverResult?.url && coverResult.url !== defaultNoCoverImage) {
          const newTags = (anime.custom_tags || []).filter(tag => tag !== 'no-cover');
          
          const { error } = await supabase
            .from('anime')
            .update({ 
              image_url: coverResult.url,
              custom_tags: newTags
            })
            .eq('id', anime.id);

          if (!error) {
            successCount++;
            addLog(`✅ ${anime.title}: Найдена! (${coverResult.source})`, 'success');
            
            if (onUpdateAnime) {
              onUpdateAnime(anime.id, { 
                image_url: coverResult.url,
                custom_tags: newTags
              });
            }
          } else {
            skippedCount++;
            addLog(`⚠️ ${anime.title}: Ошибка БД`, 'warning');
          }
        } else {
          skippedCount++;
          addLog(`⚠️ ${anime.title}: Не найдена`, 'warning');
        }
      } catch (error) {
        skippedCount++;
        addLog(`❌ ${anime.title}: Ошибка`, 'error');
      }

      setProgress({ 
        current: i + 1, 
        total: animeWithNoCover.length, 
        success: successCount, 
        skipped: skippedCount
      });

      // Небольшая задержка, чтобы не спамить API
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    setIsSearching(false);
    setSearchDone(true);
    addLog(`✨ Готово! Найдено: ${successCount} из ${animeWithNoCover.length}`, 'success');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[260] p-4">
      <div className="bg-gray-900 border border-red-900/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-red-400">🖼️ Поиск обложек</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-red-400 text-2xl transition font-bold" disabled={isSearching}>✕</button>
          </div>

          <div className="mb-6 p-4 bg-blue-900/20 border border-blue-900/50 rounded-xl">
            <p className="text-sm text-blue-300 mb-2">
              <strong>Аниме без обложки:</strong> {animeWithNoCover.length}
            </p>
            <p className="text-xs text-gray-400">
              Поиск через Aniliberty (знает русские названия) и Shikimori.
            </p>
          </div>

          {animeWithNoCover.length > 0 && !isSearching && !searchDone && (
            <div className="mb-6 max-h-40 overflow-y-auto p-3 bg-black/40 border border-red-900/30 rounded-xl">
              <p className="text-xs text-gray-400 mb-2 font-bold">Список:</p>
              {animeWithNoCover.slice(0, 15).map((anime, i) => (
                <p key={i} className="text-xs text-gray-300 py-1">• {anime.title}</p>
              ))}
              {animeWithNoCover.length > 15 && (
                <p className="text-xs text-gray-500 mt-2">...и ещё {animeWithNoCover.length - 15}</p>
              )}
            </div>
          )}

          {isSearching && (
            <div className="mb-6 p-4 bg-black/40 border border-red-900/30 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-red-400">⏳ Поиск...</p>
                <p className="text-sm text-gray-400">{progress.current} / {progress.total}</p>
              </div>
              
              <p className="text-xs text-gray-300 mb-3 truncate">
                🔍 <span className="text-white font-medium">{currentAnime}</span>
              </p>

              <div className="w-full bg-gray-800 rounded-full h-3 mb-3">
                <div 
                  className="bg-gradient-to-r from-red-600 to-red-400 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                ></div>
              </div>

              <div className="flex gap-4 text-xs">
                <span className="text-green-400">✅ {progress.success}</span>
                <span className="text-yellow-400">⚠️ {progress.skipped}</span>
              </div>
            </div>
          )}

          {logs.length > 0 && (
            <div className="mb-6 p-4 bg-black/60 border border-red-900/30 rounded-xl max-h-64 overflow-y-auto">
              <p className="text-xs text-gray-400 mb-2 font-bold">📋 Лог:</p>
              <div className="space-y-1">
                {logs.map((log, i) => (
                  <div key={i} className={`text-xs py-1 ${
                    log.type === 'success' ? 'text-green-400' :
                    log.type === 'warning' ? 'text-yellow-400' :
                    'text-gray-300'
                  }`}>
                    <span className="text-gray-500 mr-2">[{log.timestamp}]</span>
                    {log.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchDone && (
            <div className="mb-6 p-4 bg-green-900/20 border border-green-900/50 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white">✨ Готово</h3>
                <button onClick={onClose} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm font-bold transition">
                  ✓ Закрыть
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-green-900/20 border border-green-900/50 rounded-lg text-center">
                  <p className="text-2xl font-black text-green-400">{progress.success}</p>
                  <p className="text-xs text-gray-400">Найдено</p>
                </div>
                <div className="p-3 bg-yellow-900/20 border border-yellow-900/50 rounded-lg text-center">
                  <p className="text-2xl font-black text-yellow-400">{progress.skipped}</p>
                  <p className="text-xs text-gray-400">Не найдено</p>
                </div>
              </div>
            </div>
          )}

          {!isSearching && !searchDone && (
            <button
              onClick={handleStartSearch}
              disabled={animeWithNoCover.length === 0}
              className={`w-full px-6 py-3 rounded-xl text-white font-bold transition-all duration-300 ${
                animeWithNoCover.length === 0 
                  ? 'bg-gray-700 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 transform hover:scale-105 shadow-lg shadow-purple-900/50'
              }`}
            >
              🔍 Начать поиск ({animeWithNoCover.length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}