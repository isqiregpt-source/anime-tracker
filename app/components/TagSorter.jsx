'use client';

import { useState } from 'react';
import { getAllTags } from '../utils/tags';

export default function TagSorter({ currentList, onSortChange, onAlphabetSort }) {
  const allTags = getAllTags();
  const [activeTags, setActiveTags] = useState([]);
  const [alphabetSort, setAlphabetSort] = useState(false);

  const toggleTag = (tagId) => {
    const newTags = activeTags.includes(tagId)
      ? activeTags.filter(id => id !== tagId)
      : [...activeTags, tagId];
    setActiveTags(newTags);
    onSortChange(newTags);
  };

  const toggleAlphabet = () => {
    const newState = !alphabetSort;
    setAlphabetSort(newState);
    if (onAlphabetSort) {
      onAlphabetSort(newState);
    }
  };

  return (
    <div className="mb-6 p-4 bg-black/40 backdrop-blur-sm border border-red-900/30 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-300">🎨 Фильтр по тегам</h3>
        <button
          onClick={toggleAlphabet}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
            alphabetSort 
              ? 'bg-gradient-to-r from-green-700 to-green-600 border-green-500 text-white shadow-lg shadow-green-900/50' 
              : 'bg-black/60 border-red-900/30 text-gray-400 hover:border-red-700 hover:text-white'
          }`}
          title={alphabetSort ? 'Отключить сортировку А-Я' : 'Сортировать по алфавиту (А-Я)'}
        >
          {alphabetSort ? '✓ А-Я' : 'А→Я'}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {allTags.map(tag => {
          const isActive = activeTags.includes(tag.id);
          return (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition border ${
                isActive 
                  ? 'bg-red-900/50 text-white border-red-700 shadow-md' 
                  : 'bg-black/40 text-gray-400 border-red-900/30 hover:border-red-700 hover:text-white'
              }`}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
              {tag.name}
              {isActive && <span className="text-green-400 font-bold ml-1">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}