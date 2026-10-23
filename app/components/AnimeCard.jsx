'use client';

import { useState } from 'react';
import { getAllTags } from '../utils/tags';

export default function AnimeCard({ 
  anime, 
  onRemove, 
  onMove, 
  onUpdateTags, 
  onSelect, 
  isSelected, 
  selectMode, 
  onUpdateDetails,
  onUpdateComment,
  onToggleNote,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
  dragOverId
}) {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [commentText, setCommentText] = useState(anime.comment || '');
  
  const [editData, setEditData] = useState({
    title: anime.title,
    year: anime.year || '',
    episodes: anime.episodes || '',
    image_url: anime.image_url || '',
    score: anime.score || '',
    format: anime.format || 'TV'
  });

  const allTags = getAllTags();
  const showNote = anime.show_note === true;

  const handleContextMenu = (e) => {
    if (selectMode) return;
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleSaveEdit = async () => {
    await onUpdateDetails(anime.id, editData);
    setIsEditing(false);
  };

  const handleSaveComment = async () => {
    await onUpdateComment(anime.id, commentText);
    setIsEditingComment(false);
  };

  const toggleTag = async (tagId) => {
    const currentTags = anime.custom_tags || [];
    const newTags = currentTags.includes(tagId) 
      ? currentTags.filter(id => id !== tagId) 
      : [...currentTags, tagId];
    await onUpdateTags(anime.id, newTags);
  };

  const handleWatch = () => {
    const searchQuery = `смотреть онлайн ${anime.title}`;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
  };

  const handleDragStart = (e) => {
    if (selectMode) return;
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(anime.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver(anime.id);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    onDrop(anime.id);
  };

  // Режим редактирования карточки
  if (isEditing) {
    return (
      <div className="flex items-stretch gap-5 p-5 bg-gray-900 border-2 border-yellow-600 rounded-2xl shadow-2xl z-20 relative animate-fade-in">
        <div className="flex-1 space-y-3">
          <h3 className="text-lg font-bold text-yellow-400 mb-2">✏️ Редактирование карточки</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Название</label>
              <input type="text" value={editData.title} onChange={(e) => setEditData({...editData, title: e.target.value})} className="w-full px-3 py-2 bg-black/60 border border-red-900/30 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-600" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Год</label>
              <input type="text" value={editData.year} onChange={(e) => setEditData({...editData, year: e.target.value})} className="w-full px-3 py-2 bg-black/60 border border-red-900/30 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-600" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Эпизоды</label>
              <input type="text" value={editData.episodes} onChange={(e) => setEditData({...editData, episodes: e.target.value})} className="w-full px-3 py-2 bg-black/60 border border-red-900/30 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-600" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Формат</label>
              <select value={editData.format} onChange={(e) => setEditData({...editData, format: e.target.value})} className="w-full px-3 py-2 bg-black/60 border border-red-900/30 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-600">
                <option value="TV">TV Сериал</option>
                <option value="MOVIE">Фильм</option>
                <option value="OVA">OVA</option>
                <option value="ONA">ONA</option>
                <option value="SPECIAL">Спешл</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Рейтинг (%)</label>
              <input type="number" min="0" max="100" value={editData.score} onChange={(e) => setEditData({...editData, score: e.target.value ? parseInt(e.target.value) : null})} className="w-full px-3 py-2 bg-black/60 border border-red-900/30 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-600" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">URL обложки</label>
              <input type="text" value={editData.image_url} onChange={(e) => setEditData({...editData, image_url: e.target.value})} className="w-full px-3 py-2 bg-black/60 border border-red-900/30 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-yellow-600" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSaveEdit} className="flex-1 px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-white text-sm font-bold transition">💾 Сохранить</button>
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm font-bold transition">Отмена</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        id={`anime-card-${anime.id}`}
        onContextMenu={handleContextMenu}
        draggable={!selectMode}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative flex items-stretch gap-5 p-5 bg-black/60 backdrop-blur-sm rounded-2xl border transition-all duration-300 transform hover:shadow-xl hover:shadow-red-900/20 animate-fade-in z-10 hover:z-20 ${
          isDragging ? 'opacity-40 scale-95 border-yellow-500' : ''
        } ${
          dragOverId === anime.id ? 'border-t-4 border-t-yellow-400' : ''
        } ${
          isSelected ? 'border-yellow-500 bg-yellow-900/10' : 'border-red-900/30 hover:border-red-700/50'
        } ${!selectMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        {/* АНИМИРОВАННАЯ КНОПКА УДАЛЕНИЯ - ПРАВЫЙ ВЕРХНИЙ УГОЛ */}
        {!selectMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Удалить это аниме из списка?')) {
                onRemove(anime.id);
              }
            }}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-red-900/40 border-2 border-red-700/50 flex items-center justify-center text-red-400 hover:bg-red-700 hover:text-white hover:scale-125 hover:border-red-500 transition-all duration-300 animate-pulse hover:animate-none z-30 shadow-lg shadow-red-900/30"
            title="Удалить аниме"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Drag handle (иконка перемещения) */}
        {!selectMode && (
          <div className="flex items-center flex-shrink-0 px-2 text-gray-600 hover:text-yellow-400 transition" title="Зажми и перетащи">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
            </svg>
          </div>
        )}

        {selectMode && (
          <div className="flex items-center flex-shrink-0">
            <input type="checkbox" checked={isSelected} onChange={() => onSelect(anime.id)} className="w-6 h-6 rounded border-2 border-red-900/50 bg-black/60 text-red-600 focus:ring-red-500 focus:ring-2 cursor-pointer" />
          </div>
        )}

        <img src={anime.image_url} alt={anime.title} className="w-36 h-52 object-cover rounded-xl flex-shrink-0 shadow-lg shadow-black/50" onError={(e) => { e.target.src = 'https://images.meme-arsenal.com/31f2e18074a78fed6adf2284b5ff3e71.jpg'; }} />

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-bold text-white text-2xl truncate">{anime.title}</h3>
              {anime.custom_tags && anime.custom_tags.length > 0 && (
                <div className="flex gap-2">
                  {anime.custom_tags.map(tagId => {
                    const tag = allTags.find(t => t.id === tagId);
                    return tag ? (
                      <div key={tagId} className="w-4 h-4 rounded-full cursor-help flex-shrink-0 shadow-md transform hover:scale-125 transition" style={{ backgroundColor: tag.color }} title={tag.name} />
                    ) : null;
                  })}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 text-base">
              <span className="text-gray-300"> {anime.year}</span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-300">🎬 {anime.episodes} эп.</span>
              {anime.score && anime.score > 0 && (<><span className="text-gray-600">•</span><span className="text-yellow-400 font-black text-lg">⭐ {anime.score}%</span></>)}
            </div>
            {anime.genres && anime.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {anime.genres.slice(0, 5).map((genre) => (
                  <span key={genre} className="px-3 py-1 bg-red-900/30 border border-red-900/50 rounded-full text-sm text-red-300 font-medium">{genre}</span>
                ))}
              </div>
            )}

            {/* ЗАМЕТКА ПО ЦЕНТРУ КАРТОЧКИ — только если включена */}
            {showNote && (
              <div 
                onClick={() => setIsEditingComment(true)}
                className="w-full p-4 rounded-xl bg-black/15 hover:bg-black/25 transition cursor-text border border-red-900/20 hover:border-red-700/40"
              >
                {isEditingComment ? (
                  <div className="space-y-2">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Напиши заметку..."
                      className="w-full px-4 py-3 bg-black/40 border-2 border-red-700/50 rounded-lg text-red-400 text-base focus:outline-none focus:border-red-500 resize-none placeholder-gray-600"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button onClick={handleSaveComment} className="px-4 py-1.5 bg-green-700 hover:bg-green-600 rounded-lg text-white text-sm font-bold transition">✓ Сохранить</button>
                      <button onClick={() => { setIsEditingComment(false); setCommentText(anime.comment || ''); }} className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm font-bold transition">Отмена</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-red-500 uppercase tracking-wide">💬 Заметка</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsEditingComment(true); }}
                        className="text-xs text-gray-500 hover:text-red-400 transition"
                      >
                        ✏️
                      </button>
                    </div>
                    {anime.comment ? (
                      <p className="text-base text-red-400 whitespace-pre-wrap break-words leading-relaxed font-medium">{anime.comment}</p>
                    ) : (
                      <p className="text-base text-red-400/50 italic">+ Нажми чтобы добавить заметку</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4">
            <button onClick={handleWatch} className="px-6 py-3 bg-gradient-to-b from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 rounded-xl text-white text-base font-black transition-all duration-300 flex items-center gap-2 transform hover:scale-105 shadow-xl shadow-red-900/50 border border-red-500/30 uppercase tracking-wider">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Смотреть
            </button>
          </div>
        </div>

        {/* КНОПКА МЕНЮ (ТРИ ТОЧКИ) - ПРАВЫЙ НИЖНИЙ УГОЛ */}
        {!selectMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              setMenuPosition({ 
                x: rect.left - 220, 
                y: rect.top - 10 
              });
              setShowContextMenu(true);
            }}
            className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-black/60 border border-red-900/50 flex items-center justify-center text-gray-400 hover:bg-red-900/50 hover:text-white transition-all duration-300 z-30 active:scale-95 shadow-lg"
            title="Меню карточки"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        )}
      </div>

      {/* Контекстное меню (открывается по кнопке или ПКМ) */}
      {showContextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowContextMenu(false)} />
          <div 
            className="fixed z-50 bg-gray-900 border border-red-900/50 rounded-xl shadow-2xl overflow-hidden animate-fade-in min-w-[220px]"
            style={{
              top: menuPosition.y + 300 > window.innerHeight ? undefined : menuPosition.y,
              bottom: menuPosition.y + 300 > window.innerHeight ? window.innerHeight - menuPosition.y : undefined,
              left: menuPosition.x + 250 > window.innerWidth ? undefined : menuPosition.x,
              right: menuPosition.x + 250 > window.innerWidth ? window.innerWidth - menuPosition.x : undefined,
              maxHeight: '70vh',
              overflowY: 'auto'
            }}
          >
            <div className="p-2 min-w-[200px]">
              <button onClick={() => { setIsEditing(true); setShowContextMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-red-900/50 hover:text-white rounded-lg transition flex items-center gap-2">✏️ Редактировать</button>
              
              {/* ПУНКТ ВКЛЮЧЕНИЯ/ВЫКЛЮЧЕНИЯ ЗАМЕТКИ */}
              <button 
                onClick={() => { 
                  onToggleNote(anime.id, !showNote); 
                  setShowContextMenu(false); 
                }} 
                className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-red-900/50 hover:text-white rounded-lg transition flex items-center gap-2"
              >
                {showNote ? '📝 Скрыть заметку' : '📝 Показать заметку'}
                {showNote && <span className="text-green-400 font-bold ml-auto">✓</span>}
              </button>

              <div className="border-t border-red-900/30 my-1"></div>
              <p className="px-4 py-1 text-xs text-red-400 uppercase tracking-wide font-bold">Переместить в:</p>
              {[
                { id: 'watching', name: '▶️ В процессе' },
                { id: 'completed', name: '⭐ Просмотренные' },
                { id: 'planned', name: '📌 Запланированные' },
                { id: 'on_hold', name: '⏸️ Ожидаю' },
                { id: 'dropped', name: '🗑️ Заброшенные' },
                { id: 'closed', name: ' Закрытые' }
              ].filter(c => c.id !== anime.category_id).map((item) => (
                <button key={item.id} onClick={() => { onMove(anime.id, item.id); setShowContextMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-red-900/50 hover:text-white rounded-lg transition">
                  {item.name}
                </button>
              ))}

              <div className="border-t border-red-900/30 my-1"></div>
              <p className="px-4 py-1 text-xs text-red-400 uppercase tracking-wide font-bold">Метки:</p>
              <div className="max-h-40 overflow-y-auto px-2">
                {allTags.map((tag) => {
                  const isActive = (anime.custom_tags || []).includes(tag.id);
                  return (
                    <button key={tag.id} onClick={() => toggleTag(tag.id)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition ${isActive ? 'bg-red-900/50 text-white' : 'text-gray-400 hover:bg-red-900/30'}`}>
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                      <span className="flex-1 text-left">{tag.name}</span>
                      {isActive && <span className="text-green-400 font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-red-900/30 my-1"></div>
              <button onClick={() => { if (confirm('Удалить это аниме из списка?')) { onRemove(anime.id); } setShowContextMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/50 hover:text-white rounded-lg transition flex items-center gap-2 font-bold">
                🗑️ Удалить из списка
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}