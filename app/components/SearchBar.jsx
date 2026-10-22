'use client';

import { useState, useEffect, useRef } from 'react';
import { fuzzySearch } from '../utils/animeSearch';

export default function SearchBar({ onAddAnime }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [editingAnime, setEditingAnime] = useState(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      
      try {
        const fuzzyResults = fuzzySearch(query);
        
        if (fuzzyResults.length > 0 && fuzzyResults[0].score < 0.2) {
          const normalizedTitle = fuzzyResults[0].title;
          const response = await fetch(`/api/search?q=${encodeURIComponent(normalizedTitle)}`);
          if (response.ok) {
            const data = await response.json();
            setResults(data);
            setShowResults(data.length > 0);
          }
        } else {
          const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          if (response.ok) {
            const data = await response.json();
            setResults(data);
            setShowResults(data.length > 0);
          }
        }
      } catch (error) {
        console.error('Ошибка поиска:', error);
      }
      
      setLoading(false);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const handleSelect = (anime) => {
    onAddAnime(anime);
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const handleEdit = (anime) => {
    setEditingAnime({
      ...anime,
      customTags: []
    });
  };

  const handleSaveEdit = () => {
    if (editingAnime) {
      onAddAnime(editingAnime);
      setEditingAnime(null);
      setQuery('');
      setResults([]);
      setShowResults(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingAnime(null);
  };

  // Модальное окно редактирования
  if (editingAnime) {
    return (
      <div className="relative z-50">
        <div className="p-6 bg-black/95 border-2 border-yellow-700/50 rounded-xl shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-yellow-400">✏️ Редактировать перед добавлением</h3>
            <button
              onClick={handleCancelEdit}
              className="text-gray-400 hover:text-red-400 text-xl transition font-bold"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Название:</label>
              <input
                type="text"
                value={editingAnime.title}
                onChange={(e) => setEditingAnime({ ...editingAnime, title: e.target.value })}
                className="w-full px-4 py-3 bg-black/60 border border-red-900/30 rounded-xl text-white text-base focus:outline-none focus:border-yellow-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Год:</label>
                <input
                  type="text"
                  value={editingAnime.year}
                  onChange={(e) => setEditingAnime({ ...editingAnime, year: e.target.value })}
                  className="w-full px-4 py-3 bg-black/60 border border-red-900/30 rounded-xl text-white text-base focus:outline-none focus:border-yellow-600"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Эпизоды:</label>
                <input
                  type="text"
                  value={editingAnime.episodes}
                  onChange={(e) => setEditingAnime({ ...editingAnime, episodes: e.target.value })}
                  className="w-full px-4 py-3 bg-black/60 border border-red-900/30 rounded-xl text-white text-base focus:outline-none focus:border-yellow-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Формат:</label>
              <select
                value={editingAnime.format || 'TV'}
                onChange={(e) => setEditingAnime({ ...editingAnime, format: e.target.value })}
                className="w-full px-4 py-3 bg-black/60 border border-red-900/30 rounded-xl text-white text-base focus:outline-none focus:border-yellow-600"
              >
                <option value="TV">TV Сериал</option>
                <option value="MOVIE">Фильм</option>
                <option value="OVA">OVA</option>
                <option value="ONA">ONA</option>
                <option value="SPECIAL">Спешл</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Рейтинг (%):</label>
              <input
                type="number"
                min="0"
                max="100"
                value={editingAnime.score || ''}
                onChange={(e) => setEditingAnime({ ...editingAnime, score: parseInt(e.target.value) || null })}
                placeholder="0-100"
                className="w-full px-4 py-3 bg-black/60 border border-red-900/30 rounded-xl text-white text-base focus:outline-none focus:border-yellow-600"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Жанры (через запятую):</label>
              <input
                type="text"
                value={(editingAnime.genres || []).join(', ')}
                onChange={(e) => {
                  const genres = e.target.value.split(',').map(g => g.trim()).filter(g => g);
                  setEditingAnime({ ...editingAnime, genres });
                }}
                className="w-full px-4 py-3 bg-black/60 border border-red-900/30 rounded-xl text-white text-base focus:outline-none focus:border-yellow-600"
                placeholder="Экшен, Фэнтези, Приключения"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">URL постера:</label>
              <input
                type="text"
                value={editingAnime.image_url}
                onChange={(e) => setEditingAnime({ ...editingAnime, image_url: e.target.value })}
                className="w-full px-4 py-3 bg-black/60 border border-red-900/30 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-600 font-mono"
              />
              {editingAnime.image_url && (
                <img
                  src={editingAnime.image_url}
                  alt="Preview"
                  className="mt-2 w-20 h-28 object-cover rounded-lg border border-red-900/30"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 rounded-xl text-white font-bold transition-all transform hover:scale-105"
              >
                ✓ Добавить с изменениями
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-bold transition"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-50">
      {/* СТРОКА ПОИСКА — БОЛЕЕ ВЫРАЖЕННАЯ */}
      <div className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Введите название аниме (можно на русском)..."
          className="flex-1 px-5 py-4 bg-black/80 border-2 border-red-600/60 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 placeholder-gray-500 transition-all shadow-lg shadow-red-900/20"
          onFocus={() => results.length > 0 && setShowResults(true)}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setShowResults(false); }}
            className="px-5 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-white transition text-base font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* Индикатор загрузки */}
      {loading && (
        <div className="absolute top-full left-0 mt-3 w-full bg-black/95 border-2 border-red-900/30 rounded-xl p-4 z-50">
          <p className="text-gray-400 text-base text-center animate-pulse">🔍 Ищу...</p>
        </div>
      )}

      {/* ВЫПАДАЮЩИЕ РЕЗУЛЬТАТЫ */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 mt-3 w-full bg-black/95 border-2 border-red-900/30 rounded-xl shadow-2xl z-50 max-h-[600px] overflow-y-auto">
          <div className="p-4">
            <p className="text-sm text-gray-400 mb-3 font-bold">Найдено: {results.length}</p>
            <div className="space-y-3">
              {results.map((anime, index) => (
                <div
                  key={`${anime.id}-${index}`}
                  onClick={() => handleSelect(anime)}
                  className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl hover:bg-red-900/30 cursor-pointer transition-all border border-transparent hover:border-red-700/50 transform hover:scale-[1.01] relative"
                >
                  <img
                    src={anime.image_url}
                    alt={anime.title}
                    className="w-20 h-28 object-cover rounded-lg flex-shrink-0 shadow-lg"
                    onError={(e) => { e.target.src = 'https://images.meme-arsenal.com/31f2e18074a78fed6adf2284b5ff3e71.jpg'; }}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-white text-lg truncate">{anime.title}</h4>
                      {anime.source === 'shikimori' && (
                        <span className="px-2 py-0.5 bg-green-900/50 border border-green-700/50 rounded text-[10px] text-green-300 font-bold flex-shrink-0">
                          Shikimori
                        </span>
                      )}
                      {anime.source === 'anilist' && (
                        <span className="px-2 py-0.5 bg-purple-900/50 border border-purple-700/50 rounded text-[10px] text-purple-300 font-bold flex-shrink-0">
                          AniList
                        </span>
                      )}
                      {anime.source === 'local' && (
                        <span className="px-2 py-0.5 bg-blue-900/50 border border-blue-700/50 rounded text-[10px] text-blue-300 font-bold flex-shrink-0">
                          Локально
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-gray-400 mb-2">
                      <span> {anime.year}</span>
                      <span>•</span>
                      <span> {anime.episodes} эп.</span>
                      {anime.score && (
                        <>
                          <span>•</span>
                          <span className="text-yellow-400 font-bold">⭐ {anime.score}%</span>
                        </>
                      )}
                      {anime.format && anime.format !== 'TV' && (
                        <>
                          <span>•</span>
                          <span className="px-2 py-0.5 bg-purple-900/30 border border-purple-900/50 rounded text-xs text-purple-300">
                            {anime.format}
                          </span>
                        </>
                      )}
                    </div>

                    {anime.genres && anime.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {anime.genres.slice(0, 5).map((genre) => (
                          <span key={genre} className="px-2.5 py-1 bg-red-900/30 border border-red-900/50 rounded-full text-xs text-red-300 font-medium">
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ТОЛЬКО КАРАНДАШ РЕДАКТИРОВАНИЯ — ЧУТЬ БОЛЬШЕ */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(anime);
                    }}
                    className="w-12 h-12 rounded-full bg-yellow-700/30 border-2 border-yellow-700/50 flex items-center justify-center text-yellow-400 text-xl hover:bg-yellow-700/50 hover:scale-110 transition flex-shrink-0"
                    title="Редактировать перед добавлением"
                  >
                    ✏️
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showResults && results.length === 0 && !loading && query.length >= 2 && (
        <div className="absolute top-full left-0 mt-3 w-full bg-black/95 border-2 border-red-900/30 rounded-xl p-4 z-50">
          <p className="text-gray-400 text-base text-center">Ничего не найдено. Попробуй другое название.</p>
        </div>
      )}
    </div>
  );
}