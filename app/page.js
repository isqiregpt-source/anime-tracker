'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from './components/SearchBar';
import AnimeCard from './components/AnimeCard';
import SettingsPanel from './components/SettingsPanel';
import GlobalSearch from './components/GlobalSearch';
import TagSorter from './components/TagSorter';
import ManualAddForm from './components/ManualAddForm';
import { getAllCategories } from './utils/categories';
import { supabase } from './lib/supabase';

export default function Home() {
  const router = useRouter();
  const [currentProfile, setCurrentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('watching');
  const [animeLists, setAnimeLists] = useState({});
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [alphabetSort, setAlphabetSort] = useState(false);
  
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const scrollIntervalRef = useRef(null);
  const lastDragOverTime = useRef(0);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const savedProfile = localStorage.getItem('currentProfile');
        if (savedProfile) {
          const profile = JSON.parse(savedProfile);
          if (profile && profile.id) {
            const { data: updatedProfile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', profile.id)
              .single();
            
            if (error) {
              console.error('Ошибка обновления профиля:', error);
              setCurrentProfile(profile);
            } else {
              const newProfile = {
                ...updatedProfile,
                is_admin: updatedProfile.is_admin === true
              };
              localStorage.setItem('currentProfile', JSON.stringify(newProfile));
              setCurrentProfile(newProfile);
            }
          } else {
            localStorage.removeItem('currentProfile');
            router.push('/login');
          }
        } else {
          router.push('/login');
        }
      } catch (e) {
        console.error('Ошибка чтения профиля:', e);
        localStorage.removeItem('currentProfile');
        router.push('/login');
      }
      setLoading(false);
    };
    checkProfile();
  }, []);

  useEffect(() => {
    const savedStart = localStorage.getItem('gradientStart') || '#000000';
    const savedEnd = localStorage.getItem('gradientEnd') || '#1a0000';
    document.body.style.background = `linear-gradient(135deg, ${savedStart} 0%, ${savedEnd} 100%)`;
    document.body.style.backgroundAttachment = 'fixed';
  }, []);

  useEffect(() => {
    if (!currentProfile) return;
    
    const fetchData = async () => {
      console.log('Загрузка данных для профиля:', currentProfile.id);
      
      const { data: customCats, error: catError } = await supabase
        .from('custom_categories')
        .select('*')
        .eq('profile_id', currentProfile.id)
        .order('sort_order', { ascending: true });

      let allCategories = getAllCategories();
      
      if (!catError && customCats && customCats.length > 0) {
        const customCategories = customCats.map(c => ({
          id: c.id,
          name: c.name,
          icon: c.icon || '📁',
          isCustom: true
        }));
        allCategories = [...allCategories, ...customCategories];
      }
      
      setCategories(allCategories);

      const { data: animeData, error: animeError } = await supabase
        .from('anime')
        .select('*')
        .eq('profile_id', currentProfile.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (animeError) {
        console.error('Ошибка загрузки аниме:', animeError);
      } else {
        const grouped = {};
        allCategories.forEach(cat => { grouped[cat.id] = []; });
        animeData.forEach(anime => {
          const cat = anime.category_id || 'watching';
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(anime);
        });
        setAnimeLists(grouped);
      }
    };
    
    fetchData();
  }, [currentProfile]);

  useEffect(() => { 
    setSelectedTags([]); 
    setAlphabetSort(false);
  }, [activeCategory]);

  // АВТОПРОКРУТКА при перетаскивании
  const startAutoScroll = (direction) => {
    stopAutoScroll();
    scrollIntervalRef.current = setInterval(() => {
      window.scrollBy({ top: direction * 25, behavior: 'auto' });
    }, 30);
  };

  const stopAutoScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

  const handleDragStart = (animeId) => {
    setDragId(animeId);
  };

  const handleDragOver = (e, animeId) => {
    e.preventDefault();
    
    // Throttle: обновляем не чаще чем раз в 100мс
    const now = Date.now();
    if (now - lastDragOverTime.current < 100) return;
    lastDragOverTime.current = now;
    
    if (dragId === animeId) return;
    setDragOverId(animeId);

    // АВТОПРОКРУТКА: проверяем позицию мыши
    const mouseY = e.clientY;
    const windowHeight = window.innerHeight;
    const scrollThreshold = 100; // пикселей от края

    if (mouseY < scrollThreshold) {
      // Мышь вверху экрана — скроллим вверх
      startAutoScroll(-1);
    } else if (mouseY > windowHeight - scrollThreshold) {
      // Мышь внизу экрана — скроллим вниз
      startAutoScroll(1);
    } else {
      stopAutoScroll();
    }
  };

  const handleDragEnd = () => {
    stopAutoScroll();
    setDragId(null);
    setDragOverId(null);
  };

  const handleDrop = async (targetId) => {
    stopAutoScroll();
    
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setDragOverId(null);
      return;
    }

    const currentList = animeLists[activeCategory] || [];
    const dragIndex = currentList.findIndex(a => a.id === dragId);
    const dropIndex = currentList.findIndex(a => a.id === targetId);
    
    if (dragIndex === -1 || dropIndex === -1) {
      setDragId(null);
      setDragOverId(null);
      return;
    }

    const newList = [...currentList];
    const [moved] = newList.splice(dragIndex, 1);
    newList.splice(dropIndex, 0, moved);

    const updates = newList.map((anime, index) => ({
      id: anime.id,
      sort_order: index + 1
    }));

    for (const update of updates) {
      await supabase.from('anime').update({ sort_order: update.sort_order }).eq('id', update.id);
    }

    setAnimeLists(prev => ({
      ...prev,
      [activeCategory]: newList
    }));

    setDragId(null);
    setDragOverId(null);
  };

  const handleAddAnime = async (anime) => {
    const currentList = animeLists[activeCategory] || [];
    const exists = currentList.find(a => a.title === anime.title);
    
    if (exists) {
      alert('Это аниме уже есть в этом разделе!');
      return;
    }

    const defaultNoCoverImage = 'https://images.meme-arsenal.com/31f2e18074a78fed6adf2284b5ff3e71.jpg';
    const hasNoCover = !anime.image_url || 
                       anime.image_url.includes('placeholder') || 
                       anime.image_url === defaultNoCoverImage;
    const finalImageUrl = hasNoCover ? defaultNoCoverImage : anime.image_url;
    
    let finalTags = anime.customTags || [];
    if (hasNoCover && !finalTags.includes('no-cover')) {
      finalTags = [...finalTags, 'no-cover'];
    }

    let finalTitle = anime.title;
    let finalTitleRussian = anime.title_russian || '';
    
    if (!/[\u0400-\u04FF]/.test(finalTitle) && !finalTitleRussian) {
      try {
        const translateResponse = await fetch(`/api/translate?text=${encodeURIComponent(finalTitle)}`);
        if (translateResponse.ok) {
          const translateData = await translateResponse.json();
          if (translateData.translated && translateData.translated !== finalTitle) {
            finalTitleRussian = translateData.translated;
            finalTitle = finalTitleRussian;
          }
        }
      } catch (error) {
        console.error('Ошибка перевода:', error);
      }
    } else if (finalTitleRussian) {
      finalTitle = finalTitleRussian;
    }

    const maxOrder = currentList.length > 0 
      ? Math.max(...currentList.map(a => a.sort_order || 0))
      : 0;

    const newAnimePayload = {
      title: finalTitle,
      title_russian: finalTitleRussian || null,
      year: anime.year || null,
      episodes: anime.episodes || null,
      synopsis: anime.synopsis || null,
      image_url: finalImageUrl,
      genres: Array.isArray(anime.genres) ? anime.genres : [],
      score: anime.score ? Number(anime.score) : null,
      format: anime.format || 'TV',
      source: anime.source || 'manual',
      category_id: activeCategory,
      custom_tags: Array.isArray(finalTags) ? finalTags : [],
      profile_id: currentProfile.id,
      sort_order: maxOrder + 1,
      comment: null,
      show_note: false,
      countdown_date: null
    };

    const { data, error } = await supabase.from('anime').insert(newAnimePayload).select();

    if (error) {
      console.error('Ошибка добавления:', error);
      alert(`Не удалось добавить аниме!\n\nОшибка: ${error.message}`);
    } else {
      setAnimeLists(prev => ({
        ...prev,
        [activeCategory]: [...(prev[activeCategory] || []), data[0]]
      }));
    }
  };

  const handleUpdateDetails = async (animeId, updatedData) => {
    const { error } = await supabase.from('anime').update(updatedData).eq('id', animeId);
    if (error) {
      console.error('Ошибка обновления:', error);
      alert('Не удалось сохранить изменения');
    } else {
      setAnimeLists(prev => {
        const newList = { ...prev };
        for (const cat in newList) {
          const index = (newList[cat] || []).findIndex(a => a.id === animeId);
          if (index !== -1) {
            newList[cat][index] = { ...newList[cat][index], ...updatedData };
            break;
          }
        }
        return newList;
      });
    }
  };

  const handleUpdateComment = async (animeId, comment) => {
    const { error } = await supabase.from('anime').update({ comment }).eq('id', animeId);
    if (error) {
      console.error('Ошибка обновления комментария:', error);
      alert('Не удалось сохранить комментарий');
    } else {
      setAnimeLists(prev => {
        const newList = { ...prev };
        for (const cat in newList) {
          const index = (newList[cat] || []).findIndex(a => a.id === animeId);
          if (index !== -1) {
            newList[cat][index] = { ...newList[cat][index], comment };
            break;
          }
        }
        return newList;
      });
    }
  };

  const handleToggleNote = async (animeId, showNote) => {
    const { error } = await supabase.from('anime').update({ show_note: showNote }).eq('id', animeId);
    if (error) {
      console.error('Ошибка обновления заметки:', error);
    } else {
      setAnimeLists(prev => {
        const newList = { ...prev };
        for (const cat in newList) {
          const index = (newList[cat] || []).findIndex(a => a.id === animeId);
          if (index !== -1) {
            newList[cat][index] = { ...newList[cat][index], show_note: showNote };
            break;
          }
        }
        return newList;
      });
    }
  };

  const handleUpdateCountdown = async (animeId, countdownDate) => {
    const { error } = await supabase.from('anime').update({ countdown_date: countdownDate }).eq('id', animeId);
    if (error) {
      console.error('Ошибка обновления даты:', error);
      alert('Не удалось сохранить дату');
    } else {
      setAnimeLists(prev => {
        const newList = { ...prev };
        for (const cat in newList) {
          const index = (newList[cat] || []).findIndex(a => a.id === animeId);
          if (index !== -1) {
            newList[cat][index] = { ...newList[cat][index], countdown_date: countdownDate };
            break;
          }
        }
        return newList;
      });
    }
  };

  const handleRemoveAnime = async (animeId) => {
    if (!confirm('Удалить это аниме?')) return;
    const { error } = await supabase.from('anime').delete().eq('id', animeId);
    if (error) { alert('Не удалось удалить'); } 
    else {
      setAnimeLists(prev => ({
        ...prev,
        [activeCategory]: (prev[activeCategory] || []).filter(a => a.id !== animeId)
      }));
    }
  };

  const handleMoveAnime = async (animeId, newCategory) => {
    const anime = (animeLists[activeCategory] || []).find(a => a.id === animeId);
    if (!anime) return;
    const { error } = await supabase.from('anime').update({ category_id: newCategory }).eq('id', animeId);
    if (error) { alert('Не удалось переместить'); } 
    else {
      setAnimeLists(prev => ({
        ...prev,
        [activeCategory]: (prev[activeCategory] || []).filter(a => a.id !== animeId),
        [newCategory]: [...(prev[newCategory] || []), { ...anime, category_id: newCategory }]
      }));
    }
  };

  const handleUpdateTags = async (animeId, newTags) => {
    const { error } = await supabase.from('anime').update({ custom_tags: newTags }).eq('id', animeId);
    if (error) {
      console.error('Ошибка обновления тегов:', error);
    } else {
      setAnimeLists(prev => {
        const newList = { ...prev };
        for (const category in newList) {
          const index = (newList[category] || []).findIndex(a => a.id === animeId);
          if (index !== -1) {
            newList[category][index] = { ...newList[category][index], custom_tags: newTags };
            break;
          }
        }
        return newList;
      });
    }
  };

  const handleAlphabetSort = (enabled) => {
    if (!enabled) {
      const currentList = animeLists[activeCategory] || [];
      const sorted = [...currentList].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      setAnimeLists(prev => ({
        ...prev,
        [activeCategory]: sorted
      }));
      return;
    }

    const currentList = animeLists[activeCategory] || [];
    const sorted = [...currentList].sort((a, b) => {
      const titleA = (a.title || '').toLowerCase();
      const titleB = (b.title || '').toLowerCase();
      return titleA.localeCompare(titleB, 'ru');
    });

    sorted.forEach((anime, index) => {
      supabase.from('anime').update({ sort_order: index + 1 }).eq('id', anime.id);
    });

    setAnimeLists(prev => ({
      ...prev,
      [activeCategory]: sorted
    }));
  };

  const handleSortChange = (tags) => { setSelectedTags(tags); };
  const handleSelectAnime = (anime) => { setActiveCategory(anime.category_id); };
  const handleLogout = () => { 
    localStorage.removeItem('currentProfile'); 
    router.push('/login'); 
  };

  const handleSelect = (animeId) => {
    setSelectedIds(prev => prev.includes(animeId) ? prev.filter(id => id !== animeId) : [...prev, animeId]);
  };

  const handleBulkMove = async (animeIds, newCategory) => {
    for (const animeId of animeIds) {
      const anime = (animeLists[activeCategory] || []).find(a => a.id === animeId);
      if (!anime) continue;
      const { error } = await supabase.from('anime').update({ category_id: newCategory }).eq('id', animeId);
      if (!error) {
        setAnimeLists(prev => ({
          ...prev,
          [activeCategory]: (prev[activeCategory] || []).filter(a => a.id !== animeId),
          [newCategory]: [...(prev[newCategory] || []), { ...anime, category_id: newCategory }]
        }));
      }
    }
  };

  const handleBulkDelete = async (animeIds) => {
    const { error } = await supabase.from('anime').delete().in('id', animeIds);
    if (error) { alert('Не удалось удалить'); } 
    else {
      setAnimeLists(prev => ({
        ...prev,
        [activeCategory]: (prev[activeCategory] || []).filter(a => !animeIds.includes(a.id))
      }));
    }
  };

  const currentCategory = categories.find(c => c.id === activeCategory);
  const currentList = animeLists[activeCategory] || [];
  
  const filteredList = selectedTags.length > 0
    ? currentList.filter(anime => {
        const animeTags = anime.custom_tags || [];
        return selectedTags.every(tagId => animeTags.includes(tagId));
      })
    : currentList;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #000000 0%, #1a0000 100%)' }}>
        <div className="text-center"><p className="text-6xl mb-4 animate-pulse">🎌</p><p className="text-white text-xl">Загрузка...</p></div>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #000000 0%, #1a0000 100%)' }}>
        <div className="text-center">
          <p className="text-6xl mb-4">⚠️</p>
          <p className="text-white text-xl mb-4">Профиль не найден</p>
          <button onClick={() => router.push('/login')} className="px-6 py-3 bg-red-700 hover:bg-red-600 rounded-xl text-white font-bold transition">Вернуться к выбору профиля</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-72 bg-black/80 backdrop-blur-sm p-6 border-r border-red-900/20 flex-shrink-0 flex flex-col sticky top-0 h-screen overflow-y-auto">
        <h1 className="text-2xl font-bold mb-4 text-red-600 drop-shadow-lg">Pedikovatiy anime tracker</h1>
        {currentProfile && (
          <div className="mb-4 p-3 bg-black/40 border border-red-900/30 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-black text-white flex-shrink-0" style={{ backgroundColor: currentProfile.avatar_color }}>
              {currentProfile.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-bold truncate">{currentProfile.name}</p>
              {currentProfile.is_admin && <p className="text-xs text-red-400">Администратор</p>}
            </div>
          </div>
        )}
        <div className="mb-6"><GlobalSearch animeLists={animeLists} onSelectAnime={handleSelectAnime} /></div>
        <nav className="space-y-2 flex-1">
          {categories.map((category) => {
            const count = (animeLists[category.id] || []).length;
            const isActive = category.id === activeCategory;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center justify-between transform hover:scale-105 focus:outline-none focus:ring-0 ${
                  isActive ? 'bg-gradient-to-r from-red-900 to-red-800 text-white shadow-lg shadow-red-900/50' : 'bg-black/40 hover:bg-red-900/20 text-gray-300 border border-red-900/20'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-xl">{category.icon}</span>
                  <span className="sidebar-folder-name font-medium">{category.name} <span className={`text-xs font-bold ${isActive ? 'text-gray-300' : 'text-gray-500'}`}>({count})</span></span>
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 p-8 relative">
        <div className="flex items-center justify-between mb-6 pr-20">
          <h2 className="text-4xl font-bold text-white drop-shadow-lg">{currentCategory?.icon} {currentCategory?.name}</h2>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm bg-black/50 px-3 py-1 rounded-full">{filteredList.length} из {currentList.length} {currentList.length === 1 ? 'тайтл' : 'тайтлов'}</span>
            <button
              onClick={() => { setSelectMode(!selectMode); setSelectedIds([]); }}
              className={`px-4 py-2 rounded-xl font-bold transition-all focus:outline-none focus:ring-0 ${
                selectMode ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white shadow-lg shadow-yellow-900/50' : 'bg-black/60 border border-red-900/30 text-gray-400 hover:text-white hover:border-red-700'
              }`}
            >
              {selectMode ? '✓ Режим выбора' : ' Выбрать'}
            </button>

            <button
              onClick={() => setShowManualAdd(true)}
  className="p-5 rounded-full bg-gradient-to-br from-green-600 to-green-800 border-2 border-green-500 text-white hover:from-green-500 hover:to-green-700 shadow-xl shadow-green-600/50 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-0 animate-pulse"
              title="Добавить аниме вручную"
              style={{ boxShadow: '0 0 20px rgba(34, 197, 94, 0.6), 0 0 40px rgba(34, 197, 94, 0.3)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>

            <button
              onClick={() => setShowSearchBar(!showSearchBar)}
              className={`p-5 rounded-full transition-all duration-300 border-2 transform hover:scale-110 focus:outline-none focus:ring-0 ${
                showSearchBar ? 'bg-gradient-to-br from-red-500 to-red-700 border-red-400 text-white shadow-2xl shadow-red-500/70' : 'bg-gradient-to-br from-red-600 to-red-800 border-red-500 text-white hover:from-red-500 hover:to-red-700 shadow-xl shadow-red-600/50'
              }`}
              title="Добавить аниме из интернета"
              style={{ boxShadow: showSearchBar ? '0 0 30px rgba(220, 20, 60, 0.8), 0 0 60px rgba(220, 20, 60, 0.4)' : '0 0 20px rgba(220, 20, 60, 0.6), 0 0 40px rgba(220, 20, 60, 0.3)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
        
        {selectMode && (
          <div className="mb-6 p-4 bg-yellow-900/20 border-2 border-yellow-700/50 rounded-xl">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="text-yellow-400 font-bold">Выбрано: {selectedIds.length}</span>
                <button onClick={() => setSelectedIds(filteredList.map(a => a.id))} className="px-4 py-2 bg-yellow-700 hover:bg-yellow-600 rounded-lg text-white text-sm font-bold transition">✓ Выбрать все ({filteredList.length})</button>
                <button onClick={() => setSelectedIds([])} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm font-bold transition">✕ Снять все</button>
              </div>
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value && confirm(`Переместить ${selectedIds.length} аниме в "${e.target.options[e.target.selectedIndex].text}"?`)) {
                        handleBulkMove(selectedIds, e.target.value);
                        setSelectedIds([]);
                      }
                      e.target.value = '';
                    }}
                    className="px-4 py-2 bg-black/60 border border-yellow-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-600"
                  >
                    <option value="">📁 Переместить в...</option>
                    {categories.filter(c => c.id !== activeCategory).map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                  </select>
                  <button
                    onClick={() => {
                      if (confirm(`Удалить ${selectedIds.length} аниме?`)) { handleBulkDelete(selectedIds); setSelectedIds([]); }
                    }}
                    className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-white text-sm font-bold transition flex items-center gap-2"
                  >
                    🗑️ Удалить
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {showSearchBar && (
          <div className="mb-6 p-4 bg-black/60 backdrop-blur-sm border border-red-900/30 rounded-xl animate-fade-in relative z-40">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-red-400">Добавить аниме</h3>
              <button onClick={() => setShowSearchBar(false)} className="text-gray-400 hover:text-red-400 text-xl transition font-bold px-2 focus:outline-none focus:ring-0">✕</button>
            </div>
            <SearchBar onAddAnime={handleAddAnime} />
          </div>
        )}

        {currentList.length > 0 && (
          <TagSorter 
            currentList={currentList} 
            onSortChange={handleSortChange} 
            onAlphabetSort={handleAlphabetSort}
          />
        )}
        
        {filteredList.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-6xl mb-4 animate-pulse">🎌</p>
            <p className="text-gray-400 text-lg">{currentList.length === 0 ? 'В этом разделе пока пусто' : 'Нет аниме с выбранными тегами'}</p>
          </div>
        ) : (
          <div className="space-y-4 overflow-visible">
            {filteredList.map((anime) => (
              <AnimeCard
                key={anime.id}
                anime={anime}
                onRemove={handleRemoveAnime}
                onMove={handleMoveAnime}
                onUpdateTags={handleUpdateTags}
                onUpdateDetails={handleUpdateDetails}
                onUpdateComment={handleUpdateComment}
                onToggleNote={handleToggleNote}
                onUpdateCountdown={handleUpdateCountdown}
                onSelect={handleSelect}
                isSelected={selectedIds.includes(anime.id)}
                selectMode={selectMode}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                isDragging={dragId === anime.id}
                dragOverId={dragOverId}
              />
            ))}
          </div>
        )}

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`fixed bottom-8 left-8 p-5 rounded-full transition-all duration-300 border-2 transform hover:scale-110 z-[300] focus:outline-none focus:ring-0 ${
            showSettings ? 'bg-gradient-to-br from-red-500 to-red-700 border-red-400 text-white shadow-2xl shadow-red-500/70 rotate-90' : 'bg-gradient-to-br from-red-600 to-red-800 border-red-500 text-white hover:from-red-500 hover:to-red-700 shadow-xl shadow-red-600/50'
          }`}
          title="Настройки"
          style={{ boxShadow: showSettings ? '0 0 30px rgba(220, 20, 60, 0.8), 0 0 60px rgba(220, 20, 60, 0.4)' : '0 0 20px rgba(220, 20, 60, 0.6), 0 0 40px rgba(220, 20, 60, 0.3)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {showSettings && (
          <SettingsPanel 
            onClose={() => setShowSettings(false)}
            onImportComplete={() => window.location.reload()}
            currentProfile={currentProfile}
            onLogout={handleLogout}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            animeLists={animeLists}
            setAnimeLists={setAnimeLists}
          />
        )}

        {showManualAdd && (
          <ManualAddForm 
            onClose={() => setShowManualAdd(false)} 
            onAddAnime={handleAddAnime} 
          />
        )}
      </main>
    </div>
  );
}