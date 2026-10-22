'use client';

import { useState } from 'react';

export default function ManualAddForm({ onClose, onAddAnime }) {
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [episodes, setEpisodes] = useState('');
  const [format, setFormat] = useState('TV');
  const [score, setScore] = useState('');
  const [genres, setGenres] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) {
      alert('Введи название аниме!');
      return;
    }

    const anime = {
      title: title.trim(),
      title_russian: title.trim(),
      title_english: title.trim(),
      year: year || null,
      episodes: episodes || '?',
      format: format,
      score: score ? Number(score) : null,
      genres: genres ? genres.split(',').map(g => g.trim()).filter(g => g) : [],
      image_url: imageUrl || 'https://images.meme-arsenal.com/31f2e18074a78fed6adf2284b5ff3e71.jpg',
      source: 'manual',
      customTags: imageUrl ? [] : ['no-cover']
    };

    onAddAnime(anime);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[260] p-4">
      <div className="bg-gray-900 border-2 border-red-700/50 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-red-900/50">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-red-400">✏️ Добавить аниме вручную</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-red-400 text-2xl transition font-bold"></button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Название *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Перерождение дяди"
                className="w-full px-4 py-3 bg-black/60 border-2 border-red-700/50 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 placeholder-gray-500"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Год</label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2024"
                  className="w-full px-4 py-3 bg-black/60 border-2 border-red-700/50 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Эпизоды</label>
                <input
                  type="text"
                  value={episodes}
                  onChange={(e) => setEpisodes(e.target.value)}
                  placeholder="12"
                  className="w-full px-4 py-3 bg-black/60 border-2 border-red-700/50 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 placeholder-gray-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Формат</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full px-4 py-3 bg-black/60 border-2 border-red-700/50 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500"
                >
                  <option value="TV">TV Сериал</option>
                  <option value="MOVIE">Фильм</option>
                  <option value="OVA">OVA</option>
                  <option value="ONA">ONA</option>
                  <option value="SPECIAL">Спешл</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Рейтинг (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="85"
                  className="w-full px-4 py-3 bg-black/60 border-2 border-red-700/50 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 placeholder-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Жанры (через запятую)</label>
              <input
                type="text"
                value={genres}
                onChange={(e) => setGenres(e.target.value)}
                placeholder="Экшен, Фэнтези, Комедия"
                className="w-full px-4 py-3 bg-black/60 border-2 border-red-700/50 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">URL обложки (необязательно)</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 bg-black/60 border-2 border-red-700/50 rounded-xl text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 placeholder-gray-500"
              />
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="mt-2 w-20 h-28 object-cover rounded-lg border-2 border-red-900/30"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSubmit}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 rounded-xl text-white font-bold transition-all transform hover:scale-105 shadow-lg shadow-green-900/50"
              >
                ✓ Добавить
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-bold transition"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}