'use client';

import { useState, useEffect, useRef } from 'react';

export default function GlobalSearch({ animeLists, onSelectAnime }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const q = query.toLowerCase();
    const found = [];
    
    Object.entries(animeLists).forEach(([categoryId, list]) => {
      (list || []).forEach(anime => {
        if (anime.title.toLowerCase().includes(q)) {
          found.push({ ...anime, categoryId });
        }
      });
    });

    setResults(found.slice(0, 10));
    setShowResults(found.length > 0);
  }, [query, animeLists]);

  const handleSelect = (anime) => {
    // Переключаемся на нужную папку
    if (onSelectAnime) {
      onSelectAnime(anime);
    }
    
    setQuery('');
    setShowResults(false);
    
    // Скролл к карточке после переключения папки
    setTimeout(() => {
      const element = document.getElementById(`anime-card-${anime.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Подсветка карточки
        element.classList.add('ring-4', 'ring-yellow-400', 'ring-opacity-75');
        setTimeout(() => {
          element.classList.remove('ring-4', 'ring-yellow-400', 'ring-opacity-75');
        }, 2000);
      }
    }, 300);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔍 Поиск по папкам..."
        className="w-full px-4 py-3 bg-black/60 border-2 border-red-700/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 placeholder-gray-500 transition-all shadow-lg shadow-red-900/20"
        onFocus={() => results.length > 0 && setShowResults(true)}
      />
      
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 mt-2 w-full bg-black/95 border-2 border-red-900/50 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            {results.map((anime) => (
              <button
                key={anime.id}
                onClick={() => handleSelect(anime)}
                className="w-full text-left px-3 py-2 hover:bg-red-900/30 rounded-lg transition flex items-center gap-3"
              >
                <img src={anime.image_url} alt="" className="w-10 h-14 object-cover rounded" onError={(e) => { e.target.src = 'https://images.meme-arsenal.com/31f2e18074a78fed6adf2284b5ff3e71.jpg'; }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{anime.title}</p>
                  <p className="text-xs text-gray-400">📅 {anime.year} • {anime.episodes} эп.</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}