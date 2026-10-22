// Базовые системные категории
const DEFAULT_CATEGORIES = [
  { id: 'watching', name: 'В процессе', icon: '▶️' },
  { id: 'completed', name: 'Просмотренные', icon: '✅' },
  { id: 'planned', name: 'Запланированные', icon: '📋' },
  { id: 'on_hold', name: 'Ожидаю', icon: '️⏸️' },
  { id: 'dropped', name: 'Заброшенные', icon: '❌' },
  { id: 'closed', name: 'Закрытые', icon: '🔒' },
];

// Иконки для кастомных категорий
export const customCategoryIcons = ['📁', '🔥', '🌟', '🎬', '📺', '🎭', '🎪', '🎨', '🎮', '🔮', '🌙', '️', '🌊', '🍃'];

// Получить все категории (включая кастомные)
export const getAllCategories = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_CATEGORIES;
  }

  const saved = localStorage.getItem('customCategories');
  const customCategories = saved ? JSON.parse(saved) : [];
  return [...DEFAULT_CATEGORIES, ...customCategories];
};

// Сохранить кастомные категории
export const saveCustomCategories = (categories) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('customCategories', JSON.stringify(categories));
};

// Получить кастомные категории
export const getCustomCategories = () => {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('customCategories');
  return saved ? JSON.parse(saved) : [];
};

// Добавить кастомную категорию
export const addCustomCategory = (category) => {
  if (typeof window === 'undefined') return;
  const custom = getCustomCategories();
  custom.push(category);
  saveCustomCategories(custom);
};

// Удалить кастомную категорию
export const deleteCustomCategory = (categoryId) => {
  if (typeof window === 'undefined') return;
  const custom = getCustomCategories();
  const filtered = custom.filter(c => c.id !== categoryId);
  saveCustomCategories(filtered);
};

// Проверить, является ли категория системной (по умолчанию)
export const isDefaultCategory = (categoryId) => {
  return DEFAULT_CATEGORIES.some(c => c.id === categoryId);
};

// Скрыть системную категорию (сохранить в скрытые)
export const hideDefaultCategory = (categoryId) => {
  if (typeof window === 'undefined') return;
  const saved = localStorage.getItem('hiddenCategories');
  const hidden = saved ? JSON.parse(saved) : [];
  if (!hidden.includes(categoryId)) {
    hidden.push(categoryId);
    localStorage.setItem('hiddenCategories', JSON.stringify(hidden));
  }
};

// Показать скрытую системную категорию
export const showDefaultCategory = (categoryId) => {
  if (typeof window === 'undefined') return;
  const saved = localStorage.getItem('hiddenCategories');
  const hidden = saved ? JSON.parse(saved) : [];
  const filtered = hidden.filter(id => id !== categoryId);
  localStorage.setItem('hiddenCategories', JSON.stringify(filtered));
};

// Получить скрытые категории
export const getHiddenCategories = () => {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('hiddenCategories');
  return saved ? JSON.parse(saved) : [];
};

// Получить видимые категории (все минус скрытые)
export const getVisibleCategories = () => {
  if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
  const hidden = getHiddenCategories();
  const all = getAllCategories();
  return all.filter(c => !hidden.includes(c.id));
};