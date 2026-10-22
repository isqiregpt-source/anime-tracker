'use client';

import { useState } from 'react';
import { getAllCategories, addCustomCategory, deleteCustomCategory, hideDefaultCategory, isDefaultCategory, customCategoryIcons } from '../utils/categories';

export default function CategoryManager({ onClose, activeCategory, setActiveCategory }) {
  const [categories, setCategories] = useState(getAllCategories());
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      alert('Введите название папки!');
      return;
    }

    const newCategory = {
      id: `custom_${Date.now()}`,
      name: newCategoryName,
      icon: newCategoryIcon,
    };

    addCustomCategory(newCategory);
    setCategories([...categories, newCategory]);
    setNewCategoryName('');
    setNewCategoryIcon('🎌');
  };

  const handleDeleteCategory = (categoryId) => {
    if (!confirm('Удалить эту папку? Все аниме в ней будут перемещены в "Запланированные".')) return;
    
    // Проверяем, системная ли это категория
    if (isDefaultCategory(categoryId)) {
      // Скрываем системную категорию
      hideDefaultCategory(categoryId);
    } else {
      // Удаляем кастомную категорию
      deleteCustomCategory(categoryId);
    }
    
    setCategories(categories.filter(c => c.id !== categoryId));
    
    // Если удалили активную категорию, переключаемся на "Запланированные"
    if (activeCategory === categoryId) {
      setActiveCategory('planned');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Управление папками</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Форма добавления новой папки */}
          <div className="mb-6 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Создать новую папку</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Название папки..."
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-purple-500"
              />
              
              <div>
                <label className="block text-xs text-gray-400 mb-2">Выбери иконку:</label>
                <div className="flex flex-wrap gap-2">
                  {customCategoryIcons.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setNewCategoryIcon(icon)}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition ${
                        newCategoryIcon === icon 
                          ? 'bg-purple-600 border-2 border-purple-400' 
                          : 'bg-gray-900 border border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddCategory}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white transition"
              >
                Добавить папку
              </button>
            </div>
          </div>

          {/* Список всех папок */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Все папки</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <span className="text-white text-sm">{category.name}</span>
                    {isDefaultCategory(category.id) && (
                      <span className="text-xs text-gray-500">(системная)</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
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