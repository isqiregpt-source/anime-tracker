// Предустановленные теги
export const defaultTags = [
  { id: 'priority', name: 'Смотреть в 1-ю очередь', color: '#ef4444' },
  { id: 'long', name: 'Длинный тайтл', color: '#06b6d4' },
  { id: 'isekai', name: 'Исекай', color: '#f97316' },
  { id: 'movie', name: 'Фильм', color: '#a855f7' },
  { id: 'top', name: 'Топ рейтинг', color: '#eab308' },
  { id: 'no-cover', name: 'Без обложки', color: '#6b7280' },
];

// Функция для получения всех тегов (включая кастомные, исключая скрытые системные)
export const getAllTags = () => {
  const saved = localStorage.getItem('customTags');
  const customTags = saved ? JSON.parse(saved) : [];
  
  // Получаем список скрытых системных тегов
  const hiddenTags = JSON.parse(localStorage.getItem('hiddenDefaultTags') || '[]');
  
  // Фильтруем системные теги, убирая скрытые
  const visibleDefaultTags = defaultTags.filter(tag => !hiddenTags.includes(tag.id));
  
  return [...visibleDefaultTags, ...customTags];
};

// Функция для сохранения кастомного тега
export const saveCustomTag = (tag) => {
  const saved = localStorage.getItem('customTags');
  const customTags = saved ? JSON.parse(saved) : [];
  customTags.push(tag);
  localStorage.setItem('customTags', JSON.stringify(customTags));
};

// Функция для удаления кастомного тега
export const deleteCustomTag = (tagId) => {
  const saved = localStorage.getItem('customTags');
  const customTags = saved ? JSON.parse(saved) : [];
  const filtered = customTags.filter(t => t.id !== tagId);
  localStorage.setItem('customTags', JSON.stringify(filtered));
};

// Функция для скрытия системного тега
export const hideDefaultTag = (tagId) => {
  const hiddenTags = JSON.parse(localStorage.getItem('hiddenDefaultTags') || '[]');
  if (!hiddenTags.includes(tagId)) {
    hiddenTags.push(tagId);
    localStorage.setItem('hiddenDefaultTags', JSON.stringify(hiddenTags));
  }
};

// Функция для проверки, является ли тег системным
export const isDefaultTag = (tagId) => {
  return defaultTags.find(t => t.id === tagId);
};