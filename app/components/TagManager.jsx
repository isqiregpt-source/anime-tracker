'use client';

import { useState } from 'react';
import { getAllTags, saveCustomTag, deleteCustomTag, hideDefaultTag, isDefaultTag } from '../utils/tags';

export default function TagManager({ onClose }) {
  const [tags, setTags] = useState(getAllTags());
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#ef4444');

  const handleAddTag = () => {
    if (!newTagName.trim()) {
      alert('Введите название тега!');
      return;
    }

    const newTag = {
      id: `custom_${Date.now()}`,
      name: newTagName,
      color: newTagColor,
    };

    saveCustomTag(newTag);
    setTags([...tags, newTag]);
    setNewTagName('');
    setNewTagColor('#ef4444');
  };

  const handleDeleteTag = (tagId) => {
    if (!confirm('Удалить этот тег? Он будет удалён у всех аниме, где использовался.')) return;
    
    // Проверяем, системный ли это тег
    if (isDefaultTag(tagId)) {
      // Скрываем системный тег
      hideDefaultTag(tagId);
    } else {
      // Удаляем кастомный тег
      deleteCustomTag(tagId);
    }
    
    setTags(tags.filter(t => t.id !== tagId));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Управление тегами</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Форма добавления нового тега */}
          <div className="mb-6 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Создать новый тег</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Название тега..."
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-purple-500"
              />
              <div className="flex gap-2">
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <button
                  onClick={handleAddTag}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white transition"
                >
                  Добавить тег
                </button>
              </div>
            </div>
          </div>

          {/* Список всех тегов */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Все теги</h3>
            <div className="space-y-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-white text-sm">{tag.name}</span>
                    {isDefaultTag(tag.id) && (
                      <span className="text-xs text-gray-500">(системный)</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteTag(tag.id)}
                    className="text-red-400 hover:text-red-300 text-sm px-3 py-1 bg-red-900/30 hover:bg-red-900/50 rounded transition"
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}